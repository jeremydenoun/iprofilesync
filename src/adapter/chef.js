var Path = require('path-extra');
var Fs   = require('fs');
var _    = require('underscore');
var shell = require("shelljs");

module.exports = function (options) {
    this.list = function () {
	shell.config.silent = true;

	/* Override cmd */
	default_cmd = 'knife search node "name:*" -a ipaddress --format json';
	if (options.adapter_chef_custom_cmd)
	    default_cmd = options.adapter_chef_custom_cmd;

	/* CD to correct dir */
	if (options.adapter_home)
	    shell.cd(options.adapter_home);

	try {
	    list = JSON.parse(shell.exec(default_cmd).output.trim());
	    return list.rows;
	} catch (err) {
	    return false;
	}
    }
}