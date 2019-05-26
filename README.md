# dot-rest (UNDER DEVELOPMENT)

a minimalist toolkit for building fast, scalable and fault tolerant microservices

## Configuration

- **cache       :** Expiration value in milliseconds for service caching. It's disabled by default.
- **debug       :** Debug mode. It's disabled by default.
- **delimiter   :** Delimiter between prefix and service name.
- **expire      :** expire for service registry records. It's disabled by default.
- **host        :** Binds server instance to this value. It's 0.0.0.0 by default.
- **port        :** Start point for port range. If you set server instance looks up for its port starting from this number. It's 8000 by default.
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
