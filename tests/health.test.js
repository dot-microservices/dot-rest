'use strict';

const Clerq = require('clerq');
const Client = require('../src/client');
const Exception = require('../src/exception');
const redis = require('redis-mock');
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
            echo: [ '*', '/' ]
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
        return req.body || req.query;
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

const registry = new Clerq(redis.createClient(), { expire: 5, pino: { level: 'debug' } });
const client = new Client(registry, { expire: 5, pino: { level: 'debug' } });
const server = new Server(registry, { expire: 5, pino: { level: 'debug' } });
server.start()
    .then(() => server.addService(Service))
    .catch(console.log);

afterAll(() => {
    server.stop(true);
    client.close();
});

test('availability', done => {
    setTimeout(async() => {
        const name = Server._unCamelCase(Service._name());
        const r = await client.post(name, { one: '1' });
        expect(r.data.one).toBe('1');
        done();
    }, 500);
});
