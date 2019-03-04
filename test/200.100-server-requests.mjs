import assert from 'assert';
import fs from 'fs';
import HTTP2Client from '../es-modules/distributed-systems/http2-client/x/src/HTTP2Client.mjs'
import HTTP2Server from '../src/HTTP2Server';
import path from 'path';
import section from '../es-modules/distributed-systems/section-tests/1.x/index.mjs';


const { promises: { readFile} } = fs;




section.continue('HTTP 2 Server', (section) => {
    section('Requests', (section) => {

        section.test('Handle Request', async () => {
            const localFileName = new URL(import.meta.url).pathname;
            const certificate = await readFile(path.join(localFileName, '../data/l.dns.porn-cert.pem'));
            const key = await readFile(path.join(localFileName, '../data/l.dns.porn-privkey.pem'));
            
            const server = new HTTP2Server({
                key,
                certificate,
            });


            server.getRouter().get('/test-1', (request) => {
                request.response().status(200).send('yeah!');
            });


            await server.load();
            await server.listen(8000);

            const client = new HTTP2Client();
            const request = client.get('https://l.dns.porn:8000/test-1');
            request.ca(certificate);
            const response = await request.send();
            const data = await response.getData();

            assert(data);
            assert.equal(typeof data, 'string');
            assert.equal(data, 'yeah!');

            await server.close();
        });


        section.test('Handle Request (non secure)', async () => {
            const server = new HTTP2Server({
                secure: false
            });


            server.getRouter().get('/test-1', (request) => {
                request.response().status(200).send('yeah!');
            });


            await server.load();
            await server.listen(8000);

            const client = new HTTP2Client();
            const request = client.get('http://l.dns.porn:8000/test-1');
            const response = await request.send();
            const data = await response.getData();

            assert(data);
            assert.equal(typeof data, 'string');
            assert.equal(data, 'yeah!');

            await server.close();
        });




        section.test('Request Query', async () => {
            const server = new HTTP2Server({
                secure: false,
            });


            server.getRouter().get('/test-3', (request) => {
                request.response().status(200).send(request.query());
            });

            await server.load();
            await server.listen(8000);

            const client = new HTTP2Client();
            const request = client.get('http://l.dns.porn:8000/test-3').setQuery({a: 1});
            const response = await request.send();
            const data = await response.getData();

            assert(data);
            assert.equal(typeof data, 'object');
            assert.equal(data.a, 1);

            await server.close();
        });




        section.test('Request Accept: exact match', async () => {
            const server = new HTTP2Server({
                secure: false,
            });


            server.getRouter().get('/test-4', (request) => {
                request.response().status(200).send(request.accepts('text/html'));
            });

            await server.load();
            await server.listen(8000);

            const client = new HTTP2Client();
            const response = await client.get('http://l.dns.porn:8000/test-4').setHeader('accept', 'text/html').send();
            const data = await response.getData();
            assert.equal(data, 'text/html');

            await server.close();
        });




        section.test('Request Accept: secondary wildcard', async () => {
            const server = new HTTP2Server({
                secure: false,
            });


            server.getRouter().get('/test-4', (request) => {
                request.response().status(200).send(request.accepts('text/html'));
            });

            await server.load();
            await server.listen(8000);

            const client = new HTTP2Client();
            const response = await client.get('http://l.dns.porn:8000/test-4').setHeader('accept', 'text/*').send();
            const data = await response.getData();
            assert.equal(data, 'text/html');

            await server.close();
        });




        section.test('Request Accept: wildcard', async () => {
            const server = new HTTP2Server({
                secure: false,
            });


            server.getRouter().get('/test-4', (request) => {
                request.response().status(200).send(request.accepts('text/html'));
            });

            await server.load();
            await server.listen(8000);

            const client = new HTTP2Client();
            const response = await client.get('http://l.dns.porn:8000/test-4').setHeader('accept', '*/*').send();
            const data = await response.getData();
            assert.equal(data, 'text/html');

            await server.close();
        });




        section.test('Request Accept: multiple values', async () => {
            const server = new HTTP2Server({
                secure: false,
            });


            server.getRouter().get('/test-4', (request) => {
                request.response().status(200).send(request.accepts('text/html'));
            });

            await server.load();
            await server.listen(8000);

            const client = new HTTP2Client();
            const response = await client.get('http://l.dns.porn:8000/test-4').setHeader('accept', 'application/json, text/html, application/javascript').send();
            const data = await response.getData();
            assert.equal(data, 'text/html');

            await server.close();
        });



        section.test('Request Accept: multiple values with priorities', async () => {
            const server = new HTTP2Server({
                secure: false,
            });


            server.getRouter().get('/test-4', (request) => {
                request.response().status(200).send(request.accepts('text/html', 'application/json'));
            });

            await server.load();
            await server.listen(8000);

            const client = new HTTP2Client();
            const response = await client.get('http://l.dns.porn:8000/test-4').setHeader('accept', 'application/json, text/html; q=.1, application/javascript').send();
            const data = await response.getData();
            assert.equal(data, 'application/json');

            await server.close();
        });
    });
});