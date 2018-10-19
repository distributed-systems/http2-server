
// valid http2 methods
const methods = [
    'delete',
    'get',
    'head',
    'options',
    'patch',
    'post',
    'put',
    'any', // wildcard route, matches all other methods
];




/**
* a dead simple and impressively stupid router
* for routing http2 requests
*/

export default class Router {

    constructor() {
        this.routes = new Map();

        for (const methodName of methods) {
            
            // create shorthand accessors for all
            // valid methods
            this[methodName] = (...params) => {
                this.registerRoute(methodName, ...params);
            };

            // add the method to the route map
            this.routes.set(methodName, new Map());
        }
    }






    /**
    * route a request to the correct route handler
    *
    * @param {string} methodName - the http method to lookup a handler for
    * @param {string} pathName - the path portion of the http request
    *
    * @returns {object}
    */
    resolve(methodName, pathName) {
        methodName = methodName.toLowerCase();

        if (this.routes.has(methodName)) {
            const routes = this.routes.get(methodName);

            // just iterate over all routes in the order
            // they were added. return the first match.
            for (const route of routes.keys()) {
                if (typeof route === 'string') {

                    // string routes must a case insensitive match
                    if (route === pathName.toLowerCase()) {
                        return {
                            handler: routes.get(route),
                            parameters: new Map(),
                        };
                    }
                } else {

                    // must be a regexp, reset to re-scan from the beginning
                    route.lastIndex = 0;
                    const result = route.exec(pathName);

                    if (result) {
                        return {
                            handler: routes.get(route),
                            parameters: result.groups ? new Map(Object.keys(result.groups).map((key) => [key, result.groups[key]])) : {},
                        };
                    }
                }
            }
        } else throw new Error(`Cannot get request handler for the unknwnon method '${methodName}'!`);
    }






    /**
    * register a wildcard or specific route handler
    *
    * @param {string} methodName - the method to use for the route
    * @param {(string|regexp)} route - the route to match against
    * @param {function} handler - the handler for the route
    */
    registerRoute(methodName, route, handler) {
        if (this.routes.has(methodName)) {

            // convert strings containing parameters to a regular
            // expression using named capturing groups
            route = this.regexify(route);

            if (methodName === 'any') {

                // add the wildcard route to every queue
                for (const map of this.routes.values()) {
                    map.set(route, handler);
                }
            } else {

                // add the handler to the specific queue
                this.routes.get(methodName).set(route, handler);
            }
        } else throw new Error(`Cannot add route for method '${methodName}', on the following methods are valid: ${methods.join(', ')}, *`);
    }





    /**
    * create a regexp matching named params in a route:
    * /resource/:id gets /^\/resource\/(?<id>[\/+]+)$/gi
    *
    * @param {(string|*)} route - the route to regexify
    *
    * @returns {(string|regexp)} - the untouched route or 
    *   the regexp built from the route
    */
    regexify(route) {
        if (typeof route === 'string') {
            if (/\/:[a-z][a-z0-9_]*/i.test(route)) {
                const reg = /\/:([a-z][a-z0-9_]*)/gi;
                const params = [];
                let result;

                while(result = reg.exec(route)) {
                    params.push({
                        name: result[1],
                        index: result.index,
                    });
                }

                // replace values in the string with the regexp 
                // matching code
                params.reverse().forEach((param) => {
                    route = route.slice(0, param.index+1) + `(?<${param.name}>[^\\/]+)` + route.slice(param.index+2+param.name.length);
                });

                return new RegExp('^'+route+'$', 'gi');
            } else return route.toLowerCase();
        } else return route;
    }
}