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
            /* chef api call */
            key = Fs.readFileSync(expandHomedir(options.adapter_chef_key_user_path)),
            client = chef.createClient(options.adapter_chef_username, key, options.adapter_chef_url);

            client.get('/search/node?q=name%253A*&start=0&rows=9999', function(err, res, body) {
                var rows = _.map(body.rows, function (obj) {
                    var res = {};
                    res[obj.automatic.fqdn] = {"ipaddress":obj.automatic.ipaddress};
                    return res;
                });

                callback(tools.override_adapter_list(rows, options));
            });
	    } catch (err) {
            global.log(err);
            global.log("Unable to access to chef server '"+options.adapter_chef_url+"' ("+options.adapter_chef_username+") I fallback on : " + options.adapter_chef_fallback_file);

            /* restore from fallback */
            if (options.adapter_chef_fallback_file && Fs.existsSync(options.adapter_chef_fallback_file))
                return tools.import_json(options.adapter_chef_fallback_file);
	        return false;
	    }
    }
}
