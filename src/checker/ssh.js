(function() {
    var Fs, Path, Ssh, SshCheck, slice,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

    Ssh = require('ssh2');

    Fs = require('fs');

    Path = require('path-extra');

    _    = require('underscore');

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

            var errored, f, k, key, port, ports, ran, succeeded, user, users, _i, _j, _len, _len1, _ref, _ref1, _results;
            if (data.hasOwnProperty('checker_private_key') && data.checker_private_key) {
                if (!Fs.existsSync(data.checker_private_key)) {
                    process.nextTick(function() {
                        return callback(new Error("Unable to find private key : " + data.checker_private_key));
                    });
                    return;
                }
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
            data.privateKey = Fs.readFileSync(data.privateKey).toString();

            users = data.checker_users instanceof Array ? data.checker_users : [(_ref1 = data.checker_users) != null ? _ref1 : process.env.USER];
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

                    if (typeof data[key] == "object" && typeof data[key][Object.keys(data[key])[0]].ipaddress != "undefined")
                        host=data[key][Object.keys(data[key])[0]].ipaddress;

                    return self.check(host, {}, function(err, obj) {
                        if (!obj)
                            obj = {};

                        if (global.config.checker_private_prefix){
                            obj.private_range = (host.indexOf(global.config.checker_private_prefix) > -1);
                            if (host.indexOf(global.config.checker_private_prefix) > -1) {
                                obj.ssh_options = global.config.checker_private_ssh_options;
                                obj.user = global.config.checker_private_user;
                                obj.port = global.config.checker_private_port;
                                obj.host = host;
                            }
                        }

                        if (!err || global.config.checker_force_success) {
                            obj.success = true;
                        } else {
                            obj.success = false;
                            obj.error = err;
                        }

                        done[key] = true;
                        data[key].checker = obj;

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
