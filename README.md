# dot-rest

a minimalist toolkit for building fast, scalable and fault tolerant microservices

## Configuration

- **cache       :** expiration value in milliseconds for service caching. it's disabled by default.
- **delimiter   :** delimiter between prefix and service name.
- **expire      :** expire for service registry records. it's disabled by default.
- **host        :** binds server instance to this value. it's 0.0.0.0 by default.
- **iface       :** optional. name of the network interface to get outer ip from
- **pino        :** options for pino logger. it's { "level": "error" } by default.
- **port        :** start point for port assignment. it's 8000 by default.
- **prefix      :** prefix for service names
- **redis       :** options for redis instance ( please see <https://www.npmjs.com/package/redis> )
- **redis_host  :** redis hostname
- **redis_port  :** redis port

## Examples

```js
const { Client, Server } = require('dot-rest');

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

const client = new Client({ debug: true, expire: 5 });
const server = new Server({ debug: true, expire: 5 });
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
