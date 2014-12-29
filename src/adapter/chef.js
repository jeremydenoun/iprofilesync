var Path = require('path-extra');
var Fs   = require('fs');
var _    = require('underscore');
var shell = require("shelljs");
var tools = require('../lib/function.js');

module.exports = function (options) {
    this.list = function () {
	    shell.config.silent = true;

	    /* Override cmd */
	    default_cmd = 'knife search node "name:*" -a ipaddress --format json';
	    if (options.adapter_chef_custom_cmd)
	        default_cmd = options.adapter_chef_custom_cmd;

	    /* CD to correct dir */
	    if (options.adapter_chef_home)
	        shell.cd(options.adapter_chef_home);

	    try {
	        list = JSON.parse(shell.exec(default_cmd).output.trim());
            /* manual list union */
            if (options.adapter_manual) {
                list.rows = _.union(list.rows, options.adapter_manual);
            }

            /* overwrite list */
            if (options.adapter_alias) {
                for (i = 0, len = options.adapter_alias.length; i < len; ++i) {
                    var idx = -1;
                    keys = _.keys(options.adapter_alias[i]);
                    _.find(list.rows, function(obj, key){ idx = key; return _.keys(obj)[0] == keys[0]; });
                    if (idx != -1) {
                        list.rows[idx] = options.adapter_alias[i];
                    }
                }
            }

            /* remove ignore list */
            if (options.adapter_ignore) {
                for (i = 0, len = options.adapter_ignore.length; i < len; ++i) {
                    var idx = -1;
                    keys = options.adapter_ignore[i];
                    _.find(list.rows, function(obj, key){ idx = key; return _.keys(obj)[0] == keys; });
                    if (idx != -1) {
                        delete list.rows[idx];
                    }
                }
            }

            /* export for fallback */
            if (options.adapter_chef_fallback_update && options.adapter_chef_fallback_file)
                tools.export_data("json", list.rows, options.adapter_chef_fallback_file);

	        return list.rows;
	    } catch (err) {
            global.log(err);
            global.log("Main cmd '"+default_cmd+"' ("+options.adapter_chef_home+") report invalid JSON. I fallback on : " + options.adapter_chef_fallback_file);

            /* restore from fallback */
            if (options.adapter_chef_fallback_file && Fs.existsSync(options.adapter_chef_fallback_file))
                return tools.import_json(options.adapter_chef_fallback_file);
	        return false;
	    }
    }
}
