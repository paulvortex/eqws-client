import _get from 'lodash/get';
import TokenInterface from './token-interface';
import ApiError from '../ApiError';

class Protocol {
	constructor(opts = {}, name = 'client') {
		if (!opts.token) opts.token = TokenInterface;

		this._options = opts;
		this.name = name;
		console.log(name + ': intialized');
	}

	getToken() {
		return this._options.token.get();
	}

	setToken(value) {
		this._options.token.set(value);
	}

	handler(request, response) {
		let api = _get(response, 'api', {
			name: 'unknown'
		});

		console.log(this.name + ':res', api.name, response.ms + 'ms', response);

		if (response.error_code) {
			let err = this._parseError(response);

			this._onError(err);
			request.reject(err);
		} else {
			let result = typeof response.response !== 'undefined' ? response.response : response;

			this._onResponse(response);
			request.resolve(result, response);
		}
	}

	removeEmpty(obj) {
		for (let key in obj) {
			if (obj.hasOwnProperty(key)) {
				let val = obj[key];

				if (val && typeof val === 'object') {
					this.removeEmpty(val);
				} else if (val === undefined) {
					delete obj[key];
				}
			}
		}

		return obj;
	}

	_onResponse(response) {
		const token = response.token;

		if (token !== undefined) {
			if (token === null) {
				console.warn(this.name, 'recevied null token');
			} else {
				console.warn(this.name, 'recevied new token');
			}

			this.setToken(token);
		}
	}

	_parseError(data) {
		return new ApiError(data.error_code, data.error_msg);
	}

	_onSend(data) {
		this.removeEmpty(data.args);
		console.log(`${this.name}:req`, data.method, data.args);
	}

	_onError() {}
}

export default Protocol;