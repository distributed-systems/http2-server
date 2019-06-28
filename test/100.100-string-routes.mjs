import section from '../es-modules/distributed-systems/section-tests/x/index.mjs';
import Router from '../src/Router.mjs';
import assert from 'assert';


section.continue('Router', (section) => {
    section('String Routes', (section) => {
        section.test('Resolve a string route', async () => {
            const router = new Router();
            const handlerFunction = () => {};

            router.registerRoute('get', '/test', handlerFunction);

            const {handler, paramaters} = router.resolve('get', '/test');
            assert.equal(handler, handlerFunction);
        });

        section.test('Resolve a string route [case insensitive]', async () => {
            const router = new Router();
            const handlerFunction = () => {};

            router.registerRoute('get', '/test', handlerFunction);

            const {handler, paramaters} = router.resolve('get', '/TEST');
            assert.equal(handler, handlerFunction);
        });

        section.test('Resolve a string route [prefix]', async () => {
            const router = new Router();
            const handlerFunction = () => {};

            router.registerRoute('get', '/test', handlerFunction);

            const result = router.resolve('get', 'a/TEST');
            assert.equal(result, undefined);
        });

        section.test('Resolve a string route [suffix]', async () => {
            const router = new Router();
            const handlerFunction = () => {};

            router.registerRoute('get', '/test', handlerFunction);

            const result = router.resolve('get', '/TEST/');
            assert.equal(result, undefined);
        });
    });
});