'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ERROR_CODES = {
	HAS_NO_ERRORS: 0,
	UNKNOWN: -1,
	UNKNOW_API_METHOD: 1,
	ACCESS_DENIED: 2,
	INCORRECT_KEY: 3,
	SESSION_NOT_EXIST: 4,
	INCORRECT_TOKEN: 5,
	SESSION_HAS_EXPIRED: 6,
	INCORRECT_PARAMS: 101
};

var ERROR_NAMES = invert(ERROR_CODES);

var ApiError = function () {
	/**
  * ApiError Constructor
  * @param  {Number} code Error code numbder
  * @param  {String} msg  Message of error
  */
	function ApiError(code, msg) {
		_classCallCheck(this, ApiError);

		// Call base class contructor
		Error.apply(this, arguments);

		if (typeof Error.captureStackTrace !== 'function') {
			this.stack = new Error().stack;
		} else {
			Error.captureStackTrace(this, ApiError);
		}

		if (typeof code === 'string') {
			code = ERROR_CODES[code] || -1;
		}

		// Find error name
		var errName = ERROR_NAMES[code] || 'UNKNOWN';

		// Fill property
		this.code = code;
		this.message = msg || errName.toString();
	}

	/**
  * Build simple object
  * @return {Object} Contain code and message
  */


	_createClass(ApiError, [{
		key: 'toJSON',
		value: function toJSON() {
			return {
				error_code: this.code,
				error_msg: this.message
			};
		}

		/**
   * Check error code number
   * @param  {Number|String}  Number or name of error code
   * @return {Boolean}        Compare result
   */

	}, {
		key: 'is',
		value: function is(value) {
			if (typeof value === 'number') {
				return this.code === value;
			} else if (typeof value === 'string') {
				return this.code === ERROR_CODES[value];
			}

			return false;
		}
	}], [{
		key: 'incorrectParam',
		value: function incorrectParam(paramName) {
			return new ApiError('INCORRECT_PARAMS', 'Incorrect "' + paramName + '" parameter.');
		}
	}, {
		key: 'incorrectMethod',
		value: function incorrectMethod(methodName) {
			return new ApiError('INCORRECT_PARAMS', 'Incorrect "' + methodName + '" method.');
		}
	}]);

	return ApiError;
}();

function invert(obj) {
	var result = {};

	for (var key in obj) {
		result[obj[key]] = key;
	}

	return result;
}

ApiError.CODES = ERROR_CODES;
exports.default = ApiError;
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ApiError = require('./ApiError');

var _ApiError2 = _interopRequireDefault(_ApiError);

var _Protocol = require('./Protocol');

var _Protocol2 = _interopRequireDefault(_Protocol);

var _ngRequire = require('./ng-require');

var _ngRequire2 = _interopRequireDefault(_ngRequire);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HttpClient = function () {
	/**
  * Initialize API interface with http protocol
  * @param  {String} serviceUrl Back-end service URL
  */
	function HttpClient(serviceUrl) {
		_classCallCheck(this, HttpClient);

		this.serviceUrl = serviceUrl;
		this.http = (0, _ngRequire2.default)('$http');
		this.q = (0, _ngRequire2.default)('$q');
		this.proto = new _Protocol2.default('http.client');
	}

	/**
  * Call API method with args
  * @param  {String} method Name of method
  * @param  {Object} args   Arguments
  * @return {Promise}       Promise
  */


	_createClass(HttpClient, [{
		key: 'call',
		value: function call(method, args) {
			var deferred = this.q.defer();
			var data = { method: method, args: args };

			console.log('http.client:req', method, args);

			this.proto.onsend(data);
			this.http.defaults.headers.common['X-Token'] = this.proto.getToken();
			this.http.post(this.serviceUrl + method, data.args).success(this.proto.handler.bind(this.proto, deferred)).error(this.proto.handler.bind(this.proto, deferred));

			return deferred.promise;
		}

		/**
   * Parse error response to ApiError
   * @param  {Object} data Raw error data
   * @return {ApiError}   ApiError
   */

	}, {
		key: 'parseError',
		value: function parseError(data) {
			return new _ApiError2.default(data.error_code, data.error_msg);
		}
	}]);

	return HttpClient;
}();

exports.default = HttpClient;
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _set2 = require('lodash/set');

var _set3 = _interopRequireDefault(_set2);

var _get2 = require('lodash/get');

var _get3 = _interopRequireDefault(_get2);

var _sha = require('sha-1');

var _sha2 = _interopRequireDefault(_sha);

var _ApiError = require('./ApiError');

var _ApiError2 = _interopRequireDefault(_ApiError);

var _ngRequire = require('./ng-require');

