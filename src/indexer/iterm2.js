var Path = require('path-extra');
var Fs   = require('fs');
var _    = require('underscore');
var crypto    = require('crypto');


module.exports = function (options) {

    this.name = function(elt, host) {
        keys = _.keys(host);
        keys = _.difference(keys, ["checker"]);
        name = keys[0];
        n = name.split(".")[0];

        elt.Name = n.toLowerCase();
        return elt;
    }

    this.tags = function(elt, host) {
        tags = _.clone(global.config.indexer_global_generic_tag) || [];
        keys = _.keys(host);
        keys = _.difference(keys, ["checker"]);
        name = keys[0];
        n = name.split(".")[0];
        n_group = n.split(global.config.indexer_global_name_separator || "-");
        if (typeof host[name].tags != "undefined")
            n_group = n_group.concat(host[name].tags);

        for (z = 0, l_tag = n_group.length; z < l_tag; ++z) {
            if (_.indexOf(tags, n_group[z]) == -1 &&
                !parseInt(n_group[z]))
                tags.push(n_group[z]);
        }

        elt.Tags = tags;
        return elt;
    }

    this.command = function(elt, host) {
        cmd = global.config.indexer_global_command + " ";
        if (host[name].ssh_options)
            cmd += host[name].ssh_options + " ";
        if (host.checker.ssh_options)
            cmd += host.checker.ssh_options + " ";
        if (host.checker.port != 22)
            cmd += "-p "+host.checker.port + " ";
        cmd += host.checker.user+"@"+host.checker.host;

        elt.Command = cmd;
        return elt;
    }


    this.guid = function(elt, host) {
        var sum = crypto.createHash('sha1');
        var hex_high_10 = { // set the highest bit and clear the next highest
            '0': '8',
            '1': '9',
            '2': 'a',
            '3': 'b',
            '4': '8',
            '5': '9',
            '6': 'a',
            '7': 'b',
            '8': '8',
            '9': '9',
            'a': 'a',
            'b': 'b',
            'c': '8',
            'd': '9',
            'e': 'a',
            'f': 'b'
        };

        keys = _.keys(host);
        keys = _.difference(keys, ["checker"]);
        name = keys[0];

        sum.update(keys[0]);
        var uuid = sum.digest('hex');
        uuid = uuid.substr(0, 8) + '-' + // time_low
        uuid.substr(8, 4) + '-' + // time_mid
        '5' + // time_hi_and_version high 4 bits (version)
        uuid.substr(13, 3) + '-' + // time_hi_and_version low 4 bits (time high)
        hex_high_10[uuid.substr(16, 1)] + uuid.substr(17, 1) + // cloc_seq_hi_and_reserved
        uuid.substr(18, 2) + '-' + // clock_seq_low
        uuid.substr(20, 12); // node

        elt.Guid = uuid;
        return elt;
    }

    this.index = function (data, callback) {
        config = global.config;
        var _result = [];

        for (i = 0, len = data.length; i < len; ++i) {
            var elt = config.indexer_static_template;
            host = data[i];
            if (host.checker.success || host.checker.private_range) {
                for (j = 0, len2 = config.indexer_rules.length; j < len2; ++j) {
                    if (_.isFunction(this[config.indexer_rules[j]])) {
                        elt = _.clone(this[config.indexer_rules[j]](elt, host));
                    }
                }

                /* overwrite param for specific host */
                if (global.config.indexer_specific_pref) {
                    keys = _.keys(host);
                    keys = _.difference(keys, ["checker"]);
                    name = keys[0];

                    for (j = 0, len2 = global.config.indexer_specific_pref.length; j < len2; ++j) {
                        keys = _.keys(global.config.indexer_specific_pref[j]);
                        if (name == keys[0]) {
                            elt = _.extend(elt, global.config.indexer_specific_pref[j][name]);
                        }
                    }
                }

                _result.push(elt);

            }
        }
	    return callback({"Profiles":_result});
    }
}
