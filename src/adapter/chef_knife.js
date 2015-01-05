var Path = require('path-extra');
var Fs   = require('fs');
var _    = require('underscore');
var shell = require("shelljs");
var tools = require('../lib/function.js');

module.exports = function (options) {
    this.list = function (callback) {
	    shell.config.silent = true;
	    try {
	        /* Override cmd */
	        default_cmd = 'knife search node "name:*" -a ipaddress --format json';
	        if (options.adapter_chef_custom_cmd)
	            default_cmd = options.adapter_chef_custom_cmd;

	        /* CD to correct dir */
	        if (options.adapter_chef_home)
	            shell.cd(options.adapter_chef_home);

	        list = JSON.parse(shell.exec(default_cmd).output.trim());
            callback(tools.override_adapter_list(list.rows, options));
	    } catch (err) {
            global.log(err);
            global.log("Main cmd '"+default_cmd+"' ("+options.adapter_chef_home+") report invalid JSON. I fallback on : " + options.adapter_fallback_file);

            /* restore from fallback */
            if (options.adapter_fallback_file && Fs.existsSync(options.adapter_fallback_file))
                return callback(tools.import_json(options.adapter_fallback_file));
	        return false;
	    }
    }
}
