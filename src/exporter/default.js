var Path = require('path-extra');
var expandHomedir = require('expand-home-dir');
var Fs   = require('fs');
var _    = require('underscore');
var Plist = require('simple-plist');
var tools = require('../lib/function.js');

module.exports = function (options) {
    this.export = function (data, callback) {
        if (global.config.exporter_format == "json") {
            if (typeof global.config.exporter_print_diff != "undefined" && global.config.exporter_print_diff) {
                actual = tools.import_json(expandHomedir(global.config.exporter_path));
                tools.changeset_object(actual, data);
            }
            Fs.writeFileSync(expandHomedir(global.config.exporter_path), JSON.stringify(data, null, '  '));
        }
        if (global.config.exporter_format == "plist") {
            if (typeof global.config.exporter_print_diff != "undefined" && global.config.exporter_print_diff) {
                actual = Plist.readFileSync(expandHomedir(global.config.exporter_path));
                tools.changeset_object(actual, data);
            }
            Plist.writeFileSync(expandHomedir(global.config.exporter_path), data);
        }
        if (global.config.exporter_format == "bplist") {
            if (typeof global.config.exporter_print_diff != "undefined" && global.config.exporter_print_diff) {
                actual = Plist.readBinaryFileSync(expandHomedir(global.config.exporter_path));
                tools.changeset_object(actual, data);
            }
            Plist.writeBinaryFileSync(expandHomedir(global.config.exporter_path), data);
        }
        if (typeof global.config.exporter_path != "undefined")
            global.log("=> \""+expandHomedir(global.config.exporter_path)+"\"");

        nb_elt = data.length - 1;
        if (typeof data.Profiles != "undefined")
            nb_elt = data.Profiles.length;

	    return callback(nb_elt);
    }
}
