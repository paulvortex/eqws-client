import Protocol from './Protocol';
import $require from '../ng-require';

class HttpClient {
	/**
	 * Initialize API interface with http protocol
	 * @param  {String} serviceUrl Back-end service URL
	 */
	constructor(opts = {}) {
		this._options = opts;
		this._http    = $require('$http');
		this._q       = $require('$q');
		this._proto   = new Protocol(opts, 'http.client');

		this._proto._onError = (err) => this._onError(err);
	}

	/**
	 * Call API method with args
	 * @param  {String} method Name of method
	 * @param  {Object} args   Arguments
	 * @return {Promise}       Promise
	 */
	call(method, args) {
		const deferred = this._q.defer();
		const url      = this._options.url + method;
		const token    = this._proto.getToken();
		const data     = JSON.stringify(args);

		const handler = this._proto.handler.bind(this._proto);

		this._proto._onSend({method: method, args});
		this._http.defaults.headers.post['X-Token'] = token;
		this._http.defaults.headers.post['Content-Type'] = 'application/json; charset=utf-8';

		this._http
			.post(url, data)
			.then(res => handler(deferred, res.data), (err) => {
				handler(deferred, {
					error_code: -1,
					error_msg: `HttpError: ${err.statusText} (${err.status})`,
					ms: -1,
					api: {name: method}
				});
			});

		return deferred.promise;
	}

	use(key, fn) {
		this[`_${key}`] = fn;
	}

	_onError(err) {
		console.error(this._proto.name, err);
	}
}

export default HttpClient;