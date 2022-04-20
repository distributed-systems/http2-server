import { HTTP2OutgoingMessage } from '@distributed-systems/http2-lib';


export default class HTTP2Response extends HTTP2OutgoingMessage {

    constructor(stream) {
        super(stream);

        this.responseWasSent = false;
    }





    /**
    * returns true if the response was already sent
    */
    isSent() {
        return !!this.responseWasSent;
    }



    /**
    * set the response status
    */
    status(statusCode) {
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



    getErrorSignature(err) {
        return `${this._incomingMethod.toUpperCase()} request on '${this._incomingURL}' errored: ${err.message}`;
    }


    /**
    * send the response
    */
    async send(data) {
        if (this.streamIsClosed()) {
            throw new Error(`Cannot send response, stream has ended already`);
        }

        this.responseWasSent = true;

        this.setData(data);
        this.prepareData();

        const headers = this.getHeaderObject();

        const promise = new Promise((resolve, reject) => {
            this.getRawStream().once('close', () => {
                resolve();
            });

            this.getRawStream().once('error', (err) => {
                reject(err);
            });
        });

        headers[':status'] = this.statusCode;

        try {
            this.getRawStream().respond(headers);
        } catch (err) {
            throw new Error(`Failed to send headers for response of the request to the path ${this.request.path()}: ${err.message}`);
        }
        

        try {
            if (data) {
                this.getRawStream().end(this.getData());
            } else if (this.readStream) {
                this.readStream.pipe(this.getRawStream());
            } else {
                this.getRawStream().end();
            }
        } catch (err)  {
            throw new Error(`Failed to end stream for response of the request to the path ${this.request.path()}: ${err.message}`);
        }

        // wait until the data was sent
        await promise;

        return this;
    }
}