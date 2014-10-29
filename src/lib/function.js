var exit = function(ret) {
    global.log("Good Bye");
    process.exit(ret);
}

var import_json = function(path) {
    var fs = require("fs");
    JSON.minify = JSON.minify || require("node-json-minify");

    try {
	var json = (JSON.parse(JSON.minify(fs.readFileSync(path, "utf8"))));
    } catch (err) {
	if ( err instanceof SyntaxError ) {
	    global.error("unable to parse json " + path + ": ");
	    global.error(err);
	}
	return false;
    }
    return json;
}

module.exports.exit = exit;
module.exports.import_json = import_json;