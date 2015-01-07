#!/usr/bin/env node

var tools = require('./src/lib/function.js');

// non-interactive mode default
global.interactive = false;

var program = require('commander');
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
	    var chk = new Checker({});
	    var users_list = users.trim().split(",");

	    chk.check(
			host,
			{
				checker_users: users_list,
                checker_private_key: options.private_ssh_key || null,
                checker_ports: 22,
			    password: options.password || null
            },
			function (err, data) {
				if (err)
					global.log(util.inspect(err, false, null));
				else
					global.log(util.inspect(data, false, null));
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
            global.err("Unable to load src/adapter/"+config.adapter+".js adapter");
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
    .option("-d, --debug", "Debug display")
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

        config.service = service;

	    try {
            var Adapter = require('./src/adapter/'+config.adapter+'.js');
		    var Checker = require('./src/checker/'+ config.checker +'.js');
		    var Indexer = require('./src/indexer/'+ config.indexer +'.js');
		    var Exporter = require('./src/exporter/'+ config.exporter +'.js');

            global.config = config;

            var adapter = new Adapter(config);
		    var checker = new Checker(config);
		    var indexer = new Indexer(config);
		    var exporter = new Exporter(config);

            adapter.list(function(nodes_list) {
		        if (nodes_list.length == 0) {
		            global.warn("no nodes found");
		            return;
		        }
                if (options.debug)
                    global.debug("Adapter nodes list : \n" + util.inspect(nodes_list, { depth: null }));
		        nodes_check = checker.check_nodes(nodes_list, function(nodes_checked) {
                    if (options.debug)
                        global.debug("Checker step : \n" + util.inspect(nodes_checked, { depth: null }));
			        indexer.index(nodes_checked, function(nodes_indexed) {
                        if (options.debug)
                            global.debug("Indexer result : \n" + util.inspect(nodes_indexed, { depth: null }));
				        exporter.export(nodes_indexed, function(result) {
                            global.log("export completed for "+ service + " : " + result + " node"+ (result > 1 ? "s" : "") + " exported");
                            //process.exit(0);
				        });
			        });
		        });
            });

		//global.log(util.inspect(nodes_index, { depth: null }));

		} catch (err) {
            global.error("An error occured with this profil. Please check your configuration (or run with debug option) !");
            if (options.debug)
                global.debug(err);
		}

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

    rl = readline.createInterface({"path": "/tmp/.its_history", maxLength: 1000, "input" : process.stdin, "output" : process.stdout,
				   "next": function (rl) {
		rl.setPrompt('#> ');
		rl.prompt(true);
		rl.on('line', function(line) {
			program.parse(["", ""].concat(line.trim().split(" ")));
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
