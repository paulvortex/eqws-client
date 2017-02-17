import _set from 'lodash/set';
import _get from 'lodash/get';
import sha1 from 'sha-1';
import ApiError from './ApiError';
import $require from './ng-require';

class Protocol {
	constructor(name = 'client') {
		this.name         = name;
		this.localStorage = $require('$localStorage');
		this.rootScope    = $require('$rootScope');
		console.log(name + ': intialized');
	}

	handler(promise, data) {
		let api = _get(data, 'api', {
			name: 'unknown'
		});

		console.log(this.name + ':res', api.name, data.ms + 'ms', data);

		if (data.token) {
			this.localStorage.token = data.token;
			console.warn(this.name + ': recevied token');
		} else if (data.token === null) {
			this.localStorage.$reset();
			console.warn(this.name + ': recevied null token -> reset local storage.');
		}

		// Cache fetures
		if (data.cacheSign) {
			let hashKey = sha1([api.name, data.inputSign].join('.'));

			if (data.response) {
				console.debug(api.name, 'stored in cache:', hashKey);
				_set(this.localStorage, `cache.${hashKey}`, {
					v: data.response,
					h: data.cacheSign
				});
			} else {
				console.debug(api.name, 'provide from cache:', hashKey);
				data.response = _get(this.localStorage, `cache.${hashKey}.v`);
			}
		}

		if (data.error_code) {
			let err = this.parseError(data);
			this.rootScope.$emit('eqApi.error', err);
			promise.reject(err);
		} else {
			promise.resolve(data.response, data);
		}
	}

	getToken() {
		return this.localStorage.token || undefined;
	}

	onsend(data) {
		data.token = this.getToken();

		if (data.args && data.args.__cache) {
			delete data.args.__cache;

			let inputSign = sha1(JSON.stringify(data.args));
			let hashKey   = sha1([data.method, inputSign].join('.'));

			data.args.__cache = _get(this.localStorage, `cache.${hashKey}.h`);
		}
	}

	parseError(data) {
		return new ApiError(data.error_code, data.error_msg);
	}
}

export default Protocol;