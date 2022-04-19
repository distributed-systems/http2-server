import HTTP2Response from './HTTP2Response.js';
import { HTTP2IncomingMessage } from '@distributed-systems/http2-lib';
import queryString from 'querystring';


export default class HTTP2Request extends HTTP2IncomingMessage {



    constructor(http2Stream, headers, response) {
        super(http2Stream, headers);
        this._response = response;

        this._response.setMetaData(this.method(), this.url());
    }


    /**
     * return the method or compare it with the method passed to the function
     *
     * @param      {Function}  method  the method you are expecting
     * @return     {string|boolean}   the method or true if the passed method matches 
     */
    method(method) {
        if (method) return method.toLowerCase() === this.getHeader(':method').toLowerCase();
        else return this.getHeader(':method').toLowerCase();
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
     * returns on query parameter or undefined, if not found
     *
     * @param      {string]  name    The name
     */
    getQueryParameter(name) {
         return this.getQueryParameters().get(name);
    }



    /**
     * returns all query parameters as a map
     */
    getQueryParameters() {
        if (!this._query) {
            const queryObject = this.query();
            this._query = new Map(Object.entries(queryObject));
        }

        return this._query;
    }


    /**
     * checks if a given query parameter exists
     *
     * @param      {string}   name    The name
     * @return     {boolean}  True if has query parameter, False otherwise.
     */
    hasQueryParameter(name) {
        return this.getQueryParameters().has(name);
    }



    /**
    * get the response object
    */
    response() {
        if (this.streamIsClosed()) {
            throw new Error(`Cannot get data from stream, stream has ended already`);
        }

        return this._response;
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
            this._parameters = new Map();
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
        if (this.hasParameters()) {
            this._parameters = new Map([...this._parameters, ...parameters]);
        } else {
            this._parameters = parameters;
        }
    }



    /**
     * set a single parameter
     */
    setParameter(key, value) {
        this.getParameters().set(key, value);
    }


    
    /**
    * checks if a list of mime types contains a type that can be accepted by the requester
    */
    accepts(...mimeTypes) {
        if (!this.hasHeader('accept')) return null;

        // clean and order by priority
        const acceptTypes = this.getHeader('accept')
            .split(',')
            .map(type => type.trim().toLowerCase())
            .map((type) => {
                const match = /;\s*q=(?<q>\d*\.?\d+)\s*$/.exec(type);
                let priority = 1;
                
                if (match) {
                    priority = Number(match.groups.q);
                    type = type.replace(match[0], '');
                }

                return { type, priority };
            })
            .sort((a, b) => a.priority < b.priority ? 1 : -1)
            .map(type => type.type);


        // first pass, exact match
        for (const acceptType of acceptTypes) {
            for (const mimeType of mimeTypes) {
                if (mimeType === acceptType) return mimeType;
            }
        }


        // second pass, just the first part of the type
        const shortAcceptTypes = acceptTypes.filter(type => /^.+\/\*$/.test(type)).map(type => type.split('/')[0]);
        const shortMimeTypes = mimeTypes.map(type => ({type, short: type.split('/')[0]}));

        for (const shortAcceptType of shortAcceptTypes) {
            for (const shortMimeType of shortMimeTypes) {
                if (shortMimeType.short === shortAcceptType) return shortMimeType.type;
            }
        }


        // catch all
        if (acceptTypes.some(type => type === '*/*')) return mimeTypes[0];


        return null;
    }
}