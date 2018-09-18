import http2 from 'http2';
import fs from 'fs';
import {promisify} from 'util';
import EventEmitter from 'events';
import Router from './Router';
import HTTP2Request from './HTTP2Request';


const readFile = promisify(fs.readFile);




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
            this.key = await readFile(this.key);
        }

        if (typeof this.certificate === 'string') {
            this.certificate = await readFile(this.certificate);
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

        if (this.secure) {
            this.server = http2.createSecureServer({
                key: this.key, 
                cert: this.certificate
            });
        } else {
            this.server = http2.createServer();
        }


        // make sure we can access all active sessions so that
        // we can tell them to go away when the server shuts down
        this.server.on('session', (session) => {
            this.activeSessions.add(session);
            session.on('end', () => {
                this.activeSessions.delete(session);
            });
        });


        this.server.on('stream', (...params) => {
            this.handleRequest(...params).catch(console.error);
        });



        return new Promise((resolve, reject) => {

            // since the listen method isn't called o
            // errors we let it race with the error event
            const handler = (err) => {
                if (err) reject(err);
                else {

                    // remove myself as error handler
                    this.server.off('error', handler);

                    // emit errors to the outside
                    this.server.on('error', (err) => { 
                        this.emit('error', err);
                    });

                    resolve(this);
                }
            };

            // the server doesn't return errors in the listen callback
            // so we need to handle error events instead
            this.server.on('error', handler);
            this.server.listen(port || this.port, handler);
        });
    }





    /**
    * close the server
    *
    * @param {Promise}
    */
    async close() {
        return new Promise((resolve, reject) => {
            for (const session of this.activeSessions.values()) {
                session.close();
            }

            this.server.close((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }




    /**
    * handles incoming requests, sends them to the router
    *
    * @param {HTTPStream} stream - the http2 stream instance
    * @param {object} headers - object containing the http2 headers
    */
    async handleRequest(stream, headers) {
        const path = headers[':path'];
        const method = headers[':method'];
        const routeHandler = this.getRouter().resolve(method, path);
        const request = new HTTP2Request({
            stream,
            headers,
        });


        for (const middleware of this.middlewares.values()) {
            const stopExecution = await middleware(request);

            // abort if the middleware tells us to do so
            if (stopExecution === false) {
                return false;
            }
        }

        


        if (routeHandler) {
            // some users just need to know about the fact that
            // requests were received
            this.emit('request-notification');
        
            request.setParameters(routeHandler.parameters);
            routeHandler.handler(request);
        } else {
            request().response().status(404).send(`Path '${path}' for method '${method}' not found!`);
        }
    }
}