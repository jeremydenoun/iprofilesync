var Path = require('path-extra');
var Fs   = require('fs');
var _    = require('underscore');

module.exports = function (options) {
    this.list = function () {
	return ["localhost"];
    }
}