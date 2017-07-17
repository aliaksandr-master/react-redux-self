'use strict';

const path = require('path');
const webpack = require('webpack');


const DIR_SRC = 'lib';
const NODE_ENV = process.env.NODE_ENV || 'production'; // eslint-disable-line
const DIR_BABEL_CACHE_DIR = path.resolve(__dirname, '.tmp/babel');



const config = {};



config.output = {
  path: path.join(__dirname, '.tmp/release'),
  pathinfo: true,
  filename: '[name].js'
};




config.entry = {
  'react-composite-router': [
    path.join(__dirname, DIR_SRC, 'index.js')
  ]
};



config.externals = {
};



config.module = {};



config.module.loaders = [
  {
    test: /\.(?:jsx?)(?:\?.*)?$/i,
    exclude: [
    ],
    loaders: [
      `babel-loader?cacheDirectory=${DIR_BABEL_CACHE_DIR}`
    ]
  }
];




config.plugins = [
  new webpack.LoaderOptionsPlugin({
    debug: true
  })
];



config.plugins.push(new webpack.NoEmitOnErrorsPlugin());



config.plugins.push(new webpack.DefinePlugin({
  'process.env.NODE_ENV': JSON.stringify(NODE_ENV)
}));



config.resolve = {
  modules: [
    path.join(__dirname, DIR_SRC),
    'node_modules'
  ],
  extensions: [ '.js' ]
};



config.resolveLoader = {
  alias: {}
};





config.bail = true;
config.devtool = false;
config.cache = false;
config.watch = false;


config.context = __dirname;
config.node = {
  __filename: true
};


module.exports = config;
