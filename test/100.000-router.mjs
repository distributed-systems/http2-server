import section from '../es-modules/distributed-systems/section-tests/1.x/index.mjs';
import Router from '../src/Router';
import assert from 'assert';


section('Router', (section) => {
    section('Basics', (section) => {
        section.test('Instantiate Router', async () => {
            new Router();
        });


        section.test('Regexify route', async () => {
            const router = new Router();
            const regexp = router.regexify('/:resource/x/:id');
            const result = regexp.exec('/events/x/234');

            assert(result);
            assert(result.groups);
            assert.equal(result.groups.resource, 'events');
            assert.equal(result.groups.id, '234');
        });

        section.test('Register route', async () => {
            const router = new Router();
            router.registerRoute('get', '/test', () => {});
        });

        section.test('Register parameterized route', async () => {
            const router = new Router();
            router.registerRoute('get', '/test/:id', () => {});
        });

        section.test('Register regexp route', async () => {
            const router = new Router();
            router.registerRoute('get', /.*/i, () => {});
        });

        section.test('Register a route for a invalid method', async () => {
            const router = new Router();

            assert.throws(() => {
                router.registerRoute('invalid', /.*/i, () => {});
            });
        });
    });
});