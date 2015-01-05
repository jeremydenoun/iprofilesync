var Path = require('path-extra');
var Fs   = require('fs');
var _    = require('underscore');
var shell = require("shelljs");
var util = require('util');
var tools = require('../lib/function.js');
var expandHomedir = require('expand-home-dir');
var chef = require('chef');

module.exports = function (options) {
    this.list = function (callback) {
	    shell.config.silent = true;

	    try {
            return callback(tools.import_json(options.adapter_file_path));
	    } catch (err) {
            global.log(err);
	        return false;
	    }
    }
}
