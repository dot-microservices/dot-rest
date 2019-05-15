'use strict';

const axios = require('axios');
const Exception = require('../src/exception');
const Server = require('../src/server');

class Service {
    /**
     * @description dot will use this method to build endpoints up
     * @static
     * @returns Object
     * @memberof Service
     */
    static _configure() {
        return {
            echo: [ '*', '/:path' ]
        };
    }

    /**
     * @description dot will use this method for service name
     * @static
     * @returns String
     * @memberof Service
     */
    static _name() {
        return 'myService';
    }

    /**
     * @description endpoint A
     * @static
     * @param {Request} [req] http request
     * @param {Response} [res] http response
     * @returns Promise
     * @memberof Service
     */
    static async echo(req) { // ? , res
        return req.params;
    }

    /**
     * @description endpoint B
     * @static
     * @param {Request} [req] http request
     * @param {Response} [res] http response
     * @returns Promise
     * @memberof Service
     */
    static async exception() { // req , res
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
