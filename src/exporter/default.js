var Path = require('path-extra');
var expandHomedir = require('expand-home-dir');
var Fs   = require('fs');
var _    = require('underscore');
var Plist = require('simple-plist');


module.exports = function (options) {
    this.export = function (data, callback) {
        if (global.config.exporter_format == "json")
            Fs.writeFileSync(expandHomedir(global.config.exporter_path), JSON.stringify(data, null, '  '));
        if (global.config.exporter_format == "plist")
            Plist.writeFileSync(expandHomedir(global.config.exporter_path), data);
        if (global.config.exporter_format == "json")
            Plist.writeBinaryFileSync(expandHomedir(global.config.exporter_path), data);

        global.log("=> \""+expandHomedir(global.config.exporter_path)+"\"");
        nb_elt = data.Profiles.length;
	    return callback(nb_elt);
    }
}
