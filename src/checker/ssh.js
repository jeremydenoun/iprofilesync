(function() {
    var Fs, Path, Ssh, SshCheck, slice,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

    Ssh = require('ssh2');

    Fs = require('fs');

    Path = require('path-extra');

    _    = require('underscore');

    expandHomedir = require('expand-home-dir');

    slice = function(hash, values) {
        var key, r, value;
        r = {};
        for (key in hash) {
            value = hash[key];
            if (__indexOf.call(values, key) >= 0) {
                r[key] = value;
            }
        }
        return r;
    };

    SshCheck = (function() {
  	    var options;

        function SshCheck(options) {
	        this.options = options;
        }

        SshCheck.prototype.check = function(host, data, callback) {
            data = _.extend(this.options, data);

            var errored, f, k, key, port, ports, ran, succeeded, user, users, _i, _j, _len, _len1, _ref, _users, _results;
            if (data.hasOwnProperty('checker_private_key') && data.checker_private_key) {
                if (!Fs.existsSync(expandHomedir(data.checker_private_key))) {
                    process.nextTick(function() {
                        return callback(new Error("Unable to find private key : " + data.checker_private_key));
                    });
                    return;
                } else
                    data.privateKey = data.checker_private_key;
            } else {
                key = null;
                _ref = ['id_rsa', 'id_dsa'];
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    k = _ref[_i];
                    f = Path.join(Path.homedir(), '.ssh', k);
                    if (!key && Fs.existsSync(f)) {
                        key = f;
                    }
                }
                if (!key) {
                    process.nextTick(function() {
                        return callback(new Error("Unable to find private key"));
                    });
                    return;
                }
                data.privateKey = key;
            }

            data.privateKey = Fs.readFileSync(expandHomedir(data.privateKey)).toString();

            users = data.checker_users instanceof Array ? data.checker_users : [(_users = data.checker_users) != null ? _users : process.env.USER];
            ports = data.checker_ports instanceof Array ? data.checker_ports : [data.checker_ports];

            if (data.hasOwnProperty('checker_password') && typeof data.password == "undefined")
	            data.password = data.checker_password;

            succeeded = false;
            ran = 0;
            errored = 0;
            _results = [];
            for (_j = 0, _len1 = ports.length; _j < _len1; _j++) {
                port = ports[_j];
                _results.push((function() {
                    var _k, _len2, _results1;
                    _results1 = [];
                    for (_k = 0, _len2 = users.length; _k < _len2; _k++) {
                        user = users[_k];
                        _results1.push((function(port, user) {
                            var args, conn, err, error_callback, sent;
                            sent = false;
                            args = slice(data, ['password', 'privateKey', 'passphrase']);
                            args.host = host;
                            args.username = user;
                            if (port) {
                                args.port = port;
                            }
                            conn = new Ssh;
                            conn.on('ready', function() {
                                conn.end();
                                if (!succeeded) {
                                    succeeded = true;
                                    if (!sent) {
                                        callback(null, {
                                            success: true,
                                            host: host,
                                            user: args.username,
                                            port: args.port || 22
                                        });
                                    }
                                    return sent = true;
                                }
                            });
                            error_callback = function(err) {
                                conn.end();
                                errored++;
                                if (!succeeded && errored === ran) {
                                    if (ran === 1) {
                                        if (!sent) {
                                            callback(err);
                                        }
                                    } else {
                                        if (!sent) {
                                            callback(new Error("No tentative succeeded"));
                                        }
                                    }
                                    return sent = true;
                                }
                            };
                            conn.on('error', error_callback);
                            conn.on('keyboard-interactive', error_callback);
                            ran++;
                            try {
                                return conn.connect(args);
                            } catch (_error) {
                                err = _error;
                                conn.end();
                                return process.nextTick(function() {
                                    if (!sent) {
                                        callback(err);
                                    }
                                    return sent = true;
                                });
                            }
                        })(port, user));
                    }
                    return _results1;
                })());
            }
            return _results;
        };

        SshCheck.prototype.check_nodes = function(hash, callback) {
            var done, key, _results, data;

            if (hash instanceof Array) {
                data = hash;
            }
            else
                data = hash.rows;
            done = {};
            _results = [];
            for (key in data) {
                _results.push((function(self, key) {
                    var host = data[key];
                    var opts = {};
                    var hostname = Object.keys(data[key])[0].split(".")[0];

                    if (typeof data[key] == "object" && typeof data[key][Object.keys(data[key])[0]].ipaddress != "undefined") {
                        host=data[key][Object.keys(data[key])[0]].ipaddress;
                        opts=data[key][Object.keys(data[key])[0]];
                    }

                    return self.check(host, opts, function(err, obj) {
                        if (!obj)
                            obj = {};

                        // detect if we are on private range
                        //@TODO: we should test if we can connect althrough the proxy set
                        if (global.config.checker_private_prefix){
                            obj.private_range = (host.indexOf(global.config.checker_private_prefix) == 0);
                            if (obj.private_range) {
                                obj.ssh_options = global.config.checker_private_ssh_options;
                                obj.user = global.config.checker_private_user;
                                obj.port = global.config.checker_private_port;
                                obj.host = host;
                            }
                        }

                        // override success
                        if (!err || global.config.checker_force_success) {
                            // @TODO: if really not success fill user by first checker_user mention
                            obj.success = true;
                        } else {
                            obj.success = false;
                            obj.error = err;
                        }

                        // override user field with specific pref config
                        // @TODO: merge with user preference order
                        if (typeof global.config.checker_specific_pref != "undefined" && obj.success) {
                            var idx = -1;
                            _.find(global.config.checker_specific_pref, function(o, i){
                                if (_.keys(o)[0] == hostname) idx = i; return _.keys(o)[0] == hostname;
                            });
                            if (idx != -1) {
                                obj.user = global.config.checker_specific_pref[idx][hostname].user;
                            }
                        }

                        // user preference order based on array field
                        if (done[key] != true) {
                            done[key] = true;
                            data[key].checker = obj;
                        } else {
                            if ((obt.success == true && data[key].checker.success == false) ||
                                (_.indexOf(global.config.checker_users, obj.user) < _.indexOf(global.config.checker_users, data[key].checker.user)))
                                data[key].checker = obj;
                        }

                        // @TODO: replace this simple end callback detection by an intelligent system based on predictive number of callback and a scoring
                        // when we have success or failure for detect end of work for each node
                        if (Object.keys(data).length === Object.keys(done).length) {
                            return callback(data);
                        }
                    });
                })(this, key));
            }

            if (!hash instanceof Array) {
                hash.rows = _results;
                return hash;
            }
            else
                return _results;
        };

        return SshCheck;

    })();

    module.exports = SshCheck;

}).call(this);
