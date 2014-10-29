var Path = require('path-extra');
var Fs   = require('fs');
var _    = require('underscore');

module.exports = function (options) {

    this.check_nodes = function(nodes_list, callback) {
	if (typeof callback != "undefined")
            callback(nodes_list);
    }

    this.check = function (data, callback) {
	if (typeof callback != "undefined")
            callback(true);
    }
}
