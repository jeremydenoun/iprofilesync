var Path = require('path-extra');
var Fs   = require('fs');
var _    = require('underscore');
var shell = require("shelljs");
var expandHomedir = require('expand-home-dir');
var diff = require('changeset');
var Plist = require('simple-plist');

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

var export_data = function(format, data, target, display_changeset) {
    if (typeof display_changeset != "undefined" && display_changeset) {
        if (Fs.existsSync(expandHomedir(target))) {
            if (format == "json")
                actual = import_json(expandHomedir(target));
            if (format == "plist")
                actual = Plist.readFileSync(expandHomedir(target));
            if (format == "bplist")
                actual = Plist.readBinaryFileSync(expandHomedir(target));
            changeset_object(actual, data);
        }
    }

    if (format == "json")
        return Fs.writeFileSync(expandHomedir(target), JSON.stringify(data, null, '  '));
    if (format == "plist")
        return Plist.writeFileSync(expandHomedir(target), cleaner(data));
    if (format == "bplist")
        return Plist.writeBinaryFileSync(expandHomedir(target), cleaner(data));
}


// internal compare function for sorting
function compare_array_object(a, b) {
    if (_.keys(a)[0] < _.keys(b)[0])
     return -1;
    if (_.keys(a)[0] > _.keys(b)[0])
        return 1;
    return 0;
}

var override_adapter_list = function(rows, options) {
    // manual list union
    if (options.adapter_manual) {
        rows = _.union(rows, options.adapter_manual);
    }

    // overwrite list
    if (options.adapter_alias) {
        for (i = 0, len = options.adapter_alias.length; i < len; ++i) {
            var idx = -1;
            keys = _.keys(options.adapter_alias[i]);
            _.find(rows, function(obj, key){ idx = key; return _.keys(obj)[0] == keys[0]; });
            if (idx != -1) {
                rows[idx] = options.adapter_alias[i];
            }
        }
    }

    // remove ignore list
    if (options.adapter_ignore) {
        for (i = 0, len = options.adapter_ignore.length; i < len; ++i) {
            var idx = -1;
            keys = options.adapter_ignore[i];
            _.find(rows, function(obj, key){ idx = key; return _.keys(obj)[0] == keys; });
            if (idx != -1) {
                delete rows[idx];
            }
        }
    }

    // Assure sorting for re-entrance
    rows.sort(compare_array_object);

    // export for fallback
    if (options.adapter_chef_fallback_update && options.adapter_chef_fallback_file)
        export_data("json", rows, options.adapter_chef_fallback_file);

    return rows;
}

// Display a changeset of update between source and dest can be improved with colors and format
var changeset_object = function(source, dest) {
    global.log("Changeset : ");
    changeset = diff(source, dest);
    if (changeset.length > 0)
        global.log(changeset);
    else
        global.log("No change");
}

module.exports.exit = exit;
module.exports.import_json = import_json;
module.exports.export_data = export_data;
module.exports.override_adapter_list = override_adapter_list;
module.exports.changeset_object = changeset_object;

