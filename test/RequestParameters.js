import section from 'section-tests';
import Router from '../src/Router.js';
import assert from 'assert';
import HTTP2Client from '@distributed-systems/http2-client'
import HTTP2Server from '../src/HTTP2Server.js';


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
        client.end();
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
        client.end();
    });

    section.test('Set Parameter', async () => {
        const server = new HTTP2Server({
            secure: false
        });


        server.getRouter().get('/test-1', (request) => {
            assert.equal(request.hasParameters(), true);
            assert.equal(request.hasParameter('done'), true);
            assert.equal(request.getParameters().size, 1);
            assert.equal(request.getParameter('done'), true);
            
            request.response().status(200).send();
        });


        server.registerMiddleware(async (request) => {
            request.setParameter('done', true);
        });

        await server.load();
        await server.listen(8000);

        const client = new HTTP2Client();
        const request = client.get('http://l.dns.porn:8000/test-1');
        const response = await request.send();
        await server.close();
        client.end();
    });
});