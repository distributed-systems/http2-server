import section from '../es-modules/distributed-systems/section-tests/x/index.js';
import Router from '../src/Router.js';
import assert from 'assert';
import HTTP2Client from '../es-modules/distributed-systems/http2-client/x/src/HTTP2Client.js'
import HTTP2Server from '../src/HTTP2Server.js';


section.continue('HTTP2 Errors', (section) => {
    section.test('GoAway', async () => {
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
        const promise = request.send();

        const session = await client.getSession(request.requestURL.origin);
        session.http2client.goaway();
        
        let errored = false;

        await promise.catch((err) => {
            errored = true;
        });

        assert.equal(errored, true);
        await server.close();
    });
});