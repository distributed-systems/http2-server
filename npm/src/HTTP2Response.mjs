import { HTTP2OutgoingMessage } from '@distributed-systems/http2-lib'


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
    * send the response
    */
    async send(data) {
        this.responseWasSent = true;

        this.setData(data);
        this.prepareData();

        const stream = this.request.stream();
        const headers = this.getHeaderObject();

        headers[':status'] = this.statusCode;

        stream.respond(headers);
        stream.end(this.getData());

        return this;
    }
}