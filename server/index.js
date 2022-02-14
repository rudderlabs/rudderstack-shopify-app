require('@babel/register')({
  presets: ['@babel/preset-env'],
  ignore: ['node_modules']
});

module.exports = require('./server.js');
