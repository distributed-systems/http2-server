import { HTTP2OutgoingMessage } from '../es-modules/distributed-systems/http2-lib/x/index.js'


export default class HTTP2Response extends HTTP2OutgoingMessage {

    constructor({
        request,
    }) {
        super();
        this.request = request;
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




    /**
    * send the response
    */
    async send(data) {
        this.responseWasSent = true;

        this.setData(data);
        this.prepareData();

        const stream = this.request.stream();
        const headers = this.getHeaderObject();

        const promise = new Promise((resolve, reject) => {
            stream.on('close', () => {
                this.emit('close');
                resolve();
            });

            stream.on('error', (err) => {
                reject(err);
            });
        });

        headers[':status'] = this.statusCode;

        stream.respond(headers);

        if (data) {
            stream.end(this.getData());
        } else if (this.readStream) {
            this.readStream.pipe(stream);
        } else {
            stream.end();
        }

        // wait until the data was sent
        await promise;

        return this;
    }
}