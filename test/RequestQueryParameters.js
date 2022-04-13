import section from 'section-tests';
import Router from '../src/Router.js';
import assert from 'assert';
import HTTP2Client from '@distributed-systems/http2-client'
import HTTP2Server from '../src/HTTP2Server.js';


section.continue('Request query parameters', (section) => {
    section.test('Query parameters', async () => {
        const server = new HTTP2Server({
            secure: false
        });


        server.getRouter().get('/test-1', (request) => {
            assert.equal(request.hasQueryParameter('key'), true);
            assert.equal(request.getQueryParameter('key'), 'value');

            request.response().status(200).send();
        });


        await server.load();
        await server.listen(8000);

        const client = new HTTP2Client();
        const request = client.get('http://l.dns.porn:8000/test-1?key=value');
        const response = await request.send();
        await server.close();
    });
});