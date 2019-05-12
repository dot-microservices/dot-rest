'use strict';

const body = require('body/json');
const Exception = require('./exception');
const findMyWay = require('find-my-way');
const http = require('http');
const is = require('is_js');
const portFinder = require('portfinder');
const Clerq = require('clerq');
const url = require('url');

class Server {
    constructor(options) {
        if (is.not.undefined(options) && is.not.object(options))
            throw new Exception('invalid options');

        this._ignoredProperties = [ 'length', 'name', 'prototype' ];
        this._options = Object.assign({}, is.object(options) && is.not.array(options) ? options : {});
        this._registry = new Clerq({
            host: this._options.redis_host || '127.0.0.1',
            port: this._options.redis_port || 6379
        });
        this._http = http.createServer((req, res) => this.$r.lookup(req, res));
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

    _configureService(service) {
        let configure = is.function(service) && is.function(service._configure) ? service._configure() : {};
        if (is.not.object(configure) || is.array(configure)) configure = {};
        for (let cfg of Object.keys(configure)) {
            if (cfg.startsWith('_') || is.not.function(service[cfg])) delete configure[cfg];
            if (is.not.array(configure[cfg])) delete configure[cfg];
            else if (is.string(configure[cfg][0]))
                configure[cfg] = [ [ configure[cfg][0], configure[cfg][1] || Server._unCamelCase(cfg) ] ];
        }
        for (let method of Object.getOwnPropertyNames(service)) {
            if (!method || method.startsWith('_') || this._ignoredProperties.includes(method)) continue;
            if (is.not.function(service[method]) || is.array(configure[method])) continue;

            configure[method] = [ [ '*', `/${ method }` ] ];
        }
        return configure;
    }

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

    addService(service) {
        if (is.not.function(service)) throw new Exception('service must be a class');

        const configure = this._configureService(service);
        const name = Server._unCamelCase(Server._name(service));
        for (let method in configure) {
            if (method.startsWith('_') || is.not.function(service[method])) continue;
            else if (service[method].constructor.name !== 'AsyncFunction') continue;

            for (let cfg of configure[method]) {
                if (is.not.array(cfg) || cfg.length < 2) continue;
                if (is.not.string(cfg[0]) || is.not.string(cfg[1])) continue;

                if (cfg[0] === '*') cfg[0] = 'all';
                if (is.not.function(this.$r[cfg[0]])) throw new Exception('invalid http method');

                const path = cfg[1].startsWith('/') ? cfg[1].substr(1) : cfg[1];
                this._on(cfg[0], `/${ name }/${ Server._unCamelCase(path) }`, service[method]);
            }
        }
        this._registry.up(service, this._options.port).catch(e => {
            if (this._options.debug) console.log(e);
        });
    }

    async start() {
        this._options.port = await portFinder.getPortPromise({
            port: is.number(this._options.port) ? Math.abs(this._options.port) : undefined
        });
        this._http.listen(this._options.port);
    }

    stop() {
        this._http.close();
        this._registry.stop();
    }

    static _name(service) {
        if (is.not.function(service)) throw new Exception('invalid service');
        else if (service.hasOwnProperty('_name') && is.function(service._name))
            return service._name();

        return `${ service.name.charAt(0).toLowerCase() }${ service.name.slice(1) }`;
    }

    static _unCamelCase(str){
        str = str.replace(/([a-z\xE0-\xFF])([A-Z\xC0\xDF])/g, '$1-$2');
        str = str.toLowerCase();
        return str;
    }
}

module.exports = Server;
