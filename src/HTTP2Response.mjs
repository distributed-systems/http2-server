'use strict';

import HTTP2OutgoingMessage from '../es-modules/distributed-systems/http2-lib/v1.0.0/src/HTTP2OutgoingMessage.mjs'


export default class HTTP2Response extends HTTP2OutgoingMessage {

    constructor({
        request,
    }) {
        super();
        this.request = request;
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