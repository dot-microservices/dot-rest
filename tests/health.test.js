'use strict';

const axios = require('axios');
const Exception = require('../src/exception');
const Server = require('../src/server');

class Service {
    static _configure() {
        return {
            echo: [ '*', '/:path' ]
        };
    }

    static _name() {
        return 'myService';
    }

    static async echo(req) { // ? , res
        return req.params;
    }

    static async exception() { // ? , res
        throw new Exception('fail on purpose', 403);
    }
}

const server = new Server({ });
server.addService(Service);
server.start().catch(console.log);

afterAll(() => server.stop());

test('availability', done => {
    setTimeout(async() => {
        const url = `http://localhost:${ server._options.port }/${ Server._unCamelCase(Service._name()) }/test`;
        const r = await axios.get(url);
        expect(r.data.path).toBe('test');
        done();
    }, 500);
});
