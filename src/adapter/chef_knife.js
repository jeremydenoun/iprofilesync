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
	        default_cmd = 'knife search node "name:*" -a ipaddress -a ec2.public_ipv4 --format json';
	        if (options.adapter_chef_custom_cmd)
	            default_cmd = options.adapter_chef_custom_cmd;

	        /* CD to correct dir */
	        if (options.adapter_chef_home)
	            shell.cd(options.adapter_chef_home);

	        list = JSON.parse(shell.exec(default_cmd).stdout.trim());
            /* implement public address from ec2 */
            list.rows.forEach(function (json) {
                for (host in json) {
                    if (typeof json[host]["ec2.public_ipv4"] != "undefined" && json[host]["ec2.public_ipv4"] != null && json[host]["ec2.public_ipv4"] != "")
                        json[host]["ipaddress"]  = json[host]["ec2.public_ipv4"];
                }
            });
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