var _ngRequire2 = _interopRequireDefault(_ngRequire);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Protocol = function () {
	function Protocol() {
		var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'client';

		_classCallCheck(this, Protocol);

		this.name = name;
		this.localStorage = (0, _ngRequire2.default)('$localStorage');
		this.rootScope = (0, _ngRequire2.default)('$rootScope');
		console.log(name + ': intialized');
	}

	_createClass(Protocol, [{
		key: 'handler',
		value: function handler(promise, data) {
			var api = (0, _get3.default)(data, 'api', {
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
				var key = ['cache', api.name, data.inputSign].join('.');

				if (data.response) {
					console.debug(api.name, 'stored in cache', data.inputSign);

					(0, _set3.default)(this.localStorage, key, {
						v: data.response,
						h: data.cacheSign
					});
				} else {
					console.debug(api.name, 'provide from cache');
					data.response = (0, _get3.default)(this.localStorage, key + '.v');
				}
			}

			if (data.error_code) {
				var err = this.parseError(data);
				this.rootScope.$emit('eqApi.error', err);
				promise.reject(err);
			} else {
				promise.resolve(data.response);
			}
		}
	}, {
		key: 'getToken',
		value: function getToken() {
			return this.localStorage.token || undefined;
		}
	}, {
		key: 'onsend',
		value: function onsend(data) {
			data.token = this.getToken();

			if (data.args && data.args.__cache) {
				delete data.args.__cache;

				var argsSign = (0, _sha2.default)(JSON.stringify(data.args));
				var key = ['cache', data.method, argsSign, 'h'].join('.');

				data.args.__cache = (0, _get3.default)(this.localStorage, key);
			}
		}
	}, {
		key: 'parseError',
		value: function parseError(data) {
			return new _ApiError2.default(data.error_code, data.error_msg);
		}
	}]);

	return Protocol;
}();

exports.default = Protocol;
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ApiError = require('./ApiError');

var _ApiError2 = _interopRequireDefault(_ApiError);

var _Protocol = require('./Protocol');

var _Protocol2 = _interopRequireDefault(_Protocol);

var _ngRequire = require('./ng-require');

var _ngRequire2 = _interopRequireDefault(_ngRequire);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WsClient = function () {
	function WsClient(path) {
		_classCallCheck(this, WsClient);

		this.wsInit(path);
		this.stack = {};
		this.proto = new _Protocol2.default('ws.client');
		this.q = (0, _ngRequire2.default)('$q');
	}

	_createClass(WsClient, [{
		key: 'wsInit',
		value: function wsInit(path) {
			var _this = this;

			this.socket = new WebSocket(path);
			this.socket.onmessage = this.controller.bind(this);
			this.socket.onclose = function () {
				setTimeout(function () {
					console.warn('ws.client: reconnect.');
					_this.wsInit(path);
				}, 1000);
			};
		}
	}, {
		key: 'controller',
		value: function controller(message) {
			var data = this.parsePaket(message.data);

			if (data.event) {
				console.debug('ws:event', data.event);
				this.proto.rootScope.$broadcast('eqApi.' + data.event, data.args);
				return;
			};

			if (typeof data.sid !== 'string') {
				throw new Error('Incorecnt typeof [sid]');
			}

			var sess = this.stack[data.sid];

			if (!sess) {
				console.warn('ws.client: reseived unknown session response.');
				return;
			}

			delete this.stack[data.sid];
			this.proto.handler(sess, data);
		}
	}, {
		key: 'call',
		value: function call(method, args) {
			var deferred = this.q.defer();

			var uid = this.generateId();
			var sid = ['eq', uid].join(':');
			var data = { method: method, args: args, sid: sid };

			this.stack[sid] = deferred;
			this.proto.onsend(data);
			this.send(data);

			console.log('ws.client:req', method, sid, args);

			return deferred.promise;
		}
	}, {
		key: 'send',
		value: function send(data) {
			if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object') {
				data = JSON.stringify(data);
			}

			if (this.socket.readyState === 1) {
				this.socket.send(data);
			} else {
				setTimeout(this.send.bind(this, data), 5);
			}
		}
	}, {
		key: 'generateId',
		value: function generateId() {
			return Math.random().toString(16).slice(2);
		}
	}, {
		key: 'parsePaket',
		value: function parsePaket(message) {
			var data = JSON.parse(message);
			return data;
		}
	}]);

	return WsClient;
}();

exports.default = WsClient;
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.HttpClient = exports.WsClient = undefined;

var _WsClient = require('./WsClient');

var _WsClient2 = _interopRequireDefault(_WsClient);

var _HttpClient = require('./HttpClient');

var _HttpClient2 = _interopRequireDefault(_HttpClient);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

angular.module('eq.api', ['ngStorage']).provider('eqApiConfig', provider).factory('eqApi', factory);

function provider() {
	return {
		options: {
			httpUrl: '/',
			wsUrl: '/',
			defaultProtocol: 'ws'
		},
		$get: function $get() {
			return this;
		}
	};
}

function factory($http, $q, $state, $localStorage, eqApiConfig) {
	// Get options
	var opts = eqApiConfig.options;

	// Initialize ws interface
	var ws = new _WsClient2.default(opts.wsUrl);

	// Initialize http interface
	var http = new _HttpClient2.default(opts.httpUrl);

	// Interface
	var i = { ws: ws, http: http };

	i.call = function () {
		var protocol = i[opts.defaultProtocol];
		return protocol.call.apply(protocol, arguments);
	};

	return i;
}

factory.$inject = ['$http', '$q', '$state', '$localStorage', 'eqApiConfig'];

exports.WsClient = _WsClient2.default;
exports.HttpClient = _HttpClient2.default;
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function (module) {
	return angular.element(document.body).injector().get(module);
};
