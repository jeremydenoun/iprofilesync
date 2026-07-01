var SshCheck = require('../src/checker/ssh.js');
var should = require('should');

// check_nodes reads global.config; provide a minimal default.
global.config = global.config || { checker_users: [] };

describe('SshCheck', function () {
    describe('#check', function () {
        it('should report an error when the given private key does not exist', function (done) {
            var ssh = new SshCheck({});
            ssh.check('localhost', {
                checker_users: ['root'],
                checker_private_key: '/non/existant/key',
                checker_ports: 22
            }, function (err, data) {
                should.exist(err);
                should.not.exist(data);
                err.message.should.match(/Unable to find private key/);
                done();
            });
        });
    });

    describe('#check_nodes', function () {
        // Drive check_nodes with a stubbed check() so no network/key is needed,
        // then assert how the per-node checker result is derived.

        it('marks a node as failed when the check errors', function (done) {
            var ssh = new SshCheck({});
            global.config = { checker_users: ['root', 'admin'] };

            ssh.check = function (host, opts, cb) {
                process.nextTick(function () { cb(new Error('nope')); });
            };

            ssh.check_nodes([{ 'web01': { ipaddress: '10.0.0.1' } }], function (data) {
                var checker = data[0].checker;
                should.exist(checker);
                checker.success.should.equal(false);
                should.exist(checker.error);
                done();
            });
        });

        it('marks a node as successful on a clean check', function (done) {
            var ssh = new SshCheck({});
            global.config = { checker_users: ['root'] };

            ssh.check = function (host, opts, cb) {
                process.nextTick(function () {
                    cb(null, { success: true, user: 'root', host: host, port: 22 });
                });
            };

            ssh.check_nodes([{ 'web01': { ipaddress: '10.0.0.1' } }], function (data) {
                data[0].checker.success.should.equal(true);
                data[0].checker.user.should.equal('root');
                done();
            });
        });

        it('forces success when checker_force_success is set', function (done) {
            var ssh = new SshCheck({});
            global.config = { checker_users: ['root'], checker_force_success: true };

            ssh.check = function (host, opts, cb) {
                process.nextTick(function () { cb(new Error('nope')); });
            };

            ssh.check_nodes([{ 'web01': { ipaddress: '10.0.0.1' } }], function (data) {
                data[0].checker.success.should.equal(true);
                done();
            });
        });
    });
});
