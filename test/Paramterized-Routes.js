import section from '../es-modules/distributed-systems/section-tests/x/index.js';
import Router from '../src/Router.js';
import assert from 'assert';


section.continue('Router', (section) => {
    section('Parameterized String Routes', (section) => {
        section.test('Resolve a parameterized string route', async () => {
            const router = new Router();
            const handlerFunction = () => {};

            router.registerRoute('get', '/test/:id', handlerFunction);

            const {handler, parameters} = router.resolve('get', '/test/222');
            assert.equal(handler, handlerFunction);
            assert(parameters);
            assert.equal(parameters.get('id'), '222');
        });

        section.test('Resolve a parameterized string route [case insensitive]', async () => {
            const router = new Router();
            const handlerFunction = () => {};

            router.registerRoute('get', '/test/:id', handlerFunction);

            const {handler, parameters} = router.resolve('get', '/TEST/222');
            assert.equal(handler, handlerFunction);
            assert(parameters);
            assert.equal(parameters.get('id'), '222');
        });

        section.test('Resolve a parameterized string route [prefix]', async () => {
            const router = new Router();
            const handlerFunction = () => {};

            router.registerRoute('get', '/test/:id', handlerFunction);

            const result = router.resolve('get', 'a/TEST/:id');
            assert.equal(result, undefined);
        });

        section.test('Resolve a parameterized string route [suffix]', async () => {
            const router = new Router();
            const handlerFunction = () => {};

            router.registerRoute('get', '/test/:id', handlerFunction);

            const result = router.resolve('get', '/TEST/:id/');
            assert.equal(result, undefined);
        });
    });
});