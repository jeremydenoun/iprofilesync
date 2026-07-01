var Path = require('path-extra');
var Fs   = require('fs');
var _    = require('underscore');
var { EC2Client, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');
var tools = require('../lib/function.js');

module.exports = function (options) {
    this.list = function (callback) {
        var fallback = function () {
            /* restore from fallback */
            if (options.adapter_fallback_file && Fs.existsSync(options.adapter_fallback_file))
                return callback(tools.import_json(options.adapter_fallback_file));
            return false;
        };

        try {
            var regions = options.adapter_aws_region;
            var credentials;
            if (options.adapter_aws_access_key_id && options.adapter_aws_secret_access_key) {
                credentials = {
                    accessKeyId: options.adapter_aws_access_key_id,
                    secretAccessKey: options.adapter_aws_secret_access_key
                };
            }

            var rows = [];
            var region_remain = regions.length;
            var errored = false;

            regions.forEach(function (region) {
                var ec2 = new EC2Client(_.extend({ region: region }, credentials ? { credentials: credentials } : {}));

                ec2.send(new DescribeInstancesCommand({}))
                    .then(function (data) {
                        if (data.Reservations && data.Reservations.length > 0) {
                            var instances_list = data.Reservations[0].Instances;
                            var node = instances_list[0];

                            var res = {};
                            var name = node.InstanceId;
                            if (_.where(node.Tags, { Key: 'Name' }).length)
                                name = _.where(node.Tags, { Key: 'Name' })[0].Value;

                            res.ipaddress = node.PublicIpAddress;
                            res.tags = [node.InstanceType];
                            if (!options.adapter_aws_key_internal_force) {
                                if (typeof options.adapter_aws_key_path_force != 'undefined' && options.adapter_aws_key_path_force != '') {
                                    res.checker_private_key = options.adapter_aws_key_path_force;
                                    res.ssh_options = '-i ' + options.adapter_aws_key_path_force;
                                } else {
                                    res.checker_private_key = Path.join(options.adapter_aws_key_repository, node.KeyName + '.pem');
                                    res.ssh_options = '-i ' + Path.join(options.adapter_aws_key_repository, node.KeyName + '.pem');
                                }
                            }
                            var n = {};
                            n[name] = res;
                            rows.push(n);
                        }
                    })
                    .catch(function (err) {
                        console.log(err, err.stack);
                        errored = true;
                    })
                    .finally(function () {
                        if (--region_remain == 0) {
                            if (errored && rows.length === 0) {
                                global.log('Unable to access to AWS account I fallback on : ' + options.adapter_fallback_file);
                                return fallback();
                            }
                            callback(tools.override_adapter_list(rows, options));
                        }
                    });
            });
        } catch (err) {
            global.log(err);
            global.log('Unable to access to AWS account I fallback on : ' + options.adapter_fallback_file);
            return fallback();
        }
    };
};
