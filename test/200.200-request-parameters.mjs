import section from '../es-modules/distributed-systems/section-tests/x/index.mjs';
import Router from '../src/Router.mjs';
import assert from 'assert';
import HTTP2Client from '../es-modules/distributed-systems/http2-client/x/src/HTTP2Client.mjs'
import HTTP2Server from '../src/HTTP2Server.mjs';


section.continue('Request parameters', (section) => {
    section.test('No Parameter', async () => {
        const server = new HTTP2Server({
            secure: false
        });


        server.getRouter().get('/test-1', (request) => {
            assert.equal(request.hasParameters(), false);
            assert.equal(request.hasParameter('a'), false);
            assert.equal(request.getParameters().size, 0);

            request.response().status(200).send();
        });


        await server.load();
        await server.listen(8000);

        const client = new HTTP2Client();
        const request = client.get('http://l.dns.porn:8000/test-1');
        const response = await request.send();
        await server.close();
    });

    section.test('One Parameter', async () => {
        const server = new HTTP2Server({
            secure: false
        });


        server.getRouter().get('/test-1/:id', (request) => {
            assert.equal(request.hasParameters(), true);
            assert.equal(request.hasParameter('id'), true);
            assert.equal(request.getParameters().size, 1);
            assert.equal(request.getParameter('id'), '56');
            
            request.response().status(200).send();
        });


        await server.load();
        await server.listen(8000);

        const client = new HTTP2Client();
        const request = client.get('http://l.dns.porn:8000/test-1/56');
        const response = await request.send();
        await server.close();
    });
});