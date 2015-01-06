iProfilSync dynamic profil exporter
===
[![Code Climate](https://codeclimate.com/github/jeremydenoun/iprofilsync/badges/gpa.svg)](https://codeclimate.com/github/jeremydenoun/iprofilsync)
[![Test Coverage](https://codeclimate.com/github/jeremydenoun/iprofilsync/badges/coverage.svg)](https://codeclimate.com/github/jeremydenoun/iprofilsync)
[![NPM dependencies](https://david-dm.org/jeremydenoun/iprofilsync.png)](https://david-dm.org/jeremydenoun/iprofilsync)

### Prerequisites :

    * node (tested with v0.10.32)
    * for file usage :
          * nothing
    * for chef usage :
          * correct knife configuration (tested with Chef: 11.12.8)
          * or user name / private key and server url
    * for aws usage (EC2 instances) :
          * access_key_id / secret_access_key
          * region list where you have EC2 instances
          * directory with your aws pem key or single key pem or be sure to have access with your private key
    * for puppet usage : (*TODO*)
          * credentials
    * for vmware usage : (*TODO*)
          * credentials

All dependencies are included in node_modules/ in a correct version and describe in package.json you can show it with npm list.

Actually 3 npm modules are customized for assure correct behavior :

    * chef (0.3.0-custom) => I replace forsake usage by rsautl wrapper module customized by myself
    to be synchronous (if no callback provided)
    * commander (2.3.0-custom) => I would like a "interactive cli" so I add it
    * simple-plist (0.0.3-custom) => This module use deprecated plist function so I fix it
    (we can merge with master if they fix it)

### Installation

```sh
npm install iprofilsync

or

git clone https://github.com/jeremydenoun/iprofilsync.git
```

### Usage

iProfilSync is a command line tool build for sync a data repository with another tools.

We have 4 process steps :

   * import data (adapter) - available in src/adapter/*
   * launch check (checker) - available in src/checker/*
   * format for export (indexer) - available in src/indexer/*
   * write it (exporter) - available in src/exporter/*

With a simple configuration you can execute task like :

   * generate/sync a CMDB or inventory
   * check your SSH connectivity
   * Auto Tag your data
   * sync your hosts with iTerm2 although dynamic profile *

A cli is available for all command :
```sh
node iprofilsync.js
#>
```

You can get available command with help command :
```sh
node iprofilsync.js
#> help

  Usage:  [options] [command]

  Commands:

    check [options] <service> <users> <host>
       execute "service" check on remote host

    list <service>
       fetch host list from service adapter using config/profile/{service}.conf

    config <service> [pattern]
       display config (pattern key based) for services config/profile/{service}.conf

    sync [options] <service>
       launch sync based on service config/profile/{service}.conf

    help
       display help

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
    -q, --quiet    silent mode
```

You can launch command with cli or directly with command line :

```sh
node iprofilsync.js config default
{ adapter: 'default',
  checker: 'default',
  indexer: 'default',
  exporter: 'default' }

node iprofilsync.js sync --help
  Usage: sync [options] <service>

  Options:

    -h, --help   output usage information
    -d, --debug  Debug display

  Examples:

    $ sync default

node iprofilsync sync chef
=> "~/Library/Application Support/iTerm2/DynamicProfiles/chef.plist"
export completed for chef : 42 nodes exported
```

### Configuration

You should write your own configuration into **config/profile/** directory and use it like a **service** into command line.

Some common demo configuration are available on **config/profile/demo\*.json**, you can find below a **complete** configuration but only [MANDATORY] field are needed, the [RECOMMENDED] field are recommended (depending your usage) and the others are optionnal.

```sh
{
	"adapter" : "chef", /* support : default / file / chef / chef_knife / aws [MANDATORY]*/

    /* custom config for file adapter */
	"adapter_file_path": "{path}", /* JSON data path must respect syntax like [ { "localhost": {"ipaddress" : "127.0.0.1"} } ] */

    /* custom config for chef adapter */
    "adapter_chef_username": "{username}", /* chef username */
    "adapter_chef_key_user_path": "{private key path}", /* private key path (.pem) */
	"adapter_chef_url": "{url}", /* chef server url  */

    /* If you prefer use knife system you can custom config chef_knife adapter */
    "adapter_chef_home": "{your knife repo}",
    "adapter_chef_custom_cmd": false, /* by default we use 'knife search node "name:*" -a ipaddress --format json' you can replace it by your cmd (you must be compliant with knife json output) */

    /* custom config for aws adapter */
	"adapter_aws_access_key_id": "{your access key}", /* your aws access key id */
	"adapter_aws_secret_access_key": "{your secret access key}", /* your aws secret access key be careful your config file must be readable only by you */
    "adapter_aws_region" : ['us-east-1'], /* array of your region */
    "adapter_aws_key_repository" : "{private key pair directory}", /* directory with your pem key named like amazon key pair name .pem */
    "adapter_aws_key_path_force" : "{key path}", /* use it if you want force only one key */
    "adapter_aws_key_internal_force" : false, /* use your private key */


     /* custom config for all adapter */
    "adapter_fallback_file": "{path}/nodes.json", /* use this file as source if an error occured for don't remove all node */

	"adapter_suffix" : "", /* TODO we check strict hostname first and if this fail we try to fallback on hostname+adapter_suffix (think to "dot" first) */
	"adapter_force_suffix": false, /* TODO if true check with suffix will be more important than check without suffix */

	"adapter_ignore" : [ ], /* host (node) to ignore on your adapter list*/
	"adapter_manual" :  [ { "localhost": {"ipaddress" : "127.0.1.1"} } ], /* define a list of additional host to add on your adapter list */
	"adapter_alias" : [ { "localhost": {"ipaddress" : "127.0.0.1"} } ], /* define a list of alias for overwrite your adapter list */


	"checker" : "ssh", /* support : default / ssh [MANDATORY] */
	"checker_users" : ["root","customer"], /* user name preference list [RECOMMENDED]*/
	"checker_private_key" : false, /* private key (default: ~/.id_[rd]sa) */
	"checker_password" : false, /* default password */
	"checker_ports" : [22, 2222], /* ssh ports list [RECOMMENDED] */
    "checker_force_success" : false, /* specific bool for force checker to always validate entry */
	"checker_specific_pref" : [ {"localhost": {"user": "root"} } ], /* specif user for specific node */
    "checker_private_user" : "root", /* user for private area */
    "checker_private_port" : "22", /* port for private area */
    "checker_private_prefix": "10.", /* prefix ip for private area */
    "checker_private_ssh_options": "-o ProxyCommand=\"ssh -W %h:%p root@{proxy-server-for-internal}\"", /* proxy ssh command for internal */


	"indexer" : "iterm2", /* support : default / iterm2 [MANDATORY]*/
	"indexer_rules" : ["name", "guid", "command", "tags"], /* custom function for enhanced nodes list [RECOMMENDED] */
	"indexer_static_template" : {
        "Default Bookmark" : "No",
		"Custom Command" : "Yes",
		"ASCII Anti Aliased" : true
	     }, /* define standard config for node, you can overide this by node name with indexer_specific_pref you can check src/indexer/iterm2_model for available key [RECOMMENDED] */
    "indexer_global_name_separator" : "-", /* separator for name field by example web-01 => "-" | default : "-" */
    "indexer_global_generic_tag" : [ "{global tag}" ], /* global tag for each node [RECOMMENDED] */
    "indexer_global_ignore_tag" : [ "{ignore tag}" ], /* remove this tag list */
    "indexer_global_command" : "ssh -A", /* global command for each node [RECOMMENDED] */
	"indexer_specific_pref" : [ {"localhost": {"Custom Command" : "Yes"} } ], /* specify template preference for node name */

	"exporter" : "default", /* default [MANDATORY] */
	"exporter_path" : "~/Library/Application Support/iTerm2/DynamicProfiles/chef.plist", /* node name to exclude [MANDATORY] */
    "exporter_print_diff" : true, /* print diff before write */
	"exporter_format" : "plist", /* json / plist / bplist [MANDATORY] */

	"log_level" : "error", /* TODO none / debug / warning / error */
	"notify_sync_error" : "none", /* TODO value : none / mail / url_callback / script */
	"notify_sync_data" : "" /* TODO mail / url / path script (log in parameter) */
}
```
*We use JSON import workaround permit us to add comment into JSON configuration file*

### Quick Start

chef => iterm2 usage

```sh
cd config/profile
cp demo-chef.json chef.json
#edit chef.json and fill {...} field (access, path, ..)
cd ../..
node iprofilsync.js sync -d chef # for debug version
node iprofilsync.js sync chef # for short version
```

### Known Issues

    * Checker SSH - If you specify N ssh users (checker_users) for a profile and all users have
    ssh access it's the first success callback win but if another success callback with prior
    username position in checker_users config they will be override but for determine if we have
    finish we wait one callback for each node so we can determine finish before receive success
    callback so for the moment we recommend to use checker_specific_pref for determine right user,
    in next release we will wait all ssh checking callback for be sure to have consistent system

### TODO

    * Adapter :
      * puppet and vmware adapter
      * Adapter Suffix management
    * Checker :
      * Improve SSH checking for resolve known issue
      * verify real ssh connexion (wait a shell by example or other)
      * check internal range connectivity (actually we consider success in all case)
      * add a ping only checker
    * Indexer :
      * add an indexer for shell host support (bash/zsh)
    * Exporter :
      * bash/zsh exporter after indexer upgrade
      * improve changeset detector
      * support multiple exporter
    * General :
      * log level and notification
      * Mocha Testing on all step
      * progress bar display

### Link
https://iterm2.com/dynamic-profiles.html - iTerm2 Dynamic Profil Feature
https://code.google.com/p/iterm2/issues/detail?id=3094 - Original Feature Request


