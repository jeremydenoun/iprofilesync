#!/usr/bin/env node

var tools = require('./src/lib/function.js');

// non-interactive mode default
global.interactive = false;

var { Command } = require('commander');
var util = require('util');

// check winston or loglevel for logging
global.log = console.log;
global.warn = console.log;
global.error = console.log;
global.debug = console.log;

// Build a fresh program instance. Commander is stateful once parsed, so the
// interactive REPL below rebuilds one per line instead of re-parsing a shared
// instance.
function buildProgram() {
    var program = new Command();

    program
        .name('iprofilesync')
        .version('2.0.0')
        .option('-q, --quiet', 'silent mode');

    // In interactive mode we must never let commander exit the process
    // (on --help, unknown command, missing argument, ...). exitOverride throws
    // instead, and we swallow it in the REPL loop.
    if (global.interactive) {
        program.exitOverride();
    }

    program
        .command('check <service> <users> <host>')
        .description('execute "service" check on remote host')
        .option('-k, --private_ssh_key <path>', 'Use SSH Key (default : ~/.ssh/.id_rsa or ~/.ssh/.id_dsa)')
        .option('--password <pass>', 'Use password for validate SSH connection (default : null)')
        .action(function (service, users, host, options) {
            /* Adapter for checker */
            var Checker = require('./src/checker/' + service + '.js');
            var chk = new Checker({});
            var users_list = users.trim().split(',');

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
        })
        .addHelpText('after', [
            '',
            '  Examples:',
            '',
            '    $ check ssh root localhost',
            '    $ check ssh customer,www-data,root localhost',
            ''
        ].join('\n'));

    program
        .command('list <service>')
        .description('fetch host list from service adapter using config/profile/{service}.conf')
        .action(function (service) {
            var config = tools.import_json('config/profile/' + service + '.json');

            if (!config)
                return;
            if (!config.adapter)
                config.adapter = 'default';

            try {
                var ListAdapter = require('./src/adapter/' + config.adapter + '.js');

                var lister = new ListAdapter(config);
                lister.list(function (nodes_list) { global.log(util.inspect(nodes_list, { depth: null })); });
            } catch (err) {
                console.log(err);
                global.error('Unable to load src/adapter/' + config.adapter + '.js adapter');
                return;
            }
        })
        .addHelpText('after', [
            '',
            '  Examples:',
            '',
            '    $ list default',
            '    $ list chef',
            ''
        ].join('\n'));

    program
        .command('config <service> [pattern]')
        .description('display config (pattern key based) for services config/profile/{service}.conf')
        .action(function (service, pattern) {
            var config = tools.import_json('config/profile/' + service + '.json');

            if (!config)
                return;

            var result = config;
            // Filter keys by plain substring match. Using indexOf (not a regex
            // built from the CLI argument) avoids regex injection / ReDoS.
            if (typeof pattern !== 'undefined') {
                Object.keys(result).filter(function (v) {
                    return v.indexOf(pattern) === -1;
                }).forEach(function (v) {
                    delete result[v];
                });
            }

            global.log(util.inspect(result, { depth: null }));
        })
        .addHelpText('after', [
            '',
            '  Examples:',
            '',
            '    $ config default adapter',
            ''
        ].join('\n'));

    program
        .command('sync <service>')
        .description('launch sync based on service config/profile/{service}.conf')
        .option('-d, --debug', 'Debug display')
        .action(function (service, options) {
            var config = tools.import_json('config/profile/' + service + '.json');

            if (!config)
                return;

            if (!config.adapter)
                config.adapter = 'default';
            if (!config.checker)
                config.checker = 'default';
            if (!config.indexer)
                config.indexer = 'default';
            if (!config.exporter)
                config.exporter = 'default';

            config.service = service;

            try {
                var Adapter = require('./src/adapter/' + config.adapter + '.js');
                var Checker = require('./src/checker/' + config.checker + '.js');
                var Indexer = require('./src/indexer/' + config.indexer + '.js');
                var Exporter = require('./src/exporter/' + config.exporter + '.js');

                global.config = config;

                var adapter = new Adapter(config);
                var checker = new Checker(config);
                var indexer = new Indexer(config);
                var exporter = new Exporter(config);

                adapter.list(function (nodes_list) {
                    if (nodes_list.length == 0) {
                        global.warn('no nodes found');
                        return;
                    }
                    if (options.debug)
                        global.debug('Adapter nodes list : \n' + util.inspect(nodes_list, { depth: null }));
                    checker.check_nodes(nodes_list, function (nodes_checked) {
                        if (options.debug)
                            global.debug('Checker step : \n' + util.inspect(nodes_checked, { depth: null }));
                        indexer.index(nodes_checked, function (nodes_indexed) {
                            if (options.debug)
                                global.debug('Indexer result : \n' + util.inspect(nodes_indexed, { depth: null }));
                            exporter.export(nodes_indexed, function (result) {
                                global.log('export completed for ' + service + ' : ' + result + ' node' + (result > 1 ? 's' : '') + ' exported');
                            });
                        });
                    });
                });
            } catch (err) {
                global.error('An error occured with this profil. Please check your configuration (or run with debug option) !');
                if (options.debug)
                    global.debug(err);
            }
        })
        .addHelpText('after', [
            '',
            '  Examples:',
            '',
            '    $ sync default',
            ''
        ].join('\n'));

    program
        .command('help')
        .description('display help')
        .action(function () {
            program.help();
        });

    // Catch-all for unknown commands.
    program.on('command:*', function (operands) {
        global.log('command not found : "%s"', operands[0]);
    });

    return program;
}

if (process.argv.length == 2) {
    global.interactive = true;
    var readline = require('readline-history');

    var rl = readline.createInterface({
        path: '/tmp/.its_history', maxLength: 1000, input: process.stdin, output: process.stdout,
        next: function (rl) {
            rl.setPrompt('#> ');
            rl.prompt(true);
            rl.on('line', function (line) {
                try {
                    // Rebuild a fresh program each line: commander instances are
                    // single-use once parsed.
                    buildProgram().parse(['', ''].concat(line.trim().split(' ')));
                } catch (err) {
                    // exitOverride throws on help/unknown command/etc. in
                    // interactive mode; keep the REPL alive.
                }
                rl.prompt(true);
            }).on('close', function () {
                tools.exit();
            });
        }
    });
} else {
    buildProgram().parse(process.argv);
}
