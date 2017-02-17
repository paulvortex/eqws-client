'use strict';

import _isObject from 'lodash/isObject';

import PSON from 'pson/dist/PSON.js';

import ApiError from './ApiError';
import Protocol from './Protocol';
import $require from './ng-require';

class WsClient {
	constructor(path) {
		this.wsInit(path);
		this.stack  = {};
		this.proto  = new Protocol('ws.client');
		this.q      = $require('$q');
		this.pson   = new PSON.StaticPair([]);
		this.binary = false;
	}

	wsInit(path) {
		this.socket = new WebSocket(path);
		this.socket.binaryType = 'arraybuffer';
		this.socket.onmessage = this.controller.bind(this);
		this.socket.onclose = () => {
			setTimeout(() => {
				console.warn('ws.client: reconnect.');
				this.wsInit(path);
			}, 1000);
		};
	}

	controller(message) {
		let data = this.decode(message.data);

		if (data.event) {
			console.debug('ws:event', data.event);
			this.proto.rootScope.$broadcast('eqApi.' + data.event, data.args);
			return;
		};

		if (typeof data.sid !== 'string') {
			throw new Error('Incorecnt typeof [sid]');
		}

		let sess = this.stack[data.sid];

		if (!sess) {
			console.warn('ws.client: reseived unknown session response.');
			return;
		}

		delete this.stack[data.sid];
		this.proto.handler(sess, data);
	}

	call(method, args) {
		let deferred = this.q.defer();

		let uid = this.generateId();
		let sid = ['eq', uid].join(':');
		let data = {method, args, sid};

		this.stack[sid] = deferred;
		this.proto.onsend(data);
		this.send(data);

		console.log('ws.client:req', method, sid, args);

		return deferred.promise;
	}

	send(data) {
		if (typeof data === 'object' && !data.byteLength) {
			data = this.encode(data);
		}

		if (this.socket.readyState === 1) {
			this.socket.send(data);
		} else {
			setTimeout(this.send.bind(this, data), 5);
		}
	}

	generateId() {
		return Math.random().toString(16).slice(2);
	}

	encode(data) {
		if (this.binary) {
			return this.pson.encode(data).buffer;
		} else {
			return JSON.stringify(data);
		}
	}

	decode(data) {
		if (typeof data !== 'string') {
			return this.pson.decode(data);
		} else {
			return JSON.parse(data);
		}
	}
}

export default WsClient;