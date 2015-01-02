var Path = require('path-extra');
var Fs   = require('fs');
var _    = require('underscore');

module.exports = function (options) {
    this.list = function (callback) {
	callback([{"localhost":{"ipaddress": "127.0.0.1"}}]);
    }
}
