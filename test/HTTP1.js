import section from '../es-modules/distributed-systems/section-tests/x/index.js';
import Router from '../src/Router.js';
import assert from 'assert';
import HTTP2Server from '../src/HTTP2Server.js';
import http from 'http';


section.continue('HTTP1', (section) => {
    section.test('Upgrade', async () => {
        const server = new HTTP2Server({
            secure: false
        });

/*
        server.getRouter().get('/test-1', (request) => {
            assert.equal(request.hasQueryParameter('key'), true);
            assert.equal(request.getQueryParameter('key'), 'value');

            request.response().status(200).send();
        });
*/
/*
        await server.load();
        await server.listen(8000);

        const request = http.request('http://l.dns.porn:8000/test-1?key=value');

    
        await server.close();*/
    });
});