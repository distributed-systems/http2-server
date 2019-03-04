# HTTP 2 Server


A simple HTTP2 Server providing a Router, Request and Response abstractions.

This server is HTTP2 only. It does not provide upgrades from HTTP 1.1. If you
need to provide HTTP 1.1 in conjunction with HTTP 2 you may use Envoy Proxy
for translating between the different HTTP Versions. See the examples/envoy
directory for a simple example involving envoy.

Compatible with node.js 10+, with the `--experimental-modules` flag set.


ESM

```javascript
import HTTP2Server from './es-modules/distributed-systems/http2-server/1.x/src/HTTP2Server.mjs'
```

NPM

```javascript
import HTTP2Server from '@distributed-systems/http2-server';
```



## Function Reference

### HTTP2Server class

The HTTP2Server class provides all functionality to start a HTTP" server. It
emits request events which will pass HTTP2Request class instances to its
listeners.


Example:
```javascript


const server = new HTTP2Server();

await server.load();
await server.listen(443);


server.on('request', (request) => {
    const data = await request.getData();

    console.log(data);

    request.response().status(200).send('hi there');
});
```


#### new HTTP2Server (options)

The constructor takes all options required to start the server. The options are an object containing the configuration parameters.

- key: private key for the server
- certificate: certificate for the server
- port = 443: port to listen on
- router = new Router(): router that handles incoming requests. Defaults to the included Router class
- secure: if set to false, the server starts without requiring clients to use TLS



#### HTTP2Server.registerMiddleware (middleware)

Register a middleware that is executed on each request.

