var Fs   = require('fs');
var _    = require('underscore');
var tools = require('../lib/function.js');
var expandHomedir = require('expand-home-dir');
var chef = require('chef');

module.exports = function (options) {
    this.list = function (callback) {
        var fallback = function () {
            /* restore from fallback */
            if (options.adapter_fallback_file && Fs.existsSync(options.adapter_fallback_file))
                return callback(tools.import_json(options.adapter_fallback_file));
            return false;
        };

        try {
            /* chef api call */
            var key = Fs.readFileSync(expandHomedir(options.adapter_chef_key_user_path)).toString();
            var client = chef.createClient(options.adapter_chef_username, key, {
                base: options.adapter_chef_url
            });

            // chef@1.x forwards extra request options straight to https.request.
            // Accept self-signed certificates only when explicitly enabled in the
            // profile config (adapter_chef_insecure), never by default.
            var reqOpts = options.adapter_chef_insecure ? { rejectUnauthorized: false } : {};

            client.get('/search/node?q=name%253A*&start=0&rows=9999', undefined, reqOpts)
                .then(function (body) {
                    var rows = _.map(body.rows, function (obj) {
                        var res = {};
                        res[obj.automatic.fqdn] = { ipaddress: obj.automatic.ipaddress };
                        return res;
                    });

                    callback(tools.override_adapter_list(rows, options));
                })
                .catch(function (err) {
                    global.log(err);
                    global.log("Unable to access to chef server '" + options.adapter_chef_url + "' (" + options.adapter_chef_username + ") I fallback on : " + options.adapter_fallback_file);
                    return fallback();
                });
        } catch (err) {
            global.log(err);
            global.log("Unable to access to chef server '" + options.adapter_chef_url + "' (" + options.adapter_chef_username + ") I fallback on : " + options.adapter_fallback_file);
            return fallback();
        }
    };
};
