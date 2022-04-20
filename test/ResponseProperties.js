import assert from 'assert';
import HTTP2Client from '@distributed-systems/http2-client';
import HTTP2Server from '../src/HTTP2Server.js';
import section from 'section-tests';





section.continue('HTTP 2 Server', (section) => {
    section('Response Properties', (section) => {


        section.test('isSent()', async () => {
            const server = new HTTP2Server({
                secure: false
            });


            server.getRouter().get('/response-is-sent', async (request) => {
                await request.response().status(404).send();
                assert.equal(request.response().isSent(), true);
            });


            await server.load();
            await server.listen(8000);

            const client = new HTTP2Client();
            const request = client.get('http://l.dns.porn:8000/response-is-sent');
            const response = await request.send();

            assert.equal(response.status(), 404);

            await server.close();
            client.end();
        });
    });
});