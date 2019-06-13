'use strict';

const Client = require('../src/client');
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

const client = new Client({ expire: 5 });
const server = new Server({ expire: 5 });
server.start()
    .then(() => server.addService(Service))
    .catch(console.log);

afterAll(() => {
    server.stop(true);
    client.close();
});

test('availability', done => {
    setTimeout(async() => {
        const r = await client.get(Server._unCamelCase(Service._name()), 'test');
        expect(r.data.path).toBe('test');
        done();
    }, 500);
});
