import assert from 'assert';
import HTTP2Client from '@distributed-systems/http2-client';
import HTTP2Server from '../src/HTTP2Server.js';
import section from 'section-tests';





section.continue('HTTP 2 Server', (section) => {
    section('Implicit Response', (section) => {


        section.test('Handle implicit response correctly', async () => {
            const server = new HTTP2Server({
                secure: false
            });


            server.getRouter().get('/implicit-reponse-1', (request) => {
                return 'yeah!';
            });


            await server.load();
            await server.listen(8000);

            const client = new HTTP2Client();
            const request = client.get('http://l.dns.porn:8000/implicit-reponse-1');
            const response = await request.send();
            const data = await response.getData();

            assert(data);
            assert.equal(typeof data, 'string');
            assert.equal(data, 'yeah!');

            await server.close();
            client.end();
        });
    });
});