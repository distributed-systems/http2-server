import { HTTP2OutgoingMessage } from '@distributed-systems/http2-lib';
import logd from 'logd';

const log = logd.module('HTTP2Response');


export default class HTTP2Response extends HTTP2OutgoingMessage {

    constructor(stream) {
        super(stream);

        this.responseWasSent = false;
    }





    /**
    * returns true if the response was already sent
    */
    isSent() {
        return this.responseWasSent;
    }



    /**
    * set the response status
    */
    status(statusCode) {
        log.debug(`[Server] Setting status code to ${statusCode}`);
        this.statusCode = statusCode;
        return this;
    }




    /**
     * pipe the passed stream into the response
     *
     * @param      {stream}  readStream  The read stream
     */
    pipeStream(readStream) {
        this.readStream = readStream;
        return this;
    }


    setMetaData(method, url) {
        this._incomingMethod = method;
        this._incomingURL = url;
    }



    setCookie(name, value, options = {}) {
        let cookie = `${name}=${value}`;

        for (const [option, value] of Object.entries(options)) {
            if (option == 'expires') continue;
            cookie += `; ${option}=${value}`;
        }

        if (options.expires) {
            let expires = options.expires;

            if (typeof expires == 'number') {
                options.expires = new Date(expires);
            }

            if (expires && expires.toUTCString) {
                expires = expires.toUTCString();
            }

            cookie += `; Expires=${expires}`;
        }

        // set the cookie
        if (this.hasHeader('set-cookie')) {
            this.setHeader('set-cookie', `${this.getHeader('set-cookie')}, ${cookie}`);
        } else {
            this.setHeader('set-cookie', cookie);
        }

        return this;
    }


    setCookies(cookies) {
        for (const {name, value, options} of cookies) {
            this.setCookie(name, value, options);
        }

        return this;
    }


    getErrorSignature(err) {
        return `${this._incomingMethod.toUpperCase()} request on '${this._incomingURL}' errored: ${err.message}`;
    }


    /**
    * send the response
    */
    async send(data) {
        if (this.streamIsClosed()) {
            throw new Error(`[Server Response] ${this._incomingMethod.toUpperCase()} ${this._incomingURL}: Cannot send response, stream has ended already`);
        }

        log.debug(`[Server Response] ${this._incomingMethod.toUpperCase()} ${this._incomingURL}: Sending response with status code ${this.statusCode}`);

        this.responseWasSent = true;

        this.setData(data);
        this.prepareData();

        const headers = this.getHeaderObject();

        
        headers[':status'] = this.statusCode;


        // make sure we've got a stream
        const stream = this.getRawStream();
        if (!stream) {
            throw new Error(`[Server Response] ${this._incomingMethod.toUpperCase()} ${this._incomingURL}: Failed to send response, stream is not available`);
        }
        
        // send headers
        try {
            stream.respond(headers);
        } catch (err) {
            throw new Error(`[Server Response] ${this._incomingMethod.toUpperCase()} ${this._incomingURL}: Failed to send headers for response: ${err.message}`);
        }
        

        // send data
        try {
            if (data || this.readStream) {
                if (this._incomingMethod.toUpperCase() === 'HEAD') {
                    throw new Error(`Cannot send body for HEAD request`);
                } else {
                    if (!stream.writable) {
                        throw new Error(`Stream is not writable, cannot send reponse data!`);
                    }

                    if (data) {
                        stream.end(this.getData());
                    } else if (this.readStream) {
                        this.readStream.pipe(stream);
                    }
                }
            } else {
                stream.end();
            }
        } catch (err)  {
            throw new Error(`[Server Response] ${this._incomingMethod.toUpperCase()} ${this._incomingURL}: Failed to end stream for response: ${err.message}`);
        }

        // wait until the stream is clsoed
        if (!stream.closed) {
            await new Promise((resolve, reject) => {
                stream.once('close', () => {
                    resolve();
                });
    
                stream.once('error', (err) => {
                    reject(err);
                });
            });
        }

        log.debug(`[Server Response] ${this._incomingMethod.toUpperCase()} ${this._incomingURL}: response sent`);

        return this;
    }
}