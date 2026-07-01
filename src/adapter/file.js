var Fs   = require('fs');
var tools = require('../lib/function.js');

module.exports = function (options) {
    this.list = function (callback) {
	    try {
            return callback(tools.import_json(options.adapter_file_path));
	    } catch (err) {
            global.log(err);
	        return false;
	    }
    }
}
