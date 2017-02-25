import WsClient from './client/WsClient';
import HttpClient from './client/HttpClient';

angular
	.module('eq.api', ['ngStorage'])
	.provider('eqApiConfig', provider)
	.factory('eqApi', factory);

function provider() {
	return {
		options: {
			http: {
				url: '/'
			},
			ws: {
				url: '/',
				format: 'json'
			},
			defaultProtocol: 'ws'
		},
		$get: function() {
			return this;
		},
	};
}

function factory($http, $q, $state, $localStorage, $rootScope, eqApiConfig) {
	// Get options
	let options = eqApiConfig.options;

	// Define token getter
	const tokenInterface = {
		get: () => $localStorage.token,
		set: (value) => $localStorage.token = value
	}

	options.ws.token = tokenInterface;
	options.http.token = tokenInterface;

	// Initialize clients
	let ws   = new WsClient(options.ws);
	let http = new HttpClient(options.http);

	// Interface
	let i = {ws, http};

	i.call = function() {
		let protocol = i[options.defaultProtocol];
		return protocol.call.apply(protocol, arguments);
	};

	// Broadcast events
	ws.use('onEvent', (eventName, args) => {
		console.debug('eq.event', eventName, args);
		$rootScope.$broadcast(`eqApi.${eventName}`, args);
	});

	ws.use('onError', errorHandler);
	http.use('onError', errorHandler);

	function errorHandler(err) {
		$rootScope.$broadcast(`eq.error`, error);
	}

	return i;
}

factory.$inject = ['$http', '$q', '$state', '$localStorage', '$rootScope', 'eqApiConfig'];

export {WsClient, HttpClient};