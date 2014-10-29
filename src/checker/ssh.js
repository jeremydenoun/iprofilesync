(function() {
  var Fs, Path, Ssh, SshCheck, slice,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Ssh = require('ssh2');

  Fs = require('fs');

  Path = require('path-extra');

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
    function SshCheck() {}

    SshCheck.prototype.host = function(data, callback) {
      var errored, f, k, key, port, ports, ran, succeeded, user, users, _i, _j, _len, _len1, _ref, _ref1, _results;
      if (data.hasOwnProperty('privateKey')) {
        if (!Fs.existsSync(data.privateKey)) {
          process.nextTick(function() {
            return callback(new Error("Unable to find private key"));
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
      users = data.username instanceof Array ? data.username : [(_ref1 = data.username) != null ? _ref1 : process.env.USER];
      ports = data.port instanceof Array ? data.port : [data.port];
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
              args = slice(data, ['host', 'password', 'privateKey', 'passphrase']);
              args.username = user;
              if (port) {
                args.port = port;
              }
              conn = new Ssh;
              conn.on('ready', function() {
                if (!succeeded) {
                  succeeded = true;
                  if (!sent) {
                    callback(null, {
                      host: data.host,
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
      var done, key, _results;
      done = {};
      _results = [];
      for (key in hash) {
        _results.push((function(self, key) {
          return self.host(hash[key], function(err, data) {
            if (err) {
              hash[key].success = false;
              hash[key].error = err;
            } else {
              hash[key].success = true;
              hash[key].match = data;
            }
            done[key] = true;
            if (Object.keys(hash).length === Object.keys(done).length) {
              return callback(hash);
            }
          });
        })(this, key));
      }
      return _results;
    };

    return SshCheck;

  })();

  module.exports = SshCheck;

}).call(this);
