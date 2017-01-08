import WsClient from './WsClient';
import HttpClient from './HttpClient';

angular
	.module('eq.api', ['ngStorage'])
	.provider('eqApiConfig', provider)
	.factory('eqApi', factory);

function provider() {
	return {
		options: {
			httpUrl: '/',
			wsUrl: '/',
			defaultProtocol: 'ws'
		},
		$get: function() {
			return this;
		},
	};
}

function factory($http, $q, $state, $localStorage, eqApiConfig) {
	// Get options
	let opts = eqApiConfig.options;

	// Initialize ws interface
	let ws = new WsClient(opts.wsUrl);

	// Initialize http interface
	let http = new HttpClient(opts.httpUrl);

	// Interface
	let i = {ws, http};

	i.call = function() {
		let protocol = i[opts.defaultProtocol];
		return protocol.call.apply(protocol, arguments);
	};

	return i;
}

factory.$inject = ['$http', '$q', '$state', '$localStorage', 'eqApiConfig'];

export {WsClient, HttpClient};