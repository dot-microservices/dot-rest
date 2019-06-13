'use strict';

const axios = require('axios');
const Base = require('./base');
const is = require('is_js');

/**
 * @description Client class
 * @class Client
 * @extends {Base}
 */
class Client extends Base {
    /**
     *Creates an instance of Client.
     * @param {Object} options
     * @memberof Client
     */
    constructor(options) {
        super(options);
    }

    /**
     * @description first it resolves right host for the service, then makes http request to service.
     * @param {String} httpMethod http method
     * @param {String} service service name
     * @param {String} method method name
     * @param {Object} options axios options for get, put, post, patch, delete requests
     * @returns {Promise}
     * @memberof Client
     */
    _request(httpMethod, service, method, options) {
        return new Promise((resolve, reject) => {
            this._registry.get(service).then(address => {
                if (is.string(address) && is.not.empty(address) && address.includes(':')) {
                    let url = `http://${ address }/${ service }`;
                    if (is.string(method)) url += `/${ method }`;
                    const request = Object.assign({ method: httpMethod, url },
                        is.object(options) && is.not.array(options) ? options : {});
                    axios(request).then(r => resolve(r)).catch(e => reject(e));
                } else reject(new Error('UNKNOWN_SERVICE'));
            }).catch(e => reject(e));
        });
    }

    /**
     * @description first it resolves right host for the service, then makes http request to service.
     * @param {String} service service name
     * @param {String} [method] method name
     * @param {Object} options axios options for get, put, post, patch, delete requests
     * @returns {Promise}
     * @memberof Client
     */
    delete(service, method, options) {
        if (is.object(method)) {
            options = method;
            method = null;
        }
        return this._request('delete', service, method, options);
    }

    /**
     * @description first it resolves right host for the service, then makes http request to service.
     * @param {String} service service name
     * @param {String} [method] method name
     * @param {Object} options axios options for get, put, post, patch, delete requests
     * @returns {Promise}
     * @memberof Client
     */
    get(service, method, options) {
        if (is.object(method)) {
            options = method;
            method = null;
        }
        return this._request('get', service, method, options);
    }

    /**
     * @description first it resolves right host for the service, then makes http request to service.
     * @param {String} service service name
     * @param {String} [method] method name
     * @param {Object} options axios options for get, put, post, patch, delete requests
     * @returns {Promise}
     * @memberof Client
     */
    patch(service, method, options) {
        if (is.object(method)) {
            options = method;
            method = null;
        }
        return this._request('patch', service, method, options);
    }

    /**
     * @description first it resolves right host for the service, then makes http request to service.
     * @param {String} service service name
     * @param {String} [method] method name
     * @param {Object} options axios options for get, put, post, patch, delete requests
     * @returns {Promise}
     * @memberof Client
     */
    post(service, method, options) {
        if (is.object(method)) {
            options = method;
            method = null;
        }
        return this._request('post', service, method, options);
    }

    /**
     * @description first it resolves right host for the service, then makes http request to service.
     * @param {String} service service name
     * @param {String} [method] method name
     * @param {Object} options axios options for get, put, post, patch, delete requests
     * @returns {Promise}
     * @memberof Client
     */
    put(service, method, options) {
        if (is.object(method)) {
            options = method;
            method = null;
        }
        return this._request('put', service, method, options);
    }

    /**
     * @description graceful shutdown for client instance
     * @memberof Client
     */
    close() {
        this._registry.stop();
    }
}

module.exports = Client;
