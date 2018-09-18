import HTTP2Response from './HTTP2Response.mjs';
import { HTTP2IncomingMessage } from '../es-modules/distributed-systems/http2-lib/x/index.mjs';
import queryString from 'querystring';

console.log(URL);


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
        return this.url(true).pathname;
    }



    /**
     * returns the requests url
     */
    url(asObject) {
        const url =`${this.getHeader(':scheme')}://${this.getHeader(':authority')}${this.getHeader(':path')}`;
        if (asObject) return new URL(url);
        else return url;
    }



    /**
     * return the query part of the request url
     */
    query() {
        // substr is required because the ? question mark is not part of the query string
        return queryString.parse(this.url(true).search.substr(1));
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
     * gets all or a specific parameter
     *
     * @param      {<string>}  parameterName  The parameter name
     */
    parameter(parameterName) {
        if (this.hasParameters()) {
            if (parameterName) {
                if (this.hasParameter(parameterName)) {
                    return this.getParameter(parameterName);
                }
            } else {
                return this.getParameters();
            }
        }
    }




    /**
     * return all paramaters or an empty map
     *
     * @return     {<type>}  The parameters.
     */
    getParameters() {
        if (!this._parameters) {
            this._parameters = new Set();
        }

        return this._parameters;
    }



    /**
     * returns a specific parameter
     *
     * @param      {string}  parameterName  The parameter name
     * @return     {string}  The parameter.
     */
    getParameter(parameterName) {
        if (this.hasParameter(parameterName)) {
            return this._parameters.get(parameterName);
        }
    }



    /**
     * checks if a specific parameter is set
     *
     * @param      {<type>}   parameterName  The parameter name
     * @return     {boolean}  True if has parameter, False otherwise.
     */
    hasParameter(parameterName) {
        return this.hasParameters() && this._parameters.has(parameterName);
    }


    /**
     * Determines if it has parameters.
     *
     * @return     {boolean}  True if has parameters, False otherwise.
     */
    hasParameters() {
        return this.getParameters().size > 0;
    }



    /**
    * set parameters extracted from the url
    */
    setParameters(parameters) {
        this._parameters = parameters;
    }
}