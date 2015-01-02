var Path = require('path-extra');
var expandHomedir = require('expand-home-dir');
var Fs   = require('fs');
var _    = require('underscore');
var Plist = require('simple-plist');
var tools = require('../lib/function.js');

module.exports = function (options) {
    this.export = function (data, callback) {
        if (typeof global.config.exporter_format != "undefined")
            tools.export_data(global.config.exporter_format, data, expandHomedir(global.config.exporter_path), global.config.exporter_print_diff);
        if (typeof global.config.exporter_path != "undefined")
            global.log("=> \""+expandHomedir(global.config.exporter_path)+"\"");

        nb_elt = data.length - 1;
        if (typeof data.Profiles != "undefined")
            nb_elt = data.Profiles.length;

	    return callback(nb_elt);
    }
}
