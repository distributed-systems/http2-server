import section from 'section-tests';
import HTTP2Server from '../src/HTTP2Server';
import assert from 'assert';
import path from 'path';
import fs from 'fs';
import {promisify} from 'util';


const readFile = promisify(fs.readFile); 


section('HTTP 2 Server', (section) => {
    section('Basics', (section) => {
        section.test('Instantiate Server', async () => {
            new HTTP2Server({});
        });

        section.test('Load Server by loading certificates from the filesystem', async () => {
            const localFileName = new URL(import.meta.url).pathname;

            const server = new HTTP2Server({
                key: path.join(localFileName, '../data/l.dns.porn-privkey.pem'),
                certificate: path.join(localFileName, '../data/l.dns.porn-cert.pem'),
            });

            await server.load();
        });

        section.test('Load Server using passed in certificates', async () => {
            const localFileName = new URL(import.meta.url).pathname;
            const certificate = await readFile(path.join(localFileName, '../data/l.dns.porn-cert.pem'));
            const key = await readFile(path.join(localFileName, '../data/l.dns.porn-privkey.pem'));
            
            const server = new HTTP2Server({
                key,
                certificate,
            });

            await server.load();
        });

        section.test('Listen & Close', async () => {
            const localFileName = new URL(import.meta.url).pathname;
            const certificate = await readFile(path.join(localFileName, '../data/l.dns.porn-cert.pem'));
            const key = await readFile(path.join(localFileName, '../data/l.dns.porn-privkey.pem'));
            
            const server = new HTTP2Server({
                key,
                certificate,
            });

            await server.load();
            await server.listen(8000);
            await server.close();
        });

        section.test('Listen & Close (non https)', async () => {
            const server = new HTTP2Server({
                secure: false
            });

            await server.load();
            await server.listen(8000);
            await server.close();
        });
    });
});