import Protocol from './Protocol';
import Parser from '../Parser';
import $require from '../ng-require';

const CONNECTION_TIMEOUT = 1000;

class WsClient {
	constructor(opts = {}) {
		if (!opts.format) opts.format = 'json';
		if (!opts.url) opts.url = '/';

		this._options = opts;
		this._requests  = {};
		this._proto  = new Protocol(opts, 'ws.client');
		this._socket = null;
		this._parser = Parser[opts.format] || Parser.json;
		this._q = $require('$q');
		this._reconnectionTimeout = CONNECTION_TIMEOUT;

		this._proto._onError = (err) => this._onError(err);
		this.connect();
	}

	reconnect() {
		if (this._socket) {
			this._socket.onclose = null;
			this._socket.close();
			this.connect();
		} else {
			this._socket();
		}
	}

	connect() {
		const protocol = this._proto;
		const url = this._options.url + '?token=' + protocol.getToken();

		this._socket = new WebSocket(url, this._options.format);
		this._socket.binaryType = 'arraybuffer';
		this._socket.onmessage = this._onMessage.bind(this);
		this._socket.onclose = this._onClose.bind(this);
		this._socket.onopen = this._onOpen.bind(this);
	}

	getRequest(sid) {
		return this._requests[sid];
	}

	encode(data) {
		return this._parser.encode(data);
	}

	decode(data) {
		return this._parser.decode(data);
	}

	call(method, args) {
		const protocol = this._proto;
		const deferred = this._q.defer();

		let uid = this.uuid();
		let sid = ['eq', uid].join(':');
		let data = {method, args, sid};

		protocol._onSend(data);
		const encoded = this.encode(data);

		this._requests[sid] = deferred;
		this._send(encoded);

		return deferred.promise;
	}

	use(key, fn) {
		this[`_${key}`] = fn;
	}

	uuid() {
		return Math.random().toString(16).slice(2);
	}

	_send(data) {
		if (this._socket && this._socket.readyState === 1) {
			this._socket.send(data, false);
		} else {
			setTimeout(this._send.bind(this, data), 5);
		}
	}

	_onMessage(message) {
		const protocol = this._proto;
		const data = this.decode(message.data);
		const sid = data.sid;

		if (data.event) {
			return this._onEvent(data.event, data.args);
		};

		if (typeof sid !== 'string') {
			throw new Error('Incorecnt typeof [sid]');
		}

		let request = this.getRequest(sid);

		if (!request) {
			return console.warn('ws.client: received unknown response');
		}

		this._pullRequest(sid);
		this._onResponse(request, data);
	}

	_onEvent() {

	}

	_onClose() {
		console.warn('socket connection close: reconnect', this._reconnectionTimeout);
		setTimeout(() => this.connect(), this._reconnectionTimeout);

		this._reconnectionTimeout += CONNECTION_TIMEOUT;
	}

	_pullRequest(sid) {
		delete this._requests[sid];
	}

	_onResponse(request, response) {
		this._proto.handler(request, response);
	}

	_onError(err) {
		console.error(this._proto.name, err);
	}

	_onOpen() {
		this._reconnectionTimeout = CONNECTION_TIMEOUT;
	}
}

export default WsClient;