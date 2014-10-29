#!/usr/bin/env node

var tools = require('./src/lib/function.js');

global.interactive = false;
var program = require('commander-sync');
var util = require('util');

// check winston or loglevel for logging
global.log = console.log;
global.warn = console.log;
global.error = console.log;
global.debug = console.log;

program
    .version('1.0.0')
    .option('-q, --quiet', 'silent mode')

program
    .command('check <service> <users> <host>')
    .description('execute "service" check on remote host')
    .option("-k, --private_ssh_key <path>", "Use SSH Key (default : ~/.ssh/.id_rsa or ~/.ssh/.id_dsa)")
    .option("--password <pass>", "Use password for validate SSH connection (default : null)")
    .action(function(service, users, host, options){
	    /* Adapter for checker */
	    var Checker = require('./src/checker/'+ service +'.js');
	    var chk = new Checker();
	    var users_list = users.trim().split(",");

	    chk.check(
			      users_list,
			      {
				  host: host,
				  privateKey: options.private_ssh_key || null,
			          password: options.password || null,
				  callback: function (err, data) {
				      if (err)
					  global.log(util.inspect(err, false, null));
				      else
					  global.log(util.inspect(data, false, null));
				  }
			      }
	   );
	}).on('--help', function() {
		global.log('  Examples:');
		global.log();
		global.log('    $ check ssh root localhost');
		global.log('    $ check ssh customer,www-data,root localhost');
		global.log();
	    });

program
    .command('list <service>')
    .description('fetch host list from service adapter using config/profile/{service}.conf')
    .action(function(service, options){
	    var config = tools.import_json("config/profile/"+service+".json");

	    if (!config)
		return;
	    if (!config.adapter)
		config.adapter = "default";

	    try {
		var ListAdapter = require('./src/adapter/'+config.adapter+'.js');
		var lister = new ListAdapter(config);
		global.log(util.inspect(lister.list(), { depth: null }));
	    } catch (err) {
		return;
	    }

	}).on('--help', function() {
		global.log('  Examples:');
		global.log();
		global.log('    $ list default');
		global.log('    $ list chef');
		global.log();
	    });


program
    .command('config <service> [pattern]')
    .description('display config (pattern key based) for services config/profile/{service}.conf')
    .action(function(service, pattern, options){
	    var config = tools.import_json("config/profile/"+service+".json");

	    if (!config)
		return;

	    result = config;
	    Object.keys(result).filter(function (v) {
		    return !v.match(pattern);
		}).forEach(function (v) {
			delete result[v];
		    });

	    global.log(util.inspect(result, { depth: null }));

	}).on('--help', function() {
		global.log('  Examples:');
		global.log();
		global.log('    $ config default adapter');
		global.log();
	    });

program
    .command('sync <service>')
    .description('launch sync based on service config/profile/{service}.conf')
    .action(function(service, options){
	    var config = tools.import_json("config/profile/"+service+".json");

	    if (!config)
		return;

	    if (!config.adapter)
		config.adapter = "default";
	    if (!config.checker)
		config.checker = "default";
	    if (!config.indexer)
		config.indexer = "default";
	    if (!config.exporter)
		config.exporter = "default";

	    //	    try {
        var Adapter = require('./src/adapter/'+config.adapter+'.js');
		var Checker = require('./src/checker/'+ config.checker +'.js');
		var Indexer = require('./src/indexer/'+ config.indexer +'.js');
		var Exporter = require('./src/exporter/'+ config.exporter +'.js');


        var adapter = new Adapter(config);
		var checker = new Checker(config);
		var indexer = new Indexer(config);
		var exporter = new Exporter(config);

        var nodes_list = adapter.list();

		if (nodes_list.length == 0) {
		    global.warn("no nodes found");
		    return;
		}

		// check if nodes available if 0 nodes available => warning
		nodes_check = checker.check_nodes(nodes_list, function(node_checked) {
            global.log(node_checked);
            process.exit(0);
			// check if nodes indexedif 0 nodes available => warning
			indexer.index(node_checked, function(node_indexed) {
				// try to export
				exporter.export(nodes_indexed, function(result) {
				    });
			    });
		    });

		//global.log(util.inspect(nodes_index, { depth: null }));
		// if debug warning
		// notify if config

		//} catch (err) {
                //return;
		//}

	}).on('--help', function() {
		global.log('  Examples:');
		global.log();
		global.log('    $ sync default');
		global.log();
	    });



program
    .command('help')
    .description('display help')
    .action(function(env){
	    program.help();
	});


program
    .command('*')
    .action(function(env){
	    global.log('command not found : "%s"', env);

	});



if (process.argv.length == 2) {
    global.interactive = true;
    var readline = require('readline-history');
    /*    rl = readline.createInterface({
	    path: "/tmp/.its_history",
	    maxLength: 1000,
	    input: process.input,
	    output: process.output,
	    terminal: true,
	    });*/

    rl = readline.createInterface({"path": "/tmp/.its_history", maxLength: 1000, "input" : process.stdin, "output" : process.stdout,
				   "next": function (rl) {
		rl.setPrompt('#> ');
		rl.prompt(true);
		rl.on('line', function(line) {
			program.parse(["", ""].concat(line.trim().split(" ")));
			/*switch(line.trim()) {
			case 'hello':
			    global.log('world!');
			    break;
			default:
			    global.log('command not found: `' + line.trim() + '`');
			    break;
			    }*/
			rl.prompt(true);
		    }).on('close', function() {
			    tools.exit();
			});
	    }
	});
    //process.exit(0);
} else {
    program.parse(process.argv);
}
