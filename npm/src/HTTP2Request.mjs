import HTTP2Response from './HTTP2Response.mjs';
import { HTTP2IncomingMessage } from '@distributed-systems/http2-lib/index.mjs'




export default class HTTP2Request extends HTTP2IncomingMessage {



    /**
    * get the response object
    */
    response() {
        if (!this.responseInstance) {
            this.responseInstance = new HTTP2Response({
                request: this
            });
        }

        return this.responseInstance;
    }



    /**
    * set parameters extracted from the url
    */
    setParameters(parameters) {
        this.parameters = parameters;
    }
}