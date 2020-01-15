// import babel polyfill
require('@babel/polyfill');


// import libraries to help configure the webpack config
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const StylelintPlugin = require('stylelint-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ServiceWorkerWebpackPlugin = require('serviceworker-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const chalk = require('chalk');
const WebpackPwaManifest = require('webpack-pwa-manifest');

module.exports = (env, argv) => {
	// check if we are in development mode or not
	const dev = argv.mode === 'development';

	return ({
		// set the mode of our project
		mode: argv.mode,

		watch: true,

		// your main js file
		entry: ['@babel/polyfill', path.resolve(__dirname, 'src/app.js')],

		// define the output
		output: {
			path: path.resolve(__dirname, 'dist'),
			filename: 'bundle.min.js',
		},

		// define the different modules
		module: {
			rules: [
				{
					test: /\.js?$/,
					exclude: /node_modules/,
					use: ['babel-loader', 'eslint-loader'],
				},
				{
					test: /\.hbs$/,
					use: [
						{
							loader: 'handlebars-loader',
							options: {
								helperDirs: path.join(__dirname, '/src/templates/helpers'),
								partialDirs: path.join(__dirname, '/src/templates/partials'),
							},
						},
						{
							loader: 'extract-loader',
						},
						{
							loader: 'html-loader',
							options: {
								interpolate: true,
							},
						},
					],
				},
				{
					test: /\.(sa|sc|c)ss$/,
					use: [
						dev ? 'style-loader' : MiniCssExtractPlugin.loader,
						'css-loader',
						'sass-loader',
					],
				},
				{
					test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
					loader: 'url-loader',
					query: {
						limit: 1000,
						name: 'images/[name].[hash:7].[ext]',
					},
				},
				{
					test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
					loader: 'url-loader',
					options: {
						limit: 1000,
						name: 'fonts/[name].[hash:7].[ext]',
					},
				},
				{
					test: /\.(webm|mp4)$/,
					loader: 'file-loader',
					options: {
						name: 'videos/[name].[hash:7].[ext]',
					},
				},
			],
		},

		// define the plugins
		plugins: [

			new webpack.LoaderOptionsPlugin({
				options: {
					handlebarsLoader: {},
				},
			}),
			new HtmlWebpackPlugin({
				template: path.resolve(__dirname, 'src/index.hbs'),
				minify: !dev && {
					html5: true,
					collapseWhitespace: true,
					caseSensitive: true,
					removeComments: true,
					removeEmptyElements: true,
				},
			}),

			new WebpackPwaManifest({
				filename: 'manifest.json',
				name: 'Space Infection',
				short_name: 'Space',
				description: 'Run away from the alien before it infects you!',
				background_color: '#0E272D',
				crossorigin: 'use-credentials',
				display: 'standalone',
				inject: true,
				includeDirectory: true,
			}),

			new MiniCssExtractPlugin({
				filename: dev ? '[name].css' : '[name].[hash].css',
				chunkFilename: dev ? '[id].css' : '[id].[hash].css',
			}),
			new StylelintPlugin({
				configFile: '.stylelintrc',
				context: 'src',
				files: '**/*.scss',
				failOnError: false,
				quiet: false,
			}),
			new CleanWebpackPlugin(),
			new ServiceWorkerWebpackPlugin({
				entry: path.join(__dirname, 'src/sw.js'),
				excludes: ['**/.*', '**/*.map', '*.html'],
				filename: 'sw.js',
			}),
			new ProgressBarPlugin({
				format: `  build [:bar] ${chalk.green.bold(':percent')} (:elapsed seconds)`,
				clear: false,
			}),
		],

		// define our development server
		devServer: {
			port: process.env.PORT || 8080,
			contentBase: path.resolve(__dirname, './src/'),
			historyApiFallback: false,
		},
	});
};
