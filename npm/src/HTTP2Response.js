import { HTTP2OutgoingMessage } from '@distributed-systems/http2-lib'


export default class HTTP2Response extends HTTP2OutgoingMessage {

    constructor({
        request,
    }) {
        super();
        this.request = request;
        this.responseWasSent = false;
        this._sessionIsClosed = false;
    }



    setUpEvents(request) {
        request.on('goaway', () => {
            this._sessionIsClosed = true;
        });
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




    /**
    * send the response
    */
    async send(data) {
        if (this._sessionIsClosed) {
            throw new Error('Cannot send response: the sesison for this stream was closed!');
        }

        this.responseWasSent = true;

        this.setData(data);
        this.prepareData();

        const stream = this.request.stream();
        const headers = this.getHeaderObject();

        const promise = new Promise((resolve, reject) => {
            stream.once('close', () => {
                this.emit('close');
                resolve();
            });

            stream.once('error', (err) => {
                reject(err);
            });
        });

        headers[':status'] = this.statusCode;

        try {
            stream.respond(headers);
        } catch (err) {
            throw new Error(`Failed to send headers for response of the request to the path ${this.request.path()}: ${err.message}`);
        }
        

        try {
            if (data) {
                stream.end(this.getData());
            } else if (this.readStream) {
                this.readStream.pipe(stream);
            } else {
                stream.end();
            }
        } catch (err)  {
            throw new Error(`Failed to end stream for response of the request to the path ${this.request.path()}: ${err.message}`);
        }
        
        this.request.destroy();

        // wait until the data was sent
        await promise;

        return this;
    }
}