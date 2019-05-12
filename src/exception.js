'use strict';

class DotException extends Error {
    constructor(message, code) {
        super(message);
        this.name = this.constructor.name;
        this._code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = DotException;
