import ApiError from './ApiError';
import Protocol from './Protocol';
import $require from './ng-require';

class HttpClient {
	/**
	 * Initialize API interface with http protocol
	 * @param  {String} serviceUrl Back-end service URL
	 */
	constructor(serviceUrl) {
		this.serviceUrl = serviceUrl;
		this.http       = $require('$http');
		this.q          = $require('$q');
		this.proto      = new Protocol('http.client');
	}

	/**
	 * Call API method with args
	 * @param  {String} method Name of method
	 * @param  {Object} args   Arguments
	 * @return {Promise}       Promise
	 */
	call(method, args) {
		let deferred = this.q.defer();
		let data = {method, args};

		console.log('http.client:req', method, args);

		this.proto.onsend(data);
		this.http.defaults.headers.common['X-Token'] = this.proto.getToken();
		this.http
			.post(this.serviceUrl + method, data.args)
			.success(this.proto.handler.bind(this.proto, deferred))
			.error(this.proto.handler.bind(this.proto, deferred));

		return deferred.promise;
	}

	/**
	 * Parse error response to ApiError
	 * @param  {Object} data Raw error data
	 * @return {ApiError}   ApiError
	 */
	parseError(data) {
		return new ApiError(data.error_code, data.error_msg);
	}
}

export default HttpClient;