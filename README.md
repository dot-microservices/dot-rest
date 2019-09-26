# dot-rest

a minimalist toolkit for building fast, scalable and fault tolerant microservices

## Configuration

- **host        :** binds server instance to this value. it's 0.0.0.0 by default.
- **pino        :** options for pino logger. it's { "level": "error" } by default.
- **port        :** start point for port assignment. it's 8000 by default.

## Examples

```js
const Clerq = require('clerq');
const { Client, Server } = require('dot-rest');
const IORedis = require('ioredis');

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
}

const registry = new Clerq(new IORedis(), { expire: 5, pino: { level: 'error' } });
const client = new Client(registry, { expire: 5, pino: { level: 'error' } });
const server = new Server(registry, { expire: 5, pino: { level: 'error' } });
server.start()
    .then(() => server.addService(Service))
    .catch(console.log);

setTimeout(async() => {
    const r = await client.get(Server._unCamelCase(Service._name()), 'test');
    console.log(r.data);
    server.stop();
    client.close();
}, 500);
```
