/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	exports.HttpClient = exports.WsClient = undefined;

	var _WsClient = __webpack_require__(2);

	var _WsClient2 = _interopRequireDefault(_WsClient);

	var _HttpClient = __webpack_require__(72);

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

		ws.binary = !!opts.pson;
		return i;
	}

	factory.$inject = ['$http', '$q', '$state', '$localStorage', 'eqApiConfig'];

	exports.WsClient = _WsClient2.default;
	exports.HttpClient = _HttpClient2.default;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
		value: true
	});

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _isObject2 = __webpack_require__(3);

	var _isObject3 = _interopRequireDefault(_isObject2);

	var _PSON = __webpack_require__(4);

	var _PSON2 = _interopRequireDefault(_PSON);

	var _ApiError = __webpack_require__(11);

	var _ApiError2 = _interopRequireDefault(_ApiError);

	var _Protocol = __webpack_require__(12);

	var _Protocol2 = _interopRequireDefault(_Protocol);

	var _ngRequire = __webpack_require__(71);

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
			this.pson = new _PSON2.default.StaticPair([]);
			this.binary = true;
		}

		_createClass(WsClient, [{
			key: 'wsInit',
			value: function wsInit(path) {
				var _this = this;

				this.socket = new WebSocket(path);
				this.socket.binaryType = 'arraybuffer';
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
				var data = this.decode(message.data);

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
				if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object' && !data.byteLength) {
					data = this.encode(data);
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
			key: 'encode',
			value: function encode(data) {
				if (this.binary) {
					return this.pson.encode(data).buffer;
				} else {
					return JSON.stringify(data);
				}
			}
		}, {
			key: 'decode',
			value: function decode(data) {
				if (typeof data !== 'string') {
					return this.pson.decode(data);
				} else {
					return JSON.parse(data);
				}
			}
		}]);

		return WsClient;
	}();

	exports.default = WsClient;

/***/ },
/* 3 */
/***/ function(module, exports) {

	/**
	 * Checks if `value` is the
	 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
	 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	 * @example
	 *
	 * _.isObject({});
	 * // => true
	 *
	 * _.isObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isObject(_.noop);
	 * // => true
	 *
	 * _.isObject(null);
	 * // => false
	 */
	function isObject(value) {
	  var type = typeof value;
	  return value != null && (type == 'object' || type == 'function');
	}

	module.exports = isObject;


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(module) {/*
	 Copyright 2013 Daniel Wirtz <dcode@dcode.io>

	 Licensed under the Apache License, Version 2.0 (the "License");
	 you may not use this file except in compliance with the License.
	 You may obtain a copy of the License at

	 http://www.apache.org/licenses/LICENSE-2.0

	 Unless required by applicable law or agreed to in writing, software
	 distributed under the License is distributed on an "AS IS" BASIS,
	 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 See the License for the specific language governing permissions and
	 limitations under the License.
	 */

	/**
	 * @license PSON (c) 2013 Daniel Wirtz <dcode@dcode.io>
	 * Released under the Apache License, Version 2.0
	 * see: https://github.com/dcodeIO/PSON for details
	 */
	(function(global) {
	    "use strict";

	    function loadPSON(ByteBuffer) {
	        if (!ByteBuffer) {
	            throw(new Error("PSON requires ByteBuffer.js: Get it at https://github.com/dcodeIO/ByteBuffer.js"));
	        }

	        /**
	         * PSON namespace.
	         * @exports PSON
	         * @namespace
	         */
	        var PSON = {};

	        /**
	         * @alias PSON.T
	         */
	        PSON.T = (function() {

	            /**
	             * PSON byte types.
	             * @exports PSON.T
	             * @namespace
	             */
	            var T = {};

	            T.ZERO       = 0x00; // 0
	            //             0x01; // -1
	            //             0x02; // 1
	            //             ...   // zig-zag encoded varints
	            T.MAX        = 0xEF; // -120, max. zig-zag encoded varint

	            T.NULL       = 0xF0; // null
	            T.TRUE       = 0xF1; // true
	            T.FALSE      = 0xF2; // false
	            T.EOBJECT    = 0xF3; // {}
	            T.EARRAY     = 0xF4; // []
	            T.ESTRING    = 0xF5; // ""
	            T.OBJECT     = 0xF6; // {...}
	            T.ARRAY      = 0xF7; // [...]
	            T.INTEGER    = 0xF8; // number (zig-zag encoded varint32)
	            T.LONG       = 0xF9; // Long   (zig-zag encoded varint64)
	            T.FLOAT      = 0xFA; // number (float32)
	            T.DOUBLE     = 0xFB; // number (float64)
	            T.STRING     = 0xFC; // string (varint length + data)
	            T.STRING_ADD = 0xFD; // string (varint length + data, add to dictionary)
	            T.STRING_GET = 0xFE; // string (varint index to get from dictionary)
	            T.BINARY     = 0xFF; // bytes (varint length + data)

	            return T;

	        })();

	        /**
	         * @alias PSON.Encoder
	         */
	        PSON.Encoder = (function(ByteBuffer, T) {

	            /**
	             * Float conversion test buffer.
	             * @type {!ByteBuffer}
	             */
	            var fbuf = new ByteBuffer(4);
	            fbuf.length = 4;

	            /**
	             * Long.js.
	             * @type {?Long}
	             */
	            var Long = ByteBuffer.Long;

	            /**
	             * Constructs a new PSON Encoder.
	             * @exports PSON.Encoder
	             * @class A PSON Encoder.
	             * @param {Array.<string>=} dict Initial dictionary
	             * @param {boolean} progressive Whether this is a progressive or a static encoder
	             * @param {Object.<string,*>=} options Options
	             * @constructor
	             */
	            var Encoder = function(dict, progressive, options) {

	                /**
	                 * Dictionary hash.
	                 * @type {Object.<string,number>}
	                 */
	                this.dict = {};

	                /**
	                 * Next dictionary index.
	                 * @type {number}
	                 */
	                this.next = 0;
	                if (dict && Array.isArray(dict)) {
	                    while (this.next < dict.length) {
	                        this.dict[dict[this.next]] = this.next++;
	                    }
	                }

	                /**
	                 * Whether the encoder is progressive or static.
	                 * @type {boolean}
	                 */
	                this.progressive = !!progressive;

	                /**
	                 * Options.
	                 * @type {Object.<string,*>}
	                 */
	                this.options = options || {};
	            };

	            /**
	             * Encodes JSON to PSON.
	             * @param {*} json JSON
	             * @param {(!ByteBuffer)=} buf Buffer to encode to. When omitted, the resulting ByteBuffer will be flipped. When
	             *  specified, it will not be flipped.
	             * @returns {!ByteBuffer} PSON
	             */
	            Encoder.prototype.encode = function(json, buf) {
	                var doFlip = false;
	                if (!buf) {
	                    buf = new ByteBuffer();
	                    doFlip = true;
	                }
	                var le = buf.littleEndian;
	                try {
	                    this._encodeValue(json, buf.LE());
	                    buf.littleEndian = le;
	                    return doFlip ? buf.flip() : buf;
	                } catch (e) {
	                    buf.littleEndian = le;
	                    throw(e);
	                }
	            };

	            /**
	             * Encodes a single JSON value to PSON.
	             * @param {*} val JSON value
	             * @param {!ByteBuffer} buf Target buffer
	             * @param {boolean=} excluded Whether keywords are to be excluded or not
	             * @private
	             */
	            Encoder.prototype._encodeValue = function(val, buf, excluded) {
	                if (val === null) {
	                    buf.writeUint8(T.NULL);
	                } else {
	                    switch (typeof val) {
	                        case 'function':
	                            val = val.toString();
	                            // fall through
	                        case 'string':
	                            if (val.length === 0) {
	                                buf.writeUint8(T.ESTRING);
	                            } else {
	                                if (this.dict.hasOwnProperty(val)) {
	                                    buf.writeUint8(T.STRING_GET);
	                                    buf.writeVarint32(this.dict[val]);
	                                } else {
	                                    buf.writeUint8(T.STRING);
	                                    buf.writeVString(val);
	                                }
	                            }
	                            break;
	                        case 'number':
	                            var intVal = parseInt(val);
	                            if (val === intVal) {
	                                var zzval = ByteBuffer.zigZagEncode32(val); // unsigned
	                                if (zzval <= T.MAX) {
	                                    buf.writeUint8(zzval);
	                                } else {
	                                    buf.writeUint8(T.INTEGER);
	                                    buf.writeVarint32ZigZag(val);
	                                }
	                            } else {
	                                fbuf.writeFloat32(val, 0);
	                                if (val === fbuf.readFloat32(0)) {
	                                    buf.writeUint8(T.FLOAT);
	                                    buf.writeFloat32(val);
	                                } else {
	                                    buf.writeUint8(T.DOUBLE);
	                                    buf.writeFloat64(val);
	                                }
	                            }
	                            break;
	                        case 'boolean':
	                            buf.writeUint8(val ? T.TRUE : T.FALSE);
	                            break;
	                        case 'object':
	                            var i;
	                            if (Array.isArray(val)) {
	                                if (val.length === 0) {
	                                    buf.writeUint8(T.EARRAY);
	                                } else {
	                                    buf.writeUint8(T.ARRAY);
	                                    buf.writeVarint32(val.length);
	                                    for (i=0; i<val.length; i++) {
	                                        this._encodeValue(val[i], buf);
	                                    }
	                                }
	                            } else if (Long && val instanceof Long) {
	                                buf.writeUint8(T.LONG);
	                                buf.writeVarint64ZigZag(val);
	                            } else {
	                                try {
	                                    val = ByteBuffer.wrap(val);
	                                    buf.writeUint8(T.BINARY);
	                                    buf.writeVarint32(val.remaining());
	                                    buf.append(val);
	                                } catch (e) {
	                                    var keys = Object.keys(val);
	                                    var n = 0;
	                                    for (i=0; i<keys.length; i++) {
	                                        if (typeof val[keys[i]] !== 'undefined') n++;
	                                    }
	                                    if (n === 0) {
	                                        buf.writeUint8(T.EOBJECT);
	                                    } else {
	                                        buf.writeUint8(T.OBJECT);
	                                        buf.writeVarint32(n);
	                                        if (!excluded) excluded = !!val._PSON_EXCL_;
	                                        for (i=0; i<keys.length; i++) {
	                                            var key = keys[i];
	                                            if (typeof val[key] === 'undefined') continue;
	                                            if (this.dict.hasOwnProperty(key)) {
	                                                buf.writeUint8(T.STRING_GET);
	                                                buf.writeVarint32(this.dict[key]);
	                                            } else {
	                                                if (this.progressive && !excluded) {
	                                                    // Add to dictionary
	                                                    this.dict[key] = this.next++;
	                                                    buf.writeUint8(T.STRING_ADD);
	                                                } else {
	                                                    // Plain string
	                                                    buf.writeUint8(T.STRING);
	                                                }
	                                                buf.writeVString(key);
	                                            }
	                                            this._encodeValue(val[key], buf);
	                                        }
	                                    }
	                                }
	                            }
	                            break;
	                        case 'undefined':
	                            buf.writeUint8(T.NULL);
	                            break;
	                    }
	                }
	            };

	            return Encoder;

	        })(ByteBuffer, PSON.T);

	        /**
	         * @alias PSON.Decoder
	         */
	        PSON.Decoder = (function(ByteBuffer, T) {

	            /**
	             * Long.js.
	             * @type {?Long}
	             */
	            var Long = ByteBuffer.Long;

	            /**
	             * Constructs a new PSON Decoder.
	             * @exports PSON.Decoder
	             * @class A PSON Decoder.
	             * @param {Array.<string>} dict Initial dictionary values
	             * @param {boolean} progressive Whether this is a progressive or a static decoder
	             * @param {Object.<string,*>=} options Options
	             * @constructor
	             */
	            var Decoder = function(dict, progressive, options) {

	                /**
	                 * Dictionary array.
	                 * @type {Array.<string>}
	                 */
	                this.dict = (dict && Array.isArray(dict)) ? dict : [];

	                /**
	                 * Whether this is a progressive or a static decoder.
	                 * @type {boolean}
	                 */
	                this.progressive = !!progressive;

	                /**
	                 * Options.
	                 * @type {Object.<string,*>}
	                 */
	                this.options = options || {};
	            };

	            /**
	             * Decodes PSON to JSON.
	             * @param {!(ByteBuffer|ArrayBuffer|Buffer)} buf PSON
	             * @returns {?} JSON
	             */
	            Decoder.prototype.decode = function(buf) {
	                if (!(buf instanceof ByteBuffer)) {
	                    buf = ByteBuffer.wrap(buf);
	                }
	                var le = buf.littleEndian;
	                try {
	                    var val = this._decodeValue(buf.LE());
	                    buf.littleEndian = le;
	                    return val;
	                } catch (e) {
	                    buf.littleEndian = le;
	                    throw(e);
	                }
	            };

	            /**
	             * Decodes a single PSON value to JSON.
	             * @param {!ByteBuffer} buf Buffer to decode from
	             * @returns {?} JSON
	             * @private
	             */
	            Decoder.prototype._decodeValue = function(buf) {
	                var t = buf.readUint8();
	                if (t <= T.MAX) {
	                    return ByteBuffer.zigZagDecode32(t);
	                } else {
	                    switch (t) {
	                        case T.NULL: return null;
	                        case T.TRUE: return true;
	                        case T.FALSE: return false;
	                        case T.EOBJECT: return {};
	                        case T.EARRAY: return [];
	                        case T.ESTRING: return "";
	                        case T.OBJECT:
	                            t = buf.readVarint32(); // #keys
	                            var obj = {};
	                            while (--t>=0) {
	                                obj[this._decodeValue(buf)] = this._decodeValue(buf);
	                            }
	                            return obj;
	                        case T.ARRAY:
	                            t = buf.readVarint32(); // #items
	                            var arr = [];
	                            while (--t>=0) {
	                                arr.push(this._decodeValue(buf));
	                            }
	                            return arr;
	                        case T.INTEGER: return buf.readVarint32ZigZag();
	                        case T.LONG: // must not crash
	                            if (Long) return buf.readVarint64ZigZag();
	                            return buf.readVarint32ZigZag();
	                        case T.FLOAT: return buf.readFloat32();
	                        case T.DOUBLE: return buf.readFloat64();
	                        case T.STRING: return buf.readVString();
	                        case T.STRING_ADD:
	                            var str = buf.readVString();
	                            this.dict.push(str);
	                            return str;
	                        case T.STRING_GET:
	                            return this.dict[buf.readVarint32()];
	                        case T.BINARY:
	                            t = buf.readVarint32();
	                            var ret = buf.slice(buf.offset, buf.offset+t);
	                            buf.offset += t;
	                            return ret;
	                        default:
	                            throw(new Error("Illegal type at "+buf.offset+": "+t));
	                    }
	                }
	            };

	            return Decoder;

	        })(ByteBuffer, PSON.T);

	        /**
	         * @alias PSON.Pair
	         */
	        PSON.Pair = (function() {

	            /**
	             * Constructs a new abstract PSON encoder and decoder pair.
	             * @exports PSON.Pair
	             * @class An abstract PSON encoder and decoder pair.
	             * @constructor
	             * @abstract
	             */
	            var Pair = function() {

	                /**
	                 * Encoder.
	                 * @type {!PSON.Encoder}
	                 * @expose
	                 */
	                this.encoder;

	                /**
	                 * Decoder.
	                 * @type {!PSON.Decoder}
	                 * @expose
	                 */
	                this.decoder;
	            };

	            /**
	             * Encodes JSON to PSON.
	             * @param {*} json JSON
	             * @returns {!ByteBuffer} PSON
	             * @expose
	             */
	            Pair.prototype.encode = function(json) {
	                return this.encoder.encode(json);
	            };

	            /**
	             * Encodes JSON straight to an ArrayBuffer of PSON.
	             * @param {*} json JSON
	             * @returns {!ArrayBuffer} PSON as ArrayBuffer
	             * @expose
	             */
	            Pair.prototype.toArrayBuffer = function(json) {
	                return this.encoder.encode(json).toArrayBuffer();
	            };

	            /**
	             * Encodes JSON straight to a node Buffer of PSON.
	             * @param {*} json JSON
	             * @returns {!Buffer} PSON as node Buffer
	             * @expose
	             */
	            Pair.prototype.toBuffer = function(json) {
	                return this.encoder.encode(json).toBuffer();
	            };

	            /**
	             * Decodes PSON to JSON.
	             * @param {ByteBuffer|ArrayBuffer|Buffer} pson PSON
	             * @returns {*} JSON
	             * @expose
	             */
	            Pair.prototype.decode = function(pson) {
	                return this.decoder.decode(pson);
	            };

	            return Pair;
	        })();

	        /**
	         * @alias PSON.StaticPair
	         */
	        PSON.StaticPair = (function(Pair, Encoder, Decoder) {

	            /**
	             * Constructs a new static PSON encoder and decoder pair.
	             * @exports PSON.StaticPair
	             * @class A static PSON encoder and decoder pair.
	             * @param {Array.<string>=} dict Static dictionary
	             * @param {Object.<string,*>=} options Options
	             * @constructor
	             * @extends PSON.Pair
	             */
	            var StaticPair = function(dict, options) {
	                Pair.call(this);

	                this.encoder = new Encoder(dict, false, options);
	                this.decoder = new Decoder(dict, false, options);
	            };

	            // Extends PSON.Pair
	            StaticPair.prototype = Object.create(Pair.prototype);

	            return StaticPair;

	        })(PSON.Pair, PSON.Encoder, PSON.Decoder);

	        /**
	         * @alias PSON.ProgressivePair
	         */
	        PSON.ProgressivePair = (function(Pair, Encoder, Decoder) {

	            /**
	             * Constructs a new progressive PSON encoder and decoder pair.
	             * @exports PSON.ProgressivePair
	             * @class A progressive PSON encoder and decoder pair.
	             * @param {Array.<string>=} dict Initial dictionary
	             * @param {Object.<string,*>=} options Options
	             * @constructor
	             * @extends PSON.Pair
	             */
	            var ProgressivePair = function(dict, options) {
	                Pair.call(this);

	                this.encoder = new Encoder(dict, true, options);
	                this.decoder = new Decoder(dict, true, options);
	            };

	            // Extends PSON.Pair
	            ProgressivePair.prototype = Object.create(Pair.prototype);

	            /**
	             * Alias for {@link PSON.exclude}.
	             * @param {Object} obj Now excluded object
	             */
	            ProgressivePair.prototype.exclude = function(obj) {
	                PSON.exclude(obj);
	            };

	            /**
	             * Alias for {@link PSON.include}.
	             * @param {Object} obj New included object
	             */
	            ProgressivePair.prototype.include = function(obj) {
	                PSON.include(obj);
	            };

	            return ProgressivePair;

	        })(PSON.Pair, PSON.Encoder, PSON.Decoder);

	        /**
	         * Excluces an object's and its children's keys from being added to a progressive dictionary.
	         * @param {Object} obj Now excluded object
	         */
	        PSON.exclude = function(obj) {
	            if (typeof obj === 'object') {
	                Object.defineProperty(obj, "_PSON_EXCL_", {
	                    value: true,
	                    enumerable: false,
	                    configurable: true
	                });
	            }
	        };

	        /**
	         * Undoes exclusion of an object's and its children's keys from being added to a progressive dictionary.
	         * @param {Object} obj Now included object
	         */
	        PSON.include = function(obj) {
	            if (typeof obj === 'object') {
	                delete obj["_PSON_EXCL_"];
	            }
	        };

	        return PSON;
	    }

	    // Enable module loading if available
	    if (typeof module != 'undefined' && module["exports"]) { // CommonJS
	        module["exports"] = loadPSON(__webpack_require__(6));
	    } else if ("function" != 'undefined' && __webpack_require__(8)["amd"]) { // AMD
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(10)], __WEBPACK_AMD_DEFINE_FACTORY__ = (loadPSON), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    } else {
	        if (!global["dcodeIO"]) {
	            global["dcodeIO"] = {};
	        }
	        global["dcodeIO"]["PSON"] = loadPSON(global["dcodeIO"]["ByteBuffer"]);
	    }

	})(this);

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)(module)))

/***/ },
/* 5 */
/***/ function(module, exports) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(module) {/*
	 Copyright 2013-2014 Daniel Wirtz <dcode@dcode.io>

	 Licensed under the Apache License, Version 2.0 (the "License");
	 you may not use this file except in compliance with the License.
	 You may obtain a copy of the License at

	 http://www.apache.org/licenses/LICENSE-2.0

	 Unless required by applicable law or agreed to in writing, software
	 distributed under the License is distributed on an "AS IS" BASIS,
	 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 See the License for the specific language governing permissions and
	 limitations under the License.
	 */

	/**
	 * @license ByteBuffer.js (c) 2013-2014 Daniel Wirtz <dcode@dcode.io>
	 * This version of ByteBuffer.js uses an ArrayBuffer as its backing buffer which is accessed through a DataView and is
	 * compatible with modern browsers.
	 * Released under the Apache License, Version 2.0
	 * see: https://github.com/dcodeIO/ByteBuffer.js for details
	 */ //
	(function(global) {
	    "use strict";

	    /**
	     * @param {function(new: Long, number, number, boolean=)=} Long
	     * @returns {function(new: ByteBuffer, number=, boolean=, boolean=)}}
	     * @inner
	     */
	    function loadByteBuffer(Long) {

	        /**
	         * Constructs a new ByteBuffer.
	         * @class The swiss army knife for binary data in JavaScript.
	         * @exports ByteBuffer
	         * @constructor
	         * @param {number=} capacity Initial capacity. Defaults to {@link ByteBuffer.DEFAULT_CAPACITY}.
	         * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
	         *  {@link ByteBuffer.DEFAULT_ENDIAN}.
	         * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
	         *  {@link ByteBuffer.DEFAULT_NOASSERT}.
	         * @expose
	         */
	        var ByteBuffer = function(capacity, littleEndian, noAssert) {
	            if (typeof capacity     === 'undefined') capacity     = ByteBuffer.DEFAULT_CAPACITY;
	            if (typeof littleEndian === 'undefined') littleEndian = ByteBuffer.DEFAULT_ENDIAN;
	            if (typeof noAssert     === 'undefined') noAssert     = ByteBuffer.DEFAULT_NOASSERT;
	            if (!noAssert) {
	                capacity = capacity | 0;
	                if (capacity < 0)
	                    throw RangeError("Illegal capacity");
	                littleEndian = !!littleEndian;
	                noAssert = !!noAssert;
	            }

	            /**
	             * Backing buffer.
	             * @type {!ArrayBuffer}
	             * @expose
	             */
	            this.buffer = capacity === 0 ? EMPTY_BUFFER : new ArrayBuffer(capacity);

	            /**
	             * Data view to manipulate the backing buffer. Becomes `null` if the backing buffer has a capacity of `0`.
	             * @type {?DataView}
	             * @expose
	             */
	            this.view = capacity === 0 ? null : new DataView(this.buffer);

	            /**
	             * Absolute read/write offset.
	             * @type {number}
	             * @expose
	             * @see ByteBuffer#flip
	             * @see ByteBuffer#clear
	             */
	            this.offset = 0;

	            /**
	             * Marked offset.
	             * @type {number}
	             * @expose
	             * @see ByteBuffer#mark
	             * @see ByteBuffer#reset
	             */
	            this.markedOffset = -1;

	            /**
	             * Absolute limit of the contained data. Set to the backing buffer's capacity upon allocation.
	             * @type {number}
	             * @expose
	             * @see ByteBuffer#flip
	             * @see ByteBuffer#clear
	             */
	            this.limit = capacity;

	            /**
	             * Whether to use little endian byte order, defaults to `false` for big endian.
	             * @type {boolean}
	             * @expose
	             */
	            this.littleEndian = typeof littleEndian !== 'undefined' ? !!littleEndian : false;

	            /**
	             * Whether to skip assertions of offsets and values, defaults to `false`.
	             * @type {boolean}
	             * @expose
	             */
	            this.noAssert = !!noAssert;
	        };

	        /**
	         * ByteBuffer version.
	         * @type {string}
	         * @const
	         * @expose
	         */
	        ByteBuffer.VERSION = "3.5.5";

	        /**
	         * Little endian constant that can be used instead of its boolean value. Evaluates to `true`.
	         * @type {boolean}
	         * @const
	         * @expose
	         */
	        ByteBuffer.LITTLE_ENDIAN = true;

	        /**
	         * Big endian constant that can be used instead of its boolean value. Evaluates to `false`.
	         * @type {boolean}
	         * @const
	         * @expose
	         */
	        ByteBuffer.BIG_ENDIAN = false;

	        /**
	         * Default initial capacity of `16`.
	         * @type {number}
	         * @expose
	         */
	        ByteBuffer.DEFAULT_CAPACITY = 16;

	        /**
	         * Default endianess of `false` for big endian.
	         * @type {boolean}
	         * @expose
	         */
	        ByteBuffer.DEFAULT_ENDIAN = ByteBuffer.BIG_ENDIAN;

	        /**
	         * Default no assertions flag of `false`.
	         * @type {boolean}
	         * @expose
	         */
	        ByteBuffer.DEFAULT_NOASSERT = false;

	        /**
	         * A `Long` class for representing a 64-bit two's-complement integer value. May be `null` if Long.js has not been loaded
	         *  and int64 support is not available.
	         * @type {?Long}
	         * @const
	         * @see https://github.com/dcodeIO/Long.js
	         * @expose
	         */
	        ByteBuffer.Long = Long || null;

	        /**
	         * @alias ByteBuffer.prototype
	         * @inner
	         */
	        var ByteBufferPrototype = ByteBuffer.prototype;

	        // helpers

	        /**
	         * @type {!ArrayBuffer}
	         * @inner
	         */
	        var EMPTY_BUFFER = new ArrayBuffer(0);

	        /**
	         * String.fromCharCode reference for compile-time renaming.
	         * @type {function(...number):string}
	         * @inner
	         */
	        var stringFromCharCode = String.fromCharCode;

	        /**
	         * Creates a source function for a string.
	         * @param {string} s String to read from
	         * @returns {function():number|null} Source function returning the next char code respectively `null` if there are
	         *  no more characters left.
	         * @throws {TypeError} If the argument is invalid
	         * @inner
	         */
	        function stringSource(s) {
	            var i=0; return function() {
	                return i < s.length ? s.charCodeAt(i++) : null;
	            };
	        }

	        /**
	         * Creates a destination function for a string.
	         * @returns {function(number=):undefined|string} Destination function successively called with the next char code.
	         *  Returns the final string when called without arguments.
	         * @inner
	         */
	        function stringDestination() {
	            var cs = [], ps = []; return function() {
	                if (arguments.length === 0)
	                    return ps.join('')+stringFromCharCode.apply(String, cs);
	                if (cs.length + arguments.length > 1024)
	                    ps.push(stringFromCharCode.apply(String, cs)),
	                        cs.length = 0;
	                Array.prototype.push.apply(cs, arguments);
	            };
	        }

	        /**
	         * Allocates a new ByteBuffer backed by a buffer of the specified capacity.
	         * @param {number=} capacity Initial capacity. Defaults to {@link ByteBuffer.DEFAULT_CAPACITY}.
	         * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
	         *  {@link ByteBuffer.DEFAULT_ENDIAN}.
	         * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
	         *  {@link ByteBuffer.DEFAULT_NOASSERT}.
	         * @returns {!ByteBuffer}
	         * @expose
	         */
	        ByteBuffer.allocate = function(capacity, littleEndian, noAssert) {
	            return new ByteBuffer(capacity, littleEndian, noAssert);
	        };

	        /**
	         * Concatenates multiple ByteBuffers into one.
	         * @param {!Array.<!ByteBuffer|!ArrayBuffer|!Uint8Array|string>} buffers Buffers to concatenate
	         * @param {(string|boolean)=} encoding String encoding if `buffers` contains a string ("base64", "hex", "binary",
	         *  defaults to "utf8")
	         * @param {boolean=} littleEndian Whether to use little or big endian byte order for the resulting ByteBuffer. Defaults
	         *  to {@link ByteBuffer.DEFAULT_ENDIAN}.
	         * @param {boolean=} noAssert Whether to skip assertions of offsets and values for the resulting ByteBuffer. Defaults to
	         *  {@link ByteBuffer.DEFAULT_NOASSERT}.
	         * @returns {!ByteBuffer} Concatenated ByteBuffer
	         * @expose
	         */
	        ByteBuffer.concat = function(buffers, encoding, littleEndian, noAssert) {
	            if (typeof encoding === 'boolean' || typeof encoding !== 'string') {
	                noAssert = littleEndian;
	                littleEndian = encoding;
	                encoding = undefined;
	            }
	            var capacity = 0;
	            for (var i=0, k=buffers.length, length; i<k; ++i) {
	                if (!ByteBuffer.isByteBuffer(buffers[i]))
	                    buffers[i] = ByteBuffer.wrap(buffers[i], encoding);
	                length = buffers[i].limit - buffers[i].offset;
	                if (length > 0) capacity += length;
	            }
	            if (capacity === 0)
	                return new ByteBuffer(0, littleEndian, noAssert);
	            var bb = new ByteBuffer(capacity, littleEndian, noAssert),
	                bi;
	            var view = new Uint8Array(bb.buffer);
	            i=0; while (i<k) {
	                bi = buffers[i++];
	                length = bi.limit - bi.offset;
	                if (length <= 0) continue;
	                view.set(new Uint8Array(bi.buffer).subarray(bi.offset, bi.limit), bb.offset);
	                bb.offset += length;
	            }
	            bb.limit = bb.offset;
	            bb.offset = 0;
	            return bb;
	        };

	        /**
	         * Tests if the specified type is a ByteBuffer.
	         * @param {*} bb ByteBuffer to test
	         * @returns {boolean} `true` if it is a ByteBuffer, otherwise `false`
	         * @expose
	         */
	        ByteBuffer.isByteBuffer = function(bb) {
	            return (bb && bb instanceof ByteBuffer) === true;
	        };
	        /**
	         * Gets the backing buffer type.
	         * @returns {Function} `Buffer` for NB builds, `ArrayBuffer` for AB builds (classes)
	         * @expose
	         */
	        ByteBuffer.type = function() {
	            return ArrayBuffer;
	        };

	        /**
	         * Wraps a buffer or a string. Sets the allocated ByteBuffer's {@link ByteBuffer#offset} to `0` and its
	         *  {@link ByteBuffer#limit} to the length of the wrapped data.
	         * @param {!ByteBuffer|!ArrayBuffer|!Uint8Array|string|!Array.<number>} buffer Anything that can be wrapped
	         * @param {(string|boolean)=} encoding String encoding if `buffer` is a string ("base64", "hex", "binary", defaults to
	         *  "utf8")
	         * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
	         *  {@link ByteBuffer.DEFAULT_ENDIAN}.
	         * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
	         *  {@link ByteBuffer.DEFAULT_NOASSERT}.
	         * @returns {!ByteBuffer} A ByteBuffer wrapping `buffer`
	         * @expose
	         */
	        ByteBuffer.wrap = function(buffer, encoding, littleEndian, noAssert) {
	            if (typeof encoding !== 'string') {
	                noAssert = littleEndian;
	                littleEndian = encoding;
	                encoding = undefined;
	            }
	            if (typeof buffer === 'string') {
	                if (typeof encoding === 'undefined')
	                    encoding = "utf8";
	                switch (encoding) {
	                    case "base64":
	                        return ByteBuffer.fromBase64(buffer, littleEndian);
	                    case "hex":
	                        return ByteBuffer.fromHex(buffer, littleEndian);
	                    case "binary":
	                        return ByteBuffer.fromBinary(buffer, littleEndian);
	                    case "utf8":
	                        return ByteBuffer.fromUTF8(buffer, littleEndian);
	                    case "debug":
	                        return ByteBuffer.fromDebug(buffer, littleEndian);
	                    default:
	                        throw Error("Unsupported encoding: "+encoding);
	                }
	            }
	            if (buffer === null || typeof buffer !== 'object')
	                throw TypeError("Illegal buffer");
	            var bb;
	            if (ByteBuffer.isByteBuffer(buffer)) {
	                bb = ByteBufferPrototype.clone.call(buffer);
	                bb.markedOffset = -1;
	                return bb;
	            }
	            if (buffer instanceof Uint8Array) { // Extract ArrayBuffer from Uint8Array
	                bb = new ByteBuffer(0, littleEndian, noAssert);
	                if (buffer.length > 0) { // Avoid references to more than one EMPTY_BUFFER
	                    bb.buffer = buffer.buffer;
	                    bb.offset = buffer.byteOffset;
	                    bb.limit = buffer.byteOffset + buffer.length;
	                    bb.view = buffer.length > 0 ? new DataView(buffer.buffer) : null;
	                }
	            } else if (buffer instanceof ArrayBuffer) { // Reuse ArrayBuffer
	                bb = new ByteBuffer(0, littleEndian, noAssert);
	                if (buffer.byteLength > 0) {
	                    bb.buffer = buffer;
	                    bb.offset = 0;
	                    bb.limit = buffer.byteLength;
	                    bb.view = buffer.byteLength > 0 ? new DataView(buffer) : null;
	                }
	            } else if (Object.prototype.toString.call(buffer) === "[object Array]") { // Create from octets
	                bb = new ByteBuffer(buffer.length, littleEndian, noAssert);
	                bb.limit = buffer.length;
	                for (i=0; i<buffer.length; ++i)
	                    bb.view.setUint8(i, buffer[i]);
	            } else
	                throw TypeError("Illegal buffer"); // Otherwise fail
	            return bb;
	        };

	        // types/ints/int8

	        /**
	         * Writes an 8bit signed integer.
	         * @param {number} value Value to write
	         * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.writeInt8 = function(value, offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof value !== 'number' || value % 1 !== 0)
	                    throw TypeError("Illegal value: "+value+" (not an integer)");
	                value |= 0;
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	            }
	            offset += 1;
	            var capacity0 = this.buffer.byteLength;
	            if (offset > capacity0)
	                this.resize((capacity0 *= 2) > offset ? capacity0 : offset);
	            offset -= 1;
	            this.view.setInt8(offset, value);
	            if (relative) this.offset += 1;
	            return this;
	        };

	        /**
	         * Writes an 8bit signed integer. This is an alias of {@link ByteBuffer#writeInt8}.
	         * @function
	         * @param {number} value Value to write
	         * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.writeByte = ByteBufferPrototype.writeInt8;

	        /**
	         * Reads an 8bit signed integer.
	         * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
	         * @returns {number} Value read
	         * @expose
	         */
	        ByteBufferPrototype.readInt8 = function(offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 1 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+1+") <= "+this.buffer.byteLength);
	            }
	            var value = this.view.getInt8(offset);
	            if (relative) this.offset += 1;
	            return value;
	        };

	        /**
	         * Reads an 8bit signed integer. This is an alias of {@link ByteBuffer#readInt8}.
	         * @function
	         * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
	         * @returns {number} Value read
	         * @expose
	         */
	        ByteBufferPrototype.readByte = ByteBufferPrototype.readInt8;

	        /**
	         * Writes an 8bit unsigned integer.
	         * @param {number} value Value to write
	         * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.writeUint8 = function(value, offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof value !== 'number' || value % 1 !== 0)
	                    throw TypeError("Illegal value: "+value+" (not an integer)");
	                value >>>= 0;
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	            }
	            offset += 1;
	            var capacity1 = this.buffer.byteLength;
	            if (offset > capacity1)
	                this.resize((capacity1 *= 2) > offset ? capacity1 : offset);
	            offset -= 1;
	            this.view.setUint8(offset, value);
	            if (relative) this.offset += 1;
	            return this;
	        };

	        /**
	         * Reads an 8bit unsigned integer.
	         * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
	         * @returns {number} Value read
	         * @expose
	         */
	        ByteBufferPrototype.readUint8 = function(offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 1 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+1+") <= "+this.buffer.byteLength);
	            }
	            var value = this.view.getUint8(offset);
	            if (relative) this.offset += 1;
	            return value;
	        };

	        // types/ints/int16

	        /**
	         * Writes a 16bit signed integer.
	         * @param {number} value Value to write
	         * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
	         * @throws {TypeError} If `offset` or `value` is not a valid number
	         * @throws {RangeError} If `offset` is out of bounds
	         * @expose
	         */
	        ByteBufferPrototype.writeInt16 = function(value, offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof value !== 'number' || value % 1 !== 0)
	                    throw TypeError("Illegal value: "+value+" (not an integer)");
	                value |= 0;
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	            }
	            offset += 2;
	            var capacity2 = this.buffer.byteLength;
	            if (offset > capacity2)
	                this.resize((capacity2 *= 2) > offset ? capacity2 : offset);
	            offset -= 2;
	            this.view.setInt16(offset, value, this.littleEndian);
	            if (relative) this.offset += 2;
	            return this;
	        };

	        /**
	         * Writes a 16bit signed integer. This is an alias of {@link ByteBuffer#writeInt16}.
	         * @function
	         * @param {number} value Value to write
	         * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
	         * @throws {TypeError} If `offset` or `value` is not a valid number
	         * @throws {RangeError} If `offset` is out of bounds
	         * @expose
	         */
	        ByteBufferPrototype.writeShort = ByteBufferPrototype.writeInt16;

	        /**
	         * Reads a 16bit signed integer.
	         * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
	         * @returns {number} Value read
	         * @throws {TypeError} If `offset` is not a valid number
	         * @throws {RangeError} If `offset` is out of bounds
	         * @expose
	         */
	        ByteBufferPrototype.readInt16 = function(offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 2 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+2+") <= "+this.buffer.byteLength);
	            }
	            var value = this.view.getInt16(offset, this.littleEndian);
	            if (relative) this.offset += 2;
	            return value;
	        };

	        /**
	         * Reads a 16bit signed integer. This is an alias of {@link ByteBuffer#readInt16}.
	         * @function
	         * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
	         * @returns {number} Value read
	         * @throws {TypeError} If `offset` is not a valid number
	         * @throws {RangeError} If `offset` is out of bounds
	         * @expose
	         */
	        ByteBufferPrototype.readShort = ByteBufferPrototype.readInt16;

	        /**
	         * Writes a 16bit unsigned integer.
	         * @param {number} value Value to write
	         * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
	         * @throws {TypeError} If `offset` or `value` is not a valid number
	         * @throws {RangeError} If `offset` is out of bounds
	         * @expose
	         */
	        ByteBufferPrototype.writeUint16 = function(value, offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof value !== 'number' || value % 1 !== 0)
	                    throw TypeError("Illegal value: "+value+" (not an integer)");
	                value >>>= 0;
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	            }
	            offset += 2;
	            var capacity3 = this.buffer.byteLength;
	            if (offset > capacity3)
	                this.resize((capacity3 *= 2) > offset ? capacity3 : offset);
	            offset -= 2;
	            this.view.setUint16(offset, value, this.littleEndian);
	            if (relative) this.offset += 2;
	            return this;
	        };

	        /**
	         * Reads a 16bit unsigned integer.
	         * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
	         * @returns {number} Value read
	         * @throws {TypeError} If `offset` is not a valid number
	         * @throws {RangeError} If `offset` is out of bounds
	         * @expose
	         */
	        ByteBufferPrototype.readUint16 = function(offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 2 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+2+") <= "+this.buffer.byteLength);
	            }
	            var value = this.view.getUint16(offset, this.littleEndian);
	            if (relative) this.offset += 2;
	            return value;
	        };

	        // types/ints/int32

	        /**
	         * Writes a 32bit signed integer.
	         * @param {number} value Value to write
	         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
	         * @expose
	         */
	        ByteBufferPrototype.writeInt32 = function(value, offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof value !== 'number' || value % 1 !== 0)
	                    throw TypeError("Illegal value: "+value+" (not an integer)");
	                value |= 0;
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	            }
	            offset += 4;
	            var capacity4 = this.buffer.byteLength;
	            if (offset > capacity4)
	                this.resize((capacity4 *= 2) > offset ? capacity4 : offset);
	            offset -= 4;
	            this.view.setInt32(offset, value, this.littleEndian);
	            if (relative) this.offset += 4;
	            return this;
	        };

	        /**
	         * Writes a 32bit signed integer. This is an alias of {@link ByteBuffer#writeInt32}.
	         * @param {number} value Value to write
	         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
	         * @expose
	         */
	        ByteBufferPrototype.writeInt = ByteBufferPrototype.writeInt32;

	        /**
	         * Reads a 32bit signed integer.
	         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
	         * @returns {number} Value read
	         * @expose
	         */
	        ByteBufferPrototype.readInt32 = function(offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 4 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+4+") <= "+this.buffer.byteLength);
	            }
	            var value = this.view.getInt32(offset, this.littleEndian);
	            if (relative) this.offset += 4;
	            return value;
	        };

	        /**
	         * Reads a 32bit signed integer. This is an alias of {@link ByteBuffer#readInt32}.
	         * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `4` if omitted.
	         * @returns {number} Value read
	         * @expose
	         */
	        ByteBufferPrototype.readInt = ByteBufferPrototype.readInt32;

	        /**
	         * Writes a 32bit unsigned integer.
	         * @param {number} value Value to write
	         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
	         * @expose
	         */
	        ByteBufferPrototype.writeUint32 = function(value, offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof value !== 'number' || value % 1 !== 0)
	                    throw TypeError("Illegal value: "+value+" (not an integer)");
	                value >>>= 0;
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	            }
	            offset += 4;
	            var capacity5 = this.buffer.byteLength;
	            if (offset > capacity5)
	                this.resize((capacity5 *= 2) > offset ? capacity5 : offset);
	            offset -= 4;
	            this.view.setUint32(offset, value, this.littleEndian);
	            if (relative) this.offset += 4;
	            return this;
	        };

	        /**
	         * Reads a 32bit unsigned integer.
	         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
	         * @returns {number} Value read
	         * @expose
	         */
	        ByteBufferPrototype.readUint32 = function(offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 4 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+4+") <= "+this.buffer.byteLength);
	            }
	            var value = this.view.getUint32(offset, this.littleEndian);
	            if (relative) this.offset += 4;
	            return value;
	        };

	        // types/ints/int64

	        if (Long) {

	            /**
	             * Writes a 64bit signed integer.
	             * @param {number|!Long} value Value to write
	             * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
	             * @returns {!ByteBuffer} this
	             * @expose
	             */
	            ByteBufferPrototype.writeInt64 = function(value, offset) {
	                var relative = typeof offset === 'undefined';
	                if (relative) offset = this.offset;
	                if (!this.noAssert) {
	                    if (typeof value === 'number')
	                        value = Long.fromNumber(value);
	                    else if (typeof value === 'string')
	                        value = Long.fromString(value);
	                    else if (!(value && value instanceof Long))
	                        throw TypeError("Illegal value: "+value+" (not an integer or Long)");
	                    if (typeof offset !== 'number' || offset % 1 !== 0)
	                        throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                    offset >>>= 0;
	                    if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                        throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	                }
	                if (typeof value === 'number')
	                    value = Long.fromNumber(value);
	                else if (typeof value === 'string')
	                    value = Long.fromString(value);
	                offset += 8;
	                var capacity6 = this.buffer.byteLength;
	                if (offset > capacity6)
	                    this.resize((capacity6 *= 2) > offset ? capacity6 : offset);
	                offset -= 8;
	                if (this.littleEndian) {
	                    this.view.setInt32(offset  , value.low , true);
	                    this.view.setInt32(offset+4, value.high, true);
	                } else {
	                    this.view.setInt32(offset  , value.high, false);
	                    this.view.setInt32(offset+4, value.low , false);
	                }
	                if (relative) this.offset += 8;
	                return this;
	            };

	            /**
	             * Writes a 64bit signed integer. This is an alias of {@link ByteBuffer#writeInt64}.
	             * @param {number|!Long} value Value to write
	             * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
	             * @returns {!ByteBuffer} this
	             * @expose
	             */
	            ByteBufferPrototype.writeLong = ByteBufferPrototype.writeInt64;

	            /**
	             * Reads a 64bit signed integer.
	             * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
	             * @returns {!Long}
	             * @expose
	             */
	            ByteBufferPrototype.readInt64 = function(offset) {
	                var relative = typeof offset === 'undefined';
	                if (relative) offset = this.offset;
	                if (!this.noAssert) {
	                    if (typeof offset !== 'number' || offset % 1 !== 0)
	                        throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                    offset >>>= 0;
	                    if (offset < 0 || offset + 8 > this.buffer.byteLength)
	                        throw RangeError("Illegal offset: 0 <= "+offset+" (+"+8+") <= "+this.buffer.byteLength);
	                }
	                var value = this.littleEndian
	                    ? new Long(this.view.getInt32(offset  , true ), this.view.getInt32(offset+4, true ), false)
	                    : new Long(this.view.getInt32(offset+4, false), this.view.getInt32(offset  , false), false);
	                if (relative) this.offset += 8;
	                return value;
	            };

	            /**
	             * Reads a 64bit signed integer. This is an alias of {@link ByteBuffer#readInt64}.
	             * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
	             * @returns {!Long}
	             * @expose
	             */
	            ByteBufferPrototype.readLong = ByteBufferPrototype.readInt64;

	            /**
	             * Writes a 64bit unsigned integer.
	             * @param {number|!Long} value Value to write
	             * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
	             * @returns {!ByteBuffer} this
	             * @expose
	             */
	            ByteBufferPrototype.writeUint64 = function(value, offset) {
	                var relative = typeof offset === 'undefined';
	                if (relative) offset = this.offset;
	                if (!this.noAssert) {
	                    if (typeof value === 'number')
	                        value = Long.fromNumber(value);
	                    else if (typeof value === 'string')
	                        value = Long.fromString(value);
	                    else if (!(value && value instanceof Long))
	                        throw TypeError("Illegal value: "+value+" (not an integer or Long)");
	                    if (typeof offset !== 'number' || offset % 1 !== 0)
	                        throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                    offset >>>= 0;
	                    if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                        throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	                }
	                if (typeof value === 'number')
	                    value = Long.fromNumber(value);
	                else if (typeof value === 'string')
	                    value = Long.fromString(value);
	                offset += 8;
	                var capacity7 = this.buffer.byteLength;
	                if (offset > capacity7)
	                    this.resize((capacity7 *= 2) > offset ? capacity7 : offset);
	                offset -= 8;
	                if (this.littleEndian) {
	                    this.view.setInt32(offset  , value.low , true);
	                    this.view.setInt32(offset+4, value.high, true);
	                } else {
	                    this.view.setInt32(offset  , value.high, false);
	                    this.view.setInt32(offset+4, value.low , false);
	                }
	                if (relative) this.offset += 8;
	                return this;
	            };

	            /**
	             * Reads a 64bit unsigned integer.
	             * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
	             * @returns {!Long}
	             * @expose
	             */
	            ByteBufferPrototype.readUint64 = function(offset) {
	                var relative = typeof offset === 'undefined';
	                if (relative) offset = this.offset;
	                if (!this.noAssert) {
	                    if (typeof offset !== 'number' || offset % 1 !== 0)
	                        throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                    offset >>>= 0;
	                    if (offset < 0 || offset + 8 > this.buffer.byteLength)
	                        throw RangeError("Illegal offset: 0 <= "+offset+" (+"+8+") <= "+this.buffer.byteLength);
	                }
	                var value = this.littleEndian
	                    ? new Long(this.view.getInt32(offset  , true ), this.view.getInt32(offset+4, true ), true)
	                    : new Long(this.view.getInt32(offset+4, false), this.view.getInt32(offset  , false), true);
	                if (relative) this.offset += 8;
	                return value;
	            };

	        } // Long


	        // types/floats/float32

	        /**
	         * Writes a 32bit float.
	         * @param {number} value Value to write
	         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.writeFloat32 = function(value, offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof value !== 'number')
	                    throw TypeError("Illegal value: "+value+" (not a number)");
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	            }
	            offset += 4;
	            var capacity8 = this.buffer.byteLength;
	            if (offset > capacity8)
	                this.resize((capacity8 *= 2) > offset ? capacity8 : offset);
	            offset -= 4;
	            this.view.setFloat32(offset, value, this.littleEndian);
	            if (relative) this.offset += 4;
	            return this;
	        };

	        /**
	         * Writes a 32bit float. This is an alias of {@link ByteBuffer#writeFloat32}.
	         * @function
	         * @param {number} value Value to write
	         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.writeFloat = ByteBufferPrototype.writeFloat32;

	        /**
	         * Reads a 32bit float.
	         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
	         * @returns {number}
	         * @expose
	         */
	        ByteBufferPrototype.readFloat32 = function(offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 4 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+4+") <= "+this.buffer.byteLength);
	            }
	            var value = this.view.getFloat32(offset, this.littleEndian);
	            if (relative) this.offset += 4;
	            return value;
	        };

	        /**
	         * Reads a 32bit float. This is an alias of {@link ByteBuffer#readFloat32}.
	         * @function
	         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
	         * @returns {number}
	         * @expose
	         */
	        ByteBufferPrototype.readFloat = ByteBufferPrototype.readFloat32;

	        // types/floats/float64

	        /**
	         * Writes a 64bit float.
	         * @param {number} value Value to write
	         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.writeFloat64 = function(value, offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof value !== 'number')
	                    throw TypeError("Illegal value: "+value+" (not a number)");
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	            }
	            offset += 8;
	            var capacity9 = this.buffer.byteLength;
	            if (offset > capacity9)
	                this.resize((capacity9 *= 2) > offset ? capacity9 : offset);
	            offset -= 8;
	            this.view.setFloat64(offset, value, this.littleEndian);
	            if (relative) this.offset += 8;
	            return this;
	        };

	        /**
	         * Writes a 64bit float. This is an alias of {@link ByteBuffer#writeFloat64}.
	         * @function
	         * @param {number} value Value to write
	         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.writeDouble = ByteBufferPrototype.writeFloat64;

	        /**
	         * Reads a 64bit float.
	         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
	         * @returns {number}
	         * @expose
	         */
	        ByteBufferPrototype.readFloat64 = function(offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 8 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+8+") <= "+this.buffer.byteLength);
	            }
	            var value = this.view.getFloat64(offset, this.littleEndian);
	            if (relative) this.offset += 8;
	            return value;
	        };

	        /**
	         * Reads a 64bit float. This is an alias of {@link ByteBuffer#readFloat64}.
	         * @function
	         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
	         * @returns {number}
	         * @expose
	         */
	        ByteBufferPrototype.readDouble = ByteBufferPrototype.readFloat64;


	        // types/varints/varint32

	        /**
	         * Maximum number of bytes required to store a 32bit base 128 variable-length integer.
	         * @type {number}
	         * @const
	         * @expose
	         */
	        ByteBuffer.MAX_VARINT32_BYTES = 5;

	        /**
	         * Calculates the actual number of bytes required to store a 32bit base 128 variable-length integer.
	         * @param {number} value Value to encode
	         * @returns {number} Number of bytes required. Capped to {@link ByteBuffer.MAX_VARINT32_BYTES}
	         * @expose
	         */
	        ByteBuffer.calculateVarint32 = function(value) {
	            // ref: src/google/protobuf/io/coded_stream.cc
	            value = value >>> 0;
	                 if (value < 1 << 7 ) return 1;
	            else if (value < 1 << 14) return 2;
	            else if (value < 1 << 21) return 3;
	            else if (value < 1 << 28) return 4;
	            else                      return 5;
	        };

	        /**
	         * Zigzag encodes a signed 32bit integer so that it can be effectively used with varint encoding.
	         * @param {number} n Signed 32bit integer
	         * @returns {number} Unsigned zigzag encoded 32bit integer
	         * @expose
	         */
	        ByteBuffer.zigZagEncode32 = function(n) {
	            return (((n |= 0) << 1) ^ (n >> 31)) >>> 0; // ref: src/google/protobuf/wire_format_lite.h
	        };

	        /**
	         * Decodes a zigzag encoded signed 32bit integer.
	         * @param {number} n Unsigned zigzag encoded 32bit integer
	         * @returns {number} Signed 32bit integer
	         * @expose
	         */
	        ByteBuffer.zigZagDecode32 = function(n) {
	            return ((n >>> 1) ^ -(n & 1)) | 0; // // ref: src/google/protobuf/wire_format_lite.h
	        };

	        /**
	         * Writes a 32bit base 128 variable-length integer.
	         * @param {number} value Value to write
	         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	         *  written if omitted.
	         * @returns {!ByteBuffer|number} this if `offset` is omitted, else the actual number of bytes written
	         * @expose
	         */
	        ByteBufferPrototype.writeVarint32 = function(value, offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof value !== 'number' || value % 1 !== 0)
	                    throw TypeError("Illegal value: "+value+" (not an integer)");
	                value |= 0;
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	            }
	            var size = ByteBuffer.calculateVarint32(value),
	                b;
	            offset += size;
	            var capacity10 = this.buffer.byteLength;
	            if (offset > capacity10)
	                this.resize((capacity10 *= 2) > offset ? capacity10 : offset);
	            offset -= size;
	            // ref: http://code.google.com/searchframe#WTeibokF6gE/trunk/src/google/protobuf/io/coded_stream.cc
	            this.view.setUint8(offset, b = value | 0x80);
	            value >>>= 0;
	            if (value >= 1 << 7) {
	                b = (value >> 7) | 0x80;
	                this.view.setUint8(offset+1, b);
	                if (value >= 1 << 14) {
	                    b = (value >> 14) | 0x80;
	                    this.view.setUint8(offset+2, b);
	                    if (value >= 1 << 21) {
	                        b = (value >> 21) | 0x80;
	                        this.view.setUint8(offset+3, b);
	                        if (value >= 1 << 28) {
	                            this.view.setUint8(offset+4, (value >> 28) & 0x0F);
	                            size = 5;
	                        } else {
	                            this.view.setUint8(offset+3, b & 0x7F);
	                            size = 4;
	                        }
	                    } else {
	                        this.view.setUint8(offset+2, b & 0x7F);
	                        size = 3;
	                    }
	                } else {
	                    this.view.setUint8(offset+1, b & 0x7F);
	                    size = 2;
	                }
	            } else {
	                this.view.setUint8(offset, b & 0x7F);
	                size = 1;
	            }
	            if (relative) {
	                this.offset += size;
	                return this;
	            }
	            return size;
	        };

	        /**
	         * Writes a zig-zag encoded 32bit base 128 variable-length integer.
	         * @param {number} value Value to write
	         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	         *  written if omitted.
	         * @returns {!ByteBuffer|number} this if `offset` is omitted, else the actual number of bytes written
	         * @expose
	         */
	        ByteBufferPrototype.writeVarint32ZigZag = function(value, offset) {
	            return this.writeVarint32(ByteBuffer.zigZagEncode32(value), offset);
	        };

	        /**
	         * Reads a 32bit base 128 variable-length integer.
	         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	         *  written if omitted.
	         * @returns {number|!{value: number, length: number}} The value read if offset is omitted, else the value read
	         *  and the actual number of bytes read.
	         * @throws {Error} If it's not a valid varint. Has a property `truncated = true` if there is not enough data available
	         *  to fully decode the varint.
	         * @expose
	         */
	        ByteBufferPrototype.readVarint32 = function(offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 1 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+1+") <= "+this.buffer.byteLength);
	            }
	            // ref: src/google/protobuf/io/coded_stream.cc
	            var size = 0,
	                value = 0 >>> 0,
	                temp,
	                ioffset;
	            do {
	                ioffset = offset+size;
	                if (!this.noAssert && ioffset > this.limit) {
	                    var err = Error("Truncated");
	                    err['truncated'] = true;
	                    throw err;
	                }
	                temp = this.view.getUint8(ioffset);
	                if (size < 5)
	                    value |= ((temp&0x7F)<<(7*size)) >>> 0;
	                ++size;
	            } while ((temp & 0x80) === 0x80);
	            value = value | 0; // Make sure to discard the higher order bits
	            if (relative) {
	                this.offset += size;
	                return value;
	            }
	            return {
	                "value": value,
	                "length": size
	            };
	        };

	        /**
	         * Reads a zig-zag encoded 32bit base 128 variable-length integer.
	         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	         *  written if omitted.
	         * @returns {number|!{value: number, length: number}} The value read if offset is omitted, else the value read
	         *  and the actual number of bytes read.
	         * @throws {Error} If it's not a valid varint
	         * @expose
	         */
	        ByteBufferPrototype.readVarint32ZigZag = function(offset) {
	            var val = this.readVarint32(offset);
	            if (typeof val === 'object')
	                val["value"] = ByteBuffer.zigZagDecode32(val["value"]);
	            else
	                val = ByteBuffer.zigZagDecode32(val);
	            return val;
	        };

	        // types/varints/varint64

	        if (Long) {

	            /**
	             * Maximum number of bytes required to store a 64bit base 128 variable-length integer.
	             * @type {number}
	             * @const
	             * @expose
	             */
	            ByteBuffer.MAX_VARINT64_BYTES = 10;

	            /**
	             * Calculates the actual number of bytes required to store a 64bit base 128 variable-length integer.
	             * @param {number|!Long} value Value to encode
	             * @returns {number} Number of bytes required. Capped to {@link ByteBuffer.MAX_VARINT64_BYTES}
	             * @expose
	             */
	            ByteBuffer.calculateVarint64 = function(value) {
	                if (typeof value === 'number')
	                    value = Long.fromNumber(value);
	                else if (typeof value === 'string')
	                    value = Long.fromString(value);
	                // ref: src/google/protobuf/io/coded_stream.cc
	                var part0 = value.toInt() >>> 0,
	                    part1 = value.shiftRightUnsigned(28).toInt() >>> 0,
	                    part2 = value.shiftRightUnsigned(56).toInt() >>> 0;
	                if (part2 == 0) {
	                    if (part1 == 0) {
	                        if (part0 < 1 << 14)
	                            return part0 < 1 << 7 ? 1 : 2;
	                        else
	                            return part0 < 1 << 21 ? 3 : 4;
	                    } else {
	                        if (part1 < 1 << 14)
	                            return part1 < 1 << 7 ? 5 : 6;
	                        else
	                            return part1 < 1 << 21 ? 7 : 8;
	                    }
	                } else
	                    return part2 < 1 << 7 ? 9 : 10;
	            };

	            /**
	             * Zigzag encodes a signed 64bit integer so that it can be effectively used with varint encoding.
	             * @param {number|!Long} value Signed long
	             * @returns {!Long} Unsigned zigzag encoded long
	             * @expose
	             */
	            ByteBuffer.zigZagEncode64 = function(value) {
	                if (typeof value === 'number')
	                    value = Long.fromNumber(value, false);
	                else if (typeof value === 'string')
	                    value = Long.fromString(value, false);
	                else if (value.unsigned !== false) value = value.toSigned();
	                // ref: src/google/protobuf/wire_format_lite.h
	                return value.shiftLeft(1).xor(value.shiftRight(63)).toUnsigned();
	            };

	            /**
	             * Decodes a zigzag encoded signed 64bit integer.
	             * @param {!Long|number} value Unsigned zigzag encoded long or JavaScript number
	             * @returns {!Long} Signed long
	             * @expose
	             */
	            ByteBuffer.zigZagDecode64 = function(value) {
	                if (typeof value === 'number')
	                    value = Long.fromNumber(value, false);
	                else if (typeof value === 'string')
	                    value = Long.fromString(value, false);
	                else if (value.unsigned !== false) value = value.toSigned();
	                // ref: src/google/protobuf/wire_format_lite.h
	                return value.shiftRightUnsigned(1).xor(value.and(Long.ONE).toSigned().negate()).toSigned();
	            };

	            /**
	             * Writes a 64bit base 128 variable-length integer.
	             * @param {number|Long} value Value to write
	             * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	             *  written if omitted.
	             * @returns {!ByteBuffer|number} `this` if offset is omitted, else the actual number of bytes written.
	             * @expose
	             */
	            ByteBufferPrototype.writeVarint64 = function(value, offset) {
	                var relative = typeof offset === 'undefined';
	                if (relative) offset = this.offset;
	                if (!this.noAssert) {
	                    if (typeof value === 'number')
	                        value = Long.fromNumber(value);
	                    else if (typeof value === 'string')
	                        value = Long.fromString(value);
	                    else if (!(value && value instanceof Long))
	                        throw TypeError("Illegal value: "+value+" (not an integer or Long)");
	                    if (typeof offset !== 'number' || offset % 1 !== 0)
	                        throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                    offset >>>= 0;
	                    if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                        throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	                }
	                if (typeof value === 'number')
	                    value = Long.fromNumber(value, false);
	                else if (typeof value === 'string')
	                    value = Long.fromString(value, false);
	                else if (value.unsigned !== false) value = value.toSigned();
	                var size = ByteBuffer.calculateVarint64(value),
	                    part0 = value.toInt() >>> 0,
	                    part1 = value.shiftRightUnsigned(28).toInt() >>> 0,
	                    part2 = value.shiftRightUnsigned(56).toInt() >>> 0;
	                offset += size;
	                var capacity11 = this.buffer.byteLength;
	                if (offset > capacity11)
	                    this.resize((capacity11 *= 2) > offset ? capacity11 : offset);
	                offset -= size;
	                switch (size) {
	                    case 10: this.view.setUint8(offset+9, (part2 >>>  7) & 0x01);
	                    case 9 : this.view.setUint8(offset+8, size !== 9 ? (part2       ) | 0x80 : (part2       ) & 0x7F);
	                    case 8 : this.view.setUint8(offset+7, size !== 8 ? (part1 >>> 21) | 0x80 : (part1 >>> 21) & 0x7F);
	                    case 7 : this.view.setUint8(offset+6, size !== 7 ? (part1 >>> 14) | 0x80 : (part1 >>> 14) & 0x7F);
	                    case 6 : this.view.setUint8(offset+5, size !== 6 ? (part1 >>>  7) | 0x80 : (part1 >>>  7) & 0x7F);
	                    case 5 : this.view.setUint8(offset+4, size !== 5 ? (part1       ) | 0x80 : (part1       ) & 0x7F);
	                    case 4 : this.view.setUint8(offset+3, size !== 4 ? (part0 >>> 21) | 0x80 : (part0 >>> 21) & 0x7F);
	                    case 3 : this.view.setUint8(offset+2, size !== 3 ? (part0 >>> 14) | 0x80 : (part0 >>> 14) & 0x7F);
	                    case 2 : this.view.setUint8(offset+1, size !== 2 ? (part0 >>>  7) | 0x80 : (part0 >>>  7) & 0x7F);
	                    case 1 : this.view.setUint8(offset  , size !== 1 ? (part0       ) | 0x80 : (part0       ) & 0x7F);
	                }
	                if (relative) {
	                    this.offset += size;
	                    return this;
	                } else {
	                    return size;
	                }
	            };

	            /**
	             * Writes a zig-zag encoded 64bit base 128 variable-length integer.
	             * @param {number|Long} value Value to write
	             * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	             *  written if omitted.
	             * @returns {!ByteBuffer|number} `this` if offset is omitted, else the actual number of bytes written.
	             * @expose
	             */
	            ByteBufferPrototype.writeVarint64ZigZag = function(value, offset) {
	                return this.writeVarint64(ByteBuffer.zigZagEncode64(value), offset);
	            };

	            /**
	             * Reads a 64bit base 128 variable-length integer. Requires Long.js.
	             * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	             *  read if omitted.
	             * @returns {!Long|!{value: Long, length: number}} The value read if offset is omitted, else the value read and
	             *  the actual number of bytes read.
	             * @throws {Error} If it's not a valid varint
	             * @expose
	             */
	            ByteBufferPrototype.readVarint64 = function(offset) {
	                var relative = typeof offset === 'undefined';
	                if (relative) offset = this.offset;
	                if (!this.noAssert) {
	                    if (typeof offset !== 'number' || offset % 1 !== 0)
	                        throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                    offset >>>= 0;
	                    if (offset < 0 || offset + 1 > this.buffer.byteLength)
	                        throw RangeError("Illegal offset: 0 <= "+offset+" (+"+1+") <= "+this.buffer.byteLength);
	                }
	                // ref: src/google/protobuf/io/coded_stream.cc
	                var start = offset,
	                    part0 = 0,
	                    part1 = 0,
	                    part2 = 0,
	                    b  = 0;
	                b = this.view.getUint8(offset++); part0  = (b & 0x7F)      ; if (b & 0x80) {
	                b = this.view.getUint8(offset++); part0 |= (b & 0x7F) <<  7; if (b & 0x80) {
	                b = this.view.getUint8(offset++); part0 |= (b & 0x7F) << 14; if (b & 0x80) {
	                b = this.view.getUint8(offset++); part0 |= (b & 0x7F) << 21; if (b & 0x80) {
	                b = this.view.getUint8(offset++); part1  = (b & 0x7F)      ; if (b & 0x80) {
	                b = this.view.getUint8(offset++); part1 |= (b & 0x7F) <<  7; if (b & 0x80) {
	                b = this.view.getUint8(offset++); part1 |= (b & 0x7F) << 14; if (b & 0x80) {
	                b = this.view.getUint8(offset++); part1 |= (b & 0x7F) << 21; if (b & 0x80) {
	                b = this.view.getUint8(offset++); part2  = (b & 0x7F)      ; if (b & 0x80) {
	                b = this.view.getUint8(offset++); part2 |= (b & 0x7F) <<  7; if (b & 0x80) {
	                throw Error("Buffer overrun"); }}}}}}}}}}
	                var value = Long.fromBits(part0 | (part1 << 28), (part1 >>> 4) | (part2) << 24, false);
	                if (relative) {
	                    this.offset = offset;
	                    return value;
	                } else {
	                    return {
	                        'value': value,
	                        'length': offset-start
	                    };
	                }
	            };

	            /**
	             * Reads a zig-zag encoded 64bit base 128 variable-length integer. Requires Long.js.
	             * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	             *  read if omitted.
	             * @returns {!Long|!{value: Long, length: number}} The value read if offset is omitted, else the value read and
	             *  the actual number of bytes read.
	             * @throws {Error} If it's not a valid varint
	             * @expose
	             */
	            ByteBufferPrototype.readVarint64ZigZag = function(offset) {
	                var val = this.readVarint64(offset);
	                if (val && val['value'] instanceof Long)
	                    val["value"] = ByteBuffer.zigZagDecode64(val["value"]);
	                else
	                    val = ByteBuffer.zigZagDecode64(val);
	                return val;
	            };

	        } // Long


	        // types/strings/cstring

	        /**
	         * Writes a NULL-terminated UTF8 encoded string. For this to work the specified string must not contain any NULL
	         *  characters itself.
	         * @param {string} str String to write
	         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	         *  contained in `str` + 1 if omitted.
	         * @returns {!ByteBuffer|number} this if offset is omitted, else the actual number of bytes written
	         * @expose
	         */
	        ByteBufferPrototype.writeCString = function(str, offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            var i,
	                k = str.length;
	            if (!this.noAssert) {
	                if (typeof str !== 'string')
	                    throw TypeError("Illegal str: Not a string");
	                for (i=0; i<k; ++i) {
	                    if (str.charCodeAt(i) === 0)
	                        throw RangeError("Illegal str: Contains NULL-characters");
	                }
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	            }
	            // UTF8 strings do not contain zero bytes in between except for the zero character, so:
	            k = utfx.calculateUTF16asUTF8(stringSource(str))[1];
	            offset += k+1;
	            var capacity12 = this.buffer.byteLength;
	            if (offset > capacity12)
	                this.resize((capacity12 *= 2) > offset ? capacity12 : offset);
	            offset -= k+1;
	            utfx.encodeUTF16toUTF8(stringSource(str), function(b) {
	                this.view.setUint8(offset++, b);
	            }.bind(this));
	            this.view.setUint8(offset++, 0);
	            if (relative) {
	                this.offset = offset;
	                return this;
	            }
	            return k;
	        };

	        /**
	         * Reads a NULL-terminated UTF8 encoded string. For this to work the string read must not contain any NULL characters
	         *  itself.
	         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	         *  read if omitted.
	         * @returns {string|!{string: string, length: number}} The string read if offset is omitted, else the string
	         *  read and the actual number of bytes read.
	         * @expose
	         */
	        ByteBufferPrototype.readCString = function(offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 1 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+1+") <= "+this.buffer.byteLength);
	            }
	            var start = offset,
	                temp;
	            // UTF8 strings do not contain zero bytes in between except for the zero character itself, so:
	            var sd, b = -1;
	            utfx.decodeUTF8toUTF16(function() {
	                if (b === 0) return null;
	                if (offset >= this.limit)
	                    throw RangeError("Illegal range: Truncated data, "+offset+" < "+this.limit);
	                return (b = this.view.getUint8(offset++)) === 0 ? null : b;
	            }.bind(this), sd = stringDestination(), true);
	            if (relative) {
	                this.offset = offset;
	                return sd();
	            } else {
	                return {
	                    "string": sd(),
	                    "length": offset - start
	                };
	            }
	        };

	        // types/strings/istring

	        /**
	         * Writes a length as uint32 prefixed UTF8 encoded string.
	         * @param {string} str String to write
	         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	         *  written if omitted.
	         * @returns {!ByteBuffer|number} `this` if `offset` is omitted, else the actual number of bytes written
	         * @expose
	         * @see ByteBuffer#writeVarint32
	         */
	        ByteBufferPrototype.writeIString = function(str, offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof str !== 'string')
	                    throw TypeError("Illegal str: Not a string");
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	            }
	            var start = offset,
	                k;
	            k = utfx.calculateUTF16asUTF8(stringSource(str), this.noAssert)[1];
	            offset += 4+k;
	            var capacity13 = this.buffer.byteLength;
	            if (offset > capacity13)
	                this.resize((capacity13 *= 2) > offset ? capacity13 : offset);
	            offset -= 4+k;
	            this.view.setUint32(offset, k, this.littleEndian);
	            offset += 4;
	            utfx.encodeUTF16toUTF8(stringSource(str), function(b) {
	                this.view.setUint8(offset++, b);
	            }.bind(this));
	            if (offset !== start + 4 + k)
	                throw RangeError("Illegal range: Truncated data, "+offset+" == "+(offset+4+k));
	            if (relative) {
	                this.offset = offset;
	                return this;
	            }
	            return offset - start;
	        };

	        /**
	         * Reads a length as uint32 prefixed UTF8 encoded string.
	         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	         *  read if omitted.
	         * @returns {string|!{string: string, length: number}} The string read if offset is omitted, else the string
	         *  read and the actual number of bytes read.
	         * @expose
	         * @see ByteBuffer#readVarint32
	         */
	        ByteBufferPrototype.readIString = function(offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 4 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+4+") <= "+this.buffer.byteLength);
	            }
	            var temp = 0,
	                start = offset,
	                str;
	            temp = this.view.getUint32(offset, this.littleEndian);
	            offset += 4;
	            var k = offset + temp,
	                sd;
	            utfx.decodeUTF8toUTF16(function() {
	                return offset < k ? this.view.getUint8(offset++) : null;
	            }.bind(this), sd = stringDestination(), this.noAssert);
	            str = sd();
	            if (relative) {
	                this.offset = offset;
	                return str;
	            } else {
	                return {
	                    'string': str,
	                    'length': offset - start
	                };
	            }
	        };

	        // types/strings/utf8string

	        /**
	         * Metrics representing number of UTF8 characters. Evaluates to `c`.
	         * @type {string}
	         * @const
	         * @expose
	         */
	        ByteBuffer.METRICS_CHARS = 'c';

	        /**
	         * Metrics representing number of bytes. Evaluates to `b`.
	         * @type {string}
	         * @const
	         * @expose
	         */
	        ByteBuffer.METRICS_BYTES = 'b';

	        /**
	         * Writes an UTF8 encoded string.
	         * @param {string} str String to write
	         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} if omitted.
	         * @returns {!ByteBuffer|number} this if offset is omitted, else the actual number of bytes written.
	         * @expose
	         */
	        ByteBufferPrototype.writeUTF8String = function(str, offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	            }
	            var k;
	            var start = offset;
	            k = utfx.calculateUTF16asUTF8(stringSource(str))[1];
	            offset += k;
	            var capacity14 = this.buffer.byteLength;
	            if (offset > capacity14)
	                this.resize((capacity14 *= 2) > offset ? capacity14 : offset);
	            offset -= k;
	            utfx.encodeUTF16toUTF8(stringSource(str), function(b) {
	                this.view.setUint8(offset++, b);
	            }.bind(this));
	            if (relative) {
	                this.offset = offset;
	                return this;
	            }
	            return offset - start;
	        };

	        /**
	         * Writes an UTF8 encoded string. This is an alias of {@link ByteBuffer#writeUTF8String}.
	         * @function
	         * @param {string} str String to write
	         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} if omitted.
	         * @returns {!ByteBuffer|number} this if offset is omitted, else the actual number of bytes written.
	         * @expose
	         */
	        ByteBufferPrototype.writeString = ByteBufferPrototype.writeUTF8String;

	        /**
	         * Calculates the number of UTF8 characters of a string. JavaScript itself uses UTF-16, so that a string's
	         *  `length` property does not reflect its actual UTF8 size if it contains code points larger than 0xFFFF.
	         * @function
	         * @param {string} str String to calculate
	         * @returns {number} Number of UTF8 characters
	         * @expose
	         */
	        ByteBuffer.calculateUTF8Chars = function(str) {
	            return utfx.calculateUTF16asUTF8(stringSource(str))[0];
	        };

	        /**
	         * Calculates the number of UTF8 bytes of a string.
	         * @function
	         * @param {string} str String to calculate
	         * @returns {number} Number of UTF8 bytes
	         * @expose
	         */
	        ByteBuffer.calculateUTF8Bytes = function(str) {
	            return utfx.calculateUTF16asUTF8(stringSource(str))[1];
	        };

	        /**
	         * Reads an UTF8 encoded string.
	         * @param {number} length Number of characters or bytes to read.
	         * @param {string=} metrics Metrics specifying what `length` is meant to count. Defaults to
	         *  {@link ByteBuffer.METRICS_CHARS}.
	         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	         *  read if omitted.
	         * @returns {string|!{string: string, length: number}} The string read if offset is omitted, else the string
	         *  read and the actual number of bytes read.
	         * @expose
	         */
	        ByteBufferPrototype.readUTF8String = function(length, metrics, offset) {
	            if (typeof metrics === 'number') {
	                offset = metrics;
	                metrics = undefined;
	            }
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (typeof metrics === 'undefined') metrics = ByteBuffer.METRICS_CHARS;
	            if (!this.noAssert) {
	                if (typeof length !== 'number' || length % 1 !== 0)
	                    throw TypeError("Illegal length: "+length+" (not an integer)");
	                length |= 0;
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	            }
	            var i = 0,
	                start = offset,
	                sd;
	            if (metrics === ByteBuffer.METRICS_CHARS) { // The same for node and the browser
	                sd = stringDestination();
	                utfx.decodeUTF8(function() {
	                    return i < length && offset < this.limit ? this.view.getUint8(offset++) : null;
	                }.bind(this), function(cp) {
	                    ++i; utfx.UTF8toUTF16(cp, sd);
	                }.bind(this));
	                if (i !== length)
	                    throw RangeError("Illegal range: Truncated data, "+i+" == "+length);
	                if (relative) {
	                    this.offset = offset;
	                    return sd();
	                } else {
	                    return {
	                        "string": sd(),
	                        "length": offset - start
	                    };
	                }
	            } else if (metrics === ByteBuffer.METRICS_BYTES) {
	                if (!this.noAssert) {
	                    if (typeof offset !== 'number' || offset % 1 !== 0)
	                        throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                    offset >>>= 0;
	                    if (offset < 0 || offset + length > this.buffer.byteLength)
	                        throw RangeError("Illegal offset: 0 <= "+offset+" (+"+length+") <= "+this.buffer.byteLength);
	                }
	                var k = offset + length;
	                utfx.decodeUTF8toUTF16(function() {
	                    return offset < k ? this.view.getUint8(offset++) : null;
	                }.bind(this), sd = stringDestination(), this.noAssert);
	                if (offset !== k)
	                    throw RangeError("Illegal range: Truncated data, "+offset+" == "+k);
	                if (relative) {
	                    this.offset = offset;
	                    return sd();
	                } else {
	                    return {
	                        'string': sd(),
	                        'length': offset - start
	                    };
	                }
	            } else
	                throw TypeError("Unsupported metrics: "+metrics);
	        };

	        /**
	         * Reads an UTF8 encoded string. This is an alias of {@link ByteBuffer#readUTF8String}.
	         * @function
	         * @param {number} length Number of characters or bytes to read
	         * @param {number=} metrics Metrics specifying what `n` is meant to count. Defaults to
	         *  {@link ByteBuffer.METRICS_CHARS}.
	         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	         *  read if omitted.
	         * @returns {string|!{string: string, length: number}} The string read if offset is omitted, else the string
	         *  read and the actual number of bytes read.
	         * @expose
	         */
	        ByteBufferPrototype.readString = ByteBufferPrototype.readUTF8String;

	        // types/strings/vstring

	        /**
	         * Writes a length as varint32 prefixed UTF8 encoded string.
	         * @param {string} str String to write
	         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	         *  written if omitted.
	         * @returns {!ByteBuffer|number} `this` if `offset` is omitted, else the actual number of bytes written
	         * @expose
	         * @see ByteBuffer#writeVarint32
	         */
	        ByteBufferPrototype.writeVString = function(str, offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof str !== 'string')
	                    throw TypeError("Illegal str: Not a string");
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	            }
	            var start = offset,
	                k, l;
	            k = utfx.calculateUTF16asUTF8(stringSource(str), this.noAssert)[1];
	            l = ByteBuffer.calculateVarint32(k);
	            offset += l+k;
	            var capacity15 = this.buffer.byteLength;
	            if (offset > capacity15)
	                this.resize((capacity15 *= 2) > offset ? capacity15 : offset);
	            offset -= l+k;
	            offset += this.writeVarint32(k, offset);
	            utfx.encodeUTF16toUTF8(stringSource(str), function(b) {
	                this.view.setUint8(offset++, b);
	            }.bind(this));
	            if (offset !== start+k+l)
	                throw RangeError("Illegal range: Truncated data, "+offset+" == "+(offset+k+l));
	            if (relative) {
	                this.offset = offset;
	                return this;
	            }
	            return offset - start;
	        };

	        /**
	         * Reads a length as varint32 prefixed UTF8 encoded string.
	         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	         *  read if omitted.
	         * @returns {string|!{string: string, length: number}} The string read if offset is omitted, else the string
	         *  read and the actual number of bytes read.
	         * @expose
	         * @see ByteBuffer#readVarint32
	         */
	        ByteBufferPrototype.readVString = function(offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 1 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+1+") <= "+this.buffer.byteLength);
	            }
	            var temp = this.readVarint32(offset),
	                start = offset,
	                str;
	            offset += temp['length'];
	            temp = temp['value'];
	            var k = offset + temp,
	                sd = stringDestination();
	            utfx.decodeUTF8toUTF16(function() {
	                return offset < k ? this.view.getUint8(offset++) : null;
	            }.bind(this), sd, this.noAssert);
	            str = sd();
	            if (relative) {
	                this.offset = offset;
	                return str;
	            } else {
	                return {
	                    'string': str,
	                    'length': offset - start
	                };
	            }
	        };


	        /**
	         * Appends some data to this ByteBuffer. This will overwrite any contents behind the specified offset up to the appended
	         *  data's length.
	         * @param {!ByteBuffer|!ArrayBuffer|!Uint8Array|string} source Data to append. If `source` is a ByteBuffer, its offsets
	         *  will be modified according to the performed read operation.
	         * @param {(string|number)=} encoding Encoding if `data` is a string ("base64", "hex", "binary", defaults to "utf8")
	         * @param {number=} offset Offset to append at. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	         *  read if omitted.
	         * @returns {!ByteBuffer} this
	         * @expose
	         * @example A relative `<01 02>03.append(<04 05>)` will result in `<01 02 04 05>, 04 05|`
	         * @example An absolute `<01 02>03.append(04 05>, 1)` will result in `<01 04>05, 04 05|`
	         */
	        ByteBufferPrototype.append = function(source, encoding, offset) {
	            if (typeof encoding === 'number' || typeof encoding !== 'string') {
	                offset = encoding;
	                encoding = undefined;
	            }
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	            }
	            if (!(source instanceof ByteBuffer))
	                source = ByteBuffer.wrap(source, encoding);
	            var length = source.limit - source.offset;
	            if (length <= 0) return this; // Nothing to append
	            offset += length;
	            var capacity16 = this.buffer.byteLength;
	            if (offset > capacity16)
	                this.resize((capacity16 *= 2) > offset ? capacity16 : offset);
	            offset -= length;
	            new Uint8Array(this.buffer, offset).set(new Uint8Array(source.buffer).subarray(source.offset, source.limit));
	            source.offset += length;
	            if (relative) this.offset += length;
	            return this;
	        };

	        /**
	         * Appends this ByteBuffer's contents to another ByteBuffer. This will overwrite any contents at and after the
	            specified offset up to the length of this ByteBuffer's data.
	         * @param {!ByteBuffer} target Target ByteBuffer
	         * @param {number=} offset Offset to append to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	         *  read if omitted.
	         * @returns {!ByteBuffer} this
	         * @expose
	         * @see ByteBuffer#append
	         */
	        ByteBufferPrototype.appendTo = function(target, offset) {
	            target.append(this, offset);
	            return this;
	        };

	        /**
	         * Enables or disables assertions of argument types and offsets. Assertions are enabled by default but you can opt to
	         *  disable them if your code already makes sure that everything is valid.
	         * @param {boolean} assert `true` to enable assertions, otherwise `false`
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.assert = function(assert) {
	            this.noAssert = !assert;
	            return this;
	        };

	        /**
	         * Gets the capacity of this ByteBuffer's backing buffer.
	         * @returns {number} Capacity of the backing buffer
	         * @expose
	         */
	        ByteBufferPrototype.capacity = function() {
	            return this.buffer.byteLength;
	        };

	        /**
	         * Clears this ByteBuffer's offsets by setting {@link ByteBuffer#offset} to `0` and {@link ByteBuffer#limit} to the
	         *  backing buffer's capacity. Discards {@link ByteBuffer#markedOffset}.
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.clear = function() {
	            this.offset = 0;
	            this.limit = this.buffer.byteLength;
	            this.markedOffset = -1;
	            return this;
	        };

	        /**
	         * Creates a cloned instance of this ByteBuffer, preset with this ByteBuffer's values for {@link ByteBuffer#offset},
	         *  {@link ByteBuffer#markedOffset} and {@link ByteBuffer#limit}.
	         * @param {boolean=} copy Whether to copy the backing buffer or to return another view on the same, defaults to `false`
	         * @returns {!ByteBuffer} Cloned instance
	         * @expose
	         */
	        ByteBufferPrototype.clone = function(copy) {
	            var bb = new ByteBuffer(0, this.littleEndian, this.noAssert);
	            if (copy) {
	                var buffer = new ArrayBuffer(this.buffer.byteLength);
	                new Uint8Array(buffer).set(this.buffer);
	                bb.buffer = buffer;
	                bb.view = new DataView(buffer);
	            } else {
	                bb.buffer = this.buffer;
	                bb.view = this.view;
	            }
	            bb.offset = this.offset;
	            bb.markedOffset = this.markedOffset;
	            bb.limit = this.limit;
	            return bb;
	        };

	        /**
	         * Compacts this ByteBuffer to be backed by a {@link ByteBuffer#buffer} of its contents' length. Contents are the bytes
	         *  between {@link ByteBuffer#offset} and {@link ByteBuffer#limit}. Will set `offset = 0` and `limit = capacity` and
	         *  adapt {@link ByteBuffer#markedOffset} to the same relative position if set.
	         * @param {number=} begin Offset to start at, defaults to {@link ByteBuffer#offset}
	         * @param {number=} end Offset to end at, defaults to {@link ByteBuffer#limit}
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.compact = function(begin, end) {
	            if (typeof begin === 'undefined') begin = this.offset;
	            if (typeof end === 'undefined') end = this.limit;
	            if (!this.noAssert) {
	                if (typeof begin !== 'number' || begin % 1 !== 0)
	                    throw TypeError("Illegal begin: Not an integer");
	                begin >>>= 0;
	                if (typeof end !== 'number' || end % 1 !== 0)
	                    throw TypeError("Illegal end: Not an integer");
	                end >>>= 0;
	                if (begin < 0 || begin > end || end > this.buffer.byteLength)
	                    throw RangeError("Illegal range: 0 <= "+begin+" <= "+end+" <= "+this.buffer.byteLength);
	            }
	            if (begin === 0 && end === this.buffer.byteLength)
	                return this; // Already compacted
	            var len = end - begin;
	            if (len === 0) {
	                this.buffer = EMPTY_BUFFER;
	                this.view = null;
	                if (this.markedOffset >= 0) this.markedOffset -= begin;
	                this.offset = 0;
	                this.limit = 0;
	                return this;
	            }
	            var buffer = new ArrayBuffer(len);
	            new Uint8Array(buffer).set(new Uint8Array(this.buffer).subarray(begin, end));
	            this.buffer = buffer;
	            this.view = new DataView(buffer);
	            if (this.markedOffset >= 0) this.markedOffset -= begin;
	            this.offset = 0;
	            this.limit = len;
	            return this;
	        };

	        /**
	         * Creates a copy of this ByteBuffer's contents. Contents are the bytes between {@link ByteBuffer#offset} and
	         *  {@link ByteBuffer#limit}.
	         * @param {number=} begin Begin offset, defaults to {@link ByteBuffer#offset}.
	         * @param {number=} end End offset, defaults to {@link ByteBuffer#limit}.
	         * @returns {!ByteBuffer} Copy
	         * @expose
	         */
	        ByteBufferPrototype.copy = function(begin, end) {
	            if (typeof begin === 'undefined') begin = this.offset;
	            if (typeof end === 'undefined') end = this.limit;
	            if (!this.noAssert) {
	                if (typeof begin !== 'number' || begin % 1 !== 0)
	                    throw TypeError("Illegal begin: Not an integer");
	                begin >>>= 0;
	                if (typeof end !== 'number' || end % 1 !== 0)
	                    throw TypeError("Illegal end: Not an integer");
	                end >>>= 0;
	                if (begin < 0 || begin > end || end > this.buffer.byteLength)
	                    throw RangeError("Illegal range: 0 <= "+begin+" <= "+end+" <= "+this.buffer.byteLength);
	            }
	            if (begin === end)
	                return new ByteBuffer(0, this.littleEndian, this.noAssert);
	            var capacity = end - begin,
	                bb = new ByteBuffer(capacity, this.littleEndian, this.noAssert);
	            bb.offset = 0;
	            bb.limit = capacity;
	            if (bb.markedOffset >= 0) bb.markedOffset -= begin;
	            this.copyTo(bb, 0, begin, end);
	            return bb;
	        };

	        /**
	         * Copies this ByteBuffer's contents to another ByteBuffer. Contents are the bytes between {@link ByteBuffer#offset} and
	         *  {@link ByteBuffer#limit}.
	         * @param {!ByteBuffer} target Target ByteBuffer
	         * @param {number=} targetOffset Offset to copy to. Will use and increase the target's {@link ByteBuffer#offset}
	         *  by the number of bytes copied if omitted.
	         * @param {number=} sourceOffset Offset to start copying from. Will use and increase {@link ByteBuffer#offset} by the
	         *  number of bytes copied if omitted.
	         * @param {number=} sourceLimit Offset to end copying from, defaults to {@link ByteBuffer#limit}
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.copyTo = function(target, targetOffset, sourceOffset, sourceLimit) {
	            var relative,
	                targetRelative;
	            if (!this.noAssert) {
	                if (!ByteBuffer.isByteBuffer(target))
	                    throw TypeError("Illegal target: Not a ByteBuffer");
	            }
	            targetOffset = (targetRelative = typeof targetOffset === 'undefined') ? target.offset : targetOffset | 0;
	            sourceOffset = (relative = typeof sourceOffset === 'undefined') ? this.offset : sourceOffset | 0;
	            sourceLimit = typeof sourceLimit === 'undefined' ? this.limit : sourceLimit | 0;

	            if (targetOffset < 0 || targetOffset > target.buffer.byteLength)
	                throw RangeError("Illegal target range: 0 <= "+targetOffset+" <= "+target.buffer.byteLength);
	            if (sourceOffset < 0 || sourceLimit > this.buffer.byteLength)
	                throw RangeError("Illegal source range: 0 <= "+sourceOffset+" <= "+this.buffer.byteLength);

	            var len = sourceLimit - sourceOffset;
	            if (len === 0)
	                return target; // Nothing to copy

	            target.ensureCapacity(targetOffset + len);

	            new Uint8Array(target.buffer).set(new Uint8Array(this.buffer).subarray(sourceOffset, sourceLimit), targetOffset);

	            if (relative) this.offset += len;
	            if (targetRelative) target.offset += len;

	            return this;
	        };

	        /**
	         * Makes sure that this ByteBuffer is backed by a {@link ByteBuffer#buffer} of at least the specified capacity. If the
	         *  current capacity is exceeded, it will be doubled. If double the current capacity is less than the required capacity,
	         *  the required capacity will be used instead.
	         * @param {number} capacity Required capacity
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.ensureCapacity = function(capacity) {
	            var current = this.buffer.byteLength;
	            if (current < capacity)
	                return this.resize((current *= 2) > capacity ? current : capacity);
	            return this;
	        };

	        /**
	         * Overwrites this ByteBuffer's contents with the specified value. Contents are the bytes between
	         *  {@link ByteBuffer#offset} and {@link ByteBuffer#limit}.
	         * @param {number|string} value Byte value to fill with. If given as a string, the first character is used.
	         * @param {number=} begin Begin offset. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	         *  written if omitted. defaults to {@link ByteBuffer#offset}.
	         * @param {number=} end End offset, defaults to {@link ByteBuffer#limit}.
	         * @returns {!ByteBuffer} this
	         * @expose
	         * @example `someByteBuffer.clear().fill(0)` fills the entire backing buffer with zeroes
	         */
	        ByteBufferPrototype.fill = function(value, begin, end) {
	            var relative = typeof begin === 'undefined';
	            if (relative) begin = this.offset;
	            if (typeof value === 'string' && value.length > 0)
	                value = value.charCodeAt(0);
	            if (typeof begin === 'undefined') begin = this.offset;
	            if (typeof end === 'undefined') end = this.limit;
	            if (!this.noAssert) {
	                if (typeof value !== 'number' || value % 1 !== 0)
	                    throw TypeError("Illegal value: "+value+" (not an integer)");
	                value |= 0;
	                if (typeof begin !== 'number' || begin % 1 !== 0)
	                    throw TypeError("Illegal begin: Not an integer");
	                begin >>>= 0;
	                if (typeof end !== 'number' || end % 1 !== 0)
	                    throw TypeError("Illegal end: Not an integer");
	                end >>>= 0;
	                if (begin < 0 || begin > end || end > this.buffer.byteLength)
	                    throw RangeError("Illegal range: 0 <= "+begin+" <= "+end+" <= "+this.buffer.byteLength);
	            }
	            if (begin >= end)
	                return this; // Nothing to fill
	            while (begin < end) this.view.setUint8(begin++, value);
	            if (relative) this.offset = begin;
	            return this;
	        };

	        /**
	         * Makes this ByteBuffer ready for a new sequence of write or relative read operations. Sets `limit = offset` and
	         *  `offset = 0`. Make sure always to flip a ByteBuffer when all relative read or write operations are complete.
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.flip = function() {
	            this.limit = this.offset;
	            this.offset = 0;
	            return this;
	        };
	        /**
	         * Marks an offset on this ByteBuffer to be used later.
	         * @param {number=} offset Offset to mark. Defaults to {@link ByteBuffer#offset}.
	         * @returns {!ByteBuffer} this
	         * @throws {TypeError} If `offset` is not a valid number
	         * @throws {RangeError} If `offset` is out of bounds
	         * @see ByteBuffer#reset
	         * @expose
	         */
	        ByteBufferPrototype.mark = function(offset) {
	            offset = typeof offset === 'undefined' ? this.offset : offset;
	            if (!this.noAssert) {
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	            }
	            this.markedOffset = offset;
	            return this;
	        };
	        /**
	         * Sets the byte order.
	         * @param {boolean} littleEndian `true` for little endian byte order, `false` for big endian
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.order = function(littleEndian) {
	            if (!this.noAssert) {
	                if (typeof littleEndian !== 'boolean')
	                    throw TypeError("Illegal littleEndian: Not a boolean");
	            }
	            this.littleEndian = !!littleEndian;
	            return this;
	        };

	        /**
	         * Switches (to) little endian byte order.
	         * @param {boolean=} littleEndian Defaults to `true`, otherwise uses big endian
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.LE = function(littleEndian) {
	            this.littleEndian = typeof littleEndian !== 'undefined' ? !!littleEndian : true;
	            return this;
	        };

	        /**
	         * Switches (to) big endian byte order.
	         * @param {boolean=} bigEndian Defaults to `true`, otherwise uses little endian
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.BE = function(bigEndian) {
	            this.littleEndian = typeof bigEndian !== 'undefined' ? !bigEndian : false;
	            return this;
	        };
	        /**
	         * Prepends some data to this ByteBuffer. This will overwrite any contents before the specified offset up to the
	         *  prepended data's length. If there is not enough space available before the specified `offset`, the backing buffer
	         *  will be resized and its contents moved accordingly.
	         * @param {!ByteBuffer|string|!ArrayBuffer} source Data to prepend. If `source` is a ByteBuffer, its offset will be
	         *  modified according to the performed read operation.
	         * @param {(string|number)=} encoding Encoding if `data` is a string ("base64", "hex", "binary", defaults to "utf8")
	         * @param {number=} offset Offset to prepend at. Will use and decrease {@link ByteBuffer#offset} by the number of bytes
	         *  prepended if omitted.
	         * @returns {!ByteBuffer} this
	         * @expose
	         * @example A relative `00<01 02 03>.prepend(<04 05>)` results in `<04 05 01 02 03>, 04 05|`
	         * @example An absolute `00<01 02 03>.prepend(<04 05>, 2)` results in `04<05 02 03>, 04 05|`
	         */
	        ByteBufferPrototype.prepend = function(source, encoding, offset) {
	            if (typeof encoding === 'number' || typeof encoding !== 'string') {
	                offset = encoding;
	                encoding = undefined;
	            }
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	            }
	            if (!(source instanceof ByteBuffer))
	                source = ByteBuffer.wrap(source, encoding);
	            var len = source.limit - source.offset;
	            if (len <= 0) return this; // Nothing to prepend
	            var diff = len - offset;
	            var arrayView;
	            if (diff > 0) { // Not enough space before offset, so resize + move
	                var buffer = new ArrayBuffer(this.buffer.byteLength + diff);
	                arrayView = new Uint8Array(buffer);
	                arrayView.set(new Uint8Array(this.buffer).subarray(offset, this.buffer.byteLength), len);
	                this.buffer = buffer;
	                this.view = new DataView(buffer);
	                this.offset += diff;
	                if (this.markedOffset >= 0) this.markedOffset += diff;
	                this.limit += diff;
	                offset += diff;
	            } else {
	                arrayView = new Uint8Array(this.buffer);
	            }
	            arrayView.set(new Uint8Array(source.buffer).subarray(source.offset, source.limit), offset - len);
	            source.offset = source.limit;
	            if (relative)
	                this.offset -= len;
	            return this;
	        };

	        /**
	         * Prepends this ByteBuffer to another ByteBuffer. This will overwrite any contents before the specified offset up to the
	         *  prepended data's length. If there is not enough space available before the specified `offset`, the backing buffer
	         *  will be resized and its contents moved accordingly.
	         * @param {!ByteBuffer} target Target ByteBuffer
	         * @param {number=} offset Offset to prepend at. Will use and decrease {@link ByteBuffer#offset} by the number of bytes
	         *  prepended if omitted.
	         * @returns {!ByteBuffer} this
	         * @expose
	         * @see ByteBuffer#prepend
	         */
	        ByteBufferPrototype.prependTo = function(target, offset) {
	            target.prepend(this, offset);
	            return this;
	        };
	        /**
	         * Prints debug information about this ByteBuffer's contents.
	         * @param {function(string)=} out Output function to call, defaults to console.log
	         * @expose
	         */
	        ByteBufferPrototype.printDebug = function(out) {
	            if (typeof out !== 'function') out = console.log.bind(console);
	            out(
	                this.toString()+"\n"+
	                "-------------------------------------------------------------------\n"+
	                this.toDebug(/* columns */ true)
	            );
	        };

	        /**
	         * Gets the number of remaining readable bytes. Contents are the bytes between {@link ByteBuffer#offset} and
	         *  {@link ByteBuffer#limit}, so this returns `limit - offset`.
	         * @returns {number} Remaining readable bytes. May be negative if `offset > limit`.
	         * @expose
	         */
	        ByteBufferPrototype.remaining = function() {
	            return this.limit - this.offset;
	        };
	        /**
	         * Resets this ByteBuffer's {@link ByteBuffer#offset}. If an offset has been marked through {@link ByteBuffer#mark}
	         *  before, `offset` will be set to {@link ByteBuffer#markedOffset}, which will then be discarded. If no offset has been
	         *  marked, sets `offset = 0`.
	         * @returns {!ByteBuffer} this
	         * @see ByteBuffer#mark
	         * @expose
	         */
	        ByteBufferPrototype.reset = function() {
	            if (this.markedOffset >= 0) {
	                this.offset = this.markedOffset;
	                this.markedOffset = -1;
	            } else {
	                this.offset = 0;
	            }
	            return this;
	        };
	        /**
	         * Resizes this ByteBuffer to be backed by a buffer of at least the given capacity. Will do nothing if already that
	         *  large or larger.
	         * @param {number} capacity Capacity required
	         * @returns {!ByteBuffer} this
	         * @throws {TypeError} If `capacity` is not a number
	         * @throws {RangeError} If `capacity < 0`
	         * @expose
	         */
	        ByteBufferPrototype.resize = function(capacity) {
	            if (!this.noAssert) {
	                if (typeof capacity !== 'number' || capacity % 1 !== 0)
	                    throw TypeError("Illegal capacity: "+capacity+" (not an integer)");
	                capacity |= 0;
	                if (capacity < 0)
	                    throw RangeError("Illegal capacity: 0 <= "+capacity);
	            }
	            if (this.buffer.byteLength < capacity) {
	                var buffer = new ArrayBuffer(capacity);
	                new Uint8Array(buffer).set(new Uint8Array(this.buffer));
	                this.buffer = buffer;
	                this.view = new DataView(buffer);
	            }
	            return this;
	        };
	        /**
	         * Reverses this ByteBuffer's contents.
	         * @param {number=} begin Offset to start at, defaults to {@link ByteBuffer#offset}
	         * @param {number=} end Offset to end at, defaults to {@link ByteBuffer#limit}
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.reverse = function(begin, end) {
	            if (typeof begin === 'undefined') begin = this.offset;
	            if (typeof end === 'undefined') end = this.limit;
	            if (!this.noAssert) {
	                if (typeof begin !== 'number' || begin % 1 !== 0)
	                    throw TypeError("Illegal begin: Not an integer");
	                begin >>>= 0;
	                if (typeof end !== 'number' || end % 1 !== 0)
	                    throw TypeError("Illegal end: Not an integer");
	                end >>>= 0;
	                if (begin < 0 || begin > end || end > this.buffer.byteLength)
	                    throw RangeError("Illegal range: 0 <= "+begin+" <= "+end+" <= "+this.buffer.byteLength);
	            }
	            if (begin === end)
	                return this; // Nothing to reverse
	            Array.prototype.reverse.call(new Uint8Array(this.buffer).subarray(begin, end));
	            this.view = new DataView(this.buffer); // FIXME: Why exactly is this necessary?
	            return this;
	        };
	        /**
	         * Skips the next `length` bytes. This will just advance
	         * @param {number} length Number of bytes to skip. May also be negative to move the offset back.
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.skip = function(length) {
	            if (!this.noAssert) {
	                if (typeof length !== 'number' || length % 1 !== 0)
	                    throw TypeError("Illegal length: "+length+" (not an integer)");
	                length |= 0;
	            }
	            var offset = this.offset + length;
	            if (!this.noAssert) {
	                if (offset < 0 || offset > this.buffer.byteLength)
	                    throw RangeError("Illegal length: 0 <= "+this.offset+" + "+length+" <= "+this.buffer.byteLength);
	            }
	            this.offset = offset;
	            return this;
	        };

	        /**
	         * Slices this ByteBuffer by creating a cloned instance with `offset = begin` and `limit = end`.
	         * @param {number=} begin Begin offset, defaults to {@link ByteBuffer#offset}.
	         * @param {number=} end End offset, defaults to {@link ByteBuffer#limit}.
	         * @returns {!ByteBuffer} Clone of this ByteBuffer with slicing applied, backed by the same {@link ByteBuffer#buffer}
	         * @expose
	         */
	        ByteBufferPrototype.slice = function(begin, end) {
	            if (typeof begin === 'undefined') begin = this.offset;
	            if (typeof end === 'undefined') end = this.limit;
	            if (!this.noAssert) {
	                if (typeof begin !== 'number' || begin % 1 !== 0)
	                    throw TypeError("Illegal begin: Not an integer");
	                begin >>>= 0;
	                if (typeof end !== 'number' || end % 1 !== 0)
	                    throw TypeError("Illegal end: Not an integer");
	                end >>>= 0;
	                if (begin < 0 || begin > end || end > this.buffer.byteLength)
	                    throw RangeError("Illegal range: 0 <= "+begin+" <= "+end+" <= "+this.buffer.byteLength);
	            }
	            var bb = this.clone();
	            bb.offset = begin;
	            bb.limit = end;
	            return bb;
	        };
	        /**
	         * Returns a copy of the backing buffer that contains this ByteBuffer's contents. Contents are the bytes between
	         *  {@link ByteBuffer#offset} and {@link ByteBuffer#limit}. Will transparently {@link ByteBuffer#flip} this
	         *  ByteBuffer if `offset > limit` but the actual offsets remain untouched.
	         * @param {boolean=} forceCopy If `true` returns a copy, otherwise returns a view referencing the same memory if
	         *  possible. Defaults to `false`
	         * @returns {!ArrayBuffer} Contents as an ArrayBuffer
	         * @expose
	         */
	        ByteBufferPrototype.toBuffer = function(forceCopy) {
	            var offset = this.offset,
	                limit = this.limit;
	            if (offset > limit) {
	                var t = offset;
	                offset = limit;
	                limit = t;
	            }
	            if (!this.noAssert) {
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: Not an integer");
	                offset >>>= 0;
	                if (typeof limit !== 'number' || limit % 1 !== 0)
	                    throw TypeError("Illegal limit: Not an integer");
	                limit >>>= 0;
	                if (offset < 0 || offset > limit || limit > this.buffer.byteLength)
	                    throw RangeError("Illegal range: 0 <= "+offset+" <= "+limit+" <= "+this.buffer.byteLength);
	            }
	            // NOTE: It's not possible to have another ArrayBuffer reference the same memory as the backing buffer. This is
	            // possible with Uint8Array#subarray only, but we have to return an ArrayBuffer by contract. So:
	            if (!forceCopy && offset === 0 && limit === this.buffer.byteLength) {
	                return this.buffer;
	            }
	            if (offset === limit) {
	                return EMPTY_BUFFER;
	            }
	            var buffer = new ArrayBuffer(limit - offset);
	            new Uint8Array(buffer).set(new Uint8Array(this.buffer).subarray(offset, limit), 0);
	            return buffer;
	        };

	        /**
	         * Returns a raw buffer compacted to contain this ByteBuffer's contents. Contents are the bytes between
	         *  {@link ByteBuffer#offset} and {@link ByteBuffer#limit}. Will transparently {@link ByteBuffer#flip} this
	         *  ByteBuffer if `offset > limit` but the actual offsets remain untouched. This is an alias of
	         *  {@link ByteBuffer#toBuffer}.
	         * @function
	         * @param {boolean=} forceCopy If `true` returns a copy, otherwise returns a view referencing the same memory.
	         *  Defaults to `false`
	         * @returns {!ArrayBuffer} Contents as an ArrayBuffer
	         * @expose
	         */
	        ByteBufferPrototype.toArrayBuffer = ByteBufferPrototype.toBuffer;


	        /**
	         * Converts the ByteBuffer's contents to a string.
	         * @param {string=} encoding Output encoding. Returns an informative string representation if omitted but also allows
	         *  direct conversion to "utf8", "hex", "base64" and "binary" encoding. "debug" returns a hex representation with
	         *  highlighted offsets.
	         * @param {number=} begin Offset to begin at, defaults to {@link ByteBuffer#offset}
	         * @param {number=} end Offset to end at, defaults to {@link ByteBuffer#limit}
	         * @returns {string} String representation
	         * @throws {Error} If `encoding` is invalid
	         * @expose
	         */
	        ByteBufferPrototype.toString = function(encoding, begin, end) {
	            if (typeof encoding === 'undefined')
	                return "ByteBufferAB(offset="+this.offset+",markedOffset="+this.markedOffset+",limit="+this.limit+",capacity="+this.capacity()+")";
	            if (typeof encoding === 'number')
	                encoding = "utf8",
	                begin = encoding,
	                end = begin;
	            switch (encoding) {
	                case "utf8":
	                    return this.toUTF8(begin, end);
	                case "base64":
	                    return this.toBase64(begin, end);
	                case "hex":
	                    return this.toHex(begin, end);
	                case "binary":
	                    return this.toBinary(begin, end);
	                case "debug":
	                    return this.toDebug();
	                case "columns":
	                    return this.toColumns();
	                default:
	                    throw Error("Unsupported encoding: "+encoding);
	            }
	        };

	        // lxiv-embeddable

	        /**
	         * lxiv-embeddable (c) 2014 Daniel Wirtz <dcode@dcode.io>
	         * Released under the Apache License, Version 2.0
	         * see: https://github.com/dcodeIO/lxiv for details
	         */
	        var lxiv = function() {
	            "use strict";

	            /**
	             * lxiv namespace.
	             * @type {!Object.<string,*>}
	             * @exports lxiv
	             */
	            var lxiv = {};

	            /**
	             * Character codes for output.
	             * @type {!Array.<number>}
	             * @inner
	             */
	            var aout = [
	                65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80,
	                81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 97, 98, 99, 100, 101, 102,
	                103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118,
	                119, 120, 121, 122, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 43, 47
	            ];

	            /**
	             * Character codes for input.
	             * @type {!Array.<number>}
	             * @inner
	             */
	            var ain = [];
	            for (var i=0, k=aout.length; i<k; ++i)
	                ain[aout[i]] = i;

	            /**
	             * Encodes bytes to base64 char codes.
	             * @param {!function():number|null} src Bytes source as a function returning the next byte respectively `null` if
	             *  there are no more bytes left.
	             * @param {!function(number)} dst Characters destination as a function successively called with each encoded char
	             *  code.
	             */
	            lxiv.encode = function(src, dst) {
	                var b, t;
	                while ((b = src()) !== null) {
	                    dst(aout[(b>>2)&0x3f]);
	                    t = (b&0x3)<<4;
	                    if ((b = src()) !== null) {
	                        t |= (b>>4)&0xf;
	                        dst(aout[(t|((b>>4)&0xf))&0x3f]);
	                        t = (b&0xf)<<2;
	                        if ((b = src()) !== null)
	                            dst(aout[(t|((b>>6)&0x3))&0x3f]),
	                            dst(aout[b&0x3f]);
	                        else
	                            dst(aout[t&0x3f]),
	                            dst(61);
	                    } else
	                        dst(aout[t&0x3f]),
	                        dst(61),
	                        dst(61);
	                }
	            };

	            /**
	             * Decodes base64 char codes to bytes.
	             * @param {!function():number|null} src Characters source as a function returning the next char code respectively
	             *  `null` if there are no more characters left.
	             * @param {!function(number)} dst Bytes destination as a function successively called with the next byte.
	             * @throws {Error} If a character code is invalid
	             */
	            lxiv.decode = function(src, dst) {
	                var c, t1, t2;
	                function fail(c) {
	                    throw Error("Illegal character code: "+c);
	                }
	                while ((c = src()) !== null) {
	                    t1 = ain[c];
	                    if (typeof t1 === 'undefined') fail(c);
	                    if ((c = src()) !== null) {
	                        t2 = ain[c];
	                        if (typeof t2 === 'undefined') fail(c);
	                        dst((t1<<2)>>>0|(t2&0x30)>>4);
	                        if ((c = src()) !== null) {
	                            t1 = ain[c];
	                            if (typeof t1 === 'undefined')
	                                if (c === 61) break; else fail(c);
	                            dst(((t2&0xf)<<4)>>>0|(t1&0x3c)>>2);
	                            if ((c = src()) !== null) {
	                                t2 = ain[c];
	                                if (typeof t2 === 'undefined')
	                                    if (c === 61) break; else fail(c);
	                                dst(((t1&0x3)<<6)>>>0|t2);
	                            }
	                        }
	                    }
	                }
	            };

	            /**
	             * Tests if a string is valid base64.
	             * @param {string} str String to test
	             * @returns {boolean} `true` if valid, otherwise `false`
	             */
	            lxiv.test = function(str) {
	                return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(str);
	            };

	            return lxiv;
	        }();

	        // encodings/base64

	        /**
	         * Encodes this ByteBuffer's contents to a base64 encoded string.
	         * @param {number=} begin Offset to begin at, defaults to {@link ByteBuffer#offset}.
	         * @param {number=} end Offset to end at, defaults to {@link ByteBuffer#limit}.
	         * @returns {string} Base64 encoded string
	         * @expose
	         */
	        ByteBufferPrototype.toBase64 = function(begin, end) {
	            if (typeof begin === 'undefined')
	                begin = this.offset;
	            if (typeof end === 'undefined')
	                end = this.limit;
	            if (!this.noAssert) {
	                if (typeof begin !== 'number' || begin % 1 !== 0)
	                    throw TypeError("Illegal begin: Not an integer");
	                begin >>>= 0;
	                if (typeof end !== 'number' || end % 1 !== 0)
	                    throw TypeError("Illegal end: Not an integer");
	                end >>>= 0;
	                if (begin < 0 || begin > end || end > this.buffer.byteLength)
	                    throw RangeError("Illegal range: 0 <= "+begin+" <= "+end+" <= "+this.buffer.byteLength);
	            }
	            var sd; lxiv.encode(function() {
	                return begin < end ? this.view.getUint8(begin++) : null;
	            }.bind(this), sd = stringDestination());
	            return sd();
	        };

	        /**
	         * Decodes a base64 encoded string to a ByteBuffer.
	         * @param {string} str String to decode
	         * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
	         *  {@link ByteBuffer.DEFAULT_ENDIAN}.
	         * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
	         *  {@link ByteBuffer.DEFAULT_NOASSERT}.
	         * @returns {!ByteBuffer} ByteBuffer
	         * @expose
	         */
	        ByteBuffer.fromBase64 = function(str, littleEndian, noAssert) {
	            if (!noAssert) {
	                if (typeof str !== 'string')
	                    throw TypeError("Illegal str: Not a string");
	                if (str.length % 4 !== 0)
	                    throw TypeError("Illegal str: Length not a multiple of 4");
	            }
	            var bb = new ByteBuffer(str.length/4*3, littleEndian, noAssert),
	                i = 0;
	            lxiv.decode(stringSource(str), function(b) {
	                bb.view.setUint8(i++, b);
	            });
	            bb.limit = i;
	            return bb;
	        };

	        /**
	         * Encodes a binary string to base64 like `window.btoa` does.
	         * @param {string} str Binary string
	         * @returns {string} Base64 encoded string
	         * @see https://developer.mozilla.org/en-US/docs/Web/API/Window.btoa
	         * @expose
	         */
	        ByteBuffer.btoa = function(str) {
	            return ByteBuffer.fromBinary(str).toBase64();
	        };

	        /**
	         * Decodes a base64 encoded string to binary like `window.atob` does.
	         * @param {string} b64 Base64 encoded string
	         * @returns {string} Binary string
	         * @see https://developer.mozilla.org/en-US/docs/Web/API/Window.atob
	         * @expose
	         */
	        ByteBuffer.atob = function(b64) {
	            return ByteBuffer.fromBase64(b64).toBinary();
	        };

	        // encodings/binary

	        /**
	         * Encodes this ByteBuffer to a binary encoded string, that is using only characters 0x00-0xFF as bytes.
	         * @param {number=} begin Offset to begin at. Defaults to {@link ByteBuffer#offset}.
	         * @param {number=} end Offset to end at. Defaults to {@link ByteBuffer#limit}.
	         * @returns {string} Binary encoded string
	         * @throws {RangeError} If `offset > limit`
	         * @expose
	         */
	        ByteBufferPrototype.toBinary = function(begin, end) {
	            begin = typeof begin === 'undefined' ? this.offset : begin;
	            end = typeof end === 'undefined' ? this.limit : end;
	            if (!this.noAssert) {
	                if (typeof begin !== 'number' || begin % 1 !== 0)
	                    throw TypeError("Illegal begin: Not an integer");
	                begin >>>= 0;
	                if (typeof end !== 'number' || end % 1 !== 0)
	                    throw TypeError("Illegal end: Not an integer");
	                end >>>= 0;
	                if (begin < 0 || begin > end || end > this.buffer.byteLength)
	                    throw RangeError("Illegal range: 0 <= "+begin+" <= "+end+" <= "+this.buffer.byteLength);
	            }
	            if (begin === end)
	                return "";
	            var cc = [], pt = [];
	            while (begin < end) {
	                cc.push(this.view.getUint8(begin++));
	                if (cc.length >= 1024)
	                    pt.push(String.fromCharCode.apply(String, cc)),
	                    cc = [];
	            }
	            return pt.join('') + String.fromCharCode.apply(String, cc);
	        };

	        /**
	         * Decodes a binary encoded string, that is using only characters 0x00-0xFF as bytes, to a ByteBuffer.
	         * @param {string} str String to decode
	         * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
	         *  {@link ByteBuffer.DEFAULT_ENDIAN}.
	         * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
	         *  {@link ByteBuffer.DEFAULT_NOASSERT}.
	         * @returns {!ByteBuffer} ByteBuffer
	         * @expose
	         */
	        ByteBuffer.fromBinary = function(str, littleEndian, noAssert) {
	            if (!noAssert) {
	                if (typeof str !== 'string')
	                    throw TypeError("Illegal str: Not a string");
	            }
	            var i = 0, k = str.length, charCode,
	                bb = new ByteBuffer(k, littleEndian, noAssert);
	            while (i<k) {
	                charCode = str.charCodeAt(i);
	                if (!noAssert && charCode > 255)
	                    throw RangeError("Illegal charCode at "+i+": 0 <= "+charCode+" <= 255");
	                bb.view.setUint8(i++, charCode);
	            }
	            bb.limit = k;
	            return bb;
	        };

	        // encodings/debug

	        /**
	         * Encodes this ByteBuffer to a hex encoded string with marked offsets. Offset symbols are:
	         * * `<` : offset,
	         * * `'` : markedOffset,
	         * * `>` : limit,
	         * * `|` : offset and limit,
	         * * `[` : offset and markedOffset,
	         * * `]` : markedOffset and limit,
	         * * `!` : offset, markedOffset and limit
	         * @param {boolean=} columns If `true` returns two columns hex + ascii, defaults to `false`
	         * @returns {string|!Array.<string>} Debug string or array of lines if `asArray = true`
	         * @expose
	         * @example `>00'01 02<03` contains four bytes with `limit=0, markedOffset=1, offset=3`
	         * @example `00[01 02 03>` contains four bytes with `offset=markedOffset=1, limit=4`
	         * @example `00|01 02 03` contains four bytes with `offset=limit=1, markedOffset=-1`
	         * @example `|` contains zero bytes with `offset=limit=0, markedOffset=-1`
	         */
	        ByteBufferPrototype.toDebug = function(columns) {
	            var i = -1,
	                k = this.buffer.byteLength,
	                b,
	                hex = "",
	                asc = "",
	                out = "";
	            while (i<k) {
	                if (i !== -1) {
	                    b = this.view.getUint8(i);
	                    if (b < 0x10) hex += "0"+b.toString(16).toUpperCase();
	                    else hex += b.toString(16).toUpperCase();
	                    if (columns) {
	                        asc += b > 32 && b < 127 ? String.fromCharCode(b) : '.';
	                    }
	                }
	                ++i;
	                if (columns) {
	                    if (i > 0 && i % 16 === 0 && i !== k) {
	                        while (hex.length < 3*16+3) hex += " ";
	                        out += hex+asc+"\n";
	                        hex = asc = "";
	                    }
	                }
	                if (i === this.offset && i === this.limit)
	                    hex += i === this.markedOffset ? "!" : "|";
	                else if (i === this.offset)
	                    hex += i === this.markedOffset ? "[" : "<";
	                else if (i === this.limit)
	                    hex += i === this.markedOffset ? "]" : ">";
	                else
	                    hex += i === this.markedOffset ? "'" : (columns || (i !== 0 && i !== k) ? " " : "");
	            }
	            if (columns && hex !== " ") {
	                while (hex.length < 3*16+3) hex += " ";
	                out += hex+asc+"\n";
	            }
	            return columns ? out : hex;
	        };

	        /**
	         * Decodes a hex encoded string with marked offsets to a ByteBuffer.
	         * @param {string} str Debug string to decode (not be generated with `columns = true`)
	         * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
	         *  {@link ByteBuffer.DEFAULT_ENDIAN}.
	         * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
	         *  {@link ByteBuffer.DEFAULT_NOASSERT}.
	         * @returns {!ByteBuffer} ByteBuffer
	         * @expose
	         * @see ByteBuffer#toDebug
	         */
	        ByteBuffer.fromDebug = function(str, littleEndian, noAssert) {
	            var k = str.length,
	                bb = new ByteBuffer(((k+1)/3)|0, littleEndian, noAssert);
	            var i = 0, j = 0, ch, b,
	                rs = false, // Require symbol next
	                ho = false, hm = false, hl = false, // Already has offset, markedOffset, limit?
	                fail = false;
	            while (i<k) {
	                switch (ch = str.charAt(i++)) {
	                    case '!':
	                        if (!noAssert) {
	                            if (ho || hm || hl) {
	                                fail = true; break;
	                            }
	                            ho = hm = hl = true;
	                        }
	                        bb.offset = bb.markedOffset = bb.limit = j;
	                        rs = false;
	                        break;
	                    case '|':
	                        if (!noAssert) {
	                            if (ho || hl) {
	                                fail = true; break;
	                            }
	                            ho = hl = true;
	                        }
	                        bb.offset = bb.limit = j;
	                        rs = false;
	                        break;
	                    case '[':
	                        if (!noAssert) {
	                            if (ho || hm) {
	                                fail = true; break;
	                            }
	                            ho = hm = true;
	                        }
	                        bb.offset = bb.markedOffset = j;
	                        rs = false;
	                        break;
	                    case '<':
	                        if (!noAssert) {
	                            if (ho) {
	                                fail = true; break;
	                            }
	                            ho = true;
	                        }
	                        bb.offset = j;
	                        rs = false;
	                        break;
	                    case ']':
	                        if (!noAssert) {
	                            if (hl || hm) {
	                                fail = true; break;
	                            }
	                            hl = hm = true;
	                        }
	                        bb.limit = bb.markedOffset = j;
	                        rs = false;
	                        break;
	                    case '>':
	                        if (!noAssert) {
	                            if (hl) {
	                                fail = true; break;
	                            }
	                            hl = true;
	                        }
	                        bb.limit = j;
	                        rs = false;
	                        break;
	                    case "'":
	                        if (!noAssert) {
	                            if (hm) {
	                                fail = true; break;
	                            }
	                            hm = true;
	                        }
	                        bb.markedOffset = j;
	                        rs = false;
	                        break;
	                    case ' ':
	                        rs = false;
	                        break;
	                    default:
	                        if (!noAssert) {
	                            if (rs) {
	                                fail = true; break;
	                            }
	                        }
	                        b = parseInt(ch+str.charAt(i++), 16);
	                        if (!noAssert) {
	                            if (isNaN(b) || b < 0 || b > 255)
	                                throw TypeError("Illegal str: Not a debug encoded string");
	                        }
	                        bb.view.setUint8(j++, b);
	                        rs = true;
	                }
	                if (fail)
	                    throw TypeError("Illegal str: Invalid symbol at "+i);
	            }
	            if (!noAssert) {
	                if (!ho || !hl)
	                    throw TypeError("Illegal str: Missing offset or limit");
	                if (j<bb.buffer.byteLength)
	                    throw TypeError("Illegal str: Not a debug encoded string (is it hex?) "+j+" < "+k);
	            }
	            return bb;
	        };

	        // encodings/hex

	        /**
	         * Encodes this ByteBuffer's contents to a hex encoded string.
	         * @param {number=} begin Offset to begin at. Defaults to {@link ByteBuffer#offset}.
	         * @param {number=} end Offset to end at. Defaults to {@link ByteBuffer#limit}.
	         * @returns {string} Hex encoded string
	         * @expose
	         */
	        ByteBufferPrototype.toHex = function(begin, end) {
	            begin = typeof begin === 'undefined' ? this.offset : begin;
	            end = typeof end === 'undefined' ? this.limit : end;
	            if (!this.noAssert) {
	                if (typeof begin !== 'number' || begin % 1 !== 0)
	                    throw TypeError("Illegal begin: Not an integer");
	                begin >>>= 0;
	                if (typeof end !== 'number' || end % 1 !== 0)
	                    throw TypeError("Illegal end: Not an integer");
	                end >>>= 0;
	                if (begin < 0 || begin > end || end > this.buffer.byteLength)
	                    throw RangeError("Illegal range: 0 <= "+begin+" <= "+end+" <= "+this.buffer.byteLength);
	            }
	            var out = new Array(end - begin),
	                b;
	            while (begin < end) {
	                b = this.view.getUint8(begin++);
	                if (b < 0x10)
	                    out.push("0", b.toString(16));
	                else out.push(b.toString(16));
	            }
	            return out.join('');
	        };

	        /**
	         * Decodes a hex encoded string to a ByteBuffer.
	         * @param {string} str String to decode
	         * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
	         *  {@link ByteBuffer.DEFAULT_ENDIAN}.
	         * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
	         *  {@link ByteBuffer.DEFAULT_NOASSERT}.
	         * @returns {!ByteBuffer} ByteBuffer
	         * @expose
	         */
	        ByteBuffer.fromHex = function(str, littleEndian, noAssert) {
	            if (!noAssert) {
	                if (typeof str !== 'string')
	                    throw TypeError("Illegal str: Not a string");
	                if (str.length % 2 !== 0)
	                    throw TypeError("Illegal str: Length not a multiple of 2");
	            }
	            var k = str.length,
	                bb = new ByteBuffer((k / 2) | 0, littleEndian),
	                b;
	            for (var i=0, j=0; i<k; i+=2) {
	                b = parseInt(str.substring(i, i+2), 16);
	                if (!noAssert)
	                    if (!isFinite(b) || b < 0 || b > 255)
	                        throw TypeError("Illegal str: Contains non-hex characters");
	                bb.view.setUint8(j++, b);
	            }
	            bb.limit = j;
	            return bb;
	        };

	        // utfx-embeddable

	        /**
	         * utfx-embeddable (c) 2014 Daniel Wirtz <dcode@dcode.io>
	         * Released under the Apache License, Version 2.0
	         * see: https://github.com/dcodeIO/utfx for details
	         */
	        var utfx = function() {
	            "use strict";

	            /**
	             * utfx namespace.
	             * @inner
	             * @type {!Object.<string,*>}
	             */
	            var utfx = {};

	            /**
	             * Maximum valid code point.
	             * @type {number}
	             * @const
	             */
	            utfx.MAX_CODEPOINT = 0x10FFFF;

	            /**
	             * Encodes UTF8 code points to UTF8 bytes.
	             * @param {(!function():number|null) | number} src Code points source, either as a function returning the next code point
	             *  respectively `null` if there are no more code points left or a single numeric code point.
	             * @param {!function(number)} dst Bytes destination as a function successively called with the next byte
	             */
	            utfx.encodeUTF8 = function(src, dst) {
	                var cp = null;
	                if (typeof src === 'number')
	                    cp = src,
	                    src = function() { return null; };
	                while (cp !== null || (cp = src()) !== null) {
	                    if (cp < 0x80)
	                        dst(cp&0x7F);
	                    else if (cp < 0x800)
	                        dst(((cp>>6)&0x1F)|0xC0),
	                        dst((cp&0x3F)|0x80);
	                    else if (cp < 0x10000)
	                        dst(((cp>>12)&0x0F)|0xE0),
	                        dst(((cp>>6)&0x3F)|0x80),
	                        dst((cp&0x3F)|0x80);
	                    else
	                        dst(((cp>>18)&0x07)|0xF0),
	                        dst(((cp>>12)&0x3F)|0x80),
	                        dst(((cp>>6)&0x3F)|0x80),
	                        dst((cp&0x3F)|0x80);
	                    cp = null;
	                }
	            };

	            /**
	             * Decodes UTF8 bytes to UTF8 code points.
	             * @param {!function():number|null} src Bytes source as a function returning the next byte respectively `null` if there
	             *  are no more bytes left.
	             * @param {!function(number)} dst Code points destination as a function successively called with each decoded code point.
	             * @throws {RangeError} If a starting byte is invalid in UTF8
	             * @throws {Error} If the last sequence is truncated. Has an array property `bytes` holding the
	             *  remaining bytes.
	             */
	            utfx.decodeUTF8 = function(src, dst) {
	                var a, b, c, d, fail = function(b) {
	                    b = b.slice(0, b.indexOf(null));
	                    var err = Error(b.toString());
	                    err.name = "TruncatedError";
	                    err['bytes'] = b;
	                    throw err;
	                };
	                while ((a = src()) !== null) {
	                    if ((a&0x80) === 0)
	                        dst(a);
	                    else if ((a&0xE0) === 0xC0)
	                        ((b = src()) === null) && fail([a, b]),
	                        dst(((a&0x1F)<<6) | (b&0x3F));
	                    else if ((a&0xF0) === 0xE0)
	                        ((b=src()) === null || (c=src()) === null) && fail([a, b, c]),
	                        dst(((a&0x0F)<<12) | ((b&0x3F)<<6) | (c&0x3F));
	                    else if ((a&0xF8) === 0xF0)
	                        ((b=src()) === null || (c=src()) === null || (d=src()) === null) && fail([a, b, c ,d]),
	                        dst(((a&0x07)<<18) | ((b&0x3F)<<12) | ((c&0x3F)<<6) | (d&0x3F));
	                    else throw RangeError("Illegal starting byte: "+a);
	                }
	            };

	            /**
	             * Converts UTF16 characters to UTF8 code points.
	             * @param {!function():number|null} src Characters source as a function returning the next char code respectively
	             *  `null` if there are no more characters left.
	             * @param {!function(number)} dst Code points destination as a function successively called with each converted code
	             *  point.
	             */
	            utfx.UTF16toUTF8 = function(src, dst) {
	                var c1, c2 = null;
	                while (true) {
	                    if ((c1 = c2 !== null ? c2 : src()) === null)
	                        break;
	                    if (c1 >= 0xD800 && c1 <= 0xDFFF) {
	                        if ((c2 = src()) !== null) {
	                            if (c2 >= 0xDC00 && c2 <= 0xDFFF) {
	                                dst((c1-0xD800)*0x400+c2-0xDC00+0x10000);
	                                c2 = null; continue;
	                            }
	                        }
	                    }
	                    dst(c1);
	                }
	                if (c2 !== null) dst(c2);
	            };

	            /**
	             * Converts UTF8 code points to UTF16 characters.
	             * @param {(!function():number|null) | number} src Code points source, either as a function returning the next code point
	             *  respectively `null` if there are no more code points left or a single numeric code point.
	             * @param {!function(number)} dst Characters destination as a function successively called with each converted char code.
	             * @throws {RangeError} If a code point is out of range
	             */
	            utfx.UTF8toUTF16 = function(src, dst) {
	                var cp = null;
	                if (typeof src === 'number')
	                    cp = src, src = function() { return null; };
	                while (cp !== null || (cp = src()) !== null) {
	                    if (cp <= 0xFFFF)
	                        dst(cp);
	                    else
	                        cp -= 0x10000,
	                        dst((cp>>10)+0xD800),
	                        dst((cp%0x400)+0xDC00);
	                    cp = null;
	                }
	            };

	            /**
	             * Converts and encodes UTF16 characters to UTF8 bytes.
	             * @param {!function():number|null} src Characters source as a function returning the next char code respectively `null`
	             *  if there are no more characters left.
	             * @param {!function(number)} dst Bytes destination as a function successively called with the next byte.
	             */
	            utfx.encodeUTF16toUTF8 = function(src, dst) {
	                utfx.UTF16toUTF8(src, function(cp) {
	                    utfx.encodeUTF8(cp, dst);
	                });
	            };

	            /**
	             * Decodes and converts UTF8 bytes to UTF16 characters.
	             * @param {!function():number|null} src Bytes source as a function returning the next byte respectively `null` if there
	             *  are no more bytes left.
	             * @param {!function(number)} dst Characters destination as a function successively called with each converted char code.
	             * @throws {RangeError} If a starting byte is invalid in UTF8
	             * @throws {Error} If the last sequence is truncated. Has an array property `bytes` holding the remaining bytes.
	             */
	            utfx.decodeUTF8toUTF16 = function(src, dst) {
	                utfx.decodeUTF8(src, function(cp) {
	                    utfx.UTF8toUTF16(cp, dst);
	                });
	            };

	            /**
	             * Calculates the byte length of an UTF8 code point.
	             * @param {number} cp UTF8 code point
	             * @returns {number} Byte length
	             */
	            utfx.calculateCodePoint = function(cp) {
	                return (cp < 0x80) ? 1 : (cp < 0x800) ? 2 : (cp < 0x10000) ? 3 : 4;
	            };

	            /**
	             * Calculates the number of UTF8 bytes required to store UTF8 code points.
	             * @param {(!function():number|null)} src Code points source as a function returning the next code point respectively
	             *  `null` if there are no more code points left.
	             * @returns {number} The number of UTF8 bytes required
	             */
	            utfx.calculateUTF8 = function(src) {
	                var cp, l=0;
	                while ((cp = src()) !== null)
	                    l += utfx.calculateCodePoint(cp);
	                return l;
	            };

	            /**
	             * Calculates the number of UTF8 code points respectively UTF8 bytes required to store UTF16 char codes.
	             * @param {(!function():number|null)} src Characters source as a function returning the next char code respectively
	             *  `null` if there are no more characters left.
	             * @returns {!Array.<number>} The number of UTF8 code points at index 0 and the number of UTF8 bytes required at index 1.
	             */
	            utfx.calculateUTF16asUTF8 = function(src) {
	                var n=0, l=0;
	                utfx.UTF16toUTF8(src, function(cp) {
	                    ++n; l += utfx.calculateCodePoint(cp);
	                });
	                return [n,l];
	            };

	            return utfx;
	        }();

	        // encodings/utf8

	        /**
	         * Encodes this ByteBuffer's contents between {@link ByteBuffer#offset} and {@link ByteBuffer#limit} to an UTF8 encoded
	         *  string.
	         * @returns {string} Hex encoded string
	         * @throws {RangeError} If `offset > limit`
	         * @expose
	         */
	        ByteBufferPrototype.toUTF8 = function(begin, end) {
	            if (typeof begin === 'undefined') begin = this.offset;
	            if (typeof end === 'undefined') end = this.limit;
	            if (!this.noAssert) {
	                if (typeof begin !== 'number' || begin % 1 !== 0)
	                    throw TypeError("Illegal begin: Not an integer");
	                begin >>>= 0;
	                if (typeof end !== 'number' || end % 1 !== 0)
	                    throw TypeError("Illegal end: Not an integer");
	                end >>>= 0;
	                if (begin < 0 || begin > end || end > this.buffer.byteLength)
	                    throw RangeError("Illegal range: 0 <= "+begin+" <= "+end+" <= "+this.buffer.byteLength);
	            }
	            var sd; try {
	                utfx.decodeUTF8toUTF16(function() {
	                    return begin < end ? this.view.getUint8(begin++) : null;
	                }.bind(this), sd = stringDestination());
	            } catch (e) {
	                if (begin !== end)
	                    throw RangeError("Illegal range: Truncated data, "+begin+" != "+end);
	            }
	            return sd();
	        };

	        /**
	         * Decodes an UTF8 encoded string to a ByteBuffer.
	         * @param {string} str String to decode
	         * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
	         *  {@link ByteBuffer.DEFAULT_ENDIAN}.
	         * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
	         *  {@link ByteBuffer.DEFAULT_NOASSERT}.
	         * @returns {!ByteBuffer} ByteBuffer
	         * @expose
	         */
	        ByteBuffer.fromUTF8 = function(str, littleEndian, noAssert) {
	            if (!noAssert)
	                if (typeof str !== 'string')
	                    throw TypeError("Illegal str: Not a string");
	            var bb = new ByteBuffer(utfx.calculateUTF16asUTF8(stringSource(str), true)[1], littleEndian, noAssert),
	                i = 0;
	            utfx.encodeUTF16toUTF8(stringSource(str), function(b) {
	                bb.view.setUint8(i++, b);
	            });
	            bb.limit = i;
	            return bb;
	        };


	        return ByteBuffer;
	    }

	    /* CommonJS */ if ("function" === 'function' && typeof module === 'object' && module && typeof exports === 'object' && exports)
	        module['exports'] = (function() {
	            var Long; try { Long = __webpack_require__(7); } catch (e) {}
	            return loadByteBuffer(Long);
	        })();
	    /* AMD */ else if ("function" === 'function' && __webpack_require__(8)["amd"])
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(9)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Long) { return loadByteBuffer(Long); }.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    /* Global */ else
	        (global["dcodeIO"] = global["dcodeIO"] || {})["ByteBuffer"] = loadByteBuffer(global["dcodeIO"]["Long"]);

	})(this);

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)(module)))

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(module) {/*
	 Copyright 2013 Daniel Wirtz <dcode@dcode.io>
	 Copyright 2009 The Closure Library Authors. All Rights Reserved.

	 Licensed under the Apache License, Version 2.0 (the "License");
	 you may not use this file except in compliance with the License.
	 You may obtain a copy of the License at

	 http://www.apache.org/licenses/LICENSE-2.0

	 Unless required by applicable law or agreed to in writing, software
	 distributed under the License is distributed on an "AS-IS" BASIS,
	 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 See the License for the specific language governing permissions and
	 limitations under the License.
	 */

	/**
	 * @license Long.js (c) 2013 Daniel Wirtz <dcode@dcode.io>
	 * Released under the Apache License, Version 2.0
	 * see: https://github.com/dcodeIO/Long.js for details
	 */
	(function(global, factory) {

	    /* AMD */ if ("function" === 'function' && __webpack_require__(8)["amd"])
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    /* CommonJS */ else if ("function" === 'function' && typeof module === "object" && module && module["exports"])
	        module["exports"] = factory();
	    /* Global */ else
	        (global["dcodeIO"] = global["dcodeIO"] || {})["Long"] = factory();

	})(this, function() {
	    "use strict";

	    /**
	     * Constructs a 64 bit two's-complement integer, given its low and high 32 bit values as *signed* integers.
	     *  See the from* functions below for more convenient ways of constructing Longs.
	     * @exports Long
	     * @class A Long class for representing a 64 bit two's-complement integer value.
	     * @param {number} low The low (signed) 32 bits of the long
	     * @param {number} high The high (signed) 32 bits of the long
	     * @param {boolean=} unsigned Whether unsigned or not, defaults to `false` for signed
	     * @constructor
	     */
	    function Long(low, high, unsigned) {

	        /**
	         * The low 32 bits as a signed value.
	         * @type {number}
	         * @expose
	         */
	        this.low = low|0;

	        /**
	         * The high 32 bits as a signed value.
	         * @type {number}
	         * @expose
	         */
	        this.high = high|0;

	        /**
	         * Whether unsigned or not.
	         * @type {boolean}
	         * @expose
	         */
	        this.unsigned = !!unsigned;
	    }

	    // The internal representation of a long is the two given signed, 32-bit values.
	    // We use 32-bit pieces because these are the size of integers on which
	    // Javascript performs bit-operations.  For operations like addition and
	    // multiplication, we split each number into 16 bit pieces, which can easily be
	    // multiplied within Javascript's floating-point representation without overflow
	    // or change in sign.
	    //
	    // In the algorithms below, we frequently reduce the negative case to the
	    // positive case by negating the input(s) and then post-processing the result.
	    // Note that we must ALWAYS check specially whether those values are MIN_VALUE
	    // (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
	    // a positive number, it overflows back into a negative).  Not handling this
	    // case would often result in infinite recursion.
	    //
	    // Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the from*
	    // methods on which they depend.

	    /**
	     * An indicator used to reliably determine if an object is a Long or not.
	     * @type {boolean}
	     * @const
	     * @expose
	     * @private
	     */
	    Long.__isLong__;

	    Object.defineProperty(Long.prototype, "__isLong__", {
	        value: true,
	        enumerable: false,
	        configurable: false
	    });

	    /**
	     * Tests if the specified object is a Long.
	     * @param {*} obj Object
	     * @returns {boolean}
	     * @expose
	     */
	    Long.isLong = function isLong(obj) {
	        return (obj && obj["__isLong__"]) === true;
	    };

	    /**
	     * A cache of the Long representations of small integer values.
	     * @type {!Object}
	     * @inner
	     */
	    var INT_CACHE = {};

	    /**
	     * A cache of the Long representations of small unsigned integer values.
	     * @type {!Object}
	     * @inner
	     */
	    var UINT_CACHE = {};

	    /**
	     * Returns a Long representing the given 32 bit integer value.
	     * @param {number} value The 32 bit integer in question
	     * @param {boolean=} unsigned Whether unsigned or not, defaults to `false` for signed
	     * @returns {!Long} The corresponding Long value
	     * @expose
	     */
	    Long.fromInt = function fromInt(value, unsigned) {
	        var obj, cachedObj;
	        if (!unsigned) {
	            value = value | 0;
	            if (-128 <= value && value < 128) {
	                cachedObj = INT_CACHE[value];
	                if (cachedObj)
	                    return cachedObj;
	            }
	            obj = new Long(value, value < 0 ? -1 : 0, false);
	            if (-128 <= value && value < 128)
	                INT_CACHE[value] = obj;
	            return obj;
	        } else {
	            value = value >>> 0;
	            if (0 <= value && value < 256) {
	                cachedObj = UINT_CACHE[value];
	                if (cachedObj)
	                    return cachedObj;
	            }
	            obj = new Long(value, (value | 0) < 0 ? -1 : 0, true);
	            if (0 <= value && value < 256)
	                UINT_CACHE[value] = obj;
	            return obj;
	        }
	    };

	    /**
	     * Returns a Long representing the given value, provided that it is a finite number. Otherwise, zero is returned.
	     * @param {number} value The number in question
	     * @param {boolean=} unsigned Whether unsigned or not, defaults to `false` for signed
	     * @returns {!Long} The corresponding Long value
	     * @expose
	     */
	    Long.fromNumber = function fromNumber(value, unsigned) {
	        unsigned = !!unsigned;
	        if (isNaN(value) || !isFinite(value))
	            return Long.ZERO;
	        if (!unsigned && value <= -TWO_PWR_63_DBL)
	            return Long.MIN_VALUE;
	        if (!unsigned && value + 1 >= TWO_PWR_63_DBL)
	            return Long.MAX_VALUE;
	        if (unsigned && value >= TWO_PWR_64_DBL)
	            return Long.MAX_UNSIGNED_VALUE;
	        if (value < 0)
	            return Long.fromNumber(-value, unsigned).negate();
	        return new Long((value % TWO_PWR_32_DBL) | 0, (value / TWO_PWR_32_DBL) | 0, unsigned);
	    };

	    /**
	     * Returns a Long representing the 64 bit integer that comes by concatenating the given low and high bits. Each is
	     *  assumed to use 32 bits.
	     * @param {number} lowBits The low 32 bits
	     * @param {number} highBits The high 32 bits
	     * @param {boolean=} unsigned Whether unsigned or not, defaults to `false` for signed
	     * @returns {!Long} The corresponding Long value
	     * @expose
	     */
	    Long.fromBits = function fromBits(lowBits, highBits, unsigned) {
	        return new Long(lowBits, highBits, unsigned);
	    };

	    /**
	     * Returns a Long representation of the given string, written using the specified radix.
	     * @param {string} str The textual representation of the Long
	     * @param {(boolean|number)=} unsigned Whether unsigned or not, defaults to `false` for signed
	     * @param {number=} radix The radix in which the text is written (2-36), defaults to 10
	     * @returns {!Long} The corresponding Long value
	     * @expose
	     */
	    Long.fromString = function fromString(str, unsigned, radix) {
	        if (str.length === 0)
	            throw Error('number format error: empty string');
	        if (str === "NaN" || str === "Infinity" || str === "+Infinity" || str === "-Infinity")
	            return Long.ZERO;
	        if (typeof unsigned === 'number') // For goog.math.long compatibility
	            radix = unsigned,
	            unsigned = false;
	        radix = radix || 10;
	        if (radix < 2 || 36 < radix)
	            throw Error('radix out of range: ' + radix);

	        var p;
	        if ((p = str.indexOf('-')) > 0)
	            throw Error('number format error: interior "-" character: ' + str);
	        else if (p === 0)
	            return Long.fromString(str.substring(1), unsigned, radix).negate();

	        // Do several (8) digits each time through the loop, so as to
	        // minimize the calls to the very expensive emulated div.
	        var radixToPower = Long.fromNumber(Math.pow(radix, 8));

	        var result = Long.ZERO;
	        for (var i = 0; i < str.length; i += 8) {
	            var size = Math.min(8, str.length - i);
	            var value = parseInt(str.substring(i, i + size), radix);
	            if (size < 8) {
	                var power = Long.fromNumber(Math.pow(radix, size));
	                result = result.multiply(power).add(Long.fromNumber(value));
	            } else {
	                result = result.multiply(radixToPower);
	                result = result.add(Long.fromNumber(value));
	            }
	        }
	        result.unsigned = unsigned;
	        return result;
	    };

	    /**
	     * Converts the specified value to a Long.
	     * @param {!Long|number|string|!{low: number, high: number, unsigned: boolean}} val Value
	     * @returns {!Long}
	     * @expose
	     */
	    Long.fromValue = function fromValue(val) {
	        if (val /* is compatible */ instanceof Long)
	            return val;
	        if (typeof val === 'number')
	            return Long.fromNumber(val);
	        if (typeof val === 'string')
	            return Long.fromString(val);
	        // Throws for non-objects, converts non-instanceof Long:
	        return new Long(val.low, val.high, val.unsigned);
	    };

	    // NOTE: the compiler should inline these constant values below and then remove these variables, so there should be
	    // no runtime penalty for these.

	    /**
	     * @type {number}
	     * @const
	     * @inner
	     */
	    var TWO_PWR_16_DBL = 1 << 16;

	    /**
	     * @type {number}
	     * @const
	     * @inner
	     */
	    var TWO_PWR_24_DBL = 1 << 24;

	    /**
	     * @type {number}
	     * @const
	     * @inner
	     */
	    var TWO_PWR_32_DBL = TWO_PWR_16_DBL * TWO_PWR_16_DBL;

	    /**
	     * @type {number}
	     * @const
	     * @inner
	     */
	    var TWO_PWR_64_DBL = TWO_PWR_32_DBL * TWO_PWR_32_DBL;

	    /**
	     * @type {number}
	     * @const
	     * @inner
	     */
	    var TWO_PWR_63_DBL = TWO_PWR_64_DBL / 2;

	    /**
	     * @type {!Long}
	     * @const
	     * @inner
	     */
	    var TWO_PWR_24 = Long.fromInt(TWO_PWR_24_DBL);

	    /**
	     * Signed zero.
	     * @type {!Long}
	     * @expose
	     */
	    Long.ZERO = Long.fromInt(0);

	    /**
	     * Unsigned zero.
	     * @type {!Long}
	     * @expose
	     */
	    Long.UZERO = Long.fromInt(0, true);

	    /**
	     * Signed one.
	     * @type {!Long}
	     * @expose
	     */
	    Long.ONE = Long.fromInt(1);

	    /**
	     * Unsigned one.
	     * @type {!Long}
	     * @expose
	     */
	    Long.UONE = Long.fromInt(1, true);

	    /**
	     * Signed negative one.
	     * @type {!Long}
	     * @expose
	     */
	    Long.NEG_ONE = Long.fromInt(-1);

	    /**
	     * Maximum signed value.
	     * @type {!Long}
	     * @expose
	     */
	    Long.MAX_VALUE = Long.fromBits(0xFFFFFFFF|0, 0x7FFFFFFF|0, false);

	    /**
	     * Maximum unsigned value.
	     * @type {!Long}
	     * @expose
	     */
	    Long.MAX_UNSIGNED_VALUE = Long.fromBits(0xFFFFFFFF|0, 0xFFFFFFFF|0, true);

	    /**
	     * Minimum signed value.
	     * @type {!Long}
	     * @expose
	     */
	    Long.MIN_VALUE = Long.fromBits(0, 0x80000000|0, false);

	    /**
	     * Converts the Long to a 32 bit integer, assuming it is a 32 bit integer.
	     * @returns {number}
	     * @expose
	     */
	    Long.prototype.toInt = function toInt() {
	        return this.unsigned ? this.low >>> 0 : this.low;
	    };

	    /**
	     * Converts the Long to a the nearest floating-point representation of this value (double, 53 bit mantissa).
	     * @returns {number}
	     * @expose
	     */
	    Long.prototype.toNumber = function toNumber() {
	        if (this.unsigned) {
	            return ((this.high >>> 0) * TWO_PWR_32_DBL) + (this.low >>> 0);
	        }
	        return this.high * TWO_PWR_32_DBL + (this.low >>> 0);
	    };

	    /**
	     * Converts the Long to a string written in the specified radix.
	     * @param {number=} radix Radix (2-36), defaults to 10
	     * @returns {string}
	     * @override
	     * @throws {RangeError} If `radix` is out of range
	     * @expose
	     */
	    Long.prototype.toString = function toString(radix) {
	        radix = radix || 10;
	        if (radix < 2 || 36 < radix)
	            throw RangeError('radix out of range: ' + radix);
	        if (this.isZero())
	            return '0';
	        var rem;
	        if (this.isNegative()) { // Unsigned Longs are never negative
	            if (this.equals(Long.MIN_VALUE)) {
	                // We need to change the Long value before it can be negated, so we remove
	                // the bottom-most digit in this base and then recurse to do the rest.
	                var radixLong = Long.fromNumber(radix);
	                var div = this.divide(radixLong);
	                rem = div.multiply(radixLong).subtract(this);
	                return div.toString(radix) + rem.toInt().toString(radix);
	            } else
	                return '-' + this.negate().toString(radix);
	        }

	        // Do several (6) digits each time through the loop, so as to
	        // minimize the calls to the very expensive emulated div.
	        var radixToPower = Long.fromNumber(Math.pow(radix, 6), this.unsigned);
	        rem = this;
	        var result = '';
	        while (true) {
	            var remDiv = rem.divide(radixToPower),
	                intval = rem.subtract(remDiv.multiply(radixToPower)).toInt() >>> 0,
	                digits = intval.toString(radix);
	            rem = remDiv;
	            if (rem.isZero())
	                return digits + result;
	            else {
	                while (digits.length < 6)
	                    digits = '0' + digits;
	                result = '' + digits + result;
	            }
	        }
	    };

	    /**
	     * Gets the high 32 bits as a signed integer.
	     * @returns {number} Signed high bits
	     * @expose
	     */
	    Long.prototype.getHighBits = function getHighBits() {
	        return this.high;
	    };

	    /**
	     * Gets the high 32 bits as an unsigned integer.
	     * @returns {number} Unsigned high bits
	     * @expose
	     */
	    Long.prototype.getHighBitsUnsigned = function getHighBitsUnsigned() {
	        return this.high >>> 0;
	    };

	    /**
	     * Gets the low 32 bits as a signed integer.
	     * @returns {number} Signed low bits
	     * @expose
	     */
	    Long.prototype.getLowBits = function getLowBits() {
	        return this.low;
	    };

	    /**
	     * Gets the low 32 bits as an unsigned integer.
	     * @returns {number} Unsigned low bits
	     * @expose
	     */
	    Long.prototype.getLowBitsUnsigned = function getLowBitsUnsigned() {
	        return this.low >>> 0;
	    };

	    /**
	     * Gets the number of bits needed to represent the absolute value of this Long.
	     * @returns {number}
	     * @expose
	     */
	    Long.prototype.getNumBitsAbs = function getNumBitsAbs() {
	        if (this.isNegative()) // Unsigned Longs are never negative
	            return this.equals(Long.MIN_VALUE) ? 64 : this.negate().getNumBitsAbs();
	        var val = this.high != 0 ? this.high : this.low;
	        for (var bit = 31; bit > 0; bit--)
	            if ((val & (1 << bit)) != 0)
	                break;
	        return this.high != 0 ? bit + 33 : bit + 1;
	    };

	    /**
	     * Tests if this Long's value equals zero.
	     * @returns {boolean}
	     * @expose
	     */
	    Long.prototype.isZero = function isZero() {
	        return this.high === 0 && this.low === 0;
	    };

	    /**
	     * Tests if this Long's value is negative.
	     * @returns {boolean}
	     * @expose
	     */
	    Long.prototype.isNegative = function isNegative() {
	        return !this.unsigned && this.high < 0;
	    };

	    /**
	     * Tests if this Long's value is positive.
	     * @returns {boolean}
	     * @expose
	     */
	    Long.prototype.isPositive = function isPositive() {
	        return this.unsigned || this.high >= 0;
	    };

	    /**
	     * Tests if this Long's value is odd.
	     * @returns {boolean}
	     * @expose
	     */
	    Long.prototype.isOdd = function isOdd() {
	        return (this.low & 1) === 1;
	    };

	    /**
	     * Tests if this Long's value is even.
	     * @returns {boolean}
	     * @expose
	     */
	    Long.prototype.isEven = function isEven() {
	        return (this.low & 1) === 0;
	    };

	    /**
	     * Tests if this Long's value equals the specified's.
	     * @param {!Long|number|string} other Other value
	     * @returns {boolean}
	     * @expose
	     */
	    Long.prototype.equals = function equals(other) {
	        if (!Long.isLong(other))
	            other = Long.fromValue(other);
	        if (this.unsigned !== other.unsigned && (this.high >>> 31) === 1 && (other.high >>> 31) === 1)
	            return false;
	        return this.high === other.high && this.low === other.low;
	    };

	    /**
	     * Tests if this Long's value equals the specified's. This is an alias of {@link Long#equals}.
	     * @function
	     * @param {!Long|number|string} other Other value
	     * @returns {boolean}
	     * @expose
	     */
	    Long.eq = Long.prototype.equals;

	    /**
	     * Tests if this Long's value differs from the specified's.
	     * @param {!Long|number|string} other Other value
	     * @returns {boolean}
	     * @expose
	     */
	    Long.prototype.notEquals = function notEquals(other) {
	        return !this.equals(/* validates */ other);
	    };

	    /**
	     * Tests if this Long's value differs from the specified's. This is an alias of {@link Long#notEquals}.
	     * @function
	     * @param {!Long|number|string} other Other value
	     * @returns {boolean}
	     * @expose
	     */
	    Long.neq = Long.prototype.notEquals;

	    /**
	     * Tests if this Long's value is less than the specified's.
	     * @param {!Long|number|string} other Other value
	     * @returns {boolean}
	     * @expose
	     */
	    Long.prototype.lessThan = function lessThan(other) {
	        return this.compare(/* validates */ other) < 0;
	    };

	    /**
	     * Tests if this Long's value is less than the specified's. This is an alias of {@link Long#lessThan}.
	     * @function
	     * @param {!Long|number|string} other Other value
	     * @returns {boolean}
	     * @expose
	     */
	    Long.prototype.lt = Long.prototype.lessThan;

	    /**
	     * Tests if this Long's value is less than or equal the specified's.
	     * @param {!Long|number|string} other Other value
	     * @returns {boolean}
	     * @expose
	     */
	    Long.prototype.lessThanOrEqual = function lessThanOrEqual(other) {
	        return this.compare(/* validates */ other) <= 0;
	    };

	    /**
	     * Tests if this Long's value is less than or equal the specified's. This is an alias of {@link Long#lessThanOrEqual}.
	     * @function
	     * @param {!Long|number|string} other Other value
	     * @returns {boolean}
	     * @expose
	     */
	    Long.prototype.lte = Long.prototype.lessThanOrEqual;

	    /**
	     * Tests if this Long's value is greater than the specified's.
	     * @param {!Long|number|string} other Other value
	     * @returns {boolean}
	     * @expose
	     */
	    Long.prototype.greaterThan = function greaterThan(other) {
	        return this.compare(/* validates */ other) > 0;
	    };

	    /**
	     * Tests if this Long's value is greater than the specified's. This is an alias of {@link Long#greaterThan}.
	     * @function
	     * @param {!Long|number|string} other Other value
	     * @returns {boolean}
	     * @expose
	     */
	    Long.prototype.gt = Long.prototype.greaterThan;

	    /**
	     * Tests if this Long's value is greater than or equal the specified's.
	     * @param {!Long|number|string} other Other value
	     * @returns {boolean}
	     * @expose
	     */
	    Long.prototype.greaterThanOrEqual = function greaterThanOrEqual(other) {
	        return this.compare(/* validates */ other) >= 0;
	    };

	    /**
	     * Tests if this Long's value is greater than or equal the specified's. This is an alias of {@link Long#greaterThanOrEqual}.
	     * @function
	     * @param {!Long|number|string} other Other value
	     * @returns {boolean}
	     * @expose
	     */
	    Long.prototype.gte = Long.prototype.greaterThanOrEqual;

	    /**
	     * Compares this Long's value with the specified's.
	     * @param {!Long|number|string} other Other value
	     * @returns {number} 0 if they are the same, 1 if the this is greater and -1
	     *  if the given one is greater
	     * @expose
	     */
	    Long.prototype.compare = function compare(other) {
	        if (!Long.isLong(other))
	            other = Long.fromValue(other);
	        if (this.equals(other))
	            return 0;
	        var thisNeg = this.isNegative(),
	            otherNeg = other.isNegative();
	        if (thisNeg && !otherNeg)
	            return -1;
	        if (!thisNeg && otherNeg)
	            return 1;
	        // At this point the sign bits are the same
	        if (!this.unsigned)
	            return this.subtract(other).isNegative() ? -1 : 1;
	        // Both are positive if at least one is unsigned
	        return (other.high >>> 0) > (this.high >>> 0) || (other.high === this.high && (other.low >>> 0) > (this.low >>> 0)) ? -1 : 1;
	    };

	    /**
	     * Negates this Long's value.
	     * @returns {!Long} Negated Long
	     * @expose
	     */
	    Long.prototype.negate = function negate() {
	        if (!this.unsigned && this.equals(Long.MIN_VALUE))
	            return Long.MIN_VALUE;
	        return this.not().add(Long.ONE);
	    };

	    /**
	     * Negates this Long's value. This is an alias of {@link Long#negate}.
	     * @function
	     * @returns {!Long} Negated Long
	     * @expose
	     */
	    Long.prototype.neg = Long.prototype.negate;

	    /**
	     * Returns the sum of this and the specified Long.
	     * @param {!Long|number|string} addend Addend
	     * @returns {!Long} Sum
	     * @expose
	     */
	    Long.prototype.add = function add(addend) {
	        if (!Long.isLong(addend))
	            addend = Long.fromValue(addend);

	        // Divide each number into 4 chunks of 16 bits, and then sum the chunks.

	        var a48 = this.high >>> 16;
	        var a32 = this.high & 0xFFFF;
	        var a16 = this.low >>> 16;
	        var a00 = this.low & 0xFFFF;

	        var b48 = addend.high >>> 16;
	        var b32 = addend.high & 0xFFFF;
	        var b16 = addend.low >>> 16;
	        var b00 = addend.low & 0xFFFF;

	        var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
	        c00 += a00 + b00;
	        c16 += c00 >>> 16;
	        c00 &= 0xFFFF;
	        c16 += a16 + b16;
	        c32 += c16 >>> 16;
	        c16 &= 0xFFFF;
	        c32 += a32 + b32;
	        c48 += c32 >>> 16;
	        c32 &= 0xFFFF;
	        c48 += a48 + b48;
	        c48 &= 0xFFFF;
	        return Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32, this.unsigned);
	    };

	    /**
	     * Returns the difference of this and the specified Long.
	     * @param {!Long|number|string} subtrahend Subtrahend
	     * @returns {!Long} Difference
	     * @expose
	     */
	    Long.prototype.subtract = function subtract(subtrahend) {
	        if (!Long.isLong(subtrahend))
	            subtrahend = Long.fromValue(subtrahend);
	        return this.add(subtrahend.negate());
	    };

	    /**
	     * Returns the difference of this and the specified Long. This is an alias of {@link Long#subtract}.
	     * @function
	     * @param {!Long|number|string} subtrahend Subtrahend
	     * @returns {!Long} Difference
	     * @expose
	     */
	    Long.prototype.sub = Long.prototype.subtract;

	    /**
	     * Returns the product of this and the specified Long.
	     * @param {!Long|number|string} multiplier Multiplier
	     * @returns {!Long} Product
	     * @expose
	     */
	    Long.prototype.multiply = function multiply(multiplier) {
	        if (this.isZero())
	            return Long.ZERO;
	        if (!Long.isLong(multiplier))
	            multiplier = Long.fromValue(multiplier);
	        if (multiplier.isZero())
	            return Long.ZERO;
	        if (this.equals(Long.MIN_VALUE))
	            return multiplier.isOdd() ? Long.MIN_VALUE : Long.ZERO;
	        if (multiplier.equals(Long.MIN_VALUE))
	            return this.isOdd() ? Long.MIN_VALUE : Long.ZERO;

	        if (this.isNegative()) {
	            if (multiplier.isNegative())
	                return this.negate().multiply(multiplier.negate());
	            else
	                return this.negate().multiply(multiplier).negate();
	        } else if (multiplier.isNegative())
	            return this.multiply(multiplier.negate()).negate();

	        // If both longs are small, use float multiplication
	        if (this.lessThan(TWO_PWR_24) && multiplier.lessThan(TWO_PWR_24))
	            return Long.fromNumber(this.toNumber() * multiplier.toNumber(), this.unsigned);

	        // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
	        // We can skip products that would overflow.

	        var a48 = this.high >>> 16;
	        var a32 = this.high & 0xFFFF;
	        var a16 = this.low >>> 16;
	        var a00 = this.low & 0xFFFF;

	        var b48 = multiplier.high >>> 16;
	        var b32 = multiplier.high & 0xFFFF;
	        var b16 = multiplier.low >>> 16;
	        var b00 = multiplier.low & 0xFFFF;

	        var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
	        c00 += a00 * b00;
	        c16 += c00 >>> 16;
	        c00 &= 0xFFFF;
	        c16 += a16 * b00;
	        c32 += c16 >>> 16;
	        c16 &= 0xFFFF;
	        c16 += a00 * b16;
	        c32 += c16 >>> 16;
	        c16 &= 0xFFFF;
	        c32 += a32 * b00;
	        c48 += c32 >>> 16;
	        c32 &= 0xFFFF;
	        c32 += a16 * b16;
	        c48 += c32 >>> 16;
	        c32 &= 0xFFFF;
	        c32 += a00 * b32;
	        c48 += c32 >>> 16;
	        c32 &= 0xFFFF;
	        c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
	        c48 &= 0xFFFF;
	        return Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32, this.unsigned);
	    };

	    /**
	     * Returns the product of this and the specified Long. This is an alias of {@link Long#multiply}.
	     * @function
	     * @param {!Long|number|string} multiplier Multiplier
	     * @returns {!Long} Product
	     * @expose
	     */
	    Long.prototype.mul = Long.prototype.multiply;

	    /**
	     * Returns this Long divided by the specified.
	     * @param {!Long|number|string} divisor Divisor
	     * @returns {!Long} Quotient
	     * @expose
	     */
	    Long.prototype.divide = function divide(divisor) {
	        if (!Long.isLong(divisor))
	            divisor = Long.fromValue(divisor);
	        if (divisor.isZero())
	            throw(new Error('division by zero'));
	        if (this.isZero())
	            return this.unsigned ? Long.UZERO : Long.ZERO;
	        var approx, rem, res;
	        if (this.equals(Long.MIN_VALUE)) {
	            if (divisor.equals(Long.ONE) || divisor.equals(Long.NEG_ONE))
	                return Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
	            else if (divisor.equals(Long.MIN_VALUE))
	                return Long.ONE;
	            else {
	                // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
	                var halfThis = this.shiftRight(1);
	                approx = halfThis.divide(divisor).shiftLeft(1);
	                if (approx.equals(Long.ZERO)) {
	                    return divisor.isNegative() ? Long.ONE : Long.NEG_ONE;
	                } else {
	                    rem = this.subtract(divisor.multiply(approx));
	                    res = approx.add(rem.divide(divisor));
	                    return res;
	                }
	            }
	        } else if (divisor.equals(Long.MIN_VALUE))
	            return this.unsigned ? Long.UZERO : Long.ZERO;
	        if (this.isNegative()) {
	            if (divisor.isNegative())
	                return this.negate().divide(divisor.negate());
	            return this.negate().divide(divisor).negate();
	        } else if (divisor.isNegative())
	            return this.divide(divisor.negate()).negate();

	        // Repeat the following until the remainder is less than other:  find a
	        // floating-point that approximates remainder / other *from below*, add this
	        // into the result, and subtract it from the remainder.  It is critical that
	        // the approximate value is less than or equal to the real value so that the
	        // remainder never becomes negative.
	        res = Long.ZERO;
	        rem = this;
	        while (rem.greaterThanOrEqual(divisor)) {
	            // Approximate the result of division. This may be a little greater or
	            // smaller than the actual value.
	            approx = Math.max(1, Math.floor(rem.toNumber() / divisor.toNumber()));

	            // We will tweak the approximate result by changing it in the 48-th digit or
	            // the smallest non-fractional digit, whichever is larger.
	            var log2 = Math.ceil(Math.log(approx) / Math.LN2),
	                delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48),

	            // Decrease the approximation until it is smaller than the remainder.  Note
	            // that if it is too large, the product overflows and is negative.
	                approxRes = Long.fromNumber(approx),
	                approxRem = approxRes.multiply(divisor);
	            while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
	                approx -= delta;
	                approxRes = Long.fromNumber(approx, this.unsigned);
	                approxRem = approxRes.multiply(divisor);
	            }

	            // We know the answer can't be zero... and actually, zero would cause
	            // infinite recursion since we would make no progress.
	            if (approxRes.isZero())
	                approxRes = Long.ONE;

	            res = res.add(approxRes);
	            rem = rem.subtract(approxRem);
	        }
	        return res;
	    };

	    /**
	     * Returns this Long divided by the specified. This is an alias of {@link Long#divide}.
	     * @function
	     * @param {!Long|number|string} divisor Divisor
	     * @returns {!Long} Quotient
	     * @expose
	     */
	    Long.prototype.div = Long.prototype.divide;

	    /**
	     * Returns this Long modulo the specified.
	     * @param {!Long|number|string} divisor Divisor
	     * @returns {!Long} Remainder
	     * @expose
	     */
	    Long.prototype.modulo = function modulo(divisor) {
	        if (!Long.isLong(divisor))
	            divisor = Long.fromValue(divisor);
	        return this.subtract(this.divide(divisor).multiply(divisor));
	    };

	    /**
	     * Returns this Long modulo the specified. This is an alias of {@link Long#modulo}.
	     * @function
	     * @param {!Long|number|string} divisor Divisor
	     * @returns {!Long} Remainder
	     * @expose
	     */
	    Long.prototype.mod = Long.prototype.modulo;

	    /**
	     * Returns the bitwise NOT of this Long.
	     * @returns {!Long}
	     * @expose
	     */
	    Long.prototype.not = function not() {
	        return Long.fromBits(~this.low, ~this.high, this.unsigned);
	    };

	    /**
	     * Returns the bitwise AND of this Long and the specified.
	     * @param {!Long|number|string} other Other Long
	     * @returns {!Long}
	     * @expose
	     */
	    Long.prototype.and = function and(other) {
	        if (!Long.isLong(other))
	            other = Long.fromValue(other);
	        return Long.fromBits(this.low & other.low, this.high & other.high, this.unsigned);
	    };

	    /**
	     * Returns the bitwise OR of this Long and the specified.
	     * @param {!Long|number|string} other Other Long
	     * @returns {!Long}
	     * @expose
	     */
	    Long.prototype.or = function or(other) {
	        if (!Long.isLong(other))
	            other = Long.fromValue(other);
	        return Long.fromBits(this.low | other.low, this.high | other.high, this.unsigned);
	    };

	    /**
	     * Returns the bitwise XOR of this Long and the given one.
	     * @param {!Long|number|string} other Other Long
	     * @returns {!Long}
	     * @expose
	     */
	    Long.prototype.xor = function xor(other) {
	        if (!Long.isLong(other))
	            other = Long.fromValue(other);
	        return Long.fromBits(this.low ^ other.low, this.high ^ other.high, this.unsigned);
	    };

	    /**
	     * Returns this Long with bits shifted to the left by the given amount.
	     * @param {number|!Long} numBits Number of bits
	     * @returns {!Long} Shifted Long
	     * @expose
	     */
	    Long.prototype.shiftLeft = function shiftLeft(numBits) {
	        if (Long.isLong(numBits))
	            numBits = numBits.toInt();
	        if ((numBits &= 63) === 0)
	            return this;
	        else if (numBits < 32)
	            return Long.fromBits(this.low << numBits, (this.high << numBits) | (this.low >>> (32 - numBits)), this.unsigned);
	        else
	            return Long.fromBits(0, this.low << (numBits - 32), this.unsigned);
	    };

	    /**
	     * Returns this Long with bits shifted to the left by the given amount. This is an alias of {@link Long#shiftLeft}.
	     * @function
	     * @param {number|!Long} numBits Number of bits
	     * @returns {!Long} Shifted Long
	     * @expose
	     */
	    Long.prototype.shl = Long.prototype.shiftLeft;

	    /**
	     * Returns this Long with bits arithmetically shifted to the right by the given amount.
	     * @param {number|!Long} numBits Number of bits
	     * @returns {!Long} Shifted Long
	     * @expose
	     */
	    Long.prototype.shiftRight = function shiftRight(numBits) {
	        if (Long.isLong(numBits))
	            numBits = numBits.toInt();
	        if ((numBits &= 63) === 0)
	            return this;
	        else if (numBits < 32)
	            return Long.fromBits((this.low >>> numBits) | (this.high << (32 - numBits)), this.high >> numBits, this.unsigned);
	        else
	            return Long.fromBits(this.high >> (numBits - 32), this.high >= 0 ? 0 : -1, this.unsigned);
	    };

	    /**
	     * Returns this Long with bits arithmetically shifted to the right by the given amount. This is an alias of {@link Long#shiftRight}.
	     * @function
	     * @param {number|!Long} numBits Number of bits
	     * @returns {!Long} Shifted Long
	     * @expose
	     */
	    Long.prototype.shr = Long.prototype.shiftRight;

	    /**
	     * Returns this Long with bits logically shifted to the right by the given amount.
	     * @param {number|!Long} numBits Number of bits
	     * @returns {!Long} Shifted Long
	     * @expose
	     */
	    Long.prototype.shiftRightUnsigned = function shiftRightUnsigned(numBits) {
	        if (Long.isLong(numBits))
	            numBits = numBits.toInt();
	        numBits &= 63;
	        if (numBits === 0)
	            return this;
	        else {
	            var high = this.high;
	            if (numBits < 32) {
	                var low = this.low;
	                return Long.fromBits((low >>> numBits) | (high << (32 - numBits)), high >>> numBits, this.unsigned);
	            } else if (numBits === 32)
	                return Long.fromBits(high, 0, this.unsigned);
	            else
	                return Long.fromBits(high >>> (numBits - 32), 0, this.unsigned);
	        }
	    };

	    /**
	     * Returns this Long with bits logically shifted to the right by the given amount. This is an alias of {@link Long#shiftRightUnsigned}.
	     * @function
	     * @param {number|!Long} numBits Number of bits
	     * @returns {!Long} Shifted Long
	     * @expose
	     */
	    Long.prototype.shru = Long.prototype.shiftRightUnsigned;

	    /**
	     * Converts this Long to signed.
	     * @returns {!Long} Signed long
	     * @expose
	     */
	    Long.prototype.toSigned = function toSigned() {
	        if (!this.unsigned)
	            return this;
	        return new Long(this.low, this.high, false);
	    };

	    /**
	     * Converts this Long to unsigned.
	     * @returns {!Long} Unsigned long
	     * @expose
	     */
	    Long.prototype.toUnsigned = function toUnsigned() {
	        if (this.unsigned)
	            return this;
	        return new Long(this.low, this.high, true);
	    };

	    return Long;
	});

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)(module)))

/***/ },
/* 8 */
/***/ function(module, exports) {

	module.exports = function() { throw new Error("define cannot be used indirect"); };


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(module) {/*
	 Copyright 2013 Daniel Wirtz <dcode@dcode.io>
	 Copyright 2009 The Closure Library Authors. All Rights Reserved.

	 Licensed under the Apache License, Version 2.0 (the "License");
	 you may not use this file except in compliance with the License.
	 You may obtain a copy of the License at

	 http://www.apache.org/licenses/LICENSE-2.0

	 Unless required by applicable law or agreed to in writing, software
	 distributed under the License is distributed on an "AS-IS" BASIS,
	 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 See the License for the specific language governing permissions and
	 limitations under the License.
	 */

	/**
	 * @license Long.js (c) 2013 Daniel Wirtz <dcode@dcode.io>
	 * Released under the Apache License, Version 2.0
	 * see: https://github.com/dcodeIO/Long.js for details
	 */
	(function(global, factory) {

	    /* AMD */ if ("function" === 'function' && __webpack_require__(8)["amd"])
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    /* CommonJS */ else if ("function" === 'function' && typeof module === "object" && module && module["exports"])
	        module["exports"] = factory();
	    /* Global */ else
	        (global["dcodeIO"] = global["dcodeIO"] || {})["Long"] = factory();

	})(this, function() {
	    "use strict";

	    /**
	     * Constructs a 64 bit two's-complement integer, given its low and high 32 bit values as *signed* integers.
	     *  See the from* functions below for more convenient ways of constructing Longs.
	     * @exports Long
	     * @class A Long class for representing a 64 bit two's-complement integer value.
	     * @param {number} low The low (signed) 32 bits of the long
	     * @param {number} high The high (signed) 32 bits of the long
	     * @param {boolean=} unsigned Whether unsigned or not, defaults to `false` for signed
	     * @constructor
	     */
	    function Long(low, high, unsigned) {

	        /**
	         * The low 32 bits as a signed value.
	         * @type {number}
	         * @expose
	         */
	        this.low = low|0;

	        /**
	         * The high 32 bits as a signed value.
	         * @type {number}
	         * @expose
	         */
	        this.high = high|0;

	        /**
	         * Whether unsigned or not.
	         * @type {boolean}
	         * @expose
	         */
	        this.unsigned = !!unsigned;
	    }

	    // The internal representation of a long is the two given signed, 32-bit values.
	    // We use 32-bit pieces because these are the size of integers on which
	    // Javascript performs bit-operations.  For operations like addition and
	    // multiplication, we split each number into 16 bit pieces, which can easily be
	    // multiplied within Javascript's floating-point representation without overflow
	    // or change in sign.
	    //
	    // In the algorithms below, we frequently reduce the negative case to the
	    // positive case by negating the input(s) and then post-processing the result.
	    // Note that we must ALWAYS check specially whether those values are MIN_VALUE
	    // (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
	    // a positive number, it overflows back into a negative).  Not handling this
	    // case would often result in infinite recursion.
	    //
	    // Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the from*
	    // methods on which they depend.

	    /**
	     * An indicator used to reliably determine if an object is a Long or not.
	     * @type {boolean}
	     * @const
	     * @expose
	     * @private
	     */
	    Long.__isLong__;

	    Object.defineProperty(Long.prototype, "__isLong__", {
	        value: true,
	        enumerable: false,
	        configurable: false
	    });

	    /**
	     * Tests if the specified object is a Long.
	     * @param {*} obj Object
	     * @returns {boolean}
	     * @expose
	     */
	    Long.isLong = function isLong(obj) {
	        return (obj && obj["__isLong__"]) === true;
	    };

	    /**
	     * A cache of the Long representations of small integer values.
	     * @type {!Object}
	     * @inner
	     */
	    var INT_CACHE = {};

	    /**
	     * A cache of the Long representations of small unsigned integer values.
	     * @type {!Object}
	     * @inner
	     */
	    var UINT_CACHE = {};

	    /**
	     * Returns a Long representing the given 32 bit integer value.
	     * @param {number} value The 32 bit integer in question
	     * @param {boolean=} unsigned Whether unsigned or not, defaults to `false` for signed
	     * @returns {!Long} The corresponding Long value
	     * @expose
	     */
	    Long.fromInt = function fromInt(value, unsigned) {
	        var obj, cachedObj;
	        if (!unsigned) {
	            value = value | 0;
	            if (-128 <= value && value < 128) {
	                cachedObj = INT_CACHE[value];
	                if (cachedObj)
	                    return cachedObj;
	            }
	            obj = new Long(value, value < 0 ? -1 : 0, false);
	            if (-128 <= value && value < 128)
	                INT_CACHE[value] = obj;
	            return obj;
	        } else {
	            value = value >>> 0;
	            if (0 <= value && value < 256) {
	                cachedObj = UINT_CACHE[value];
	                if (cachedObj)
	                    return cachedObj;
	            }
	            obj = new Long(value, (value | 0) < 0 ? -1 : 0, true);
	            if (0 <= value && value < 256)
	                UINT_CACHE[value] = obj;
	            return obj;
	        }
	    };

	    /**
	     * Returns a Long representing the given value, provided that it is a finite number. Otherwise, zero is returned.
	     * @param {number} value The number in question
	     * @param {boolean=} unsigned Whether unsigned or not, defaults to `false` for signed
	     * @returns {!Long} The corresponding Long value
	     * @expose
	     */
	    Long.fromNumber = function fromNumber(value, unsigned) {
	        unsigned = !!unsigned;
	        if (isNaN(value) || !isFinite(value))
	            return Long.ZERO;
	        if (!unsigned && value <= -TWO_PWR_63_DBL)
	            return Long.MIN_VALUE;
	        if (!unsigned && value + 1 >= TWO_PWR_63_DBL)
	            return Long.MAX_VALUE;
	        if (unsigned && value >= TWO_PWR_64_DBL)
	            return Long.MAX_UNSIGNED_VALUE;
	        if (value < 0)
	            return Long.fromNumber(-value, unsigned).negate();
	        return new Long((value % TWO_PWR_32_DBL) | 0, (value / TWO_PWR_32_DBL) | 0, unsigned);
	    };

	    /**
	     * Returns a Long representing the 64 bit integer that comes by concatenating the given low and high bits. Each is
	     *  assumed to use 32 bits.
	     * @param {number} lowBits The low 32 bits
	     * @param {number} highBits The high 32 bits
	     * @param {boolean=} unsigned Whether unsigned or not, defaults to `false` for signed
	     * @returns {!Long} The corresponding Long value
	     * @expose
	     */
	    Long.fromBits = function fromBits(lowBits, highBits, unsigned) {
	        return new Long(lowBits, highBits, unsigned);
	    };

	    /**
	     * Returns a Long representation of the given string, written using the specified radix.
	     * @param {string} str The textual representation of the Long
	     * @param {(boolean|number)=} unsigned Whether unsigned or not, defaults to `false` for signed
	     * @param {number=} radix The radix in which the text is written (2-36), defaults to 10
	     * @returns {!Long} The corresponding Long value
	     * @expose
	     */
	    Long.fromString = function fromString(str, unsigned, radix) {
	        if (str.length === 0)
	            throw Error('number format error: empty string');
	        if (str === "NaN" || str === "Infinity" || str === "+Infinity" || str === "-Infinity")
	            return Long.ZERO;
	        if (typeof unsigned === 'number') // For goog.math.long compatibility
	            radix = unsigned,
	            unsigned = false;
	        radix = radix || 10;
	        if (radix < 2 || 36 < radix)
	            throw Error('radix out of range: ' + radix);

	        var p;
	        if ((p = str.indexOf('-')) > 0)
	            throw Error('number format error: interior "-" character: ' + str);
	        else if (p === 0)
	            return Long.fromString(str.substring(1), unsigned, radix).negate();

	        // Do several (8) digits each time through the loop, so as to
	        // minimize the calls to the very expensive emulated div.
	        var radixToPower = Long.fromNumber(Math.pow(radix, 8));

	        var result = Long.ZERO;
	        for (var i = 0; i < str.length; i += 8) {
	            var size = Math.min(8, str.length - i);
	            var value = parseInt(str.substring(i, i + size), radix);
	            if (size < 8) {
	                var power = Long.fromNumber(Math.pow(radix, size));
	                result = result.multiply(power).add(Long.fromNumber(value));
	            } else {
	                result = result.multiply(radixToPower);
	                result = result.add(Long.fromNumber(value));
	            }
	        }
	        result.unsigned = unsigned;
	        return result;
	    };

	    /**
	     * Converts the specified value to a Long.
	     * @param {!Long|number|string|!{low: number, high: number, unsigned: boolean}} val Value
	     * @returns {!Long}
	     * @expose
	     */
	    Long.fromValue = function fromValue(val) {
	        if (val /* is compatible */ instanceof Long)
	            return val;
	        if (typeof val === 'number')
	            return Long.fromNumber(val);
	        if (typeof val === 'string')
	            return Long.fromString(val);
	        // Throws for non-objects, converts non-instanceof Long:
	        return new Long(val.low, val.high, val.unsigned);
	    };

	    // NOTE: the compiler should inline these constant values below and then remove these variables, so there should be
	    // no runtime penalty for these.

	    /**
	     * @type {number}
	     * @const
	     * @inner
	     */
	    var TWO_PWR_16_DBL = 1 << 16;

	    /**
	     * @type {number}
	     * @const
	     * @inner
	     */
	    var TWO_PWR_24_DBL = 1 << 24;

	    /**
	     * @type {number}
	     * @const
	     * @inner
	     */
	    var TWO_PWR_32_DBL = TWO_PWR_16_DBL * TWO_PWR_16_DBL;

	    /**
	     * @type {number}
	     * @const
	     * @inner
	     */
	    var TWO_PWR_64_DBL = TWO_PWR_32_DBL * TWO_PWR_32_DBL;

	    /**
	     * @type {number}
	     * @const
	     * @inner
	     */
	    var TWO_PWR_63_DBL = TWO_PWR_64_DBL / 2;

	    /**
	     * @type {!Long}
	     * @const
	     * @inner
	     */
	    var TWO_PWR_24 = Long.fromInt(TWO_PWR_24_DBL);

	    /**
	     * Signed zero.
	     * @type {!Long}
	     * @expose
	     */
	    Long.ZERO = Long.fromInt(0);

	    /**
	     * Unsigned zero.
	     * @type {!Long}
	     * @expose
	     */
	    Long.UZERO = Long.fromInt(0, true);

	    /**
	     * Signed one.
	     * @type {!Long}
	     * @expose
	     */
	    Long.ONE = Long.fromInt(1);

	    /**
	     * Unsigned one.
	     * @type {!Long}
	     * @expose
	     */
	    Long.UONE = Long.fromInt(1, true);

	    /**
	     * Signed negative one.
	     * @type {!Long}
	     * @expose
	     */
	    Long.NEG_ONE = Long.fromInt(-1);

	    /**
	     * Maximum signed value.
	     * @type {!Long}
	     * @expose
	     */
	    Long.MAX_VALUE = Long.fromBits(0xFFFFFFFF|0, 0x7FFFFFFF|0, false);

	    /**
	     * Maximum unsigned value.
	     * @type {!Long}
	     * @expose
	     */
	    Long.MAX_UNSIGNED_VALUE = Long.fromBits(0xFFFFFFFF|0, 0xFFFFFFFF|0, true);

	    /**
	     * Minimum signed value.
	     * @type {!Long}
	     * @expose
	     */
	    Long.MIN_VALUE = Long.fromBits(0, 0x80000000|0, false);

	    /**
	     * Converts the Long to a 32 bit integer, assuming it is a 32 bit integer.
	     * @returns {number}
	     * @expose
	     */
	    Long.prototype.toInt = function toInt() {
	        return this.unsigned ? this.low >>> 0 : this.low;
	    };

	    /**
	     * Converts the Long to a the nearest floating-point representation of this value (double, 53 bit mantissa).
	     * @returns {number}
	     * @expose
	     */
	    Long.prototype.toNumber = function toNumber() {
	        if (this.unsigned) {
	            return ((this.high >>> 0) * TWO_PWR_32_DBL) + (this.low >>> 0);
	        }
	        return this.high * TWO_PWR_32_DBL + (this.low >>> 0);
	    };

	    /**
	     * Converts the Long to a string written in the specified radix.
	     * @param {number=} radix Radix (2-36), defaults to 10
	     * @returns {string}
	     * @override
	     * @throws {RangeError} If `radix` is out of range
	     * @expose
	     */
	    Long.prototype.toString = function toString(radix) {
	        radix = radix || 10;
	        if (radix < 2 || 36 < radix)
	            throw RangeError('radix out of range: ' + radix);
	        if (this.isZero())
	            return '0';
	        var rem;
	        if (this.isNegative()) { // Unsigned Longs are never negative
	            if (this.equals(Long.MIN_VALUE)) {
	                // We need to change the Long value before it can be negated, so we remove
	                // the bottom-most digit in this base and then recurse to do the rest.
	                var radixLong = Long.fromNumber(radix);
	                var div = this.divide(radixLong);
	                rem = div.multiply(radixLong).subtract(this);
	                return div.toString(radix) + rem.toInt().toString(radix);
	            } else
	                return '-' + this.negate().toString(radix);
	        }

	        // Do several (6) digits each time through the loop, so as to
	        // minimize the calls to the very expensive emulated div.
	        var radixToPower = Long.fromNumber(Math.pow(radix, 6), this.unsigned);
	        rem = this;
	        var result = '';
	        while (true) {
	            var remDiv = rem.divide(radixToPower),
	                intval = rem.subtract(remDiv.multiply(radixToPower)).toInt() >>> 0,
	                digits = intval.toString(radix);
	            rem = remDiv;
	            if (rem.isZero())
	                return digits + result;
	            else {
	                while (digits.length < 6)
	                    digits = '0' + digits;
	                result = '' + digits + result;
	            }
	        }
	    };

	    /**
	     * Gets the high 32 bits as a signed integer.
	     * @returns {number} Signed high bits
	     * @expose
	     */
	    Long.prototype.getHighBits = function getHighBits() {
	        return this.high;
	    };

	    /**
	     * Gets the high 32 bits as an unsigned integer.
	     * @returns {number} Unsigned high bits
	     * @expose
	     */
	    Long.prototype.getHighBitsUnsigned = function getHighBitsUnsigned() {
	        return this.high >>> 0;
	    };

	    /**
	     * Gets the low 32 bits as a signed integer.
	     * @returns {number} Signed low bits
	     * @expose
	     */
	    Long.prototype.getLowBits = function getLowBits() {
	        return this.low;
	    };

	    /**
	     * Gets the low 32 bits as an unsigned integer.
	     * @returns {number} Unsigned low bits
	     * @expose
	     */
	    Long.prototype.getLowBitsUnsigned = function getLowBitsUnsigned() {
	        return this.low >>> 0;
	    };

	    /**
	     * Gets the number of bits needed to represent the absolute value of this Long.
	     * @returns {number}
	     * @expose
	     */
	    Long.prototype.getNumBitsAbs = function getNumBitsAbs() {
	        if (this.isNegative()) // Unsigned Longs are never negative
	            return this.equals(Long.MIN_VALUE) ? 64 : this.negate().getNumBitsAbs();
	        var val = this.high != 0 ? this.high : this.low;
	        for (var bit = 31; bit > 0; bit--)
	            if ((val & (1 << bit)) != 0)
	                break;
	        return this.high != 0 ? bit + 33 : bit + 1;
	    };

	    /**
	     * Tests if this Long's value equals zero.
	     * @returns {boolean}
	     * @expose
	     */
	    Long.prototype.isZero = function isZero() {
	        return this.high === 0 && this.low === 0;
	    };

	    /**
	     * Tests if this Long's value is negative.
	     * @returns {boolean}
	     * @expose
	     */
	    Long.prototype.isNegative = function isNegative() {
	        return !this.unsigned && this.high < 0;
	    };

	    /**
	     * Tests if this Long's value is positive.
	     * @returns {boolean}
	     * @expose
	     */
	    Long.prototype.isPositive = function isPositive() {
	        return this.unsigned || this.high >= 0;
	    };

	    /**
	     * Tests if this Long's value is odd.
	     * @returns {boolean}
	     * @expose
	     */
	    Long.prototype.isOdd = function isOdd() {
	        return (this.low & 1) === 1;
	    };

	    /**
	     * Tests if this Long's value is even.
	     * @returns {boolean}
	     * @expose
	     */
	    Long.prototype.isEven = function isEven() {
	        return (this.low & 1) === 0;
	    };

	    /**
	     * Tests if this Long's value equals the specified's.
	     * @param {!Long|number|string} other Other value
	     * @returns {boolean}
	     * @expose
	     */
	    Long.prototype.equals = function equals(other) {
	        if (!Long.isLong(other))
	            other = Long.fromValue(other);
	        if (this.unsigned !== other.unsigned && (this.high >>> 31) === 1 && (other.high >>> 31) === 1)
	            return false;
	        return this.high === other.high && this.low === other.low;
	    };

	    /**
	     * Tests if this Long's value equals the specified's. This is an alias of {@link Long#equals}.
	     * @function
	     * @param {!Long|number|string} other Other value
	     * @returns {boolean}
	     * @expose
	     */
	    Long.eq = Long.prototype.equals;

	    /**
	     * Tests if this Long's value differs from the specified's.
	     * @param {!Long|number|string} other Other value
	     * @returns {boolean}
	     * @expose
	     */
	    Long.prototype.notEquals = function notEquals(other) {
	        return !this.equals(/* validates */ other);
	    };

	    /**
	     * Tests if this Long's value differs from the specified's. This is an alias of {@link Long#notEquals}.
	     * @function
	     * @param {!Long|number|string} other Other value
	     * @returns {boolean}
	     * @expose
	     */
	    Long.neq = Long.prototype.notEquals;

	    /**
	     * Tests if this Long's value is less than the specified's.
	     * @param {!Long|number|string} other Other value
	     * @returns {boolean}
	     * @expose
	     */
	    Long.prototype.lessThan = function lessThan(other) {
	        return this.compare(/* validates */ other) < 0;
	    };

	    /**
	     * Tests if this Long's value is less than the specified's. This is an alias of {@link Long#lessThan}.
	     * @function
	     * @param {!Long|number|string} other Other value
	     * @returns {boolean}
	     * @expose
	     */
	    Long.prototype.lt = Long.prototype.lessThan;

	    /**
	     * Tests if this Long's value is less than or equal the specified's.
	     * @param {!Long|number|string} other Other value
	     * @returns {boolean}
	     * @expose
	     */
	    Long.prototype.lessThanOrEqual = function lessThanOrEqual(other) {
	        return this.compare(/* validates */ other) <= 0;
	    };

	    /**
	     * Tests if this Long's value is less than or equal the specified's. This is an alias of {@link Long#lessThanOrEqual}.
	     * @function
	     * @param {!Long|number|string} other Other value
	     * @returns {boolean}
	     * @expose
	     */
	    Long.prototype.lte = Long.prototype.lessThanOrEqual;

	    /**
	     * Tests if this Long's value is greater than the specified's.
	     * @param {!Long|number|string} other Other value
	     * @returns {boolean}
	     * @expose
	     */
	    Long.prototype.greaterThan = function greaterThan(other) {
	        return this.compare(/* validates */ other) > 0;
	    };

	    /**
	     * Tests if this Long's value is greater than the specified's. This is an alias of {@link Long#greaterThan}.
	     * @function
	     * @param {!Long|number|string} other Other value
	     * @returns {boolean}
	     * @expose
	     */
	    Long.prototype.gt = Long.prototype.greaterThan;

	    /**
	     * Tests if this Long's value is greater than or equal the specified's.
	     * @param {!Long|number|string} other Other value
	     * @returns {boolean}
	     * @expose
	     */
	    Long.prototype.greaterThanOrEqual = function greaterThanOrEqual(other) {
	        return this.compare(/* validates */ other) >= 0;
	    };

	    /**
	     * Tests if this Long's value is greater than or equal the specified's. This is an alias of {@link Long#greaterThanOrEqual}.
	     * @function
	     * @param {!Long|number|string} other Other value
	     * @returns {boolean}
	     * @expose
	     */
	    Long.prototype.gte = Long.prototype.greaterThanOrEqual;

	    /**
	     * Compares this Long's value with the specified's.
	     * @param {!Long|number|string} other Other value
	     * @returns {number} 0 if they are the same, 1 if the this is greater and -1
	     *  if the given one is greater
	     * @expose
	     */
	    Long.prototype.compare = function compare(other) {
	        if (!Long.isLong(other))
	            other = Long.fromValue(other);
	        if (this.equals(other))
	            return 0;
	        var thisNeg = this.isNegative(),
	            otherNeg = other.isNegative();
	        if (thisNeg && !otherNeg)
	            return -1;
	        if (!thisNeg && otherNeg)
	            return 1;
	        // At this point the sign bits are the same
	        if (!this.unsigned)
	            return this.subtract(other).isNegative() ? -1 : 1;
	        // Both are positive if at least one is unsigned
	        return (other.high >>> 0) > (this.high >>> 0) || (other.high === this.high && (other.low >>> 0) > (this.low >>> 0)) ? -1 : 1;
	    };

	    /**
	     * Negates this Long's value.
	     * @returns {!Long} Negated Long
	     * @expose
	     */
	    Long.prototype.negate = function negate() {
	        if (!this.unsigned && this.equals(Long.MIN_VALUE))
	            return Long.MIN_VALUE;
	        return this.not().add(Long.ONE);
	    };

	    /**
	     * Negates this Long's value. This is an alias of {@link Long#negate}.
	     * @function
	     * @returns {!Long} Negated Long
	     * @expose
	     */
	    Long.prototype.neg = Long.prototype.negate;

	    /**
	     * Returns the sum of this and the specified Long.
	     * @param {!Long|number|string} addend Addend
	     * @returns {!Long} Sum
	     * @expose
	     */
	    Long.prototype.add = function add(addend) {
	        if (!Long.isLong(addend))
	            addend = Long.fromValue(addend);

	        // Divide each number into 4 chunks of 16 bits, and then sum the chunks.

	        var a48 = this.high >>> 16;
	        var a32 = this.high & 0xFFFF;
	        var a16 = this.low >>> 16;
	        var a00 = this.low & 0xFFFF;

	        var b48 = addend.high >>> 16;
	        var b32 = addend.high & 0xFFFF;
	        var b16 = addend.low >>> 16;
	        var b00 = addend.low & 0xFFFF;

	        var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
	        c00 += a00 + b00;
	        c16 += c00 >>> 16;
	        c00 &= 0xFFFF;
	        c16 += a16 + b16;
	        c32 += c16 >>> 16;
	        c16 &= 0xFFFF;
	        c32 += a32 + b32;
	        c48 += c32 >>> 16;
	        c32 &= 0xFFFF;
	        c48 += a48 + b48;
	        c48 &= 0xFFFF;
	        return Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32, this.unsigned);
	    };

	    /**
	     * Returns the difference of this and the specified Long.
	     * @param {!Long|number|string} subtrahend Subtrahend
	     * @returns {!Long} Difference
	     * @expose
	     */
	    Long.prototype.subtract = function subtract(subtrahend) {
	        if (!Long.isLong(subtrahend))
	            subtrahend = Long.fromValue(subtrahend);
	        return this.add(subtrahend.negate());
	    };

	    /**
	     * Returns the difference of this and the specified Long. This is an alias of {@link Long#subtract}.
	     * @function
	     * @param {!Long|number|string} subtrahend Subtrahend
	     * @returns {!Long} Difference
	     * @expose
	     */
	    Long.prototype.sub = Long.prototype.subtract;

	    /**
	     * Returns the product of this and the specified Long.
	     * @param {!Long|number|string} multiplier Multiplier
	     * @returns {!Long} Product
	     * @expose
	     */
	    Long.prototype.multiply = function multiply(multiplier) {
	        if (this.isZero())
	            return Long.ZERO;
	        if (!Long.isLong(multiplier))
	            multiplier = Long.fromValue(multiplier);
	        if (multiplier.isZero())
	            return Long.ZERO;
	        if (this.equals(Long.MIN_VALUE))
	            return multiplier.isOdd() ? Long.MIN_VALUE : Long.ZERO;
	        if (multiplier.equals(Long.MIN_VALUE))
	            return this.isOdd() ? Long.MIN_VALUE : Long.ZERO;

	        if (this.isNegative()) {
	            if (multiplier.isNegative())
	                return this.negate().multiply(multiplier.negate());
	            else
	                return this.negate().multiply(multiplier).negate();
	        } else if (multiplier.isNegative())
	            return this.multiply(multiplier.negate()).negate();

	        // If both longs are small, use float multiplication
	        if (this.lessThan(TWO_PWR_24) && multiplier.lessThan(TWO_PWR_24))
	            return Long.fromNumber(this.toNumber() * multiplier.toNumber(), this.unsigned);

	        // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
	        // We can skip products that would overflow.

	        var a48 = this.high >>> 16;
	        var a32 = this.high & 0xFFFF;
	        var a16 = this.low >>> 16;
	        var a00 = this.low & 0xFFFF;

	        var b48 = multiplier.high >>> 16;
	        var b32 = multiplier.high & 0xFFFF;
	        var b16 = multiplier.low >>> 16;
	        var b00 = multiplier.low & 0xFFFF;

	        var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
	        c00 += a00 * b00;
	        c16 += c00 >>> 16;
	        c00 &= 0xFFFF;
	        c16 += a16 * b00;
	        c32 += c16 >>> 16;
	        c16 &= 0xFFFF;
	        c16 += a00 * b16;
	        c32 += c16 >>> 16;
	        c16 &= 0xFFFF;
	        c32 += a32 * b00;
	        c48 += c32 >>> 16;
	        c32 &= 0xFFFF;
	        c32 += a16 * b16;
	        c48 += c32 >>> 16;
	        c32 &= 0xFFFF;
	        c32 += a00 * b32;
	        c48 += c32 >>> 16;
	        c32 &= 0xFFFF;
	        c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
	        c48 &= 0xFFFF;
	        return Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32, this.unsigned);
	    };

	    /**
	     * Returns the product of this and the specified Long. This is an alias of {@link Long#multiply}.
	     * @function
	     * @param {!Long|number|string} multiplier Multiplier
	     * @returns {!Long} Product
	     * @expose
	     */
	    Long.prototype.mul = Long.prototype.multiply;

	    /**
	     * Returns this Long divided by the specified.
	     * @param {!Long|number|string} divisor Divisor
	     * @returns {!Long} Quotient
	     * @expose
	     */
	    Long.prototype.divide = function divide(divisor) {
	        if (!Long.isLong(divisor))
	            divisor = Long.fromValue(divisor);
	        if (divisor.isZero())
	            throw(new Error('division by zero'));
	        if (this.isZero())
	            return this.unsigned ? Long.UZERO : Long.ZERO;
	        var approx, rem, res;
	        if (this.equals(Long.MIN_VALUE)) {
	            if (divisor.equals(Long.ONE) || divisor.equals(Long.NEG_ONE))
	                return Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
	            else if (divisor.equals(Long.MIN_VALUE))
	                return Long.ONE;
	            else {
	                // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
	                var halfThis = this.shiftRight(1);
	                approx = halfThis.divide(divisor).shiftLeft(1);
	                if (approx.equals(Long.ZERO)) {
	                    return divisor.isNegative() ? Long.ONE : Long.NEG_ONE;
	                } else {
	                    rem = this.subtract(divisor.multiply(approx));
	                    res = approx.add(rem.divide(divisor));
	                    return res;
	                }
	            }
	        } else if (divisor.equals(Long.MIN_VALUE))
	            return this.unsigned ? Long.UZERO : Long.ZERO;
	        if (this.isNegative()) {
	            if (divisor.isNegative())
	                return this.negate().divide(divisor.negate());
	            return this.negate().divide(divisor).negate();
	        } else if (divisor.isNegative())
	            return this.divide(divisor.negate()).negate();

	        // Repeat the following until the remainder is less than other:  find a
	        // floating-point that approximates remainder / other *from below*, add this
	        // into the result, and subtract it from the remainder.  It is critical that
	        // the approximate value is less than or equal to the real value so that the
	        // remainder never becomes negative.
	        res = Long.ZERO;
	        rem = this;
	        while (rem.greaterThanOrEqual(divisor)) {
	            // Approximate the result of division. This may be a little greater or
	            // smaller than the actual value.
	            approx = Math.max(1, Math.floor(rem.toNumber() / divisor.toNumber()));

	            // We will tweak the approximate result by changing it in the 48-th digit or
	            // the smallest non-fractional digit, whichever is larger.
	            var log2 = Math.ceil(Math.log(approx) / Math.LN2),
	                delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48),

	            // Decrease the approximation until it is smaller than the remainder.  Note
	            // that if it is too large, the product overflows and is negative.
	                approxRes = Long.fromNumber(approx),
	                approxRem = approxRes.multiply(divisor);
	            while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
	                approx -= delta;
	                approxRes = Long.fromNumber(approx, this.unsigned);
	                approxRem = approxRes.multiply(divisor);
	            }

	            // We know the answer can't be zero... and actually, zero would cause
	            // infinite recursion since we would make no progress.
	            if (approxRes.isZero())
	                approxRes = Long.ONE;

	            res = res.add(approxRes);
	            rem = rem.subtract(approxRem);
	        }
	        return res;
	    };

	    /**
	     * Returns this Long divided by the specified. This is an alias of {@link Long#divide}.
	     * @function
	     * @param {!Long|number|string} divisor Divisor
	     * @returns {!Long} Quotient
	     * @expose
	     */
	    Long.prototype.div = Long.prototype.divide;

	    /**
	     * Returns this Long modulo the specified.
	     * @param {!Long|number|string} divisor Divisor
	     * @returns {!Long} Remainder
	     * @expose
	     */
	    Long.prototype.modulo = function modulo(divisor) {
	        if (!Long.isLong(divisor))
	            divisor = Long.fromValue(divisor);
	        return this.subtract(this.divide(divisor).multiply(divisor));
	    };

	    /**
	     * Returns this Long modulo the specified. This is an alias of {@link Long#modulo}.
	     * @function
	     * @param {!Long|number|string} divisor Divisor
	     * @returns {!Long} Remainder
	     * @expose
	     */
	    Long.prototype.mod = Long.prototype.modulo;

	    /**
	     * Returns the bitwise NOT of this Long.
	     * @returns {!Long}
	     * @expose
	     */
	    Long.prototype.not = function not() {
	        return Long.fromBits(~this.low, ~this.high, this.unsigned);
	    };

	    /**
	     * Returns the bitwise AND of this Long and the specified.
	     * @param {!Long|number|string} other Other Long
	     * @returns {!Long}
	     * @expose
	     */
	    Long.prototype.and = function and(other) {
	        if (!Long.isLong(other))
	            other = Long.fromValue(other);
	        return Long.fromBits(this.low & other.low, this.high & other.high, this.unsigned);
	    };

	    /**
	     * Returns the bitwise OR of this Long and the specified.
	     * @param {!Long|number|string} other Other Long
	     * @returns {!Long}
	     * @expose
	     */
	    Long.prototype.or = function or(other) {
	        if (!Long.isLong(other))
	            other = Long.fromValue(other);
	        return Long.fromBits(this.low | other.low, this.high | other.high, this.unsigned);
	    };

	    /**
	     * Returns the bitwise XOR of this Long and the given one.
	     * @param {!Long|number|string} other Other Long
	     * @returns {!Long}
	     * @expose
	     */
	    Long.prototype.xor = function xor(other) {
	        if (!Long.isLong(other))
	            other = Long.fromValue(other);
	        return Long.fromBits(this.low ^ other.low, this.high ^ other.high, this.unsigned);
	    };

	    /**
	     * Returns this Long with bits shifted to the left by the given amount.
	     * @param {number|!Long} numBits Number of bits
	     * @returns {!Long} Shifted Long
	     * @expose
	     */
	    Long.prototype.shiftLeft = function shiftLeft(numBits) {
	        if (Long.isLong(numBits))
	            numBits = numBits.toInt();
	        if ((numBits &= 63) === 0)
	            return this;
	        else if (numBits < 32)
	            return Long.fromBits(this.low << numBits, (this.high << numBits) | (this.low >>> (32 - numBits)), this.unsigned);
	        else
	            return Long.fromBits(0, this.low << (numBits - 32), this.unsigned);
	    };

	    /**
	     * Returns this Long with bits shifted to the left by the given amount. This is an alias of {@link Long#shiftLeft}.
	     * @function
	     * @param {number|!Long} numBits Number of bits
	     * @returns {!Long} Shifted Long
	     * @expose
	     */
	    Long.prototype.shl = Long.prototype.shiftLeft;

	    /**
	     * Returns this Long with bits arithmetically shifted to the right by the given amount.
	     * @param {number|!Long} numBits Number of bits
	     * @returns {!Long} Shifted Long
	     * @expose
	     */
	    Long.prototype.shiftRight = function shiftRight(numBits) {
	        if (Long.isLong(numBits))
	            numBits = numBits.toInt();
	        if ((numBits &= 63) === 0)
	            return this;
	        else if (numBits < 32)
	            return Long.fromBits((this.low >>> numBits) | (this.high << (32 - numBits)), this.high >> numBits, this.unsigned);
	        else
	            return Long.fromBits(this.high >> (numBits - 32), this.high >= 0 ? 0 : -1, this.unsigned);
	    };

	    /**
	     * Returns this Long with bits arithmetically shifted to the right by the given amount. This is an alias of {@link Long#shiftRight}.
	     * @function
	     * @param {number|!Long} numBits Number of bits
	     * @returns {!Long} Shifted Long
	     * @expose
	     */
	    Long.prototype.shr = Long.prototype.shiftRight;

	    /**
	     * Returns this Long with bits logically shifted to the right by the given amount.
	     * @param {number|!Long} numBits Number of bits
	     * @returns {!Long} Shifted Long
	     * @expose
	     */
	    Long.prototype.shiftRightUnsigned = function shiftRightUnsigned(numBits) {
	        if (Long.isLong(numBits))
	            numBits = numBits.toInt();
	        numBits &= 63;
	        if (numBits === 0)
	            return this;
	        else {
	            var high = this.high;
	            if (numBits < 32) {
	                var low = this.low;
	                return Long.fromBits((low >>> numBits) | (high << (32 - numBits)), high >>> numBits, this.unsigned);
	            } else if (numBits === 32)
	                return Long.fromBits(high, 0, this.unsigned);
	            else
	                return Long.fromBits(high >>> (numBits - 32), 0, this.unsigned);
	        }
	    };

	    /**
	     * Returns this Long with bits logically shifted to the right by the given amount. This is an alias of {@link Long#shiftRightUnsigned}.
	     * @function
	     * @param {number|!Long} numBits Number of bits
	     * @returns {!Long} Shifted Long
	     * @expose
	     */
	    Long.prototype.shru = Long.prototype.shiftRightUnsigned;

	    /**
	     * Converts this Long to signed.
	     * @returns {!Long} Signed long
	     * @expose
	     */
	    Long.prototype.toSigned = function toSigned() {
	        if (!this.unsigned)
	            return this;
	        return new Long(this.low, this.high, false);
	    };

	    /**
	     * Converts this Long to unsigned.
	     * @returns {!Long} Unsigned long
	     * @expose
	     */
	    Long.prototype.toUnsigned = function toUnsigned() {
	        if (this.unsigned)
	            return this;
	        return new Long(this.low, this.high, true);
	    };

	    return Long;
	});

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)(module)))

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(module) {/*
	 Copyright 2013-2014 Daniel Wirtz <dcode@dcode.io>

	 Licensed under the Apache License, Version 2.0 (the "License");
	 you may not use this file except in compliance with the License.
	 You may obtain a copy of the License at

	 http://www.apache.org/licenses/LICENSE-2.0

	 Unless required by applicable law or agreed to in writing, software
	 distributed under the License is distributed on an "AS IS" BASIS,
	 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 See the License for the specific language governing permissions and
	 limitations under the License.
	 */

	/**
	 * @license ByteBuffer.js (c) 2013-2014 Daniel Wirtz <dcode@dcode.io>
	 * This version of ByteBuffer.js uses an ArrayBuffer as its backing buffer which is accessed through a DataView and is
	 * compatible with modern browsers.
	 * Released under the Apache License, Version 2.0
	 * see: https://github.com/dcodeIO/ByteBuffer.js for details
	 */ //
	(function(global) {
	    "use strict";

	    /**
	     * @param {function(new: Long, number, number, boolean=)=} Long
	     * @returns {function(new: ByteBuffer, number=, boolean=, boolean=)}}
	     * @inner
	     */
	    function loadByteBuffer(Long) {

	        /**
	         * Constructs a new ByteBuffer.
	         * @class The swiss army knife for binary data in JavaScript.
	         * @exports ByteBuffer
	         * @constructor
	         * @param {number=} capacity Initial capacity. Defaults to {@link ByteBuffer.DEFAULT_CAPACITY}.
	         * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
	         *  {@link ByteBuffer.DEFAULT_ENDIAN}.
	         * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
	         *  {@link ByteBuffer.DEFAULT_NOASSERT}.
	         * @expose
	         */
	        var ByteBuffer = function(capacity, littleEndian, noAssert) {
	            if (typeof capacity     === 'undefined') capacity     = ByteBuffer.DEFAULT_CAPACITY;
	            if (typeof littleEndian === 'undefined') littleEndian = ByteBuffer.DEFAULT_ENDIAN;
	            if (typeof noAssert     === 'undefined') noAssert     = ByteBuffer.DEFAULT_NOASSERT;
	            if (!noAssert) {
	                capacity = capacity | 0;
	                if (capacity < 0)
	                    throw RangeError("Illegal capacity");
	                littleEndian = !!littleEndian;
	                noAssert = !!noAssert;
	            }

	            /**
	             * Backing buffer.
	             * @type {!ArrayBuffer}
	             * @expose
	             */
	            this.buffer = capacity === 0 ? EMPTY_BUFFER : new ArrayBuffer(capacity);

	            /**
	             * Data view to manipulate the backing buffer. Becomes `null` if the backing buffer has a capacity of `0`.
	             * @type {?DataView}
	             * @expose
	             */
	            this.view = capacity === 0 ? null : new DataView(this.buffer);

	            /**
	             * Absolute read/write offset.
	             * @type {number}
	             * @expose
	             * @see ByteBuffer#flip
	             * @see ByteBuffer#clear
	             */
	            this.offset = 0;

	            /**
	             * Marked offset.
	             * @type {number}
	             * @expose
	             * @see ByteBuffer#mark
	             * @see ByteBuffer#reset
	             */
	            this.markedOffset = -1;

	            /**
	             * Absolute limit of the contained data. Set to the backing buffer's capacity upon allocation.
	             * @type {number}
	             * @expose
	             * @see ByteBuffer#flip
	             * @see ByteBuffer#clear
	             */
	            this.limit = capacity;

	            /**
	             * Whether to use little endian byte order, defaults to `false` for big endian.
	             * @type {boolean}
	             * @expose
	             */
	            this.littleEndian = typeof littleEndian !== 'undefined' ? !!littleEndian : false;

	            /**
	             * Whether to skip assertions of offsets and values, defaults to `false`.
	             * @type {boolean}
	             * @expose
	             */
	            this.noAssert = !!noAssert;
	        };

	        /**
	         * ByteBuffer version.
	         * @type {string}
	         * @const
	         * @expose
	         */
	        ByteBuffer.VERSION = "3.5.5";

	        /**
	         * Little endian constant that can be used instead of its boolean value. Evaluates to `true`.
	         * @type {boolean}
	         * @const
	         * @expose
	         */
	        ByteBuffer.LITTLE_ENDIAN = true;

	        /**
	         * Big endian constant that can be used instead of its boolean value. Evaluates to `false`.
	         * @type {boolean}
	         * @const
	         * @expose
	         */
	        ByteBuffer.BIG_ENDIAN = false;

	        /**
	         * Default initial capacity of `16`.
	         * @type {number}
	         * @expose
	         */
	        ByteBuffer.DEFAULT_CAPACITY = 16;

	        /**
	         * Default endianess of `false` for big endian.
	         * @type {boolean}
	         * @expose
	         */
	        ByteBuffer.DEFAULT_ENDIAN = ByteBuffer.BIG_ENDIAN;

	        /**
	         * Default no assertions flag of `false`.
	         * @type {boolean}
	         * @expose
	         */
	        ByteBuffer.DEFAULT_NOASSERT = false;

	        /**
	         * A `Long` class for representing a 64-bit two's-complement integer value. May be `null` if Long.js has not been loaded
	         *  and int64 support is not available.
	         * @type {?Long}
	         * @const
	         * @see https://github.com/dcodeIO/Long.js
	         * @expose
	         */
	        ByteBuffer.Long = Long || null;

	        /**
	         * @alias ByteBuffer.prototype
	         * @inner
	         */
	        var ByteBufferPrototype = ByteBuffer.prototype;

	        // helpers

	        /**
	         * @type {!ArrayBuffer}
	         * @inner
	         */
	        var EMPTY_BUFFER = new ArrayBuffer(0);

	        /**
	         * String.fromCharCode reference for compile-time renaming.
	         * @type {function(...number):string}
	         * @inner
	         */
	        var stringFromCharCode = String.fromCharCode;

	        /**
	         * Creates a source function for a string.
	         * @param {string} s String to read from
	         * @returns {function():number|null} Source function returning the next char code respectively `null` if there are
	         *  no more characters left.
	         * @throws {TypeError} If the argument is invalid
	         * @inner
	         */
	        function stringSource(s) {
	            var i=0; return function() {
	                return i < s.length ? s.charCodeAt(i++) : null;
	            };
	        }

	        /**
	         * Creates a destination function for a string.
	         * @returns {function(number=):undefined|string} Destination function successively called with the next char code.
	         *  Returns the final string when called without arguments.
	         * @inner
	         */
	        function stringDestination() {
	            var cs = [], ps = []; return function() {
	                if (arguments.length === 0)
	                    return ps.join('')+stringFromCharCode.apply(String, cs);
	                if (cs.length + arguments.length > 1024)
	                    ps.push(stringFromCharCode.apply(String, cs)),
	                        cs.length = 0;
	                Array.prototype.push.apply(cs, arguments);
	            };
	        }

	        /**
	         * Allocates a new ByteBuffer backed by a buffer of the specified capacity.
	         * @param {number=} capacity Initial capacity. Defaults to {@link ByteBuffer.DEFAULT_CAPACITY}.
	         * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
	         *  {@link ByteBuffer.DEFAULT_ENDIAN}.
	         * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
	         *  {@link ByteBuffer.DEFAULT_NOASSERT}.
	         * @returns {!ByteBuffer}
	         * @expose
	         */
	        ByteBuffer.allocate = function(capacity, littleEndian, noAssert) {
	            return new ByteBuffer(capacity, littleEndian, noAssert);
	        };

	        /**
	         * Concatenates multiple ByteBuffers into one.
	         * @param {!Array.<!ByteBuffer|!ArrayBuffer|!Uint8Array|string>} buffers Buffers to concatenate
	         * @param {(string|boolean)=} encoding String encoding if `buffers` contains a string ("base64", "hex", "binary",
	         *  defaults to "utf8")
	         * @param {boolean=} littleEndian Whether to use little or big endian byte order for the resulting ByteBuffer. Defaults
	         *  to {@link ByteBuffer.DEFAULT_ENDIAN}.
	         * @param {boolean=} noAssert Whether to skip assertions of offsets and values for the resulting ByteBuffer. Defaults to
	         *  {@link ByteBuffer.DEFAULT_NOASSERT}.
	         * @returns {!ByteBuffer} Concatenated ByteBuffer
	         * @expose
	         */
	        ByteBuffer.concat = function(buffers, encoding, littleEndian, noAssert) {
	            if (typeof encoding === 'boolean' || typeof encoding !== 'string') {
	                noAssert = littleEndian;
	                littleEndian = encoding;
	                encoding = undefined;
	            }
	            var capacity = 0;
	            for (var i=0, k=buffers.length, length; i<k; ++i) {
	                if (!ByteBuffer.isByteBuffer(buffers[i]))
	                    buffers[i] = ByteBuffer.wrap(buffers[i], encoding);
	                length = buffers[i].limit - buffers[i].offset;
	                if (length > 0) capacity += length;
	            }
	            if (capacity === 0)
	                return new ByteBuffer(0, littleEndian, noAssert);
	            var bb = new ByteBuffer(capacity, littleEndian, noAssert),
	                bi;
	            var view = new Uint8Array(bb.buffer);
	            i=0; while (i<k) {
	                bi = buffers[i++];
	                length = bi.limit - bi.offset;
	                if (length <= 0) continue;
	                view.set(new Uint8Array(bi.buffer).subarray(bi.offset, bi.limit), bb.offset);
	                bb.offset += length;
	            }
	            bb.limit = bb.offset;
	            bb.offset = 0;
	            return bb;
	        };

	        /**
	         * Tests if the specified type is a ByteBuffer.
	         * @param {*} bb ByteBuffer to test
	         * @returns {boolean} `true` if it is a ByteBuffer, otherwise `false`
	         * @expose
	         */
	        ByteBuffer.isByteBuffer = function(bb) {
	            return (bb && bb instanceof ByteBuffer) === true;
	        };
	        /**
	         * Gets the backing buffer type.
	         * @returns {Function} `Buffer` for NB builds, `ArrayBuffer` for AB builds (classes)
	         * @expose
	         */
	        ByteBuffer.type = function() {
	            return ArrayBuffer;
	        };

	        /**
	         * Wraps a buffer or a string. Sets the allocated ByteBuffer's {@link ByteBuffer#offset} to `0` and its
	         *  {@link ByteBuffer#limit} to the length of the wrapped data.
	         * @param {!ByteBuffer|!ArrayBuffer|!Uint8Array|string|!Array.<number>} buffer Anything that can be wrapped
	         * @param {(string|boolean)=} encoding String encoding if `buffer` is a string ("base64", "hex", "binary", defaults to
	         *  "utf8")
	         * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
	         *  {@link ByteBuffer.DEFAULT_ENDIAN}.
	         * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
	         *  {@link ByteBuffer.DEFAULT_NOASSERT}.
	         * @returns {!ByteBuffer} A ByteBuffer wrapping `buffer`
	         * @expose
	         */
	        ByteBuffer.wrap = function(buffer, encoding, littleEndian, noAssert) {
	            if (typeof encoding !== 'string') {
	                noAssert = littleEndian;
	                littleEndian = encoding;
	                encoding = undefined;
	            }
	            if (typeof buffer === 'string') {
	                if (typeof encoding === 'undefined')
	                    encoding = "utf8";
	                switch (encoding) {
	                    case "base64":
	                        return ByteBuffer.fromBase64(buffer, littleEndian);
	                    case "hex":
	                        return ByteBuffer.fromHex(buffer, littleEndian);
	                    case "binary":
	                        return ByteBuffer.fromBinary(buffer, littleEndian);
	                    case "utf8":
	                        return ByteBuffer.fromUTF8(buffer, littleEndian);
	                    case "debug":
	                        return ByteBuffer.fromDebug(buffer, littleEndian);
	                    default:
	                        throw Error("Unsupported encoding: "+encoding);
	                }
	            }
	            if (buffer === null || typeof buffer !== 'object')
	                throw TypeError("Illegal buffer");
	            var bb;
	            if (ByteBuffer.isByteBuffer(buffer)) {
	                bb = ByteBufferPrototype.clone.call(buffer);
	                bb.markedOffset = -1;
	                return bb;
	            }
	            if (buffer instanceof Uint8Array) { // Extract ArrayBuffer from Uint8Array
	                bb = new ByteBuffer(0, littleEndian, noAssert);
	                if (buffer.length > 0) { // Avoid references to more than one EMPTY_BUFFER
	                    bb.buffer = buffer.buffer;
	                    bb.offset = buffer.byteOffset;
	                    bb.limit = buffer.byteOffset + buffer.length;
	                    bb.view = buffer.length > 0 ? new DataView(buffer.buffer) : null;
	                }
	            } else if (buffer instanceof ArrayBuffer) { // Reuse ArrayBuffer
	                bb = new ByteBuffer(0, littleEndian, noAssert);
	                if (buffer.byteLength > 0) {
	                    bb.buffer = buffer;
	                    bb.offset = 0;
	                    bb.limit = buffer.byteLength;
	                    bb.view = buffer.byteLength > 0 ? new DataView(buffer) : null;
	                }
	            } else if (Object.prototype.toString.call(buffer) === "[object Array]") { // Create from octets
	                bb = new ByteBuffer(buffer.length, littleEndian, noAssert);
	                bb.limit = buffer.length;
	                for (i=0; i<buffer.length; ++i)
	                    bb.view.setUint8(i, buffer[i]);
	            } else
	                throw TypeError("Illegal buffer"); // Otherwise fail
	            return bb;
	        };

	        // types/ints/int8

	        /**
	         * Writes an 8bit signed integer.
	         * @param {number} value Value to write
	         * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.writeInt8 = function(value, offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof value !== 'number' || value % 1 !== 0)
	                    throw TypeError("Illegal value: "+value+" (not an integer)");
	                value |= 0;
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	            }
	            offset += 1;
	            var capacity0 = this.buffer.byteLength;
	            if (offset > capacity0)
	                this.resize((capacity0 *= 2) > offset ? capacity0 : offset);
	            offset -= 1;
	            this.view.setInt8(offset, value);
	            if (relative) this.offset += 1;
	            return this;
	        };

	        /**
	         * Writes an 8bit signed integer. This is an alias of {@link ByteBuffer#writeInt8}.
	         * @function
	         * @param {number} value Value to write
	         * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.writeByte = ByteBufferPrototype.writeInt8;

	        /**
	         * Reads an 8bit signed integer.
	         * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
	         * @returns {number} Value read
	         * @expose
	         */
	        ByteBufferPrototype.readInt8 = function(offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 1 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+1+") <= "+this.buffer.byteLength);
	            }
	            var value = this.view.getInt8(offset);
	            if (relative) this.offset += 1;
	            return value;
	        };

	        /**
	         * Reads an 8bit signed integer. This is an alias of {@link ByteBuffer#readInt8}.
	         * @function
	         * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
	         * @returns {number} Value read
	         * @expose
	         */
	        ByteBufferPrototype.readByte = ByteBufferPrototype.readInt8;

	        /**
	         * Writes an 8bit unsigned integer.
	         * @param {number} value Value to write
	         * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.writeUint8 = function(value, offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof value !== 'number' || value % 1 !== 0)
	                    throw TypeError("Illegal value: "+value+" (not an integer)");
	                value >>>= 0;
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	            }
	            offset += 1;
	            var capacity1 = this.buffer.byteLength;
	            if (offset > capacity1)
	                this.resize((capacity1 *= 2) > offset ? capacity1 : offset);
	            offset -= 1;
	            this.view.setUint8(offset, value);
	            if (relative) this.offset += 1;
	            return this;
	        };

	        /**
	         * Reads an 8bit unsigned integer.
	         * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
	         * @returns {number} Value read
	         * @expose
	         */
	        ByteBufferPrototype.readUint8 = function(offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 1 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+1+") <= "+this.buffer.byteLength);
	            }
	            var value = this.view.getUint8(offset);
	            if (relative) this.offset += 1;
	            return value;
	        };

	        // types/ints/int16

	        /**
	         * Writes a 16bit signed integer.
	         * @param {number} value Value to write
	         * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
	         * @throws {TypeError} If `offset` or `value` is not a valid number
	         * @throws {RangeError} If `offset` is out of bounds
	         * @expose
	         */
	        ByteBufferPrototype.writeInt16 = function(value, offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof value !== 'number' || value % 1 !== 0)
	                    throw TypeError("Illegal value: "+value+" (not an integer)");
	                value |= 0;
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	            }
	            offset += 2;
	            var capacity2 = this.buffer.byteLength;
	            if (offset > capacity2)
	                this.resize((capacity2 *= 2) > offset ? capacity2 : offset);
	            offset -= 2;
	            this.view.setInt16(offset, value, this.littleEndian);
	            if (relative) this.offset += 2;
	            return this;
	        };

	        /**
	         * Writes a 16bit signed integer. This is an alias of {@link ByteBuffer#writeInt16}.
	         * @function
	         * @param {number} value Value to write
	         * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
	         * @throws {TypeError} If `offset` or `value` is not a valid number
	         * @throws {RangeError} If `offset` is out of bounds
	         * @expose
	         */
	        ByteBufferPrototype.writeShort = ByteBufferPrototype.writeInt16;

	        /**
	         * Reads a 16bit signed integer.
	         * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
	         * @returns {number} Value read
	         * @throws {TypeError} If `offset` is not a valid number
	         * @throws {RangeError} If `offset` is out of bounds
	         * @expose
	         */
	        ByteBufferPrototype.readInt16 = function(offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 2 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+2+") <= "+this.buffer.byteLength);
	            }
	            var value = this.view.getInt16(offset, this.littleEndian);
	            if (relative) this.offset += 2;
	            return value;
	        };

	        /**
	         * Reads a 16bit signed integer. This is an alias of {@link ByteBuffer#readInt16}.
	         * @function
	         * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
	         * @returns {number} Value read
	         * @throws {TypeError} If `offset` is not a valid number
	         * @throws {RangeError} If `offset` is out of bounds
	         * @expose
	         */
	        ByteBufferPrototype.readShort = ByteBufferPrototype.readInt16;

	        /**
	         * Writes a 16bit unsigned integer.
	         * @param {number} value Value to write
	         * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
	         * @throws {TypeError} If `offset` or `value` is not a valid number
	         * @throws {RangeError} If `offset` is out of bounds
	         * @expose
	         */
	        ByteBufferPrototype.writeUint16 = function(value, offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof value !== 'number' || value % 1 !== 0)
	                    throw TypeError("Illegal value: "+value+" (not an integer)");
	                value >>>= 0;
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	            }
	            offset += 2;
	            var capacity3 = this.buffer.byteLength;
	            if (offset > capacity3)
	                this.resize((capacity3 *= 2) > offset ? capacity3 : offset);
	            offset -= 2;
	            this.view.setUint16(offset, value, this.littleEndian);
	            if (relative) this.offset += 2;
	            return this;
	        };

	        /**
	         * Reads a 16bit unsigned integer.
	         * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
	         * @returns {number} Value read
	         * @throws {TypeError} If `offset` is not a valid number
	         * @throws {RangeError} If `offset` is out of bounds
	         * @expose
	         */
	        ByteBufferPrototype.readUint16 = function(offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 2 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+2+") <= "+this.buffer.byteLength);
	            }
	            var value = this.view.getUint16(offset, this.littleEndian);
	            if (relative) this.offset += 2;
	            return value;
	        };

	        // types/ints/int32

	        /**
	         * Writes a 32bit signed integer.
	         * @param {number} value Value to write
	         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
	         * @expose
	         */
	        ByteBufferPrototype.writeInt32 = function(value, offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof value !== 'number' || value % 1 !== 0)
	                    throw TypeError("Illegal value: "+value+" (not an integer)");
	                value |= 0;
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	            }
	            offset += 4;
	            var capacity4 = this.buffer.byteLength;
	            if (offset > capacity4)
	                this.resize((capacity4 *= 2) > offset ? capacity4 : offset);
	            offset -= 4;
	            this.view.setInt32(offset, value, this.littleEndian);
	            if (relative) this.offset += 4;
	            return this;
	        };

	        /**
	         * Writes a 32bit signed integer. This is an alias of {@link ByteBuffer#writeInt32}.
	         * @param {number} value Value to write
	         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
	         * @expose
	         */
	        ByteBufferPrototype.writeInt = ByteBufferPrototype.writeInt32;

	        /**
	         * Reads a 32bit signed integer.
	         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
	         * @returns {number} Value read
	         * @expose
	         */
	        ByteBufferPrototype.readInt32 = function(offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 4 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+4+") <= "+this.buffer.byteLength);
	            }
	            var value = this.view.getInt32(offset, this.littleEndian);
	            if (relative) this.offset += 4;
	            return value;
	        };

	        /**
	         * Reads a 32bit signed integer. This is an alias of {@link ByteBuffer#readInt32}.
	         * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `4` if omitted.
	         * @returns {number} Value read
	         * @expose
	         */
	        ByteBufferPrototype.readInt = ByteBufferPrototype.readInt32;

	        /**
	         * Writes a 32bit unsigned integer.
	         * @param {number} value Value to write
	         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
	         * @expose
	         */
	        ByteBufferPrototype.writeUint32 = function(value, offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof value !== 'number' || value % 1 !== 0)
	                    throw TypeError("Illegal value: "+value+" (not an integer)");
	                value >>>= 0;
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	            }
	            offset += 4;
	            var capacity5 = this.buffer.byteLength;
	            if (offset > capacity5)
	                this.resize((capacity5 *= 2) > offset ? capacity5 : offset);
	            offset -= 4;
	            this.view.setUint32(offset, value, this.littleEndian);
	            if (relative) this.offset += 4;
	            return this;
	        };

	        /**
	         * Reads a 32bit unsigned integer.
	         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
	         * @returns {number} Value read
	         * @expose
	         */
	        ByteBufferPrototype.readUint32 = function(offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 4 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+4+") <= "+this.buffer.byteLength);
	            }
	            var value = this.view.getUint32(offset, this.littleEndian);
	            if (relative) this.offset += 4;
	            return value;
	        };

	        // types/ints/int64

	        if (Long) {

	            /**
	             * Writes a 64bit signed integer.
	             * @param {number|!Long} value Value to write
	             * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
	             * @returns {!ByteBuffer} this
	             * @expose
	             */
	            ByteBufferPrototype.writeInt64 = function(value, offset) {
	                var relative = typeof offset === 'undefined';
	                if (relative) offset = this.offset;
	                if (!this.noAssert) {
	                    if (typeof value === 'number')
	                        value = Long.fromNumber(value);
	                    else if (typeof value === 'string')
	                        value = Long.fromString(value);
	                    else if (!(value && value instanceof Long))
	                        throw TypeError("Illegal value: "+value+" (not an integer or Long)");
	                    if (typeof offset !== 'number' || offset % 1 !== 0)
	                        throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                    offset >>>= 0;
	                    if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                        throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	                }
	                if (typeof value === 'number')
	                    value = Long.fromNumber(value);
	                else if (typeof value === 'string')
	                    value = Long.fromString(value);
	                offset += 8;
	                var capacity6 = this.buffer.byteLength;
	                if (offset > capacity6)
	                    this.resize((capacity6 *= 2) > offset ? capacity6 : offset);
	                offset -= 8;
	                if (this.littleEndian) {
	                    this.view.setInt32(offset  , value.low , true);
	                    this.view.setInt32(offset+4, value.high, true);
	                } else {
	                    this.view.setInt32(offset  , value.high, false);
	                    this.view.setInt32(offset+4, value.low , false);
	                }
	                if (relative) this.offset += 8;
	                return this;
	            };

	            /**
	             * Writes a 64bit signed integer. This is an alias of {@link ByteBuffer#writeInt64}.
	             * @param {number|!Long} value Value to write
	             * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
	             * @returns {!ByteBuffer} this
	             * @expose
	             */
	            ByteBufferPrototype.writeLong = ByteBufferPrototype.writeInt64;

	            /**
	             * Reads a 64bit signed integer.
	             * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
	             * @returns {!Long}
	             * @expose
	             */
	            ByteBufferPrototype.readInt64 = function(offset) {
	                var relative = typeof offset === 'undefined';
	                if (relative) offset = this.offset;
	                if (!this.noAssert) {
	                    if (typeof offset !== 'number' || offset % 1 !== 0)
	                        throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                    offset >>>= 0;
	                    if (offset < 0 || offset + 8 > this.buffer.byteLength)
	                        throw RangeError("Illegal offset: 0 <= "+offset+" (+"+8+") <= "+this.buffer.byteLength);
	                }
	                var value = this.littleEndian
	                    ? new Long(this.view.getInt32(offset  , true ), this.view.getInt32(offset+4, true ), false)
	                    : new Long(this.view.getInt32(offset+4, false), this.view.getInt32(offset  , false), false);
	                if (relative) this.offset += 8;
	                return value;
	            };

	            /**
	             * Reads a 64bit signed integer. This is an alias of {@link ByteBuffer#readInt64}.
	             * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
	             * @returns {!Long}
	             * @expose
	             */
	            ByteBufferPrototype.readLong = ByteBufferPrototype.readInt64;

	            /**
	             * Writes a 64bit unsigned integer.
	             * @param {number|!Long} value Value to write
	             * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
	             * @returns {!ByteBuffer} this
	             * @expose
	             */
	            ByteBufferPrototype.writeUint64 = function(value, offset) {
	                var relative = typeof offset === 'undefined';
	                if (relative) offset = this.offset;
	                if (!this.noAssert) {
	                    if (typeof value === 'number')
	                        value = Long.fromNumber(value);
	                    else if (typeof value === 'string')
	                        value = Long.fromString(value);
	                    else if (!(value && value instanceof Long))
	                        throw TypeError("Illegal value: "+value+" (not an integer or Long)");
	                    if (typeof offset !== 'number' || offset % 1 !== 0)
	                        throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                    offset >>>= 0;
	                    if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                        throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	                }
	                if (typeof value === 'number')
	                    value = Long.fromNumber(value);
	                else if (typeof value === 'string')
	                    value = Long.fromString(value);
	                offset += 8;
	                var capacity7 = this.buffer.byteLength;
	                if (offset > capacity7)
	                    this.resize((capacity7 *= 2) > offset ? capacity7 : offset);
	                offset -= 8;
	                if (this.littleEndian) {
	                    this.view.setInt32(offset  , value.low , true);
	                    this.view.setInt32(offset+4, value.high, true);
	                } else {
	                    this.view.setInt32(offset  , value.high, false);
	                    this.view.setInt32(offset+4, value.low , false);
	                }
	                if (relative) this.offset += 8;
	                return this;
	            };

	            /**
	             * Reads a 64bit unsigned integer.
	             * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
	             * @returns {!Long}
	             * @expose
	             */
	            ByteBufferPrototype.readUint64 = function(offset) {
	                var relative = typeof offset === 'undefined';
	                if (relative) offset = this.offset;
	                if (!this.noAssert) {
	                    if (typeof offset !== 'number' || offset % 1 !== 0)
	                        throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                    offset >>>= 0;
	                    if (offset < 0 || offset + 8 > this.buffer.byteLength)
	                        throw RangeError("Illegal offset: 0 <= "+offset+" (+"+8+") <= "+this.buffer.byteLength);
	                }
	                var value = this.littleEndian
	                    ? new Long(this.view.getInt32(offset  , true ), this.view.getInt32(offset+4, true ), true)
	                    : new Long(this.view.getInt32(offset+4, false), this.view.getInt32(offset  , false), true);
	                if (relative) this.offset += 8;
	                return value;
	            };

	        } // Long


	        // types/floats/float32

	        /**
	         * Writes a 32bit float.
	         * @param {number} value Value to write
	         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.writeFloat32 = function(value, offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof value !== 'number')
	                    throw TypeError("Illegal value: "+value+" (not a number)");
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	            }
	            offset += 4;
	            var capacity8 = this.buffer.byteLength;
	            if (offset > capacity8)
	                this.resize((capacity8 *= 2) > offset ? capacity8 : offset);
	            offset -= 4;
	            this.view.setFloat32(offset, value, this.littleEndian);
	            if (relative) this.offset += 4;
	            return this;
	        };

	        /**
	         * Writes a 32bit float. This is an alias of {@link ByteBuffer#writeFloat32}.
	         * @function
	         * @param {number} value Value to write
	         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.writeFloat = ByteBufferPrototype.writeFloat32;

	        /**
	         * Reads a 32bit float.
	         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
	         * @returns {number}
	         * @expose
	         */
	        ByteBufferPrototype.readFloat32 = function(offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 4 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+4+") <= "+this.buffer.byteLength);
	            }
	            var value = this.view.getFloat32(offset, this.littleEndian);
	            if (relative) this.offset += 4;
	            return value;
	        };

	        /**
	         * Reads a 32bit float. This is an alias of {@link ByteBuffer#readFloat32}.
	         * @function
	         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
	         * @returns {number}
	         * @expose
	         */
	        ByteBufferPrototype.readFloat = ByteBufferPrototype.readFloat32;

	        // types/floats/float64

	        /**
	         * Writes a 64bit float.
	         * @param {number} value Value to write
	         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.writeFloat64 = function(value, offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof value !== 'number')
	                    throw TypeError("Illegal value: "+value+" (not a number)");
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	            }
	            offset += 8;
	            var capacity9 = this.buffer.byteLength;
	            if (offset > capacity9)
	                this.resize((capacity9 *= 2) > offset ? capacity9 : offset);
	            offset -= 8;
	            this.view.setFloat64(offset, value, this.littleEndian);
	            if (relative) this.offset += 8;
	            return this;
	        };

	        /**
	         * Writes a 64bit float. This is an alias of {@link ByteBuffer#writeFloat64}.
	         * @function
	         * @param {number} value Value to write
	         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.writeDouble = ByteBufferPrototype.writeFloat64;

	        /**
	         * Reads a 64bit float.
	         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
	         * @returns {number}
	         * @expose
	         */
	        ByteBufferPrototype.readFloat64 = function(offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 8 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+8+") <= "+this.buffer.byteLength);
	            }
	            var value = this.view.getFloat64(offset, this.littleEndian);
	            if (relative) this.offset += 8;
	            return value;
	        };

	        /**
	         * Reads a 64bit float. This is an alias of {@link ByteBuffer#readFloat64}.
	         * @function
	         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
	         * @returns {number}
	         * @expose
	         */
	        ByteBufferPrototype.readDouble = ByteBufferPrototype.readFloat64;


	        // types/varints/varint32

	        /**
	         * Maximum number of bytes required to store a 32bit base 128 variable-length integer.
	         * @type {number}
	         * @const
	         * @expose
	         */
	        ByteBuffer.MAX_VARINT32_BYTES = 5;

	        /**
	         * Calculates the actual number of bytes required to store a 32bit base 128 variable-length integer.
	         * @param {number} value Value to encode
	         * @returns {number} Number of bytes required. Capped to {@link ByteBuffer.MAX_VARINT32_BYTES}
	         * @expose
	         */
	        ByteBuffer.calculateVarint32 = function(value) {
	            // ref: src/google/protobuf/io/coded_stream.cc
	            value = value >>> 0;
	                 if (value < 1 << 7 ) return 1;
	            else if (value < 1 << 14) return 2;
	            else if (value < 1 << 21) return 3;
	            else if (value < 1 << 28) return 4;
	            else                      return 5;
	        };

	        /**
	         * Zigzag encodes a signed 32bit integer so that it can be effectively used with varint encoding.
	         * @param {number} n Signed 32bit integer
	         * @returns {number} Unsigned zigzag encoded 32bit integer
	         * @expose
	         */
	        ByteBuffer.zigZagEncode32 = function(n) {
	            return (((n |= 0) << 1) ^ (n >> 31)) >>> 0; // ref: src/google/protobuf/wire_format_lite.h
	        };

	        /**
	         * Decodes a zigzag encoded signed 32bit integer.
	         * @param {number} n Unsigned zigzag encoded 32bit integer
	         * @returns {number} Signed 32bit integer
	         * @expose
	         */
	        ByteBuffer.zigZagDecode32 = function(n) {
	            return ((n >>> 1) ^ -(n & 1)) | 0; // // ref: src/google/protobuf/wire_format_lite.h
	        };

	        /**
	         * Writes a 32bit base 128 variable-length integer.
	         * @param {number} value Value to write
	         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	         *  written if omitted.
	         * @returns {!ByteBuffer|number} this if `offset` is omitted, else the actual number of bytes written
	         * @expose
	         */
	        ByteBufferPrototype.writeVarint32 = function(value, offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof value !== 'number' || value % 1 !== 0)
	                    throw TypeError("Illegal value: "+value+" (not an integer)");
	                value |= 0;
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	            }
	            var size = ByteBuffer.calculateVarint32(value),
	                b;
	            offset += size;
	            var capacity10 = this.buffer.byteLength;
	            if (offset > capacity10)
	                this.resize((capacity10 *= 2) > offset ? capacity10 : offset);
	            offset -= size;
	            // ref: http://code.google.com/searchframe#WTeibokF6gE/trunk/src/google/protobuf/io/coded_stream.cc
	            this.view.setUint8(offset, b = value | 0x80);
	            value >>>= 0;
	            if (value >= 1 << 7) {
	                b = (value >> 7) | 0x80;
	                this.view.setUint8(offset+1, b);
	                if (value >= 1 << 14) {
	                    b = (value >> 14) | 0x80;
	                    this.view.setUint8(offset+2, b);
	                    if (value >= 1 << 21) {
	                        b = (value >> 21) | 0x80;
	                        this.view.setUint8(offset+3, b);
	                        if (value >= 1 << 28) {
	                            this.view.setUint8(offset+4, (value >> 28) & 0x0F);
	                            size = 5;
	                        } else {
	                            this.view.setUint8(offset+3, b & 0x7F);
	                            size = 4;
	                        }
	                    } else {
	                        this.view.setUint8(offset+2, b & 0x7F);
	                        size = 3;
	                    }
	                } else {
	                    this.view.setUint8(offset+1, b & 0x7F);
	                    size = 2;
	                }
	            } else {
	                this.view.setUint8(offset, b & 0x7F);
	                size = 1;
	            }
	            if (relative) {
	                this.offset += size;
	                return this;
	            }
	            return size;
	        };

	        /**
	         * Writes a zig-zag encoded 32bit base 128 variable-length integer.
	         * @param {number} value Value to write
	         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	         *  written if omitted.
	         * @returns {!ByteBuffer|number} this if `offset` is omitted, else the actual number of bytes written
	         * @expose
	         */
	        ByteBufferPrototype.writeVarint32ZigZag = function(value, offset) {
	            return this.writeVarint32(ByteBuffer.zigZagEncode32(value), offset);
	        };

	        /**
	         * Reads a 32bit base 128 variable-length integer.
	         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	         *  written if omitted.
	         * @returns {number|!{value: number, length: number}} The value read if offset is omitted, else the value read
	         *  and the actual number of bytes read.
	         * @throws {Error} If it's not a valid varint. Has a property `truncated = true` if there is not enough data available
	         *  to fully decode the varint.
	         * @expose
	         */
	        ByteBufferPrototype.readVarint32 = function(offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 1 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+1+") <= "+this.buffer.byteLength);
	            }
	            // ref: src/google/protobuf/io/coded_stream.cc
	            var size = 0,
	                value = 0 >>> 0,
	                temp,
	                ioffset;
	            do {
	                ioffset = offset+size;
	                if (!this.noAssert && ioffset > this.limit) {
	                    var err = Error("Truncated");
	                    err['truncated'] = true;
	                    throw err;
	                }
	                temp = this.view.getUint8(ioffset);
	                if (size < 5)
	                    value |= ((temp&0x7F)<<(7*size)) >>> 0;
	                ++size;
	            } while ((temp & 0x80) === 0x80);
	            value = value | 0; // Make sure to discard the higher order bits
	            if (relative) {
	                this.offset += size;
	                return value;
	            }
	            return {
	                "value": value,
	                "length": size
	            };
	        };

	        /**
	         * Reads a zig-zag encoded 32bit base 128 variable-length integer.
	         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	         *  written if omitted.
	         * @returns {number|!{value: number, length: number}} The value read if offset is omitted, else the value read
	         *  and the actual number of bytes read.
	         * @throws {Error} If it's not a valid varint
	         * @expose
	         */
	        ByteBufferPrototype.readVarint32ZigZag = function(offset) {
	            var val = this.readVarint32(offset);
	            if (typeof val === 'object')
	                val["value"] = ByteBuffer.zigZagDecode32(val["value"]);
	            else
	                val = ByteBuffer.zigZagDecode32(val);
	            return val;
	        };

	        // types/varints/varint64

	        if (Long) {

	            /**
	             * Maximum number of bytes required to store a 64bit base 128 variable-length integer.
	             * @type {number}
	             * @const
	             * @expose
	             */
	            ByteBuffer.MAX_VARINT64_BYTES = 10;

	            /**
	             * Calculates the actual number of bytes required to store a 64bit base 128 variable-length integer.
	             * @param {number|!Long} value Value to encode
	             * @returns {number} Number of bytes required. Capped to {@link ByteBuffer.MAX_VARINT64_BYTES}
	             * @expose
	             */
	            ByteBuffer.calculateVarint64 = function(value) {
	                if (typeof value === 'number')
	                    value = Long.fromNumber(value);
	                else if (typeof value === 'string')
	                    value = Long.fromString(value);
	                // ref: src/google/protobuf/io/coded_stream.cc
	                var part0 = value.toInt() >>> 0,
	                    part1 = value.shiftRightUnsigned(28).toInt() >>> 0,
	                    part2 = value.shiftRightUnsigned(56).toInt() >>> 0;
	                if (part2 == 0) {
	                    if (part1 == 0) {
	                        if (part0 < 1 << 14)
	                            return part0 < 1 << 7 ? 1 : 2;
	                        else
	                            return part0 < 1 << 21 ? 3 : 4;
	                    } else {
	                        if (part1 < 1 << 14)
	                            return part1 < 1 << 7 ? 5 : 6;
	                        else
	                            return part1 < 1 << 21 ? 7 : 8;
	                    }
	                } else
	                    return part2 < 1 << 7 ? 9 : 10;
	            };

	            /**
	             * Zigzag encodes a signed 64bit integer so that it can be effectively used with varint encoding.
	             * @param {number|!Long} value Signed long
	             * @returns {!Long} Unsigned zigzag encoded long
	             * @expose
	             */
	            ByteBuffer.zigZagEncode64 = function(value) {
	                if (typeof value === 'number')
	                    value = Long.fromNumber(value, false);
	                else if (typeof value === 'string')
	                    value = Long.fromString(value, false);
	                else if (value.unsigned !== false) value = value.toSigned();
	                // ref: src/google/protobuf/wire_format_lite.h
	                return value.shiftLeft(1).xor(value.shiftRight(63)).toUnsigned();
	            };

	            /**
	             * Decodes a zigzag encoded signed 64bit integer.
	             * @param {!Long|number} value Unsigned zigzag encoded long or JavaScript number
	             * @returns {!Long} Signed long
	             * @expose
	             */
	            ByteBuffer.zigZagDecode64 = function(value) {
	                if (typeof value === 'number')
	                    value = Long.fromNumber(value, false);
	                else if (typeof value === 'string')
	                    value = Long.fromString(value, false);
	                else if (value.unsigned !== false) value = value.toSigned();
	                // ref: src/google/protobuf/wire_format_lite.h
	                return value.shiftRightUnsigned(1).xor(value.and(Long.ONE).toSigned().negate()).toSigned();
	            };

	            /**
	             * Writes a 64bit base 128 variable-length integer.
	             * @param {number|Long} value Value to write
	             * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	             *  written if omitted.
	             * @returns {!ByteBuffer|number} `this` if offset is omitted, else the actual number of bytes written.
	             * @expose
	             */
	            ByteBufferPrototype.writeVarint64 = function(value, offset) {
	                var relative = typeof offset === 'undefined';
	                if (relative) offset = this.offset;
	                if (!this.noAssert) {
	                    if (typeof value === 'number')
	                        value = Long.fromNumber(value);
	                    else if (typeof value === 'string')
	                        value = Long.fromString(value);
	                    else if (!(value && value instanceof Long))
	                        throw TypeError("Illegal value: "+value+" (not an integer or Long)");
	                    if (typeof offset !== 'number' || offset % 1 !== 0)
	                        throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                    offset >>>= 0;
	                    if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                        throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	                }
	                if (typeof value === 'number')
	                    value = Long.fromNumber(value, false);
	                else if (typeof value === 'string')
	                    value = Long.fromString(value, false);
	                else if (value.unsigned !== false) value = value.toSigned();
	                var size = ByteBuffer.calculateVarint64(value),
	                    part0 = value.toInt() >>> 0,
	                    part1 = value.shiftRightUnsigned(28).toInt() >>> 0,
	                    part2 = value.shiftRightUnsigned(56).toInt() >>> 0;
	                offset += size;
	                var capacity11 = this.buffer.byteLength;
	                if (offset > capacity11)
	                    this.resize((capacity11 *= 2) > offset ? capacity11 : offset);
	                offset -= size;
	                switch (size) {
	                    case 10: this.view.setUint8(offset+9, (part2 >>>  7) & 0x01);
	                    case 9 : this.view.setUint8(offset+8, size !== 9 ? (part2       ) | 0x80 : (part2       ) & 0x7F);
	                    case 8 : this.view.setUint8(offset+7, size !== 8 ? (part1 >>> 21) | 0x80 : (part1 >>> 21) & 0x7F);
	                    case 7 : this.view.setUint8(offset+6, size !== 7 ? (part1 >>> 14) | 0x80 : (part1 >>> 14) & 0x7F);
	                    case 6 : this.view.setUint8(offset+5, size !== 6 ? (part1 >>>  7) | 0x80 : (part1 >>>  7) & 0x7F);
	                    case 5 : this.view.setUint8(offset+4, size !== 5 ? (part1       ) | 0x80 : (part1       ) & 0x7F);
	                    case 4 : this.view.setUint8(offset+3, size !== 4 ? (part0 >>> 21) | 0x80 : (part0 >>> 21) & 0x7F);
	                    case 3 : this.view.setUint8(offset+2, size !== 3 ? (part0 >>> 14) | 0x80 : (part0 >>> 14) & 0x7F);
	                    case 2 : this.view.setUint8(offset+1, size !== 2 ? (part0 >>>  7) | 0x80 : (part0 >>>  7) & 0x7F);
	                    case 1 : this.view.setUint8(offset  , size !== 1 ? (part0       ) | 0x80 : (part0       ) & 0x7F);
	                }
	                if (relative) {
	                    this.offset += size;
	                    return this;
	                } else {
	                    return size;
	                }
	            };

	            /**
	             * Writes a zig-zag encoded 64bit base 128 variable-length integer.
	             * @param {number|Long} value Value to write
	             * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	             *  written if omitted.
	             * @returns {!ByteBuffer|number} `this` if offset is omitted, else the actual number of bytes written.
	             * @expose
	             */
	            ByteBufferPrototype.writeVarint64ZigZag = function(value, offset) {
	                return this.writeVarint64(ByteBuffer.zigZagEncode64(value), offset);
	            };

	            /**
	             * Reads a 64bit base 128 variable-length integer. Requires Long.js.
	             * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	             *  read if omitted.
	             * @returns {!Long|!{value: Long, length: number}} The value read if offset is omitted, else the value read and
	             *  the actual number of bytes read.
	             * @throws {Error} If it's not a valid varint
	             * @expose
	             */
	            ByteBufferPrototype.readVarint64 = function(offset) {
	                var relative = typeof offset === 'undefined';
	                if (relative) offset = this.offset;
	                if (!this.noAssert) {
	                    if (typeof offset !== 'number' || offset % 1 !== 0)
	                        throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                    offset >>>= 0;
	                    if (offset < 0 || offset + 1 > this.buffer.byteLength)
	                        throw RangeError("Illegal offset: 0 <= "+offset+" (+"+1+") <= "+this.buffer.byteLength);
	                }
	                // ref: src/google/protobuf/io/coded_stream.cc
	                var start = offset,
	                    part0 = 0,
	                    part1 = 0,
	                    part2 = 0,
	                    b  = 0;
	                b = this.view.getUint8(offset++); part0  = (b & 0x7F)      ; if (b & 0x80) {
	                b = this.view.getUint8(offset++); part0 |= (b & 0x7F) <<  7; if (b & 0x80) {
	                b = this.view.getUint8(offset++); part0 |= (b & 0x7F) << 14; if (b & 0x80) {
	                b = this.view.getUint8(offset++); part0 |= (b & 0x7F) << 21; if (b & 0x80) {
	                b = this.view.getUint8(offset++); part1  = (b & 0x7F)      ; if (b & 0x80) {
	                b = this.view.getUint8(offset++); part1 |= (b & 0x7F) <<  7; if (b & 0x80) {
	                b = this.view.getUint8(offset++); part1 |= (b & 0x7F) << 14; if (b & 0x80) {
	                b = this.view.getUint8(offset++); part1 |= (b & 0x7F) << 21; if (b & 0x80) {
	                b = this.view.getUint8(offset++); part2  = (b & 0x7F)      ; if (b & 0x80) {
	                b = this.view.getUint8(offset++); part2 |= (b & 0x7F) <<  7; if (b & 0x80) {
	                throw Error("Buffer overrun"); }}}}}}}}}}
	                var value = Long.fromBits(part0 | (part1 << 28), (part1 >>> 4) | (part2) << 24, false);
	                if (relative) {
	                    this.offset = offset;
	                    return value;
	                } else {
	                    return {
	                        'value': value,
	                        'length': offset-start
	                    };
	                }
	            };

	            /**
	             * Reads a zig-zag encoded 64bit base 128 variable-length integer. Requires Long.js.
	             * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	             *  read if omitted.
	             * @returns {!Long|!{value: Long, length: number}} The value read if offset is omitted, else the value read and
	             *  the actual number of bytes read.
	             * @throws {Error} If it's not a valid varint
	             * @expose
	             */
	            ByteBufferPrototype.readVarint64ZigZag = function(offset) {
	                var val = this.readVarint64(offset);
	                if (val && val['value'] instanceof Long)
	                    val["value"] = ByteBuffer.zigZagDecode64(val["value"]);
	                else
	                    val = ByteBuffer.zigZagDecode64(val);
	                return val;
	            };

	        } // Long


	        // types/strings/cstring

	        /**
	         * Writes a NULL-terminated UTF8 encoded string. For this to work the specified string must not contain any NULL
	         *  characters itself.
	         * @param {string} str String to write
	         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	         *  contained in `str` + 1 if omitted.
	         * @returns {!ByteBuffer|number} this if offset is omitted, else the actual number of bytes written
	         * @expose
	         */
	        ByteBufferPrototype.writeCString = function(str, offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            var i,
	                k = str.length;
	            if (!this.noAssert) {
	                if (typeof str !== 'string')
	                    throw TypeError("Illegal str: Not a string");
	                for (i=0; i<k; ++i) {
	                    if (str.charCodeAt(i) === 0)
	                        throw RangeError("Illegal str: Contains NULL-characters");
	                }
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	            }
	            // UTF8 strings do not contain zero bytes in between except for the zero character, so:
	            k = utfx.calculateUTF16asUTF8(stringSource(str))[1];
	            offset += k+1;
	            var capacity12 = this.buffer.byteLength;
	            if (offset > capacity12)
	                this.resize((capacity12 *= 2) > offset ? capacity12 : offset);
	            offset -= k+1;
	            utfx.encodeUTF16toUTF8(stringSource(str), function(b) {
	                this.view.setUint8(offset++, b);
	            }.bind(this));
	            this.view.setUint8(offset++, 0);
	            if (relative) {
	                this.offset = offset;
	                return this;
	            }
	            return k;
	        };

	        /**
	         * Reads a NULL-terminated UTF8 encoded string. For this to work the string read must not contain any NULL characters
	         *  itself.
	         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	         *  read if omitted.
	         * @returns {string|!{string: string, length: number}} The string read if offset is omitted, else the string
	         *  read and the actual number of bytes read.
	         * @expose
	         */
	        ByteBufferPrototype.readCString = function(offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 1 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+1+") <= "+this.buffer.byteLength);
	            }
	            var start = offset,
	                temp;
	            // UTF8 strings do not contain zero bytes in between except for the zero character itself, so:
	            var sd, b = -1;
	            utfx.decodeUTF8toUTF16(function() {
	                if (b === 0) return null;
	                if (offset >= this.limit)
	                    throw RangeError("Illegal range: Truncated data, "+offset+" < "+this.limit);
	                return (b = this.view.getUint8(offset++)) === 0 ? null : b;
	            }.bind(this), sd = stringDestination(), true);
	            if (relative) {
	                this.offset = offset;
	                return sd();
	            } else {
	                return {
	                    "string": sd(),
	                    "length": offset - start
	                };
	            }
	        };

	        // types/strings/istring

	        /**
	         * Writes a length as uint32 prefixed UTF8 encoded string.
	         * @param {string} str String to write
	         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	         *  written if omitted.
	         * @returns {!ByteBuffer|number} `this` if `offset` is omitted, else the actual number of bytes written
	         * @expose
	         * @see ByteBuffer#writeVarint32
	         */
	        ByteBufferPrototype.writeIString = function(str, offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof str !== 'string')
	                    throw TypeError("Illegal str: Not a string");
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	            }
	            var start = offset,
	                k;
	            k = utfx.calculateUTF16asUTF8(stringSource(str), this.noAssert)[1];
	            offset += 4+k;
	            var capacity13 = this.buffer.byteLength;
	            if (offset > capacity13)
	                this.resize((capacity13 *= 2) > offset ? capacity13 : offset);
	            offset -= 4+k;
	            this.view.setUint32(offset, k, this.littleEndian);
	            offset += 4;
	            utfx.encodeUTF16toUTF8(stringSource(str), function(b) {
	                this.view.setUint8(offset++, b);
	            }.bind(this));
	            if (offset !== start + 4 + k)
	                throw RangeError("Illegal range: Truncated data, "+offset+" == "+(offset+4+k));
	            if (relative) {
	                this.offset = offset;
	                return this;
	            }
	            return offset - start;
	        };

	        /**
	         * Reads a length as uint32 prefixed UTF8 encoded string.
	         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	         *  read if omitted.
	         * @returns {string|!{string: string, length: number}} The string read if offset is omitted, else the string
	         *  read and the actual number of bytes read.
	         * @expose
	         * @see ByteBuffer#readVarint32
	         */
	        ByteBufferPrototype.readIString = function(offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 4 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+4+") <= "+this.buffer.byteLength);
	            }
	            var temp = 0,
	                start = offset,
	                str;
	            temp = this.view.getUint32(offset, this.littleEndian);
	            offset += 4;
	            var k = offset + temp,
	                sd;
	            utfx.decodeUTF8toUTF16(function() {
	                return offset < k ? this.view.getUint8(offset++) : null;
	            }.bind(this), sd = stringDestination(), this.noAssert);
	            str = sd();
	            if (relative) {
	                this.offset = offset;
	                return str;
	            } else {
	                return {
	                    'string': str,
	                    'length': offset - start
	                };
	            }
	        };

	        // types/strings/utf8string

	        /**
	         * Metrics representing number of UTF8 characters. Evaluates to `c`.
	         * @type {string}
	         * @const
	         * @expose
	         */
	        ByteBuffer.METRICS_CHARS = 'c';

	        /**
	         * Metrics representing number of bytes. Evaluates to `b`.
	         * @type {string}
	         * @const
	         * @expose
	         */
	        ByteBuffer.METRICS_BYTES = 'b';

	        /**
	         * Writes an UTF8 encoded string.
	         * @param {string} str String to write
	         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} if omitted.
	         * @returns {!ByteBuffer|number} this if offset is omitted, else the actual number of bytes written.
	         * @expose
	         */
	        ByteBufferPrototype.writeUTF8String = function(str, offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	            }
	            var k;
	            var start = offset;
	            k = utfx.calculateUTF16asUTF8(stringSource(str))[1];
	            offset += k;
	            var capacity14 = this.buffer.byteLength;
	            if (offset > capacity14)
	                this.resize((capacity14 *= 2) > offset ? capacity14 : offset);
	            offset -= k;
	            utfx.encodeUTF16toUTF8(stringSource(str), function(b) {
	                this.view.setUint8(offset++, b);
	            }.bind(this));
	            if (relative) {
	                this.offset = offset;
	                return this;
	            }
	            return offset - start;
	        };

	        /**
	         * Writes an UTF8 encoded string. This is an alias of {@link ByteBuffer#writeUTF8String}.
	         * @function
	         * @param {string} str String to write
	         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} if omitted.
	         * @returns {!ByteBuffer|number} this if offset is omitted, else the actual number of bytes written.
	         * @expose
	         */
	        ByteBufferPrototype.writeString = ByteBufferPrototype.writeUTF8String;

	        /**
	         * Calculates the number of UTF8 characters of a string. JavaScript itself uses UTF-16, so that a string's
	         *  `length` property does not reflect its actual UTF8 size if it contains code points larger than 0xFFFF.
	         * @function
	         * @param {string} str String to calculate
	         * @returns {number} Number of UTF8 characters
	         * @expose
	         */
	        ByteBuffer.calculateUTF8Chars = function(str) {
	            return utfx.calculateUTF16asUTF8(stringSource(str))[0];
	        };

	        /**
	         * Calculates the number of UTF8 bytes of a string.
	         * @function
	         * @param {string} str String to calculate
	         * @returns {number} Number of UTF8 bytes
	         * @expose
	         */
	        ByteBuffer.calculateUTF8Bytes = function(str) {
	            return utfx.calculateUTF16asUTF8(stringSource(str))[1];
	        };

	        /**
	         * Reads an UTF8 encoded string.
	         * @param {number} length Number of characters or bytes to read.
	         * @param {string=} metrics Metrics specifying what `length` is meant to count. Defaults to
	         *  {@link ByteBuffer.METRICS_CHARS}.
	         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	         *  read if omitted.
	         * @returns {string|!{string: string, length: number}} The string read if offset is omitted, else the string
	         *  read and the actual number of bytes read.
	         * @expose
	         */
	        ByteBufferPrototype.readUTF8String = function(length, metrics, offset) {
	            if (typeof metrics === 'number') {
	                offset = metrics;
	                metrics = undefined;
	            }
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (typeof metrics === 'undefined') metrics = ByteBuffer.METRICS_CHARS;
	            if (!this.noAssert) {
	                if (typeof length !== 'number' || length % 1 !== 0)
	                    throw TypeError("Illegal length: "+length+" (not an integer)");
	                length |= 0;
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	            }
	            var i = 0,
	                start = offset,
	                sd;
	            if (metrics === ByteBuffer.METRICS_CHARS) { // The same for node and the browser
	                sd = stringDestination();
	                utfx.decodeUTF8(function() {
	                    return i < length && offset < this.limit ? this.view.getUint8(offset++) : null;
	                }.bind(this), function(cp) {
	                    ++i; utfx.UTF8toUTF16(cp, sd);
	                }.bind(this));
	                if (i !== length)
	                    throw RangeError("Illegal range: Truncated data, "+i+" == "+length);
	                if (relative) {
	                    this.offset = offset;
	                    return sd();
	                } else {
	                    return {
	                        "string": sd(),
	                        "length": offset - start
	                    };
	                }
	            } else if (metrics === ByteBuffer.METRICS_BYTES) {
	                if (!this.noAssert) {
	                    if (typeof offset !== 'number' || offset % 1 !== 0)
	                        throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                    offset >>>= 0;
	                    if (offset < 0 || offset + length > this.buffer.byteLength)
	                        throw RangeError("Illegal offset: 0 <= "+offset+" (+"+length+") <= "+this.buffer.byteLength);
	                }
	                var k = offset + length;
	                utfx.decodeUTF8toUTF16(function() {
	                    return offset < k ? this.view.getUint8(offset++) : null;
	                }.bind(this), sd = stringDestination(), this.noAssert);
	                if (offset !== k)
	                    throw RangeError("Illegal range: Truncated data, "+offset+" == "+k);
	                if (relative) {
	                    this.offset = offset;
	                    return sd();
	                } else {
	                    return {
	                        'string': sd(),
	                        'length': offset - start
	                    };
	                }
	            } else
	                throw TypeError("Unsupported metrics: "+metrics);
	        };

	        /**
	         * Reads an UTF8 encoded string. This is an alias of {@link ByteBuffer#readUTF8String}.
	         * @function
	         * @param {number} length Number of characters or bytes to read
	         * @param {number=} metrics Metrics specifying what `n` is meant to count. Defaults to
	         *  {@link ByteBuffer.METRICS_CHARS}.
	         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	         *  read if omitted.
	         * @returns {string|!{string: string, length: number}} The string read if offset is omitted, else the string
	         *  read and the actual number of bytes read.
	         * @expose
	         */
	        ByteBufferPrototype.readString = ByteBufferPrototype.readUTF8String;

	        // types/strings/vstring

	        /**
	         * Writes a length as varint32 prefixed UTF8 encoded string.
	         * @param {string} str String to write
	         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	         *  written if omitted.
	         * @returns {!ByteBuffer|number} `this` if `offset` is omitted, else the actual number of bytes written
	         * @expose
	         * @see ByteBuffer#writeVarint32
	         */
	        ByteBufferPrototype.writeVString = function(str, offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof str !== 'string')
	                    throw TypeError("Illegal str: Not a string");
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	            }
	            var start = offset,
	                k, l;
	            k = utfx.calculateUTF16asUTF8(stringSource(str), this.noAssert)[1];
	            l = ByteBuffer.calculateVarint32(k);
	            offset += l+k;
	            var capacity15 = this.buffer.byteLength;
	            if (offset > capacity15)
	                this.resize((capacity15 *= 2) > offset ? capacity15 : offset);
	            offset -= l+k;
	            offset += this.writeVarint32(k, offset);
	            utfx.encodeUTF16toUTF8(stringSource(str), function(b) {
	                this.view.setUint8(offset++, b);
	            }.bind(this));
	            if (offset !== start+k+l)
	                throw RangeError("Illegal range: Truncated data, "+offset+" == "+(offset+k+l));
	            if (relative) {
	                this.offset = offset;
	                return this;
	            }
	            return offset - start;
	        };

	        /**
	         * Reads a length as varint32 prefixed UTF8 encoded string.
	         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	         *  read if omitted.
	         * @returns {string|!{string: string, length: number}} The string read if offset is omitted, else the string
	         *  read and the actual number of bytes read.
	         * @expose
	         * @see ByteBuffer#readVarint32
	         */
	        ByteBufferPrototype.readVString = function(offset) {
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 1 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+1+") <= "+this.buffer.byteLength);
	            }
	            var temp = this.readVarint32(offset),
	                start = offset,
	                str;
	            offset += temp['length'];
	            temp = temp['value'];
	            var k = offset + temp,
	                sd = stringDestination();
	            utfx.decodeUTF8toUTF16(function() {
	                return offset < k ? this.view.getUint8(offset++) : null;
	            }.bind(this), sd, this.noAssert);
	            str = sd();
	            if (relative) {
	                this.offset = offset;
	                return str;
	            } else {
	                return {
	                    'string': str,
	                    'length': offset - start
	                };
	            }
	        };


	        /**
	         * Appends some data to this ByteBuffer. This will overwrite any contents behind the specified offset up to the appended
	         *  data's length.
	         * @param {!ByteBuffer|!ArrayBuffer|!Uint8Array|string} source Data to append. If `source` is a ByteBuffer, its offsets
	         *  will be modified according to the performed read operation.
	         * @param {(string|number)=} encoding Encoding if `data` is a string ("base64", "hex", "binary", defaults to "utf8")
	         * @param {number=} offset Offset to append at. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	         *  read if omitted.
	         * @returns {!ByteBuffer} this
	         * @expose
	         * @example A relative `<01 02>03.append(<04 05>)` will result in `<01 02 04 05>, 04 05|`
	         * @example An absolute `<01 02>03.append(04 05>, 1)` will result in `<01 04>05, 04 05|`
	         */
	        ByteBufferPrototype.append = function(source, encoding, offset) {
	            if (typeof encoding === 'number' || typeof encoding !== 'string') {
	                offset = encoding;
	                encoding = undefined;
	            }
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	            }
	            if (!(source instanceof ByteBuffer))
	                source = ByteBuffer.wrap(source, encoding);
	            var length = source.limit - source.offset;
	            if (length <= 0) return this; // Nothing to append
	            offset += length;
	            var capacity16 = this.buffer.byteLength;
	            if (offset > capacity16)
	                this.resize((capacity16 *= 2) > offset ? capacity16 : offset);
	            offset -= length;
	            new Uint8Array(this.buffer, offset).set(new Uint8Array(source.buffer).subarray(source.offset, source.limit));
	            source.offset += length;
	            if (relative) this.offset += length;
	            return this;
	        };

	        /**
	         * Appends this ByteBuffer's contents to another ByteBuffer. This will overwrite any contents at and after the
	            specified offset up to the length of this ByteBuffer's data.
	         * @param {!ByteBuffer} target Target ByteBuffer
	         * @param {number=} offset Offset to append to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	         *  read if omitted.
	         * @returns {!ByteBuffer} this
	         * @expose
	         * @see ByteBuffer#append
	         */
	        ByteBufferPrototype.appendTo = function(target, offset) {
	            target.append(this, offset);
	            return this;
	        };

	        /**
	         * Enables or disables assertions of argument types and offsets. Assertions are enabled by default but you can opt to
	         *  disable them if your code already makes sure that everything is valid.
	         * @param {boolean} assert `true` to enable assertions, otherwise `false`
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.assert = function(assert) {
	            this.noAssert = !assert;
	            return this;
	        };

	        /**
	         * Gets the capacity of this ByteBuffer's backing buffer.
	         * @returns {number} Capacity of the backing buffer
	         * @expose
	         */
	        ByteBufferPrototype.capacity = function() {
	            return this.buffer.byteLength;
	        };

	        /**
	         * Clears this ByteBuffer's offsets by setting {@link ByteBuffer#offset} to `0` and {@link ByteBuffer#limit} to the
	         *  backing buffer's capacity. Discards {@link ByteBuffer#markedOffset}.
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.clear = function() {
	            this.offset = 0;
	            this.limit = this.buffer.byteLength;
	            this.markedOffset = -1;
	            return this;
	        };

	        /**
	         * Creates a cloned instance of this ByteBuffer, preset with this ByteBuffer's values for {@link ByteBuffer#offset},
	         *  {@link ByteBuffer#markedOffset} and {@link ByteBuffer#limit}.
	         * @param {boolean=} copy Whether to copy the backing buffer or to return another view on the same, defaults to `false`
	         * @returns {!ByteBuffer} Cloned instance
	         * @expose
	         */
	        ByteBufferPrototype.clone = function(copy) {
	            var bb = new ByteBuffer(0, this.littleEndian, this.noAssert);
	            if (copy) {
	                var buffer = new ArrayBuffer(this.buffer.byteLength);
	                new Uint8Array(buffer).set(this.buffer);
	                bb.buffer = buffer;
	                bb.view = new DataView(buffer);
	            } else {
	                bb.buffer = this.buffer;
	                bb.view = this.view;
	            }
	            bb.offset = this.offset;
	            bb.markedOffset = this.markedOffset;
	            bb.limit = this.limit;
	            return bb;
	        };

	        /**
	         * Compacts this ByteBuffer to be backed by a {@link ByteBuffer#buffer} of its contents' length. Contents are the bytes
	         *  between {@link ByteBuffer#offset} and {@link ByteBuffer#limit}. Will set `offset = 0` and `limit = capacity` and
	         *  adapt {@link ByteBuffer#markedOffset} to the same relative position if set.
	         * @param {number=} begin Offset to start at, defaults to {@link ByteBuffer#offset}
	         * @param {number=} end Offset to end at, defaults to {@link ByteBuffer#limit}
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.compact = function(begin, end) {
	            if (typeof begin === 'undefined') begin = this.offset;
	            if (typeof end === 'undefined') end = this.limit;
	            if (!this.noAssert) {
	                if (typeof begin !== 'number' || begin % 1 !== 0)
	                    throw TypeError("Illegal begin: Not an integer");
	                begin >>>= 0;
	                if (typeof end !== 'number' || end % 1 !== 0)
	                    throw TypeError("Illegal end: Not an integer");
	                end >>>= 0;
	                if (begin < 0 || begin > end || end > this.buffer.byteLength)
	                    throw RangeError("Illegal range: 0 <= "+begin+" <= "+end+" <= "+this.buffer.byteLength);
	            }
	            if (begin === 0 && end === this.buffer.byteLength)
	                return this; // Already compacted
	            var len = end - begin;
	            if (len === 0) {
	                this.buffer = EMPTY_BUFFER;
	                this.view = null;
	                if (this.markedOffset >= 0) this.markedOffset -= begin;
	                this.offset = 0;
	                this.limit = 0;
	                return this;
	            }
	            var buffer = new ArrayBuffer(len);
	            new Uint8Array(buffer).set(new Uint8Array(this.buffer).subarray(begin, end));
	            this.buffer = buffer;
	            this.view = new DataView(buffer);
	            if (this.markedOffset >= 0) this.markedOffset -= begin;
	            this.offset = 0;
	            this.limit = len;
	            return this;
	        };

	        /**
	         * Creates a copy of this ByteBuffer's contents. Contents are the bytes between {@link ByteBuffer#offset} and
	         *  {@link ByteBuffer#limit}.
	         * @param {number=} begin Begin offset, defaults to {@link ByteBuffer#offset}.
	         * @param {number=} end End offset, defaults to {@link ByteBuffer#limit}.
	         * @returns {!ByteBuffer} Copy
	         * @expose
	         */
	        ByteBufferPrototype.copy = function(begin, end) {
	            if (typeof begin === 'undefined') begin = this.offset;
	            if (typeof end === 'undefined') end = this.limit;
	            if (!this.noAssert) {
	                if (typeof begin !== 'number' || begin % 1 !== 0)
	                    throw TypeError("Illegal begin: Not an integer");
	                begin >>>= 0;
	                if (typeof end !== 'number' || end % 1 !== 0)
	                    throw TypeError("Illegal end: Not an integer");
	                end >>>= 0;
	                if (begin < 0 || begin > end || end > this.buffer.byteLength)
	                    throw RangeError("Illegal range: 0 <= "+begin+" <= "+end+" <= "+this.buffer.byteLength);
	            }
	            if (begin === end)
	                return new ByteBuffer(0, this.littleEndian, this.noAssert);
	            var capacity = end - begin,
	                bb = new ByteBuffer(capacity, this.littleEndian, this.noAssert);
	            bb.offset = 0;
	            bb.limit = capacity;
	            if (bb.markedOffset >= 0) bb.markedOffset -= begin;
	            this.copyTo(bb, 0, begin, end);
	            return bb;
	        };

	        /**
	         * Copies this ByteBuffer's contents to another ByteBuffer. Contents are the bytes between {@link ByteBuffer#offset} and
	         *  {@link ByteBuffer#limit}.
	         * @param {!ByteBuffer} target Target ByteBuffer
	         * @param {number=} targetOffset Offset to copy to. Will use and increase the target's {@link ByteBuffer#offset}
	         *  by the number of bytes copied if omitted.
	         * @param {number=} sourceOffset Offset to start copying from. Will use and increase {@link ByteBuffer#offset} by the
	         *  number of bytes copied if omitted.
	         * @param {number=} sourceLimit Offset to end copying from, defaults to {@link ByteBuffer#limit}
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.copyTo = function(target, targetOffset, sourceOffset, sourceLimit) {
	            var relative,
	                targetRelative;
	            if (!this.noAssert) {
	                if (!ByteBuffer.isByteBuffer(target))
	                    throw TypeError("Illegal target: Not a ByteBuffer");
	            }
	            targetOffset = (targetRelative = typeof targetOffset === 'undefined') ? target.offset : targetOffset | 0;
	            sourceOffset = (relative = typeof sourceOffset === 'undefined') ? this.offset : sourceOffset | 0;
	            sourceLimit = typeof sourceLimit === 'undefined' ? this.limit : sourceLimit | 0;

	            if (targetOffset < 0 || targetOffset > target.buffer.byteLength)
	                throw RangeError("Illegal target range: 0 <= "+targetOffset+" <= "+target.buffer.byteLength);
	            if (sourceOffset < 0 || sourceLimit > this.buffer.byteLength)
	                throw RangeError("Illegal source range: 0 <= "+sourceOffset+" <= "+this.buffer.byteLength);

	            var len = sourceLimit - sourceOffset;
	            if (len === 0)
	                return target; // Nothing to copy

	            target.ensureCapacity(targetOffset + len);

	            new Uint8Array(target.buffer).set(new Uint8Array(this.buffer).subarray(sourceOffset, sourceLimit), targetOffset);

	            if (relative) this.offset += len;
	            if (targetRelative) target.offset += len;

	            return this;
	        };

	        /**
	         * Makes sure that this ByteBuffer is backed by a {@link ByteBuffer#buffer} of at least the specified capacity. If the
	         *  current capacity is exceeded, it will be doubled. If double the current capacity is less than the required capacity,
	         *  the required capacity will be used instead.
	         * @param {number} capacity Required capacity
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.ensureCapacity = function(capacity) {
	            var current = this.buffer.byteLength;
	            if (current < capacity)
	                return this.resize((current *= 2) > capacity ? current : capacity);
	            return this;
	        };

	        /**
	         * Overwrites this ByteBuffer's contents with the specified value. Contents are the bytes between
	         *  {@link ByteBuffer#offset} and {@link ByteBuffer#limit}.
	         * @param {number|string} value Byte value to fill with. If given as a string, the first character is used.
	         * @param {number=} begin Begin offset. Will use and increase {@link ByteBuffer#offset} by the number of bytes
	         *  written if omitted. defaults to {@link ByteBuffer#offset}.
	         * @param {number=} end End offset, defaults to {@link ByteBuffer#limit}.
	         * @returns {!ByteBuffer} this
	         * @expose
	         * @example `someByteBuffer.clear().fill(0)` fills the entire backing buffer with zeroes
	         */
	        ByteBufferPrototype.fill = function(value, begin, end) {
	            var relative = typeof begin === 'undefined';
	            if (relative) begin = this.offset;
	            if (typeof value === 'string' && value.length > 0)
	                value = value.charCodeAt(0);
	            if (typeof begin === 'undefined') begin = this.offset;
	            if (typeof end === 'undefined') end = this.limit;
	            if (!this.noAssert) {
	                if (typeof value !== 'number' || value % 1 !== 0)
	                    throw TypeError("Illegal value: "+value+" (not an integer)");
	                value |= 0;
	                if (typeof begin !== 'number' || begin % 1 !== 0)
	                    throw TypeError("Illegal begin: Not an integer");
	                begin >>>= 0;
	                if (typeof end !== 'number' || end % 1 !== 0)
	                    throw TypeError("Illegal end: Not an integer");
	                end >>>= 0;
	                if (begin < 0 || begin > end || end > this.buffer.byteLength)
	                    throw RangeError("Illegal range: 0 <= "+begin+" <= "+end+" <= "+this.buffer.byteLength);
	            }
	            if (begin >= end)
	                return this; // Nothing to fill
	            while (begin < end) this.view.setUint8(begin++, value);
	            if (relative) this.offset = begin;
	            return this;
	        };

	        /**
	         * Makes this ByteBuffer ready for a new sequence of write or relative read operations. Sets `limit = offset` and
	         *  `offset = 0`. Make sure always to flip a ByteBuffer when all relative read or write operations are complete.
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.flip = function() {
	            this.limit = this.offset;
	            this.offset = 0;
	            return this;
	        };
	        /**
	         * Marks an offset on this ByteBuffer to be used later.
	         * @param {number=} offset Offset to mark. Defaults to {@link ByteBuffer#offset}.
	         * @returns {!ByteBuffer} this
	         * @throws {TypeError} If `offset` is not a valid number
	         * @throws {RangeError} If `offset` is out of bounds
	         * @see ByteBuffer#reset
	         * @expose
	         */
	        ByteBufferPrototype.mark = function(offset) {
	            offset = typeof offset === 'undefined' ? this.offset : offset;
	            if (!this.noAssert) {
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	            }
	            this.markedOffset = offset;
	            return this;
	        };
	        /**
	         * Sets the byte order.
	         * @param {boolean} littleEndian `true` for little endian byte order, `false` for big endian
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.order = function(littleEndian) {
	            if (!this.noAssert) {
	                if (typeof littleEndian !== 'boolean')
	                    throw TypeError("Illegal littleEndian: Not a boolean");
	            }
	            this.littleEndian = !!littleEndian;
	            return this;
	        };

	        /**
	         * Switches (to) little endian byte order.
	         * @param {boolean=} littleEndian Defaults to `true`, otherwise uses big endian
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.LE = function(littleEndian) {
	            this.littleEndian = typeof littleEndian !== 'undefined' ? !!littleEndian : true;
	            return this;
	        };

	        /**
	         * Switches (to) big endian byte order.
	         * @param {boolean=} bigEndian Defaults to `true`, otherwise uses little endian
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.BE = function(bigEndian) {
	            this.littleEndian = typeof bigEndian !== 'undefined' ? !bigEndian : false;
	            return this;
	        };
	        /**
	         * Prepends some data to this ByteBuffer. This will overwrite any contents before the specified offset up to the
	         *  prepended data's length. If there is not enough space available before the specified `offset`, the backing buffer
	         *  will be resized and its contents moved accordingly.
	         * @param {!ByteBuffer|string|!ArrayBuffer} source Data to prepend. If `source` is a ByteBuffer, its offset will be
	         *  modified according to the performed read operation.
	         * @param {(string|number)=} encoding Encoding if `data` is a string ("base64", "hex", "binary", defaults to "utf8")
	         * @param {number=} offset Offset to prepend at. Will use and decrease {@link ByteBuffer#offset} by the number of bytes
	         *  prepended if omitted.
	         * @returns {!ByteBuffer} this
	         * @expose
	         * @example A relative `00<01 02 03>.prepend(<04 05>)` results in `<04 05 01 02 03>, 04 05|`
	         * @example An absolute `00<01 02 03>.prepend(<04 05>, 2)` results in `04<05 02 03>, 04 05|`
	         */
	        ByteBufferPrototype.prepend = function(source, encoding, offset) {
	            if (typeof encoding === 'number' || typeof encoding !== 'string') {
	                offset = encoding;
	                encoding = undefined;
	            }
	            var relative = typeof offset === 'undefined';
	            if (relative) offset = this.offset;
	            if (!this.noAssert) {
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: "+offset+" (not an integer)");
	                offset >>>= 0;
	                if (offset < 0 || offset + 0 > this.buffer.byteLength)
	                    throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);
	            }
	            if (!(source instanceof ByteBuffer))
	                source = ByteBuffer.wrap(source, encoding);
	            var len = source.limit - source.offset;
	            if (len <= 0) return this; // Nothing to prepend
	            var diff = len - offset;
	            var arrayView;
	            if (diff > 0) { // Not enough space before offset, so resize + move
	                var buffer = new ArrayBuffer(this.buffer.byteLength + diff);
	                arrayView = new Uint8Array(buffer);
	                arrayView.set(new Uint8Array(this.buffer).subarray(offset, this.buffer.byteLength), len);
	                this.buffer = buffer;
	                this.view = new DataView(buffer);
	                this.offset += diff;
	                if (this.markedOffset >= 0) this.markedOffset += diff;
	                this.limit += diff;
	                offset += diff;
	            } else {
	                arrayView = new Uint8Array(this.buffer);
	            }
	            arrayView.set(new Uint8Array(source.buffer).subarray(source.offset, source.limit), offset - len);
	            source.offset = source.limit;
	            if (relative)
	                this.offset -= len;
	            return this;
	        };

	        /**
	         * Prepends this ByteBuffer to another ByteBuffer. This will overwrite any contents before the specified offset up to the
	         *  prepended data's length. If there is not enough space available before the specified `offset`, the backing buffer
	         *  will be resized and its contents moved accordingly.
	         * @param {!ByteBuffer} target Target ByteBuffer
	         * @param {number=} offset Offset to prepend at. Will use and decrease {@link ByteBuffer#offset} by the number of bytes
	         *  prepended if omitted.
	         * @returns {!ByteBuffer} this
	         * @expose
	         * @see ByteBuffer#prepend
	         */
	        ByteBufferPrototype.prependTo = function(target, offset) {
	            target.prepend(this, offset);
	            return this;
	        };
	        /**
	         * Prints debug information about this ByteBuffer's contents.
	         * @param {function(string)=} out Output function to call, defaults to console.log
	         * @expose
	         */
	        ByteBufferPrototype.printDebug = function(out) {
	            if (typeof out !== 'function') out = console.log.bind(console);
	            out(
	                this.toString()+"\n"+
	                "-------------------------------------------------------------------\n"+
	                this.toDebug(/* columns */ true)
	            );
	        };

	        /**
	         * Gets the number of remaining readable bytes. Contents are the bytes between {@link ByteBuffer#offset} and
	         *  {@link ByteBuffer#limit}, so this returns `limit - offset`.
	         * @returns {number} Remaining readable bytes. May be negative if `offset > limit`.
	         * @expose
	         */
	        ByteBufferPrototype.remaining = function() {
	            return this.limit - this.offset;
	        };
	        /**
	         * Resets this ByteBuffer's {@link ByteBuffer#offset}. If an offset has been marked through {@link ByteBuffer#mark}
	         *  before, `offset` will be set to {@link ByteBuffer#markedOffset}, which will then be discarded. If no offset has been
	         *  marked, sets `offset = 0`.
	         * @returns {!ByteBuffer} this
	         * @see ByteBuffer#mark
	         * @expose
	         */
	        ByteBufferPrototype.reset = function() {
	            if (this.markedOffset >= 0) {
	                this.offset = this.markedOffset;
	                this.markedOffset = -1;
	            } else {
	                this.offset = 0;
	            }
	            return this;
	        };
	        /**
	         * Resizes this ByteBuffer to be backed by a buffer of at least the given capacity. Will do nothing if already that
	         *  large or larger.
	         * @param {number} capacity Capacity required
	         * @returns {!ByteBuffer} this
	         * @throws {TypeError} If `capacity` is not a number
	         * @throws {RangeError} If `capacity < 0`
	         * @expose
	         */
	        ByteBufferPrototype.resize = function(capacity) {
	            if (!this.noAssert) {
	                if (typeof capacity !== 'number' || capacity % 1 !== 0)
	                    throw TypeError("Illegal capacity: "+capacity+" (not an integer)");
	                capacity |= 0;
	                if (capacity < 0)
	                    throw RangeError("Illegal capacity: 0 <= "+capacity);
	            }
	            if (this.buffer.byteLength < capacity) {
	                var buffer = new ArrayBuffer(capacity);
	                new Uint8Array(buffer).set(new Uint8Array(this.buffer));
	                this.buffer = buffer;
	                this.view = new DataView(buffer);
	            }
	            return this;
	        };
	        /**
	         * Reverses this ByteBuffer's contents.
	         * @param {number=} begin Offset to start at, defaults to {@link ByteBuffer#offset}
	         * @param {number=} end Offset to end at, defaults to {@link ByteBuffer#limit}
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.reverse = function(begin, end) {
	            if (typeof begin === 'undefined') begin = this.offset;
	            if (typeof end === 'undefined') end = this.limit;
	            if (!this.noAssert) {
	                if (typeof begin !== 'number' || begin % 1 !== 0)
	                    throw TypeError("Illegal begin: Not an integer");
	                begin >>>= 0;
	                if (typeof end !== 'number' || end % 1 !== 0)
	                    throw TypeError("Illegal end: Not an integer");
	                end >>>= 0;
	                if (begin < 0 || begin > end || end > this.buffer.byteLength)
	                    throw RangeError("Illegal range: 0 <= "+begin+" <= "+end+" <= "+this.buffer.byteLength);
	            }
	            if (begin === end)
	                return this; // Nothing to reverse
	            Array.prototype.reverse.call(new Uint8Array(this.buffer).subarray(begin, end));
	            this.view = new DataView(this.buffer); // FIXME: Why exactly is this necessary?
	            return this;
	        };
	        /**
	         * Skips the next `length` bytes. This will just advance
	         * @param {number} length Number of bytes to skip. May also be negative to move the offset back.
	         * @returns {!ByteBuffer} this
	         * @expose
	         */
	        ByteBufferPrototype.skip = function(length) {
	            if (!this.noAssert) {
	                if (typeof length !== 'number' || length % 1 !== 0)
	                    throw TypeError("Illegal length: "+length+" (not an integer)");
	                length |= 0;
	            }
	            var offset = this.offset + length;
	            if (!this.noAssert) {
	                if (offset < 0 || offset > this.buffer.byteLength)
	                    throw RangeError("Illegal length: 0 <= "+this.offset+" + "+length+" <= "+this.buffer.byteLength);
	            }
	            this.offset = offset;
	            return this;
	        };

	        /**
	         * Slices this ByteBuffer by creating a cloned instance with `offset = begin` and `limit = end`.
	         * @param {number=} begin Begin offset, defaults to {@link ByteBuffer#offset}.
	         * @param {number=} end End offset, defaults to {@link ByteBuffer#limit}.
	         * @returns {!ByteBuffer} Clone of this ByteBuffer with slicing applied, backed by the same {@link ByteBuffer#buffer}
	         * @expose
	         */
	        ByteBufferPrototype.slice = function(begin, end) {
	            if (typeof begin === 'undefined') begin = this.offset;
	            if (typeof end === 'undefined') end = this.limit;
	            if (!this.noAssert) {
	                if (typeof begin !== 'number' || begin % 1 !== 0)
	                    throw TypeError("Illegal begin: Not an integer");
	                begin >>>= 0;
	                if (typeof end !== 'number' || end % 1 !== 0)
	                    throw TypeError("Illegal end: Not an integer");
	                end >>>= 0;
	                if (begin < 0 || begin > end || end > this.buffer.byteLength)
	                    throw RangeError("Illegal range: 0 <= "+begin+" <= "+end+" <= "+this.buffer.byteLength);
	            }
	            var bb = this.clone();
	            bb.offset = begin;
	            bb.limit = end;
	            return bb;
	        };
	        /**
	         * Returns a copy of the backing buffer that contains this ByteBuffer's contents. Contents are the bytes between
	         *  {@link ByteBuffer#offset} and {@link ByteBuffer#limit}. Will transparently {@link ByteBuffer#flip} this
	         *  ByteBuffer if `offset > limit` but the actual offsets remain untouched.
	         * @param {boolean=} forceCopy If `true` returns a copy, otherwise returns a view referencing the same memory if
	         *  possible. Defaults to `false`
	         * @returns {!ArrayBuffer} Contents as an ArrayBuffer
	         * @expose
	         */
	        ByteBufferPrototype.toBuffer = function(forceCopy) {
	            var offset = this.offset,
	                limit = this.limit;
	            if (offset > limit) {
	                var t = offset;
	                offset = limit;
	                limit = t;
	            }
	            if (!this.noAssert) {
	                if (typeof offset !== 'number' || offset % 1 !== 0)
	                    throw TypeError("Illegal offset: Not an integer");
	                offset >>>= 0;
	                if (typeof limit !== 'number' || limit % 1 !== 0)
	                    throw TypeError("Illegal limit: Not an integer");
	                limit >>>= 0;
	                if (offset < 0 || offset > limit || limit > this.buffer.byteLength)
	                    throw RangeError("Illegal range: 0 <= "+offset+" <= "+limit+" <= "+this.buffer.byteLength);
	            }
	            // NOTE: It's not possible to have another ArrayBuffer reference the same memory as the backing buffer. This is
	            // possible with Uint8Array#subarray only, but we have to return an ArrayBuffer by contract. So:
	            if (!forceCopy && offset === 0 && limit === this.buffer.byteLength) {
	                return this.buffer;
	            }
	            if (offset === limit) {
	                return EMPTY_BUFFER;
	            }
	            var buffer = new ArrayBuffer(limit - offset);
	            new Uint8Array(buffer).set(new Uint8Array(this.buffer).subarray(offset, limit), 0);
	            return buffer;
	        };

	        /**
	         * Returns a raw buffer compacted to contain this ByteBuffer's contents. Contents are the bytes between
	         *  {@link ByteBuffer#offset} and {@link ByteBuffer#limit}. Will transparently {@link ByteBuffer#flip} this
	         *  ByteBuffer if `offset > limit` but the actual offsets remain untouched. This is an alias of
	         *  {@link ByteBuffer#toBuffer}.
	         * @function
	         * @param {boolean=} forceCopy If `true` returns a copy, otherwise returns a view referencing the same memory.
	         *  Defaults to `false`
	         * @returns {!ArrayBuffer} Contents as an ArrayBuffer
	         * @expose
	         */
	        ByteBufferPrototype.toArrayBuffer = ByteBufferPrototype.toBuffer;


	        /**
	         * Converts the ByteBuffer's contents to a string.
	         * @param {string=} encoding Output encoding. Returns an informative string representation if omitted but also allows
	         *  direct conversion to "utf8", "hex", "base64" and "binary" encoding. "debug" returns a hex representation with
	         *  highlighted offsets.
	         * @param {number=} begin Offset to begin at, defaults to {@link ByteBuffer#offset}
	         * @param {number=} end Offset to end at, defaults to {@link ByteBuffer#limit}
	         * @returns {string} String representation
	         * @throws {Error} If `encoding` is invalid
	         * @expose
	         */
	        ByteBufferPrototype.toString = function(encoding, begin, end) {
	            if (typeof encoding === 'undefined')
	                return "ByteBufferAB(offset="+this.offset+",markedOffset="+this.markedOffset+",limit="+this.limit+",capacity="+this.capacity()+")";
	            if (typeof encoding === 'number')
	                encoding = "utf8",
	                begin = encoding,
	                end = begin;
	            switch (encoding) {
	                case "utf8":
	                    return this.toUTF8(begin, end);
	                case "base64":
	                    return this.toBase64(begin, end);
	                case "hex":
	                    return this.toHex(begin, end);
	                case "binary":
	                    return this.toBinary(begin, end);
	                case "debug":
	                    return this.toDebug();
	                case "columns":
	                    return this.toColumns();
	                default:
	                    throw Error("Unsupported encoding: "+encoding);
	            }
	        };

	        // lxiv-embeddable

	        /**
	         * lxiv-embeddable (c) 2014 Daniel Wirtz <dcode@dcode.io>
	         * Released under the Apache License, Version 2.0
	         * see: https://github.com/dcodeIO/lxiv for details
	         */
	        var lxiv = function() {
	            "use strict";

	            /**
	             * lxiv namespace.
	             * @type {!Object.<string,*>}
	             * @exports lxiv
	             */
	            var lxiv = {};

	            /**
	             * Character codes for output.
	             * @type {!Array.<number>}
	             * @inner
	             */
	            var aout = [
	                65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80,
	                81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 97, 98, 99, 100, 101, 102,
	                103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118,
	                119, 120, 121, 122, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 43, 47
	            ];

	            /**
	             * Character codes for input.
	             * @type {!Array.<number>}
	             * @inner
	             */
	            var ain = [];
	            for (var i=0, k=aout.length; i<k; ++i)
	                ain[aout[i]] = i;

	            /**
	             * Encodes bytes to base64 char codes.
	             * @param {!function():number|null} src Bytes source as a function returning the next byte respectively `null` if
	             *  there are no more bytes left.
	             * @param {!function(number)} dst Characters destination as a function successively called with each encoded char
	             *  code.
	             */
	            lxiv.encode = function(src, dst) {
	                var b, t;
	                while ((b = src()) !== null) {
	                    dst(aout[(b>>2)&0x3f]);
	                    t = (b&0x3)<<4;
	                    if ((b = src()) !== null) {
	                        t |= (b>>4)&0xf;
	                        dst(aout[(t|((b>>4)&0xf))&0x3f]);
	                        t = (b&0xf)<<2;
	                        if ((b = src()) !== null)
	                            dst(aout[(t|((b>>6)&0x3))&0x3f]),
	                            dst(aout[b&0x3f]);
	                        else
	                            dst(aout[t&0x3f]),
	                            dst(61);
	                    } else
	                        dst(aout[t&0x3f]),
	                        dst(61),
	                        dst(61);
	                }
	            };

	            /**
	             * Decodes base64 char codes to bytes.
	             * @param {!function():number|null} src Characters source as a function returning the next char code respectively
	             *  `null` if there are no more characters left.
	             * @param {!function(number)} dst Bytes destination as a function successively called with the next byte.
	             * @throws {Error} If a character code is invalid
	             */
	            lxiv.decode = function(src, dst) {
	                var c, t1, t2;
	                function fail(c) {
	                    throw Error("Illegal character code: "+c);
	                }
	                while ((c = src()) !== null) {
	                    t1 = ain[c];
	                    if (typeof t1 === 'undefined') fail(c);
	                    if ((c = src()) !== null) {
	                        t2 = ain[c];
	                        if (typeof t2 === 'undefined') fail(c);
	                        dst((t1<<2)>>>0|(t2&0x30)>>4);
	                        if ((c = src()) !== null) {
	                            t1 = ain[c];
	                            if (typeof t1 === 'undefined')
	                                if (c === 61) break; else fail(c);
	                            dst(((t2&0xf)<<4)>>>0|(t1&0x3c)>>2);
	                            if ((c = src()) !== null) {
	                                t2 = ain[c];
	                                if (typeof t2 === 'undefined')
	                                    if (c === 61) break; else fail(c);
	                                dst(((t1&0x3)<<6)>>>0|t2);
	                            }
	                        }
	                    }
	                }
	            };

	            /**
	             * Tests if a string is valid base64.
	             * @param {string} str String to test
	             * @returns {boolean} `true` if valid, otherwise `false`
	             */
	            lxiv.test = function(str) {
	                return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(str);
	            };

	            return lxiv;
	        }();

	        // encodings/base64

	        /**
	         * Encodes this ByteBuffer's contents to a base64 encoded string.
	         * @param {number=} begin Offset to begin at, defaults to {@link ByteBuffer#offset}.
	         * @param {number=} end Offset to end at, defaults to {@link ByteBuffer#limit}.
	         * @returns {string} Base64 encoded string
	         * @expose
	         */
	        ByteBufferPrototype.toBase64 = function(begin, end) {
	            if (typeof begin === 'undefined')
	                begin = this.offset;
	            if (typeof end === 'undefined')
	                end = this.limit;
	            if (!this.noAssert) {
	                if (typeof begin !== 'number' || begin % 1 !== 0)
	                    throw TypeError("Illegal begin: Not an integer");
	                begin >>>= 0;
	                if (typeof end !== 'number' || end % 1 !== 0)
	                    throw TypeError("Illegal end: Not an integer");
	                end >>>= 0;
	                if (begin < 0 || begin > end || end > this.buffer.byteLength)
	                    throw RangeError("Illegal range: 0 <= "+begin+" <= "+end+" <= "+this.buffer.byteLength);
	            }
	            var sd; lxiv.encode(function() {
	                return begin < end ? this.view.getUint8(begin++) : null;
	            }.bind(this), sd = stringDestination());
	            return sd();
	        };

	        /**
	         * Decodes a base64 encoded string to a ByteBuffer.
	         * @param {string} str String to decode
	         * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
	         *  {@link ByteBuffer.DEFAULT_ENDIAN}.
	         * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
	         *  {@link ByteBuffer.DEFAULT_NOASSERT}.
	         * @returns {!ByteBuffer} ByteBuffer
	         * @expose
	         */
	        ByteBuffer.fromBase64 = function(str, littleEndian, noAssert) {
	            if (!noAssert) {
	                if (typeof str !== 'string')
	                    throw TypeError("Illegal str: Not a string");
	                if (str.length % 4 !== 0)
	                    throw TypeError("Illegal str: Length not a multiple of 4");
	            }
	            var bb = new ByteBuffer(str.length/4*3, littleEndian, noAssert),
	                i = 0;
	            lxiv.decode(stringSource(str), function(b) {
	                bb.view.setUint8(i++, b);
	            });
	            bb.limit = i;
	            return bb;
	        };

	        /**
	         * Encodes a binary string to base64 like `window.btoa` does.
	         * @param {string} str Binary string
	         * @returns {string} Base64 encoded string
	         * @see https://developer.mozilla.org/en-US/docs/Web/API/Window.btoa
	         * @expose
	         */
	        ByteBuffer.btoa = function(str) {
	            return ByteBuffer.fromBinary(str).toBase64();
	        };

	        /**
	         * Decodes a base64 encoded string to binary like `window.atob` does.
	         * @param {string} b64 Base64 encoded string
	         * @returns {string} Binary string
	         * @see https://developer.mozilla.org/en-US/docs/Web/API/Window.atob
	         * @expose
	         */
	        ByteBuffer.atob = function(b64) {
	            return ByteBuffer.fromBase64(b64).toBinary();
	        };

	        // encodings/binary

	        /**
	         * Encodes this ByteBuffer to a binary encoded string, that is using only characters 0x00-0xFF as bytes.
	         * @param {number=} begin Offset to begin at. Defaults to {@link ByteBuffer#offset}.
	         * @param {number=} end Offset to end at. Defaults to {@link ByteBuffer#limit}.
	         * @returns {string} Binary encoded string
	         * @throws {RangeError} If `offset > limit`
	         * @expose
	         */
	        ByteBufferPrototype.toBinary = function(begin, end) {
	            begin = typeof begin === 'undefined' ? this.offset : begin;
	            end = typeof end === 'undefined' ? this.limit : end;
	            if (!this.noAssert) {
	                if (typeof begin !== 'number' || begin % 1 !== 0)
	                    throw TypeError("Illegal begin: Not an integer");
	                begin >>>= 0;
	                if (typeof end !== 'number' || end % 1 !== 0)
	                    throw TypeError("Illegal end: Not an integer");
	                end >>>= 0;
	                if (begin < 0 || begin > end || end > this.buffer.byteLength)
	                    throw RangeError("Illegal range: 0 <= "+begin+" <= "+end+" <= "+this.buffer.byteLength);
	            }
	            if (begin === end)
	                return "";
	            var cc = [], pt = [];
	            while (begin < end) {
	                cc.push(this.view.getUint8(begin++));
	                if (cc.length >= 1024)
	                    pt.push(String.fromCharCode.apply(String, cc)),
	                    cc = [];
	            }
	            return pt.join('') + String.fromCharCode.apply(String, cc);
	        };

	        /**
	         * Decodes a binary encoded string, that is using only characters 0x00-0xFF as bytes, to a ByteBuffer.
	         * @param {string} str String to decode
	         * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
	         *  {@link ByteBuffer.DEFAULT_ENDIAN}.
	         * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
	         *  {@link ByteBuffer.DEFAULT_NOASSERT}.
	         * @returns {!ByteBuffer} ByteBuffer
	         * @expose
	         */
	        ByteBuffer.fromBinary = function(str, littleEndian, noAssert) {
	            if (!noAssert) {
	                if (typeof str !== 'string')
	                    throw TypeError("Illegal str: Not a string");
	            }
	            var i = 0, k = str.length, charCode,
	                bb = new ByteBuffer(k, littleEndian, noAssert);
	            while (i<k) {
	                charCode = str.charCodeAt(i);
	                if (!noAssert && charCode > 255)
	                    throw RangeError("Illegal charCode at "+i+": 0 <= "+charCode+" <= 255");
	                bb.view.setUint8(i++, charCode);
	            }
	            bb.limit = k;
	            return bb;
	        };

	        // encodings/debug

	        /**
	         * Encodes this ByteBuffer to a hex encoded string with marked offsets. Offset symbols are:
	         * * `<` : offset,
	         * * `'` : markedOffset,
	         * * `>` : limit,
	         * * `|` : offset and limit,
	         * * `[` : offset and markedOffset,
	         * * `]` : markedOffset and limit,
	         * * `!` : offset, markedOffset and limit
	         * @param {boolean=} columns If `true` returns two columns hex + ascii, defaults to `false`
	         * @returns {string|!Array.<string>} Debug string or array of lines if `asArray = true`
	         * @expose
	         * @example `>00'01 02<03` contains four bytes with `limit=0, markedOffset=1, offset=3`
	         * @example `00[01 02 03>` contains four bytes with `offset=markedOffset=1, limit=4`
	         * @example `00|01 02 03` contains four bytes with `offset=limit=1, markedOffset=-1`
	         * @example `|` contains zero bytes with `offset=limit=0, markedOffset=-1`
	         */
	        ByteBufferPrototype.toDebug = function(columns) {
	            var i = -1,
	                k = this.buffer.byteLength,
	                b,
	                hex = "",
	                asc = "",
	                out = "";
	            while (i<k) {
	                if (i !== -1) {
	                    b = this.view.getUint8(i);
	                    if (b < 0x10) hex += "0"+b.toString(16).toUpperCase();
	                    else hex += b.toString(16).toUpperCase();
	                    if (columns) {
	                        asc += b > 32 && b < 127 ? String.fromCharCode(b) : '.';
	                    }
	                }
	                ++i;
	                if (columns) {
	                    if (i > 0 && i % 16 === 0 && i !== k) {
	                        while (hex.length < 3*16+3) hex += " ";
	                        out += hex+asc+"\n";
	                        hex = asc = "";
	                    }
	                }
	                if (i === this.offset && i === this.limit)
	                    hex += i === this.markedOffset ? "!" : "|";
	                else if (i === this.offset)
	                    hex += i === this.markedOffset ? "[" : "<";
	                else if (i === this.limit)
	                    hex += i === this.markedOffset ? "]" : ">";
	                else
	                    hex += i === this.markedOffset ? "'" : (columns || (i !== 0 && i !== k) ? " " : "");
	            }
	            if (columns && hex !== " ") {
	                while (hex.length < 3*16+3) hex += " ";
	                out += hex+asc+"\n";
	            }
	            return columns ? out : hex;
	        };

	        /**
	         * Decodes a hex encoded string with marked offsets to a ByteBuffer.
	         * @param {string} str Debug string to decode (not be generated with `columns = true`)
	         * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
	         *  {@link ByteBuffer.DEFAULT_ENDIAN}.
	         * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
	         *  {@link ByteBuffer.DEFAULT_NOASSERT}.
	         * @returns {!ByteBuffer} ByteBuffer
	         * @expose
	         * @see ByteBuffer#toDebug
	         */
	        ByteBuffer.fromDebug = function(str, littleEndian, noAssert) {
	            var k = str.length,
	                bb = new ByteBuffer(((k+1)/3)|0, littleEndian, noAssert);
	            var i = 0, j = 0, ch, b,
	                rs = false, // Require symbol next
	                ho = false, hm = false, hl = false, // Already has offset, markedOffset, limit?
	                fail = false;
	            while (i<k) {
	                switch (ch = str.charAt(i++)) {
	                    case '!':
	                        if (!noAssert) {
	                            if (ho || hm || hl) {
	                                fail = true; break;
	                            }
	                            ho = hm = hl = true;
	                        }
	                        bb.offset = bb.markedOffset = bb.limit = j;
	                        rs = false;
	                        break;
	                    case '|':
	                        if (!noAssert) {
	                            if (ho || hl) {
	                                fail = true; break;
	                            }
	                            ho = hl = true;
	                        }
	                        bb.offset = bb.limit = j;
	                        rs = false;
	                        break;
	                    case '[':
	                        if (!noAssert) {
	                            if (ho || hm) {
	                                fail = true; break;
	                            }
	                            ho = hm = true;
	                        }
	                        bb.offset = bb.markedOffset = j;
	                        rs = false;
	                        break;
	                    case '<':
	                        if (!noAssert) {
	                            if (ho) {
	                                fail = true; break;
	                            }
	                            ho = true;
	                        }
	                        bb.offset = j;
	                        rs = false;
	                        break;
	                    case ']':
	                        if (!noAssert) {
	                            if (hl || hm) {
	                                fail = true; break;
	                            }
	                            hl = hm = true;
	                        }
	                        bb.limit = bb.markedOffset = j;
	                        rs = false;
	                        break;
	                    case '>':
	                        if (!noAssert) {
	                            if (hl) {
	                                fail = true; break;
	                            }
	                            hl = true;
	                        }
	                        bb.limit = j;
	                        rs = false;
	                        break;
	                    case "'":
	                        if (!noAssert) {
	                            if (hm) {
	                                fail = true; break;
	                            }
	                            hm = true;
	                        }
	                        bb.markedOffset = j;
	                        rs = false;
	                        break;
	                    case ' ':
	                        rs = false;
	                        break;
	                    default:
	                        if (!noAssert) {
	                            if (rs) {
	                                fail = true; break;
	                            }
	                        }
	                        b = parseInt(ch+str.charAt(i++), 16);
	                        if (!noAssert) {
	                            if (isNaN(b) || b < 0 || b > 255)
	                                throw TypeError("Illegal str: Not a debug encoded string");
	                        }
	                        bb.view.setUint8(j++, b);
	                        rs = true;
	                }
	                if (fail)
	                    throw TypeError("Illegal str: Invalid symbol at "+i);
	            }
	            if (!noAssert) {
	                if (!ho || !hl)
	                    throw TypeError("Illegal str: Missing offset or limit");
	                if (j<bb.buffer.byteLength)
	                    throw TypeError("Illegal str: Not a debug encoded string (is it hex?) "+j+" < "+k);
	            }
	            return bb;
	        };

	        // encodings/hex

	        /**
	         * Encodes this ByteBuffer's contents to a hex encoded string.
	         * @param {number=} begin Offset to begin at. Defaults to {@link ByteBuffer#offset}.
	         * @param {number=} end Offset to end at. Defaults to {@link ByteBuffer#limit}.
	         * @returns {string} Hex encoded string
	         * @expose
	         */
	        ByteBufferPrototype.toHex = function(begin, end) {
	            begin = typeof begin === 'undefined' ? this.offset : begin;
	            end = typeof end === 'undefined' ? this.limit : end;
	            if (!this.noAssert) {
	                if (typeof begin !== 'number' || begin % 1 !== 0)
	                    throw TypeError("Illegal begin: Not an integer");
	                begin >>>= 0;
	                if (typeof end !== 'number' || end % 1 !== 0)
	                    throw TypeError("Illegal end: Not an integer");
	                end >>>= 0;
	                if (begin < 0 || begin > end || end > this.buffer.byteLength)
	                    throw RangeError("Illegal range: 0 <= "+begin+" <= "+end+" <= "+this.buffer.byteLength);
	            }
	            var out = new Array(end - begin),
	                b;
	            while (begin < end) {
	                b = this.view.getUint8(begin++);
	                if (b < 0x10)
	                    out.push("0", b.toString(16));
	                else out.push(b.toString(16));
	            }
	            return out.join('');
	        };

	        /**
	         * Decodes a hex encoded string to a ByteBuffer.
	         * @param {string} str String to decode
	         * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
	         *  {@link ByteBuffer.DEFAULT_ENDIAN}.
	         * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
	         *  {@link ByteBuffer.DEFAULT_NOASSERT}.
	         * @returns {!ByteBuffer} ByteBuffer
	         * @expose
	         */
	        ByteBuffer.fromHex = function(str, littleEndian, noAssert) {
	            if (!noAssert) {
	                if (typeof str !== 'string')
	                    throw TypeError("Illegal str: Not a string");
	                if (str.length % 2 !== 0)
	                    throw TypeError("Illegal str: Length not a multiple of 2");
	            }
	            var k = str.length,
	                bb = new ByteBuffer((k / 2) | 0, littleEndian),
	                b;
	            for (var i=0, j=0; i<k; i+=2) {
	                b = parseInt(str.substring(i, i+2), 16);
	                if (!noAssert)
	                    if (!isFinite(b) || b < 0 || b > 255)
	                        throw TypeError("Illegal str: Contains non-hex characters");
	                bb.view.setUint8(j++, b);
	            }
	            bb.limit = j;
	            return bb;
	        };

	        // utfx-embeddable

	        /**
	         * utfx-embeddable (c) 2014 Daniel Wirtz <dcode@dcode.io>
	         * Released under the Apache License, Version 2.0
	         * see: https://github.com/dcodeIO/utfx for details
	         */
	        var utfx = function() {
	            "use strict";

	            /**
	             * utfx namespace.
	             * @inner
	             * @type {!Object.<string,*>}
	             */
	            var utfx = {};

	            /**
	             * Maximum valid code point.
	             * @type {number}
	             * @const
	             */
	            utfx.MAX_CODEPOINT = 0x10FFFF;

	            /**
	             * Encodes UTF8 code points to UTF8 bytes.
	             * @param {(!function():number|null) | number} src Code points source, either as a function returning the next code point
	             *  respectively `null` if there are no more code points left or a single numeric code point.
	             * @param {!function(number)} dst Bytes destination as a function successively called with the next byte
	             */
	            utfx.encodeUTF8 = function(src, dst) {
	                var cp = null;
	                if (typeof src === 'number')
	                    cp = src,
	                    src = function() { return null; };
	                while (cp !== null || (cp = src()) !== null) {
	                    if (cp < 0x80)
	                        dst(cp&0x7F);
	                    else if (cp < 0x800)
	                        dst(((cp>>6)&0x1F)|0xC0),
	                        dst((cp&0x3F)|0x80);
	                    else if (cp < 0x10000)
	                        dst(((cp>>12)&0x0F)|0xE0),
	                        dst(((cp>>6)&0x3F)|0x80),
	                        dst((cp&0x3F)|0x80);
	                    else
	                        dst(((cp>>18)&0x07)|0xF0),
	                        dst(((cp>>12)&0x3F)|0x80),
	                        dst(((cp>>6)&0x3F)|0x80),
	                        dst((cp&0x3F)|0x80);
	                    cp = null;
	                }
	            };

	            /**
	             * Decodes UTF8 bytes to UTF8 code points.
	             * @param {!function():number|null} src Bytes source as a function returning the next byte respectively `null` if there
	             *  are no more bytes left.
	             * @param {!function(number)} dst Code points destination as a function successively called with each decoded code point.
	             * @throws {RangeError} If a starting byte is invalid in UTF8
	             * @throws {Error} If the last sequence is truncated. Has an array property `bytes` holding the
	             *  remaining bytes.
	             */
	            utfx.decodeUTF8 = function(src, dst) {
	                var a, b, c, d, fail = function(b) {
	                    b = b.slice(0, b.indexOf(null));
	                    var err = Error(b.toString());
	                    err.name = "TruncatedError";
	                    err['bytes'] = b;
	                    throw err;
	                };
	                while ((a = src()) !== null) {
	                    if ((a&0x80) === 0)
	                        dst(a);
	                    else if ((a&0xE0) === 0xC0)
	                        ((b = src()) === null) && fail([a, b]),
	                        dst(((a&0x1F)<<6) | (b&0x3F));
	                    else if ((a&0xF0) === 0xE0)
	                        ((b=src()) === null || (c=src()) === null) && fail([a, b, c]),
	                        dst(((a&0x0F)<<12) | ((b&0x3F)<<6) | (c&0x3F));
	                    else if ((a&0xF8) === 0xF0)
	                        ((b=src()) === null || (c=src()) === null || (d=src()) === null) && fail([a, b, c ,d]),
	                        dst(((a&0x07)<<18) | ((b&0x3F)<<12) | ((c&0x3F)<<6) | (d&0x3F));
	                    else throw RangeError("Illegal starting byte: "+a);
	                }
	            };

	            /**
	             * Converts UTF16 characters to UTF8 code points.
	             * @param {!function():number|null} src Characters source as a function returning the next char code respectively
	             *  `null` if there are no more characters left.
	             * @param {!function(number)} dst Code points destination as a function successively called with each converted code
	             *  point.
	             */
	            utfx.UTF16toUTF8 = function(src, dst) {
	                var c1, c2 = null;
	                while (true) {
	                    if ((c1 = c2 !== null ? c2 : src()) === null)
	                        break;
	                    if (c1 >= 0xD800 && c1 <= 0xDFFF) {
	                        if ((c2 = src()) !== null) {
	                            if (c2 >= 0xDC00 && c2 <= 0xDFFF) {
	                                dst((c1-0xD800)*0x400+c2-0xDC00+0x10000);
	                                c2 = null; continue;
	                            }
	                        }
	                    }
	                    dst(c1);
	                }
	                if (c2 !== null) dst(c2);
	            };

	            /**
	             * Converts UTF8 code points to UTF16 characters.
	             * @param {(!function():number|null) | number} src Code points source, either as a function returning the next code point
	             *  respectively `null` if there are no more code points left or a single numeric code point.
	             * @param {!function(number)} dst Characters destination as a function successively called with each converted char code.
	             * @throws {RangeError} If a code point is out of range
	             */
	            utfx.UTF8toUTF16 = function(src, dst) {
	                var cp = null;
	                if (typeof src === 'number')
	                    cp = src, src = function() { return null; };
	                while (cp !== null || (cp = src()) !== null) {
	                    if (cp <= 0xFFFF)
	                        dst(cp);
	                    else
	                        cp -= 0x10000,
	                        dst((cp>>10)+0xD800),
	                        dst((cp%0x400)+0xDC00);
	                    cp = null;
	                }
	            };

	            /**
	             * Converts and encodes UTF16 characters to UTF8 bytes.
	             * @param {!function():number|null} src Characters source as a function returning the next char code respectively `null`
	             *  if there are no more characters left.
	             * @param {!function(number)} dst Bytes destination as a function successively called with the next byte.
	             */
	            utfx.encodeUTF16toUTF8 = function(src, dst) {
	                utfx.UTF16toUTF8(src, function(cp) {
	                    utfx.encodeUTF8(cp, dst);
	                });
	            };

	            /**
	             * Decodes and converts UTF8 bytes to UTF16 characters.
	             * @param {!function():number|null} src Bytes source as a function returning the next byte respectively `null` if there
	             *  are no more bytes left.
	             * @param {!function(number)} dst Characters destination as a function successively called with each converted char code.
	             * @throws {RangeError} If a starting byte is invalid in UTF8
	             * @throws {Error} If the last sequence is truncated. Has an array property `bytes` holding the remaining bytes.
	             */
	            utfx.decodeUTF8toUTF16 = function(src, dst) {
	                utfx.decodeUTF8(src, function(cp) {
	                    utfx.UTF8toUTF16(cp, dst);
	                });
	            };

	            /**
	             * Calculates the byte length of an UTF8 code point.
	             * @param {number} cp UTF8 code point
	             * @returns {number} Byte length
	             */
	            utfx.calculateCodePoint = function(cp) {
	                return (cp < 0x80) ? 1 : (cp < 0x800) ? 2 : (cp < 0x10000) ? 3 : 4;
	            };

	            /**
	             * Calculates the number of UTF8 bytes required to store UTF8 code points.
	             * @param {(!function():number|null)} src Code points source as a function returning the next code point respectively
	             *  `null` if there are no more code points left.
	             * @returns {number} The number of UTF8 bytes required
	             */
	            utfx.calculateUTF8 = function(src) {
	                var cp, l=0;
	                while ((cp = src()) !== null)
	                    l += utfx.calculateCodePoint(cp);
	                return l;
	            };

	            /**
	             * Calculates the number of UTF8 code points respectively UTF8 bytes required to store UTF16 char codes.
	             * @param {(!function():number|null)} src Characters source as a function returning the next char code respectively
	             *  `null` if there are no more characters left.
	             * @returns {!Array.<number>} The number of UTF8 code points at index 0 and the number of UTF8 bytes required at index 1.
	             */
	            utfx.calculateUTF16asUTF8 = function(src) {
	                var n=0, l=0;
	                utfx.UTF16toUTF8(src, function(cp) {
	                    ++n; l += utfx.calculateCodePoint(cp);
	                });
	                return [n,l];
	            };

	            return utfx;
	        }();

	        // encodings/utf8

	        /**
	         * Encodes this ByteBuffer's contents between {@link ByteBuffer#offset} and {@link ByteBuffer#limit} to an UTF8 encoded
	         *  string.
	         * @returns {string} Hex encoded string
	         * @throws {RangeError} If `offset > limit`
	         * @expose
	         */
	        ByteBufferPrototype.toUTF8 = function(begin, end) {
	            if (typeof begin === 'undefined') begin = this.offset;
	            if (typeof end === 'undefined') end = this.limit;
	            if (!this.noAssert) {
	                if (typeof begin !== 'number' || begin % 1 !== 0)
	                    throw TypeError("Illegal begin: Not an integer");
	                begin >>>= 0;
	                if (typeof end !== 'number' || end % 1 !== 0)
	                    throw TypeError("Illegal end: Not an integer");
	                end >>>= 0;
	                if (begin < 0 || begin > end || end > this.buffer.byteLength)
	                    throw RangeError("Illegal range: 0 <= "+begin+" <= "+end+" <= "+this.buffer.byteLength);
	            }
	            var sd; try {
	                utfx.decodeUTF8toUTF16(function() {
	                    return begin < end ? this.view.getUint8(begin++) : null;
	                }.bind(this), sd = stringDestination());
	            } catch (e) {
	                if (begin !== end)
	                    throw RangeError("Illegal range: Truncated data, "+begin+" != "+end);
	            }
	            return sd();
	        };

	        /**
	         * Decodes an UTF8 encoded string to a ByteBuffer.
	         * @param {string} str String to decode
	         * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
	         *  {@link ByteBuffer.DEFAULT_ENDIAN}.
	         * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
	         *  {@link ByteBuffer.DEFAULT_NOASSERT}.
	         * @returns {!ByteBuffer} ByteBuffer
	         * @expose
	         */
	        ByteBuffer.fromUTF8 = function(str, littleEndian, noAssert) {
	            if (!noAssert)
	                if (typeof str !== 'string')
	                    throw TypeError("Illegal str: Not a string");
	            var bb = new ByteBuffer(utfx.calculateUTF16asUTF8(stringSource(str), true)[1], littleEndian, noAssert),
	                i = 0;
	            utfx.encodeUTF16toUTF8(stringSource(str), function(b) {
	                bb.view.setUint8(i++, b);
	            });
	            bb.limit = i;
	            return bb;
	        };


	        return ByteBuffer;
	    }

	    /* CommonJS */ if ("function" === 'function' && typeof module === 'object' && module && typeof exports === 'object' && exports)
	        module['exports'] = (function() {
	            var Long; try { Long = __webpack_require__(7); } catch (e) {}
	            return loadByteBuffer(Long);
	        })();
	    /* AMD */ else if ("function" === 'function' && __webpack_require__(8)["amd"])
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(9)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Long) { return loadByteBuffer(Long); }.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    /* Global */ else
	        (global["dcodeIO"] = global["dcodeIO"] || {})["ByteBuffer"] = loadByteBuffer(global["dcodeIO"]["Long"]);

	})(this);

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)(module)))

/***/ },
/* 11 */
/***/ function(module, exports) {

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

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
		value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _set2 = __webpack_require__(13);

	var _set3 = _interopRequireDefault(_set2);

	var _get2 = __webpack_require__(68);

	var _get3 = _interopRequireDefault(_get2);

	var _sha = __webpack_require__(70);

	var _sha2 = _interopRequireDefault(_sha);

	var _ApiError = __webpack_require__(11);

	var _ApiError2 = _interopRequireDefault(_ApiError);

	var _ngRequire = __webpack_require__(71);

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
					var hashKey = (0, _sha2.default)([api.name, data.inputSign].join('.'));

					if (data.response) {
						console.debug(api.name, 'stored in cache:', hashKey);
						(0, _set3.default)(this.localStorage, 'cache.' + hashKey, {
							v: data.response,
							h: data.cacheSign
						});
					} else {
						console.debug(api.name, 'provide from cache:', hashKey);
						data.response = (0, _get3.default)(this.localStorage, 'cache.' + hashKey + '.v');
					}
				}

				if (data.error_code) {
					var err = this.parseError(data);
					this.rootScope.$emit('eqApi.error', err);
					promise.reject(err);
				} else {
					promise.resolve(data.response, data);
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

					var inputSign = (0, _sha2.default)(JSON.stringify(data.args));
					var hashKey = (0, _sha2.default)([data.method, inputSign].join('.'));

					data.args.__cache = (0, _get3.default)(this.localStorage, 'cache.' + hashKey + '.h');
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

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	var baseSet = __webpack_require__(14);

	/**
	 * Sets the value at `path` of `object`. If a portion of `path` doesn't exist,
	 * it's created. Arrays are created for missing index properties while objects
	 * are created for all other missing properties. Use `_.setWith` to customize
	 * `path` creation.
	 *
	 * **Note:** This method mutates `object`.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.7.0
	 * @category Object
	 * @param {Object} object The object to modify.
	 * @param {Array|string} path The path of the property to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns `object`.
	 * @example
	 *
	 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
	 *
	 * _.set(object, 'a[0].b.c', 4);
	 * console.log(object.a[0].b.c);
	 * // => 4
	 *
	 * _.set(object, ['x', '0', 'y', 'z'], 5);
	 * console.log(object.x[0].y.z);
	 * // => 5
	 */
	function set(object, path, value) {
	  return object == null ? object : baseSet(object, path, value);
	}

	module.exports = set;


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	var assignValue = __webpack_require__(15),
	    castPath = __webpack_require__(32),
	    isIndex = __webpack_require__(66),
	    isObject = __webpack_require__(3),
	    toKey = __webpack_require__(67);

	/**
	 * The base implementation of `_.set`.
	 *
	 * @private
	 * @param {Object} object The object to modify.
	 * @param {Array|string} path The path of the property to set.
	 * @param {*} value The value to set.
	 * @param {Function} [customizer] The function to customize path creation.
	 * @returns {Object} Returns `object`.
	 */
	function baseSet(object, path, value, customizer) {
	  if (!isObject(object)) {
	    return object;
	  }
	  path = castPath(path, object);

	  var index = -1,
	      length = path.length,
	      lastIndex = length - 1,
	      nested = object;

	  while (nested != null && ++index < length) {
	    var key = toKey(path[index]),
	        newValue = value;

	    if (index != lastIndex) {
	      var objValue = nested[key];
	      newValue = customizer ? customizer(objValue, key, nested) : undefined;
	      if (newValue === undefined) {
	        newValue = isObject(objValue)
	          ? objValue
	          : (isIndex(path[index + 1]) ? [] : {});
	      }
	    }
	    assignValue(nested, key, newValue);
	    nested = nested[key];
	  }
	  return object;
	}

	module.exports = baseSet;


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	var baseAssignValue = __webpack_require__(16),
	    eq = __webpack_require__(31);

	/** Used for built-in method references. */
	var objectProto = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/**
	 * Assigns `value` to `key` of `object` if the existing value is not equivalent
	 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
	 * for equality comparisons.
	 *
	 * @private
	 * @param {Object} object The object to modify.
	 * @param {string} key The key of the property to assign.
	 * @param {*} value The value to assign.
	 */
	function assignValue(object, key, value) {
	  var objValue = object[key];
	  if (!(hasOwnProperty.call(object, key) && eq(objValue, value)) ||
	      (value === undefined && !(key in object))) {
	    baseAssignValue(object, key, value);
	  }
	}

	module.exports = assignValue;


/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	var defineProperty = __webpack_require__(17);

	/**
	 * The base implementation of `assignValue` and `assignMergeValue` without
	 * value checks.
	 *
	 * @private
	 * @param {Object} object The object to modify.
	 * @param {string} key The key of the property to assign.
	 * @param {*} value The value to assign.
	 */
	function baseAssignValue(object, key, value) {
	  if (key == '__proto__' && defineProperty) {
	    defineProperty(object, key, {
	      'configurable': true,
	      'enumerable': true,
	      'value': value,
	      'writable': true
	    });
	  } else {
	    object[key] = value;
	  }
	}

	module.exports = baseAssignValue;


/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	var getNative = __webpack_require__(18);

	var defineProperty = (function() {
	  try {
	    var func = getNative(Object, 'defineProperty');
	    func({}, '', {});
	    return func;
	  } catch (e) {}
	}());

	module.exports = defineProperty;


/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	var baseIsNative = __webpack_require__(19),
	    getValue = __webpack_require__(30);

	/**
	 * Gets the native function at `key` of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {string} key The key of the method to get.
	 * @returns {*} Returns the function if it's native, else `undefined`.
	 */
	function getNative(object, key) {
	  var value = getValue(object, key);
	  return baseIsNative(value) ? value : undefined;
	}

	module.exports = getNative;


/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	var isFunction = __webpack_require__(20),
	    isMasked = __webpack_require__(27),
	    isObject = __webpack_require__(3),
	    toSource = __webpack_require__(29);

	/**
	 * Used to match `RegExp`
	 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
	 */
	var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

	/** Used to detect host constructors (Safari). */
	var reIsHostCtor = /^\[object .+?Constructor\]$/;

	/** Used for built-in method references. */
	var funcProto = Function.prototype,
	    objectProto = Object.prototype;

	/** Used to resolve the decompiled source of functions. */
	var funcToString = funcProto.toString;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/** Used to detect if a method is native. */
	var reIsNative = RegExp('^' +
	  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
	  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
	);

	/**
	 * The base implementation of `_.isNative` without bad shim checks.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a native function,
	 *  else `false`.
	 */
	function baseIsNative(value) {
	  if (!isObject(value) || isMasked(value)) {
	    return false;
	  }
	  var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
	  return pattern.test(toSource(value));
	}

	module.exports = baseIsNative;


/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	var baseGetTag = __webpack_require__(21),
	    isObject = __webpack_require__(3);

	/** `Object#toString` result references. */
	var asyncTag = '[object AsyncFunction]',
	    funcTag = '[object Function]',
	    genTag = '[object GeneratorFunction]',
	    proxyTag = '[object Proxy]';

	/**
	 * Checks if `value` is classified as a `Function` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
	 * @example
	 *
	 * _.isFunction(_);
	 * // => true
	 *
	 * _.isFunction(/abc/);
	 * // => false
	 */
	function isFunction(value) {
	  if (!isObject(value)) {
	    return false;
	  }
	  // The use of `Object#toString` avoids issues with the `typeof` operator
	  // in Safari 9 which returns 'object' for typed arrays and other constructors.
	  var tag = baseGetTag(value);
	  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
	}

	module.exports = isFunction;


/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	var Symbol = __webpack_require__(22),
	    getRawTag = __webpack_require__(25),
	    objectToString = __webpack_require__(26);

	/** `Object#toString` result references. */
	var nullTag = '[object Null]',
	    undefinedTag = '[object Undefined]';

	/** Built-in value references. */
	var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

	/**
	 * The base implementation of `getTag` without fallbacks for buggy environments.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @returns {string} Returns the `toStringTag`.
	 */
	function baseGetTag(value) {
	  if (value == null) {
	    return value === undefined ? undefinedTag : nullTag;
	  }
	  return (symToStringTag && symToStringTag in Object(value))
	    ? getRawTag(value)
	    : objectToString(value);
	}

	module.exports = baseGetTag;


/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	var root = __webpack_require__(23);

	/** Built-in value references. */
	var Symbol = root.Symbol;

	module.exports = Symbol;


/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	var freeGlobal = __webpack_require__(24);

	/** Detect free variable `self`. */
	var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

	/** Used as a reference to the global object. */
	var root = freeGlobal || freeSelf || Function('return this')();

	module.exports = root;


/***/ },
/* 24 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {/** Detect free variable `global` from Node.js. */
	var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

	module.exports = freeGlobal;

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	var Symbol = __webpack_require__(22);

	/** Used for built-in method references. */
	var objectProto = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/**
	 * Used to resolve the
	 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var nativeObjectToString = objectProto.toString;

	/** Built-in value references. */
	var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

	/**
	 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @returns {string} Returns the raw `toStringTag`.
	 */
	function getRawTag(value) {
	  var isOwn = hasOwnProperty.call(value, symToStringTag),
	      tag = value[symToStringTag];

	  try {
	    value[symToStringTag] = undefined;
	    var unmasked = true;
	  } catch (e) {}

	  var result = nativeObjectToString.call(value);
	  if (unmasked) {
	    if (isOwn) {
	      value[symToStringTag] = tag;
	    } else {
	      delete value[symToStringTag];
	    }
	  }
	  return result;
	}

	module.exports = getRawTag;


/***/ },
/* 26 */
/***/ function(module, exports) {

	/** Used for built-in method references. */
	var objectProto = Object.prototype;

	/**
	 * Used to resolve the
	 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var nativeObjectToString = objectProto.toString;

	/**
	 * Converts `value` to a string using `Object.prototype.toString`.
	 *
	 * @private
	 * @param {*} value The value to convert.
	 * @returns {string} Returns the converted string.
	 */
	function objectToString(value) {
	  return nativeObjectToString.call(value);
	}

	module.exports = objectToString;


/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	var coreJsData = __webpack_require__(28);

	/** Used to detect methods masquerading as native. */
	var maskSrcKey = (function() {
	  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
	  return uid ? ('Symbol(src)_1.' + uid) : '';
	}());

	/**
	 * Checks if `func` has its source masked.
	 *
	 * @private
	 * @param {Function} func The function to check.
	 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
	 */
	function isMasked(func) {
	  return !!maskSrcKey && (maskSrcKey in func);
	}

	module.exports = isMasked;


/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	var root = __webpack_require__(23);

	/** Used to detect overreaching core-js shims. */
	var coreJsData = root['__core-js_shared__'];

	module.exports = coreJsData;


/***/ },
/* 29 */
/***/ function(module, exports) {

	/** Used for built-in method references. */
	var funcProto = Function.prototype;

	/** Used to resolve the decompiled source of functions. */
	var funcToString = funcProto.toString;

	/**
	 * Converts `func` to its source code.
	 *
	 * @private
	 * @param {Function} func The function to convert.
	 * @returns {string} Returns the source code.
	 */
	function toSource(func) {
	  if (func != null) {
	    try {
	      return funcToString.call(func);
	    } catch (e) {}
	    try {
	      return (func + '');
	    } catch (e) {}
	  }
	  return '';
	}

	module.exports = toSource;


/***/ },
/* 30 */
/***/ function(module, exports) {

	/**
	 * Gets the value at `key` of `object`.
	 *
	 * @private
	 * @param {Object} [object] The object to query.
	 * @param {string} key The key of the property to get.
	 * @returns {*} Returns the property value.
	 */
	function getValue(object, key) {
	  return object == null ? undefined : object[key];
	}

	module.exports = getValue;


/***/ },
/* 31 */
/***/ function(module, exports) {

	/**
	 * Performs a
	 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
	 * comparison between two values to determine if they are equivalent.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	 * @example
	 *
	 * var object = { 'a': 1 };
	 * var other = { 'a': 1 };
	 *
	 * _.eq(object, object);
	 * // => true
	 *
	 * _.eq(object, other);
	 * // => false
	 *
	 * _.eq('a', 'a');
	 * // => true
	 *
	 * _.eq('a', Object('a'));
	 * // => false
	 *
	 * _.eq(NaN, NaN);
	 * // => true
	 */
	function eq(value, other) {
	  return value === other || (value !== value && other !== other);
	}

	module.exports = eq;


/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	var isArray = __webpack_require__(33),
	    isKey = __webpack_require__(34),
	    stringToPath = __webpack_require__(37),
	    toString = __webpack_require__(63);

	/**
	 * Casts `value` to a path array if it's not one.
	 *
	 * @private
	 * @param {*} value The value to inspect.
	 * @param {Object} [object] The object to query keys on.
	 * @returns {Array} Returns the cast property path array.
	 */
	function castPath(value, object) {
	  if (isArray(value)) {
	    return value;
	  }
	  return isKey(value, object) ? [value] : stringToPath(toString(value));
	}

	module.exports = castPath;


/***/ },
/* 33 */
/***/ function(module, exports) {

	/**
	 * Checks if `value` is classified as an `Array` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
	 * @example
	 *
	 * _.isArray([1, 2, 3]);
	 * // => true
	 *
	 * _.isArray(document.body.children);
	 * // => false
	 *
	 * _.isArray('abc');
	 * // => false
	 *
	 * _.isArray(_.noop);
	 * // => false
	 */
	var isArray = Array.isArray;

	module.exports = isArray;


/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	var isArray = __webpack_require__(33),
	    isSymbol = __webpack_require__(35);

	/** Used to match property names within property paths. */
	var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
	    reIsPlainProp = /^\w*$/;

	/**
	 * Checks if `value` is a property name and not a property path.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {Object} [object] The object to query keys on.
	 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
	 */
	function isKey(value, object) {
	  if (isArray(value)) {
	    return false;
	  }
	  var type = typeof value;
	  if (type == 'number' || type == 'symbol' || type == 'boolean' ||
	      value == null || isSymbol(value)) {
	    return true;
	  }
	  return reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
	    (object != null && value in Object(object));
	}

	module.exports = isKey;


/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	var baseGetTag = __webpack_require__(21),
	    isObjectLike = __webpack_require__(36);

	/** `Object#toString` result references. */
	var symbolTag = '[object Symbol]';

	/**
	 * Checks if `value` is classified as a `Symbol` primitive or object.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
	 * @example
	 *
	 * _.isSymbol(Symbol.iterator);
	 * // => true
	 *
	 * _.isSymbol('abc');
	 * // => false
	 */
	function isSymbol(value) {
	  return typeof value == 'symbol' ||
	    (isObjectLike(value) && baseGetTag(value) == symbolTag);
	}

	module.exports = isSymbol;


/***/ },
/* 36 */
/***/ function(module, exports) {

	/**
	 * Checks if `value` is object-like. A value is object-like if it's not `null`
	 * and has a `typeof` result of "object".
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	 * @example
	 *
	 * _.isObjectLike({});
	 * // => true
	 *
	 * _.isObjectLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isObjectLike(_.noop);
	 * // => false
	 *
	 * _.isObjectLike(null);
	 * // => false
	 */
	function isObjectLike(value) {
	  return value != null && typeof value == 'object';
	}

	module.exports = isObjectLike;


/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	var memoizeCapped = __webpack_require__(38);

	/** Used to match property names within property paths. */
	var reLeadingDot = /^\./,
	    rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

	/** Used to match backslashes in property paths. */
	var reEscapeChar = /\\(\\)?/g;

	/**
	 * Converts `string` to a property path array.
	 *
	 * @private
	 * @param {string} string The string to convert.
	 * @returns {Array} Returns the property path array.
	 */
	var stringToPath = memoizeCapped(function(string) {
	  var result = [];
	  if (reLeadingDot.test(string)) {
	    result.push('');
	  }
	  string.replace(rePropName, function(match, number, quote, string) {
	    result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
	  });
	  return result;
	});

	module.exports = stringToPath;


/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	var memoize = __webpack_require__(39);

	/** Used as the maximum memoize cache size. */
	var MAX_MEMOIZE_SIZE = 500;

	/**
	 * A specialized version of `_.memoize` which clears the memoized function's
	 * cache when it exceeds `MAX_MEMOIZE_SIZE`.
	 *
	 * @private
	 * @param {Function} func The function to have its output memoized.
	 * @returns {Function} Returns the new memoized function.
	 */
	function memoizeCapped(func) {
	  var result = memoize(func, function(key) {
	    if (cache.size === MAX_MEMOIZE_SIZE) {
	      cache.clear();
	    }
	    return key;
	  });

	  var cache = result.cache;
	  return result;
	}

	module.exports = memoizeCapped;


/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	var MapCache = __webpack_require__(40);

	/** Error message constants. */
	var FUNC_ERROR_TEXT = 'Expected a function';

	/**
	 * Creates a function that memoizes the result of `func`. If `resolver` is
	 * provided, it determines the cache key for storing the result based on the
	 * arguments provided to the memoized function. By default, the first argument
	 * provided to the memoized function is used as the map cache key. The `func`
	 * is invoked with the `this` binding of the memoized function.
	 *
	 * **Note:** The cache is exposed as the `cache` property on the memoized
	 * function. Its creation may be customized by replacing the `_.memoize.Cache`
	 * constructor with one whose instances implement the
	 * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
	 * method interface of `clear`, `delete`, `get`, `has`, and `set`.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Function
	 * @param {Function} func The function to have its output memoized.
	 * @param {Function} [resolver] The function to resolve the cache key.
	 * @returns {Function} Returns the new memoized function.
	 * @example
	 *
	 * var object = { 'a': 1, 'b': 2 };
	 * var other = { 'c': 3, 'd': 4 };
	 *
	 * var values = _.memoize(_.values);
	 * values(object);
	 * // => [1, 2]
	 *
	 * values(other);
	 * // => [3, 4]
	 *
	 * object.a = 2;
	 * values(object);
	 * // => [1, 2]
	 *
	 * // Modify the result cache.
	 * values.cache.set(object, ['a', 'b']);
	 * values(object);
	 * // => ['a', 'b']
	 *
	 * // Replace `_.memoize.Cache`.
	 * _.memoize.Cache = WeakMap;
	 */
	function memoize(func, resolver) {
	  if (typeof func != 'function' || (resolver != null && typeof resolver != 'function')) {
	    throw new TypeError(FUNC_ERROR_TEXT);
	  }
	  var memoized = function() {
	    var args = arguments,
	        key = resolver ? resolver.apply(this, args) : args[0],
	        cache = memoized.cache;

	    if (cache.has(key)) {
	      return cache.get(key);
	    }
	    var result = func.apply(this, args);
	    memoized.cache = cache.set(key, result) || cache;
	    return result;
	  };
	  memoized.cache = new (memoize.Cache || MapCache);
	  return memoized;
	}

	// Expose `MapCache`.
	memoize.Cache = MapCache;

	module.exports = memoize;


/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	var mapCacheClear = __webpack_require__(41),
	    mapCacheDelete = __webpack_require__(57),
	    mapCacheGet = __webpack_require__(60),
	    mapCacheHas = __webpack_require__(61),
	    mapCacheSet = __webpack_require__(62);

	/**
	 * Creates a map cache object to store key-value pairs.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function MapCache(entries) {
	  var index = -1,
	      length = entries == null ? 0 : entries.length;

	  this.clear();
	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}

	// Add methods to `MapCache`.
	MapCache.prototype.clear = mapCacheClear;
	MapCache.prototype['delete'] = mapCacheDelete;
	MapCache.prototype.get = mapCacheGet;
	MapCache.prototype.has = mapCacheHas;
	MapCache.prototype.set = mapCacheSet;

	module.exports = MapCache;


/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	var Hash = __webpack_require__(42),
	    ListCache = __webpack_require__(49),
	    Map = __webpack_require__(56);

	/**
	 * Removes all key-value entries from the map.
	 *
	 * @private
	 * @name clear
	 * @memberOf MapCache
	 */
	function mapCacheClear() {
	  this.size = 0;
	  this.__data__ = {
	    'hash': new Hash,
	    'map': new (Map || ListCache),
	    'string': new Hash
	  };
	}

	module.exports = mapCacheClear;


/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	var hashClear = __webpack_require__(43),
	    hashDelete = __webpack_require__(45),
	    hashGet = __webpack_require__(46),
	    hashHas = __webpack_require__(47),
	    hashSet = __webpack_require__(48);

	/**
	 * Creates a hash object.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function Hash(entries) {
	  var index = -1,
	      length = entries == null ? 0 : entries.length;

	  this.clear();
	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}

	// Add methods to `Hash`.
	Hash.prototype.clear = hashClear;
	Hash.prototype['delete'] = hashDelete;
	Hash.prototype.get = hashGet;
	Hash.prototype.has = hashHas;
	Hash.prototype.set = hashSet;

	module.exports = Hash;


/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	var nativeCreate = __webpack_require__(44);

	/**
	 * Removes all key-value entries from the hash.
	 *
	 * @private
	 * @name clear
	 * @memberOf Hash
	 */
	function hashClear() {
	  this.__data__ = nativeCreate ? nativeCreate(null) : {};
	  this.size = 0;
	}

	module.exports = hashClear;


/***/ },
/* 44 */
/***/ function(module, exports, __webpack_require__) {

	var getNative = __webpack_require__(18);

	/* Built-in method references that are verified to be native. */
	var nativeCreate = getNative(Object, 'create');

	module.exports = nativeCreate;


/***/ },
/* 45 */
/***/ function(module, exports) {

	/**
	 * Removes `key` and its value from the hash.
	 *
	 * @private
	 * @name delete
	 * @memberOf Hash
	 * @param {Object} hash The hash to modify.
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function hashDelete(key) {
	  var result = this.has(key) && delete this.__data__[key];
	  this.size -= result ? 1 : 0;
	  return result;
	}

	module.exports = hashDelete;


/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	var nativeCreate = __webpack_require__(44);

	/** Used to stand-in for `undefined` hash values. */
	var HASH_UNDEFINED = '__lodash_hash_undefined__';

	/** Used for built-in method references. */
	var objectProto = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/**
	 * Gets the hash value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf Hash
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function hashGet(key) {
	  var data = this.__data__;
	  if (nativeCreate) {
	    var result = data[key];
	    return result === HASH_UNDEFINED ? undefined : result;
	  }
	  return hasOwnProperty.call(data, key) ? data[key] : undefined;
	}

	module.exports = hashGet;


/***/ },
/* 47 */
/***/ function(module, exports, __webpack_require__) {

	var nativeCreate = __webpack_require__(44);

	/** Used for built-in method references. */
	var objectProto = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/**
	 * Checks if a hash value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf Hash
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function hashHas(key) {
	  var data = this.__data__;
	  return nativeCreate ? (data[key] !== undefined) : hasOwnProperty.call(data, key);
	}

	module.exports = hashHas;


/***/ },
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	var nativeCreate = __webpack_require__(44);

	/** Used to stand-in for `undefined` hash values. */
	var HASH_UNDEFINED = '__lodash_hash_undefined__';

	/**
	 * Sets the hash `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf Hash
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the hash instance.
	 */
	function hashSet(key, value) {
	  var data = this.__data__;
	  this.size += this.has(key) ? 0 : 1;
	  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
	  return this;
	}

	module.exports = hashSet;


/***/ },
/* 49 */
/***/ function(module, exports, __webpack_require__) {

	var listCacheClear = __webpack_require__(50),
	    listCacheDelete = __webpack_require__(51),
	    listCacheGet = __webpack_require__(53),
	    listCacheHas = __webpack_require__(54),
	    listCacheSet = __webpack_require__(55);

	/**
	 * Creates an list cache object.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function ListCache(entries) {
	  var index = -1,
	      length = entries == null ? 0 : entries.length;

	  this.clear();
	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}

	// Add methods to `ListCache`.
	ListCache.prototype.clear = listCacheClear;
	ListCache.prototype['delete'] = listCacheDelete;
	ListCache.prototype.get = listCacheGet;
	ListCache.prototype.has = listCacheHas;
	ListCache.prototype.set = listCacheSet;

	module.exports = ListCache;


/***/ },
/* 50 */
/***/ function(module, exports) {

	/**
	 * Removes all key-value entries from the list cache.
	 *
	 * @private
	 * @name clear
	 * @memberOf ListCache
	 */
	function listCacheClear() {
	  this.__data__ = [];
	  this.size = 0;
	}

	module.exports = listCacheClear;


/***/ },
/* 51 */
/***/ function(module, exports, __webpack_require__) {

	var assocIndexOf = __webpack_require__(52);

	/** Used for built-in method references. */
	var arrayProto = Array.prototype;

	/** Built-in value references. */
	var splice = arrayProto.splice;

	/**
	 * Removes `key` and its value from the list cache.
	 *
	 * @private
	 * @name delete
	 * @memberOf ListCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function listCacheDelete(key) {
	  var data = this.__data__,
	      index = assocIndexOf(data, key);

	  if (index < 0) {
	    return false;
	  }
	  var lastIndex = data.length - 1;
	  if (index == lastIndex) {
	    data.pop();
	  } else {
	    splice.call(data, index, 1);
	  }
	  --this.size;
	  return true;
	}

	module.exports = listCacheDelete;


/***/ },
/* 52 */
/***/ function(module, exports, __webpack_require__) {

	var eq = __webpack_require__(31);

	/**
	 * Gets the index at which the `key` is found in `array` of key-value pairs.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {*} key The key to search for.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */
	function assocIndexOf(array, key) {
	  var length = array.length;
	  while (length--) {
	    if (eq(array[length][0], key)) {
	      return length;
	    }
	  }
	  return -1;
	}

	module.exports = assocIndexOf;


/***/ },
/* 53 */
/***/ function(module, exports, __webpack_require__) {

	var assocIndexOf = __webpack_require__(52);

	/**
	 * Gets the list cache value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf ListCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function listCacheGet(key) {
	  var data = this.__data__,
	      index = assocIndexOf(data, key);

	  return index < 0 ? undefined : data[index][1];
	}

	module.exports = listCacheGet;


/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

	var assocIndexOf = __webpack_require__(52);

	/**
	 * Checks if a list cache value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf ListCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function listCacheHas(key) {
	  return assocIndexOf(this.__data__, key) > -1;
	}

	module.exports = listCacheHas;


/***/ },
/* 55 */
/***/ function(module, exports, __webpack_require__) {

	var assocIndexOf = __webpack_require__(52);

	/**
	 * Sets the list cache `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf ListCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the list cache instance.
	 */
	function listCacheSet(key, value) {
	  var data = this.__data__,
	      index = assocIndexOf(data, key);

	  if (index < 0) {
	    ++this.size;
	    data.push([key, value]);
	  } else {
	    data[index][1] = value;
	  }
	  return this;
	}

	module.exports = listCacheSet;


/***/ },
/* 56 */
/***/ function(module, exports, __webpack_require__) {

	var getNative = __webpack_require__(18),
	    root = __webpack_require__(23);

	/* Built-in method references that are verified to be native. */
	var Map = getNative(root, 'Map');

	module.exports = Map;


/***/ },
/* 57 */
/***/ function(module, exports, __webpack_require__) {

	var getMapData = __webpack_require__(58);

	/**
	 * Removes `key` and its value from the map.
	 *
	 * @private
	 * @name delete
	 * @memberOf MapCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function mapCacheDelete(key) {
	  var result = getMapData(this, key)['delete'](key);
	  this.size -= result ? 1 : 0;
	  return result;
	}

	module.exports = mapCacheDelete;


/***/ },
/* 58 */
/***/ function(module, exports, __webpack_require__) {

	var isKeyable = __webpack_require__(59);

	/**
	 * Gets the data for `map`.
	 *
	 * @private
	 * @param {Object} map The map to query.
	 * @param {string} key The reference key.
	 * @returns {*} Returns the map data.
	 */
	function getMapData(map, key) {
	  var data = map.__data__;
	  return isKeyable(key)
	    ? data[typeof key == 'string' ? 'string' : 'hash']
	    : data.map;
	}

	module.exports = getMapData;


/***/ },
/* 59 */
/***/ function(module, exports) {

	/**
	 * Checks if `value` is suitable for use as unique object key.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
	 */
	function isKeyable(value) {
	  var type = typeof value;
	  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
	    ? (value !== '__proto__')
	    : (value === null);
	}

	module.exports = isKeyable;


/***/ },
/* 60 */
/***/ function(module, exports, __webpack_require__) {

	var getMapData = __webpack_require__(58);

	/**
	 * Gets the map value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf MapCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function mapCacheGet(key) {
	  return getMapData(this, key).get(key);
	}

	module.exports = mapCacheGet;


/***/ },
/* 61 */
/***/ function(module, exports, __webpack_require__) {

	var getMapData = __webpack_require__(58);

	/**
	 * Checks if a map value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf MapCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function mapCacheHas(key) {
	  return getMapData(this, key).has(key);
	}

	module.exports = mapCacheHas;


/***/ },
/* 62 */
/***/ function(module, exports, __webpack_require__) {

	var getMapData = __webpack_require__(58);

	/**
	 * Sets the map `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf MapCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the map cache instance.
	 */
	function mapCacheSet(key, value) {
	  var data = getMapData(this, key),
	      size = data.size;

	  data.set(key, value);
	  this.size += data.size == size ? 0 : 1;
	  return this;
	}

	module.exports = mapCacheSet;


/***/ },
/* 63 */
/***/ function(module, exports, __webpack_require__) {

	var baseToString = __webpack_require__(64);

	/**
	 * Converts `value` to a string. An empty string is returned for `null`
	 * and `undefined` values. The sign of `-0` is preserved.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to convert.
	 * @returns {string} Returns the converted string.
	 * @example
	 *
	 * _.toString(null);
	 * // => ''
	 *
	 * _.toString(-0);
	 * // => '-0'
	 *
	 * _.toString([1, 2, 3]);
	 * // => '1,2,3'
	 */
	function toString(value) {
	  return value == null ? '' : baseToString(value);
	}

	module.exports = toString;


/***/ },
/* 64 */
/***/ function(module, exports, __webpack_require__) {

	var Symbol = __webpack_require__(22),
	    arrayMap = __webpack_require__(65),
	    isArray = __webpack_require__(33),
	    isSymbol = __webpack_require__(35);

	/** Used as references for various `Number` constants. */
	var INFINITY = 1 / 0;

	/** Used to convert symbols to primitives and strings. */
	var symbolProto = Symbol ? Symbol.prototype : undefined,
	    symbolToString = symbolProto ? symbolProto.toString : undefined;

	/**
	 * The base implementation of `_.toString` which doesn't convert nullish
	 * values to empty strings.
	 *
	 * @private
	 * @param {*} value The value to process.
	 * @returns {string} Returns the string.
	 */
	function baseToString(value) {
	  // Exit early for strings to avoid a performance hit in some environments.
	  if (typeof value == 'string') {
	    return value;
	  }
	  if (isArray(value)) {
	    // Recursively convert values (susceptible to call stack limits).
	    return arrayMap(value, baseToString) + '';
	  }
	  if (isSymbol(value)) {
	    return symbolToString ? symbolToString.call(value) : '';
	  }
	  var result = (value + '');
	  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
	}

	module.exports = baseToString;


/***/ },
/* 65 */
/***/ function(module, exports) {

	/**
	 * A specialized version of `_.map` for arrays without support for iteratee
	 * shorthands.
	 *
	 * @private
	 * @param {Array} [array] The array to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns the new mapped array.
	 */
	function arrayMap(array, iteratee) {
	  var index = -1,
	      length = array == null ? 0 : array.length,
	      result = Array(length);

	  while (++index < length) {
	    result[index] = iteratee(array[index], index, array);
	  }
	  return result;
	}

	module.exports = arrayMap;


/***/ },
/* 66 */
/***/ function(module, exports) {

	/** Used as references for various `Number` constants. */
	var MAX_SAFE_INTEGER = 9007199254740991;

	/** Used to detect unsigned integer values. */
	var reIsUint = /^(?:0|[1-9]\d*)$/;

	/**
	 * Checks if `value` is a valid array-like index.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
	 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
	 */
	function isIndex(value, length) {
	  length = length == null ? MAX_SAFE_INTEGER : length;
	  return !!length &&
	    (typeof value == 'number' || reIsUint.test(value)) &&
	    (value > -1 && value % 1 == 0 && value < length);
	}

	module.exports = isIndex;


/***/ },
/* 67 */
/***/ function(module, exports, __webpack_require__) {

	var isSymbol = __webpack_require__(35);

	/** Used as references for various `Number` constants. */
	var INFINITY = 1 / 0;

	/**
	 * Converts `value` to a string key if it's not a string or symbol.
	 *
	 * @private
	 * @param {*} value The value to inspect.
	 * @returns {string|symbol} Returns the key.
	 */
	function toKey(value) {
	  if (typeof value == 'string' || isSymbol(value)) {
	    return value;
	  }
	  var result = (value + '');
	  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
	}

	module.exports = toKey;


/***/ },
/* 68 */
/***/ function(module, exports, __webpack_require__) {

	var baseGet = __webpack_require__(69);

	/**
	 * Gets the value at `path` of `object`. If the resolved value is
	 * `undefined`, the `defaultValue` is returned in its place.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.7.0
	 * @category Object
	 * @param {Object} object The object to query.
	 * @param {Array|string} path The path of the property to get.
	 * @param {*} [defaultValue] The value returned for `undefined` resolved values.
	 * @returns {*} Returns the resolved value.
	 * @example
	 *
	 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
	 *
	 * _.get(object, 'a[0].b.c');
	 * // => 3
	 *
	 * _.get(object, ['a', '0', 'b', 'c']);
	 * // => 3
	 *
	 * _.get(object, 'a.b.c', 'default');
	 * // => 'default'
	 */
	function get(object, path, defaultValue) {
	  var result = object == null ? undefined : baseGet(object, path);
	  return result === undefined ? defaultValue : result;
	}

	module.exports = get;


/***/ },
/* 69 */
/***/ function(module, exports, __webpack_require__) {

	var castPath = __webpack_require__(32),
	    toKey = __webpack_require__(67);

	/**
	 * The base implementation of `_.get` without support for default values.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {Array|string} path The path of the property to get.
	 * @returns {*} Returns the resolved value.
	 */
	function baseGet(object, path) {
	  path = castPath(path, object);

	  var index = 0,
	      length = path.length;

	  while (object != null && index < length) {
	    object = object[toKey(path[index++])];
	  }
	  return (index && index == length) ? object : undefined;
	}

	module.exports = baseGet;


/***/ },
/* 70 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;(function(){
	    var root = this;

	    //消息填充位，补足长度。
	    function fillString(str){
	        var blockAmount = ((str.length + 8) >> 6) + 1,
	            blocks = [],
	            i;

	        for(i = 0; i < blockAmount * 16; i++){
	            blocks[i] = 0;
	        }
	        for(i = 0; i < str.length; i++){
	            blocks[i >> 2] |= str.charCodeAt(i) << (24 - (i & 3) * 8);
	        }
	        blocks[i >> 2] |= 0x80 << (24 - (i & 3) * 8);
	        blocks[blockAmount * 16 - 1] = str.length * 8;

	        return blocks;
	    }

	    //将输入的二进制数组转化为十六进制的字符串。
	    function binToHex(binArray){
	        var hexString = "0123456789abcdef",
	            str = "",
	            i;

	        for(i = 0; i < binArray.length * 4; i++){
	            str += hexString.charAt((binArray[i >> 2] >> ((3 - i % 4) * 8 + 4)) & 0xF) +
	                    hexString.charAt((binArray[i >> 2] >> ((3 - i % 4) * 8  )) & 0xF);
	        }

	        return str;
	    }

	    //核心函数，输出为长度为5的number数组，对应160位的消息摘要。
	    function coreFunction(blockArray){
	        var w = [],
	            a = 0x67452301,
	            b = 0xEFCDAB89,
	            c = 0x98BADCFE,
	            d = 0x10325476,
	            e = 0xC3D2E1F0,
	            olda,
	            oldb,
	            oldc,
	            oldd,
	            olde,
	            t,
	            i,
	            j;

	        for(i = 0; i < blockArray.length; i += 16){  //每次处理512位 16*32
	            olda = a;
	            oldb = b;
	            oldc = c;
	            oldd = d;
	            olde = e;

	            for(j = 0; j < 80; j++){  //对每个512位进行80步操作
	                if(j < 16){
	                    w[j] = blockArray[i + j];
	                }else{
	                    w[j] = cyclicShift(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1);
	                }
	                t = modPlus(modPlus(cyclicShift(a, 5), ft(j, b, c, d)), modPlus(modPlus(e, w[j]), kt(j)));
	                e = d;
	                d = c;
	                c = cyclicShift(b, 30);
	                b = a;
	                a = t;
	            }

	            a = modPlus(a, olda);
	            b = modPlus(b, oldb);
	            c = modPlus(c, oldc);
	            d = modPlus(d, oldd);
	            e = modPlus(e, olde);
	        }

	        return [a, b, c, d, e];
	    }

	    //根据t值返回相应得压缩函数中用到的f函数。
	    function ft(t, b, c, d){
	        if(t < 20){
	            return (b & c) | ((~b) & d);
	        }else if(t < 40){
	            return b ^ c ^ d;
	        }else if(t < 60){
	            return (b & c) | (b & d) | (c & d);
	        }else{
	            return b ^ c ^ d;
	        }
	    }

	    //根据t值返回相应得压缩函数中用到的K值。
	    function kt(t){
	        return (t < 20) ?  0x5A827999 :
	                (t < 40) ? 0x6ED9EBA1 :
	                (t < 60) ? 0x8F1BBCDC : 0xCA62C1D6;
	    }

	    //模2的32次方加法，因为JavaScript的number是双精度浮点数表示，所以将32位数拆成高16位和低16位分别进行相加
	    function modPlus(x, y){
	        var low = (x & 0xFFFF) + (y & 0xFFFF),
	            high = (x >> 16) + (y >> 16) + (low >> 16);

	        return (high << 16) | (low & 0xFFFF);
	    }

	    //对输入的32位的num二进制数进行循环左移 ,因为JavaScript的number是双精度浮点数表示，所以移位需需要注意
	    function cyclicShift(num, k){
	        return (num << k) | (num >>> (32 - k));
	    }

	    //主函数根据输入的消息字符串计算消息摘要，返回十六进制表示的消息摘要
	    function sha1(s){
	        return binToHex(coreFunction(fillString(s)));
	    }

	    // support AMD and Node
	    if(true){
	        !(__WEBPACK_AMD_DEFINE_RESULT__ = function(){
	            return sha1;
	        }.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    }else if(typeof exports !== 'undefined') {
	        if(typeof module !== 'undefined' && module.exports) {
	          exports = module.exports = sha1;
	        }
	        exports.sha1 = sha1;
	    } else {
	        root.sha1 = sha1;
	    }

	}).call(this);

/***/ },
/* 71 */
/***/ function(module, exports) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
		value: true
	});

	exports.default = function (module) {
		return angular.element(document.body).injector().get(module);
	};

/***/ },
/* 72 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
		value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _ApiError = __webpack_require__(11);

	var _ApiError2 = _interopRequireDefault(_ApiError);

	var _Protocol = __webpack_require__(12);

	var _Protocol2 = _interopRequireDefault(_Protocol);

	var _ngRequire = __webpack_require__(71);

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

/***/ }
/******/ ]);