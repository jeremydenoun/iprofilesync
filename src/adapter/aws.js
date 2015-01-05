var Path = require('path-extra');
var Fs   = require('fs');
var _    = require('underscore');
var shell = require("shelljs");
var util = require('util');
var AWS = require('aws-sdk');
var tools = require('../lib/function.js');


module.exports = function (options) {
    this.list = function (callback) {
	    shell.config.silent = true;

	    try {
            AWS.config.update({accessKeyId: options.adapter_aws_access_key_id, secretAccessKey: options.adapter_aws_secret_access_key});
            region_remain = options.adapter_aws_region.length;
            var rows = [];
            for (region_idx = 0; region_idx < options.adapter_aws_region.length; region_idx++) {
                AWS.config.region = options.adapter_aws_region[region_idx];
                var ec2 = new AWS.EC2();
                ec2.describeInstances( function(err, data, context) {
                    if (err) {
                        console.log(err, err.stack);
                        return null;
                    }

                    if (data.Reservations.length > 0) {
                        instances_list = data.Reservations[0].Instances;
                        node = instances_list[0];

                        var res = {};
                        var name = node.InstanceId;
                        if (_.where(node.Tags, {"Key":"Name"}).length)
                            name = _.where(node.Tags, {"Key":"Name"})[0].Value;

                        res["ipaddress"] = node.PublicIpAddress;
                        res["tags"] = [node.InstanceType];
                        if (!options.adapter_aws_key_internal_force) {
                            if (typeof options.adapter_aws_key_path_force != "undefined" && options.adapter_aws_key_path_force != "") {
                                res["checker_private_key"] = options.adapter_aws_key_path_force;
                                res["ssh_options"] = "-i "+options.adapter_aws_key_path_force;
                            }
                            else {
                                res["checker_private_key"] = Path.join(options.adapter_aws_key_repository, node.KeyName + ".pem");
                                res["ssh_options"] = "-i " + Path.join(options.adapter_aws_key_repository , node.KeyName + ".pem");
                            }
                        }
                        var n = {};
                        n[name] = res;
                        rows.push(n);
                    }

                    if (--region_remain == 0) {
                        callback(tools.override_adapter_list(rows, options));
                    }
                });
            }
        } catch (err) {
            global.log(err);
            global.log("Unable to access to AWS account I fallback on : " + options.adapter_fallback_file);

            /* restore from fallback */
            if (options.adapter_fallback_file && Fs.existsSync(options.adapter_fallback_file))
                return callback(tools.import_json(options.adapter_fallback_file));
	        return false;
	    }
    }
}
