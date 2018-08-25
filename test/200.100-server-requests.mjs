'use strict';

import section from 'section-tests';
import HTTP2Server from '../src/HTTP2Server';
import assert from 'assert';
import path from 'path';
import fs from 'fs';
import {promisify} from 'util';


const readFile = promisify(fs.readFile); 


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

            await server.load();
            await server.listen(8000);

            

            await server.close();
        });
    });
});