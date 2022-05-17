import section from 'section-tests';
import HTTP2Client from '@distributed-systems/http2-client'
import HTTP2Server from '../src/HTTP2Server.js';


section.continue('Repeated Connections', (section) => {
    section.test('Connect 20 times to the same server', async () => {
        section.setTimeout(5000);

        const server = new HTTP2Server({
            secure: false
        });


        server.getRouter().get('/test-connection', (request) => {
            request.response().status(200).send();
        });


        await server.load();
        await server.listen(8000);

        await Promise.all(Array(20).fill(0).map(async () => {
            const client = new HTTP2Client();
            const request = client.get('http://l.dns.porn:8000/test-connection');
            const response = await request.send();
            await response.getData();
            await client.end();
            await section.wait(10);
        }));


        await server.close();
    });
});