import http2 from 'http2';
import { promises as fs } from 'fs';
import EventEmitter from 'events';
import Router from './Router.js';
import HTTP2Request from './HTTP2Request.js';
import HTTP2Response from './HTTP2Response.js';
import HTTP2ServerSession from './HTTP2ServerSession.js';
import logd from 'logd';

const log = logd.module('HTTP2Server');




export default class HTTP2Server extends EventEmitter {


    /**
     * configure the server
     *
     * @param      {Object}           arg1              options object
     * @param      {string}           arg1.key          The key
     * @param      {(string|buffer)}  arg1.certificate  tls certificate buffer containing the
     *                                                  certificate or path to the key
     * @param      {number}           arg1.port         The port
     * @param      {object}           arg1.router       The router
     * @param      {boolean}          arg1.secure       The secure
     */
    constructor({
        key,
        certificate,
        port = 443,
        router = new Router(),
        secure = true,
    }) {
        super();

        this.router = router;
        this.key = key;
        this.certificate = certificate;
        this.port = port;
        this.secure = secure;

        this.activeSessions = new Set();

        // express.js style middlewares
        this.middlewares = new Set();
    }




    /**
     * register a middleware that is called on all routes
     *
     * @param      {object}  middleware  The middleware
     */
    registerMiddleware(middleware) {
        this.middlewares.add(middleware);
    }





    /**
    * get the router so you can add router
    *
    * @returns {Router} the router instance
    */
    getRouter() {
        return this.router;
    }





    /**
    * prepare the server, load the certificates from
    * the file system if required
    *
    * @returns {Promise}
    */
    async load() {
        if (typeof this.key === 'string') {
            this.key = await fs.readFile(this.key);
        }

        if (typeof this.certificate === 'string') {
            this.certificate = await fs.readFile(this.certificate);
        }
    }
    




    /**
    * let the server listen on the port configured
    * or the port passed to this method
    *
    * @param {int} [port=this.port=443] - the port to listen on 
    *
    * @param {Promise<HTTP2Server instance>}
    */
    async listen(port) {
        if (port) this.port = port;

        if (this.secure) {
            this.server = http2.createSecureServer({
                key: this.key, 
                cert: this.certificate
            });
        } else {
            this.server = http2.createServer();
        }


        this.server.setTimeout(0);

        // make sure we can access all active sessions so that
        // we can tell them to go away when the server shuts down
        this.server.on('session', (session) => {            
            const http2Session = new HTTP2ServerSession(session, {
                HTTP2Request,
                HTTP2Response,
            });

            this.activeSessions.add(http2Session);

            http2Session.once('end', () => {
                this.activeSessions.delete(http2Session);
            });

            http2Session.on('request', (request) => {
                this._handleRequest(request);
            });
        });


        // start listening for requests
        return new Promise((resolve) => {
            this.server.listen(this.port, () => {
                log.success(`The server is listening on port ${this.port}`);
                resolve(this);
            });
        });
    }


  


    /**
    * close the server
    *
    * @param {Promise}
    */
    async close() {
        return new Promise((resolve) => {
            for (const session of this.activeSessions.values()) {
                session.end();
            }

            this.removeAllListeners();

            this.server.close(() => {
                log.info(`The server listening on port ${this.port} is closed`);
                resolve();
            });
        });
    }




    /**
    * handles incoming requests, sends them to the router
    */
    async _handleRequest(request) {
        log.debug(`[Server] ${request.method()} request on ${request.url()}`);

        for (const middleware of this.middlewares.values()) {
            log.debug(`[Server] ${request.method()} request on ${request.url()}, executing middleware`);

            const stopExecution = await (typeof middleware.handleRequest === 'function' ? middleware.handleRequest(request) : middleware(request));

            // abort if the middleware tells us to do so or the response was sent already
            if (stopExecution === false || request.response().isSent()) {
                log.debug(`[Server] ${request.method()} request on ${request.url()}, middleware sent response, aborting further processing`);
                return false;
            }
        }


        const routeHandler = this.getRouter().resolve(request.method(), request.path());

        if (routeHandler) {
            // some users just need to know about the fact that
            // requests were received
            this.emit('request-notification');
        
            request.setParameters(routeHandler.parameters);

            // since we don't know if the route handler is async, we
            // need to wrap it so that it is handled anyways.
            await (async() => {
                log.debug(`[Server] ${request.method()} request on ${request.url()}, passing request to route handler`);
                const data = await routeHandler.handler(request);

                if (request.response().isSent()) {
                    log.debug(`[Server] ${request.method()} request on ${request.url()}, route handler has sent a response`);
                }

                if (data !== undefined) {
                    if (!request.response().isSent()) {
                        log.debug(`[Server] ${request.method()} request on ${request.url()}, sendig data returned by the route handler`);
                        request.response().send(data);
                    } else {
                        log.warn(`The response was already sent, but the route handler returned data.`);
                    }
                }
            })().catch((err) => {

                // sent the error only if the request was not sent already
                if (!request.response().isSent()) {
                    log.error(`[Server] ${request.method()} request on ${request.url()}: The route handler errored. Sent a HTTP 500 response: ${err.message}`, err);
                    request.response().status(500).send(err.message);
                } else {
                    log.error(`[Server] ${request.method()} request on ${request.url()}: The route handler errored but already sent a reponse: ${err.message}`, err);
                }
            });
        } else {
            request.response().status(404).send(`Path '${request.path()}' for method '${request.method()}' not found!`);
        }
    }
}