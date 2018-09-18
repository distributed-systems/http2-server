import HTTP2Response from './HTTP2Response.mjs';
import { HTTP2IncomingMessage } from '@distributed-systems/http2-lib/index.mjs'




export default class HTTP2Request extends HTTP2IncomingMessage {




    /**
     * return the method or compare it with the method passed to the function
     *
     * @param      {Function}  method  the method you are expecting
     * @return     {string|boolean}   the method or true if the passed method matches 
     */
    method(method) {
        if (method) return method === this.getHeader(':method');
        else return this.getHeader(':method');
    }




    /**
     * return the requests path
     *
     * @return     {string}  the request path
     */
    path() {
        return this.getHeader(':path');
    }





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