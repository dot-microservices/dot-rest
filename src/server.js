'use strict';

const Base = require('./base');
const body = require('body/json');
const Exception = require('./exception');
const findMyWay = require('find-my-way');
const http = require('http');
const is = require('is_js');
const portFinder = require('portfinder');
const url = require('url');

/**
 * @description Server class
 * @class Server
 * @extends {Base}
 */
class Server extends Base {
    /**
     *Creates an instance of Server.
     * @param {Object} options
     * @memberof Server
     */
    constructor(options) {
        super(options);

        this._ignoredProperties = [ 'length', 'name', 'prototype' ];
        this._http = http.createServer((req, res) => this.$r.lookup(req, res));
        this._services = [];
        this.$r = findMyWay({
            caseSensitive: this._options.router && is.existy(this._options.router.caseSensitive) ?
                this._options.router.caseSensitive : false,
            defaultRoute: this._options.defaultRoute && is.function(this._options.defaultRoute) ?
                this._options.defaultRoute : (req, res) => {
                    res.statusCode = 404;
                    res.end('not found');
                },
            ignoreTrailingSlash: this._options.router && is.existy(this._options.router.ignoreTrailingSlash) ?
                this._options.router.ignoreTrailingSlash : true
        });
    }

    /**
     * @description builds endpoints up
     * @param {Function} service
     * @private
     * @returns Object
     * @memberof Server
     */
    _configureService(service) {
        let configure = is.function(service) && is.function(service._configure) ? service._configure() : {};
        if (is.not.object(configure) || is.array(configure)) configure = {};
        for (let cfg of Object.keys(configure)) {
            if (cfg.startsWith('_') || is.not.function(service[cfg])) delete configure[cfg];
            if (is.not.array(configure[cfg])) delete configure[cfg];
            else if (is.string(configure[cfg][0]))
                configure[cfg] = [ [ configure[cfg][0], configure[cfg][1] || Base._unCamelCase(cfg) ] ];
        }
        for (let method of Object.getOwnPropertyNames(service)) {
            if (!method || method.startsWith('_') || this._ignoredProperties.includes(method)) continue;
            if (is.not.function(service[method]) || is.array(configure[method])) continue;

            configure[method] = [ [ '*', `/${ method }` ] ];
        }
        return configure;
    }

    /**
     * @description binds a new endpoint
     * @param {String} method
     * @param {String} path
     * @param {Function} handler
     * @private
     * @memberof Server
     */
    _on(method, path, handler) {
        if (is.undefined(handler)) handler = () => {};
        if (is.not.function(handler)) throw new Exception('invalid handler');
        if (is.not.function(this.$r[method])) throw new Exception('invalid method');

        this.$r[method](path, (req, res, params) => {
            req.params = params || {};
            const query = url.parse(req.url, true);
            req.query = query ? query.query || {} : {};
            body(req, (e, payload) => {
                req.body = payload;
                const output = handler(req, res);
                if (output instanceof Promise)
                    output
                        .then(r => {
                            if (r instanceof Buffer) return r.toString();
                            else if (r instanceof Array || is.object(r)) return JSON.stringify(r);
                            else if (is.not.existy(r) || is.nan(r)) throw new Exception('invalid value');
                            else return r.toString();
                        })
                        .then(d => {
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(d);
                        })
                        .catch(e => {
                            res.statusCode = is.number(e._code) ? Math.abs(e._code) : 500;
                            res.end(e.message);
                        });
            });
        });
    }

    /**
     * @description adds a new service
     * @param {Function} service
     * @memberof Server
     */
    addService(service) {
        if (is.not.function(service)) throw new Exception('service must be a class');

        const configure = this._configureService(service);
        const name = Base._unCamelCase(Base._name(service));
        for (let method in configure) {
            if (method.startsWith('_') || is.not.function(service[method])) continue;
            else if (service[method].constructor.name !== 'AsyncFunction') continue;

            for (let cfg of configure[method]) {
                if (is.not.array(cfg) || cfg.length < 2) continue;
                if (is.not.string(cfg[0]) || is.not.string(cfg[1])) continue;

                if (cfg[0] === '*') cfg[0] = 'all';
                if (is.not.function(this.$r[cfg[0]])) throw new Exception('invalid http method');

                const path = cfg[1].startsWith('/') ? cfg[1].substr(1) : cfg[1];
                this._on(cfg[0], `/${ name }/${ Base._unCamelCase(path) }`, service[method]);
            }
        }
        this._registry.up(name, this._options.port)
            .then(() => {
                if (!this._services.includes(name)) this._services.push(name);
            })
            .catch(e => {
                if (this._options.debug) console.log(e);
            });
    }

    /**
     * @description starts server instance
     * @memberof Server
     */
    async start() {
        this._options.port = await portFinder.getPortPromise({
            port: is.number(this._options.port) ? Math.abs(this._options.port) : undefined
        });
        this._http.listen(this._options.port, this._options.host);
    }

    /**
     * @description graceful shutdown for server instance
     * @param {Boolean} [destroy] flag for destroying service key
     * @memberof Server
     */
    async stop(destroy) {
        this._http.close();
        try {
            for (let service of this._services) {
                if (destroy) await this._registry.destroy(service);
                else await this._registry.down(service, this._options.port);
            }
        } catch (e) {
            if (this._options.debug) console.log(e);
        }
        this._registry.stop();
    }
}

module.exports = Server;
