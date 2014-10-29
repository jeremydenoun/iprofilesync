var SshCheck = require('../src/checker/ssh.js');
var ssh = new SshCheck();
var should = require('should');

describe('SshCheck', function () {
    describe('#checkOne', function () {
        this.timeout(6000);

        it('Should reject missing host', function (done) {
            ssh.checkOne({
                user: 'unused',
                callback: function (err, data) {
                    should.exist(err);
                    should.not.exist(data);
                    err.type.should.equal("MissingArgument");
                    done();
                }
            });
        });

        it('should reject missing user', function (done) {
            ssh.checkOne({
                host: 'unused',
                callback: function (err, data) {
                    should.exist(err);
                    should.not.exist(data);
                    err.type.should.equal("MissingArgument");
                    done();
                }
            });
        });

        it('should report error on non-existant keyfile', function (done) {
            ssh.checkOne({
                username: 'unused',
                host: 'unused',
                privateKey: '/non/existant',
                callback: function (err, data) {
                    should.exist(err);
                    should.not.exist(data);
                    err.type.should.equal("MissingKeyFile");
                    done();
                }
            });
        });

        it('should report error on invalid keyfile', function (done) {
            ssh.checkOne({
                username: 'unused',
                host: 'unused',
                privateKey: '/dev/null',
                callback: function (err, data) {
                    should.exist(err);
                    should.not.exist(data);
                    err.type.should.equal("InvalidKeyFile");
                    done();
                }
            });
        });

        it('should connect to a valid host', function (done) {
            ssh.checkOne({
                username: 'new',
                host: 'sdf.org',
                callback: done
            });
        });

        it('should timeout on a blackhole host', function (done) {
            ssh.checkOne({
                username: 'unused',
                host: '10.255.255.1',
                callback: function (err, data) {
                    should.exist(err);
                    should.not.exist(data);
                    err.level.should.equal("connection-timeout");
                    done();
                }
            });
        });

        it('should connect to a password protected host', function (done) {
            ssh.checkOne({
                username: 'adaedra',
                host: '127.0.0.1',
                callback: function (err, data) {
                    should.not.exist(err);
                    should.exist(data);
                    data.should.equal("password");
                    done();
                }
            });
        });

        it('should reject a password protected host if explicitely asked so', function (done) {
            ssh.checkOne({
                username: 'adaedra',
                host: '127.0.0.1',
                tryKeyboard: false,
                callback: function (err, data) {
                    should.exist(err);
                    should.not.exist(data);
                    err.level.should.equal('authentication');
                    done();
                }
            });
        });

        it('should reject connection with bad password', function (done) {
            ssh.checkOne({
                username: 'adaedra',
                host: '127.0.0.1',
                tryKeyboard: false,
                callback: function (err, data) {
                    should.exist(err);
                    should.not.exist(data);
                    err.level.should.equal('authentication');
                    done();
                }
            });
        });

        it('should connect if a correct password is given', function (done) {
            var password = process.env.TEST_PASSWORD;
            var user = process.env.USER;

            if (!password) {
                throw new Error("You should provide your current password "
                    + "with the TEST_PASSWORD variable");
            }

            ssh.checkOne({
                host: '127.0.0.1',
                username: user,
                password: password,
                callback: function (err, data) {
                    should.not.exist(err);
                    should.exist(data);
                    data.should.be.true;
                    done();
                }
            });
        });
    });

    describe('#check', function () {
        this.timeout(10000);

        it('should return correct results for connection tries', function (done) {
            var users = [ 'adaedra', 'root', 'pinkiepie', 'foo', 'nobody' ];
            ssh.check(
                users,
                {
                    host: '127.0.0.1',
                    callback: function (err, data) {
                        should.not.exist(err);
                        should.exist(data);
                        should.exist(data.success);
                        should.exist(data.failure);
                        data.success.length.should.equal(0);
                        data.failure.length.should.equal(users.length);
                        done();
                    }
                });
        });

        it('should report fatal errors', function (done) {
            ssh.check(
                [ 'o', 's', 'e', 'f' ],
                {
                    host: 'nowhere',
                    privateKey: '/non/existant',
                    callback: function (err, data) {
                        should.exist(err);
                        should.not.exist(data);
                        should.exist(err.fatal);
                        err.fatal.should.be.true;
                        err.type.should.equal('MissingKeyFile');
                        done();
                    }
                });
        });

        it ('should report correct results for password based authentication', function (done) {
            var password = process.env.TEST_PASSWORD;
            var user = process.env.USER;

            if (!password) {
                throw new Error("You should provide your current password "
                    + "with the TEST_PASSWORD variable");
            }

            var users = {
                root: 'foo',
                nobody: 'bar'
            };
            users[user] = password;

            ssh.check(
                users,
                {
                    host: '127.0.0.1',
                    callback: function (err, data) {
                        should.not.exist(err);
                        should.exist(data);
                        should.exist(data.success);
                        should.exist(data.failure);
                        data.success.length.should.equal(1);
                        data.failure.length.should.equal(2);
                        data.success.should.containEql(user);
                        data.host.should.be.equal('127.0.0.1');
                        var users = data.failure.map(function (data) {
                            return data.user;
                        });
                        users.should.containEql('root');
                        users.should.containEql('nobody');
                        done();
                    }
                });
        });
    });
});