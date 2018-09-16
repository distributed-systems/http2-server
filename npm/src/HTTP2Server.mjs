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
    * @param {(string|buffer)} key - tls key buffer containing the key or path to 
    *   the key
    * @param {(string|buffer)} certificate - tls certificate buffer containing the 
    *   certificate or path to the key
    * @param {number} [port=443] - the port the server should listen on
    * @param {Router} [router=new Router()] - the router to use for dispatching 
    *   requests
    */
    constructor({
        key,
        certificate,
        port = 443,
        router = new Router(),
    }) {
        super();

        this.router = router;
        this.key = key;
        this.certificate = certificate;
        this.port = port;

        this.activeSessions = new Set();
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
        this.server = http2.createSecureServer({
            key: this.key, 
            cert: this.certificate
        });


        // make sure we can access all active sessions so that
        // we can tell them to go away when the server shuts down
        this.server.on('session', (session) => {
            this.activeSessions.add(session);
            session.on('end', () => {
                this.activeSessions.delete(session);
            });
        });


        this.server.on('stream', (...params) => {
            this.handleRequest(...params);
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
    handleRequest(stream, headers) {
        const path = headers[':path'];
        const method = headers[':method'];
        const routeHandler = this.getRouter().resolve(method, path);
        const request = new HTTP2Request({
            stream,
            headers,
        });


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