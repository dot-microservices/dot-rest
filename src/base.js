'use strict';

const Exception = require('./exception');
const is = require('is_js');
const pino = require('pino');

/**
 * @description Base class
 * @class Base
 */
class Base {
    /**
     *Creates an instance of Base.
     * @param {Object} clerq Clerq instance
     * @param {Object} options
     * @memberof Base
     */
    constructor(clerq, options) {
        if (is.not.undefined(options) && is.not.object(options)) throw new Exception('invalid options');

        this._options = Object.assign({}, is.object(options) && is.not.array(options) ? options : {});
        this._logger = pino(Object.assign({ level: 'error' }, is.object(this._options.pino) ? this._options.pino : {}));
        this._registry = clerq;
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
