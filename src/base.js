'use strict';

const Exception = require('./exception');
const is = require('is_js');
const Clerq = require('clerq');
const pino = require('pino');

/**
 * @description Base class
 * @class Base
 */
class Base {
    /**
     *Creates an instance of Base.
     * @param {Object} options
     * @memberof Base
     */
    constructor(options) {
        if (is.not.undefined(options) && is.not.object(options))
            throw new Exception('invalid options');

        this._options = Object.assign({}, is.object(options) && is.not.array(options) ? options : {});
        this._logger = pino(Object.assign({ level: 'error' }, is.object(this._options.pino) ? this._options.pino : {}));
        this._clerq();
    }

    /**
     * @description creates a valid clerq instance for service registry and discovery
     * @memberof Base
     */
    _clerq() {
        const options = { host: this._options.redis_host || '127.0.0.1',
            port: this._options.redis_port || 6379, redis: this._options.redis };
        if (this._options.cache) options.cache = this._options.cache;
        if (this._options.delimiter) options.delimiter = this._options.delimiter;
        if (this._options.expire) options.expire = this._options.expire;
        if (this._options.prefix) options.prefix = this._options.prefix;
        if (this._options.pino) options.pino = this._options.pino;
        this._registry = new Clerq(options);
    }

    /**
     * @description returns proper service name
     * @param {Function} service
     * @static
     * @private
     * @returns String
     * @memberof Base
     */
    static _name(service) {
        if (is.not.function(service)) throw new Exception('invalid service');
        else if (is.function(service._name))
            return service._name();

        return `${ service.name.charAt(0).toLowerCase() }${ service.name.slice(1) }`;
    }

    /**
     * @description returns hyphenated form of camel-case string
     * @param {String} str
     * @static
     * @private
     * @returns
     * @memberof Base
     */
    static _unCamelCase(str){
        str = str.replace(/([a-z\xE0-\xFF])([A-Z\xC0\xDF])/g, '$1-$2');
        str = str.toLowerCase();
        return str;
    }
}

module.exports = Base;
