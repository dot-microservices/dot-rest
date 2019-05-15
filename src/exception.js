'use strict';

/**
 * @description customized exception
 * @class DotException
 * @extends {Error}
 */
class DotException extends Error {
    /**
     *Creates an instance of DotException.
     * @param {String} message error message
     * @param {Number} code status code
     * @memberof DotException
     */
    constructor(message, code) {
        super(message);
        this.name = this.constructor.name;
        this._code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = DotException;
