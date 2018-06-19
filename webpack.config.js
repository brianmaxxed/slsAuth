const path = require('path');
const webpack = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const NodemonPlugin = require('nodemon-webpack-plugin');
const Dotenv = require('dotenv-webpack');
require('dotenv-safe').config();

let sourcemap = '(none)';
if (process.env.SOURCEMAP === 'true') {
  sourcemap = (process.env.DEBUG) ? 'inline-source-map' : 'sourcemap';
}

const entry = (process.env.SERVERLESS === 'true') ? 'serverless.js' : 'server.js';
// const entry = 'server.js';

const plugins = [
  new Dotenv({
    path: './.env', // Path to .env file (this is the default)
    safe: true, // load .env.example (defaults to "false" which does not use dotenv-safe)
  }),
  new CleanWebpackPlugin(['./dist']),
  new CopyWebpackPlugin([{
    context: './src/public',
    from: '**/*',
    to: 'public',
  }]),
  new webpack.optimize.OccurrenceOrderPlugin(),
  new NodemonPlugin({
    verbose: true,
    delay: 1000,
    exec: 'node',
    inspect: true,
  }),

];

console.log(`ENV: ${process.env.NODE_ENV}`);
if (process.env.NODE_ENV === 'production') {
  plugins.push(new UglifyJSPlugin({
    sourceMap: true,
  }));
}

// exclude nodemon for production. need to add that.
const config = {
  mode: 'production',
  name: 'server',
  target: 'node',
  externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
  devtool: sourcemap,
  entry: path.join(__dirname, `src/${entry}`),
  context: __dirname,
  node: {
    __filename: true,
    __dirname: true,
  },
  output: {
    path: path.join(__dirname, './dist/'),
    filename: 'server.js',
    libraryTarget: 'commonjs2',
    publicPath: './dist/public/',
  },
  plugins,
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader',
    },
    {
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'eslint-loader',
      options: {
        fix: true,
        emitError: true,
        failOnError: true,
        filename: './src/server.js',
      },
    },
    ],
  },
};

module.exports = config;
