# HTTP2-Server

A simple HTTP Server providing a Router, Request and Response abstractions.

This server is http2 only. It does not provide upgrades from HTTP 1.1. If you
need to provide HTTP 1.1 in conjunction with HTTP 2 you may use [Envoy Proxy](https://www.envoyproxy.io/)
for translating between the different HTTP Versions. See the examples/envoy 
directory for a simple example involving envoy.

**ESM**
```javascript
import HTTP2Server from 'es-modules/distributed-systems/http2-server/1.0.0+/index.mjs';
```

**NPM**
```javascript
import HTTP2Server from '@distributed-systems/http2-server';
```



### Example of a non secure server

Be aware that no browser is sending non secure requests to a HTTP2 Server, since it's quite insecure.

```javascript
import HTTP2Server from 'es-modules/distributed-systems/http2-server/1.0.0+/index.mjs';


const server = new HTTP2Server({
    port: 8000,
    secure: false,
});


// prepare the server
await server.load();


// intercept request on the GET /status route
const router = server.getRouter();

router.get('/status', (request) => {
    request.response().status(200).send(`I'm very well!`);
});


// start listening. you may also define a port here
await server.listen(8010);
```