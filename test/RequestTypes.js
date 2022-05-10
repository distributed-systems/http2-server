import section from 'section-tests';
import Router from '../src/Router.js';
import assert from 'assert';
import HTTP2Client from '@distributed-systems/http2-client'
import HTTP2Server from '../src/HTTP2Server.js';


section.continue('Request Types', (section) => {
    section.test('HEAD request with no handler', async () => {
        const server = new HTTP2Server({
            secure: false
        });


        server.getRouter().get('/test-head', (request) => {
            request.response().status(200).send();
        });


        await server.load();
        await server.listen(8000);

        const client = new HTTP2Client();
        const request = client.head('http://l.dns.porn:8000/test-head');
        const response = await request.send();
        await server.close();
        client.end();
    });

    section.test('HEAD request with handler', async () => {
        const server = new HTTP2Server({
            secure: false
        });


        server.getRouter().head('/test-head', (request) => {
            request.response().status(200).send();
        });


        await server.load();
        await server.listen(8000);

        const client = new HTTP2Client();
        const request = client.head('http://l.dns.porn:8000/test-head');
        const response = await request.send();
        await server.close();
        client.end();
    });

    section.test('HEAD request with handler and payload', async () => {
        const server = new HTTP2Server({
            secure: false
        });


        server.getRouter().head('/test-head', async (request) => {
            await request.response().status(200).send('invalid');
        });


        await server.load();
        await server.listen(8000);

        const client = new HTTP2Client();
        const request = client.head('http://l.dns.porn:8000/test-head');
        const response = await request.send();
        await server.close();
        client.end();
    });
});