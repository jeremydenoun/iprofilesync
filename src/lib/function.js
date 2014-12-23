var Path = require('path-extra');
var Fs   = require('fs');
var _    = require('underscore');
var shell = require("shelljs");

var exit = function(ret) {
    global.log("Good Bye");
    process.exit(ret);
}

var import_json = function(path) {
    var fs = require("fs");
    JSON.minify = JSON.minify || require("node-json-minify");

    try {
	var json = (JSON.parse(JSON.minify(fs.readFileSync(path, "utf8"))));
    } catch (err) {
	if ( err instanceof SyntaxError ) {
	    global.error("unable to parse json " + path + ": ");
	    global.error(err);
	}
	return false;
    }
    return json;
}

var cleaner, cleaner_array, cleaner_hash;

cleaner_array = function(data) {
    var e;
    return ((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
            e = data[_i];
            _results.push(cleaner(e));
        }
        return _results;
    })()).filter(function(e) {
        return e !== null;
    });
};

cleaner_hash = function(data) {
    var k, r, v;
    r = {};
    for (k in data) {
        v = data[k];
        if (v !== null) {
            r[k] = cleaner(v);
        }
    }
    return r;
};

cleaner = function(data) {
    if (data instanceof Array) {
        return cleaner_array(data);
    } else if (data instanceof Object) {
        return cleaner_hash(data);
    } else {
        return data;
    }
};

var export_data = function(format, data, target) {
    if (format == "json")
        return Fs.writeFileSync(target, JSON.stringify(data, null, '  '));
    if (format == "plist")
        return Plist.writeFileSync(target, cleaner(data));
    if (format == "bplist")
        return Plist.writeBinaryFileSync(target, cleaner(data));
}


module.exports.exit = exit;
module.exports.import_json = import_json;
module.exports.export_data = export_data;
