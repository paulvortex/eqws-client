module.exports = {
	entry: ['./src/index.js'],
	output: {
		filename: 'dist/eqws-client.js'
	},
	module: {
		loaders: [{
			test: /\.js$/,
			exclude: /node_modules/,
			loader: 'babel?presets=es2015',
		}]
	}
};