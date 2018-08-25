



```javascript

import HTTP2Server from './es-modules/distributed-systems/http2-server/1.x/src/HTTP2Server.mjs'


const server = new HTTP2Server();

server.listen(443);


server.on('request', (request) => {
    const data = await request.getData();

    request.response().status(200).send(data);

    const stream = request.response().status(200).stream();
    file.pipe(stream);

    cons response = request.pushResponse();
});
```