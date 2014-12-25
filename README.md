iProfilSync dynamic profil exporter
===

### Prerequisites :

    * node (tested with v0.10.32)
    * for file usage :
          * nothing
    * for chef usage :
          * correct knife configuration (tested with Chef: 11.12.8)
    * for puppet usage : (*TODO*)
          * credentials
    * for vmware usage : (*TODO*)
          * credentials

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
   * sync your hosts with iTerm2 http://iterm2.com/

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

    sync <service>
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

node iprofilsync sync chef
=> "/Users/denoun_j/Library/Application Support/iTerm2/DynamicProfiles/chef.plist"
export completed for chef : 42 nodes exported
```

### Configuration

We use JSON import workaround permit us to add comment into JSON configuration file

```sh
{
    "adapter" : "chef", /* support : default / file / chef */

    /* specific config for file adapter */
    "adapter_file_path": "~/xxx", /* JSON data store path format with [{"host1":{"ipaddress":"127.0.0.1"}},{"host2":{"ipaddress":"127.0.0.1"}}] */

    /* specific config for chef adapter */
    "adapter_chef_home": "{your knife repo}",
    "adapter_chef_fallback_update": true, /* if true update fallback_file file if chef return one node or more */
    "adapter_chef_fallback_file": "{your knife repo}/nodes.json", /* use this file as source if knife cmd return 0 node */
    "adapter_chef_custom_cmd": false, /* replace 'knife search node "name:*" -a ipaddress --format json' by your cmd (you must be compliant with knife json output) */

    "adapter_suffix" : "", /* we check strict hostname first and if this fail we try to fallback on hostname+adapter_suffix (think to "dot" first) */
    "adapter_force_suffix": false, /* if true check with suffix will be more important than check without suffix */
    "adapter_ignore" : [ ], /* host (node) to ignore */
    "adapter_alias" : [ { "localhost": {"ipaddress" : "127.0.0.1"} } ], /* define a list of alias overwrite output */
    "adapter_manual" :  [ { "localhost": {"ipaddress" : "127.0.1.1"} } ], /* define a list of additional host */


    "checker" : "ssh", /* support : default / ssh */

    /* specific config for ssh checker */
    "checker_users" : ["root","customer"], /* user name preference list */
    "checker_private_key" : false, /* private key (default: ~/.id_[rd]sa) */
    "checker_password" : false, /* default password */
    "checker_ports" : [22], /* ssh ports list */
    "checker_additional_options" : "-A", /* options add to connection string for export */
    "checker_force_success" : false, /* specific bool for force checker to always validate entry */
    "checker_specific_pref" : [ {"localhost": {"users": "root"} } ], /* specif user for specific node */
    "checker_private_user" : "root", /* user for private area */
    "checker_private_port" : "22", /* port for private area */
    "checker_private_prefix": "10.", /* prefix ip for private area */
    "checker_private_ssh_options": "-o ProxyCommand=\"ssh -W %h:%p root@{proxy-server-for-internal}\"", /* proxy ssh command for internal */


    "indexer" : "iterm2", /* support : default / iterm2 */

    /* define standard config for node, you can check src/indexer/iterm2_model for available key */
    "indexer_static_template" : {
        "Default Bookmark" : "No",
                 "Custom Command" : "Yes",
                         "ASCII Anti Aliased" : true
                              },

    "indexer_rules" : ["name", "guid", "command", "tags"], /* custom function for enhanced nodes list */
    "indexer_global_tags" : [ "{global tag}" ], /* global tag for each node */
    "indexer_global_command" : "ssh -A", /* global command for each node */
    "indexer_specific_pref" : [ {"localhost": {"Custom Command" : "Yes"} } ], /* specify template preference for node name */

    "exporter" : "default", /* support : default */
    "exporter_path" : "~/Library/Application Support/iTerm2/DynamicProfiles/chef.plist", /* export path + filename */
    "exporter_format" : "plist", /* json / plist / bplist */

    "log_level" : "error", /* none / debug / warning / error */
}
```

### Example

@TODO


### Link
https://iterm2.com/dynamic-profiles.html - iTerm2 Dynamic Profil Feature
https://code.google.com/p/iterm2/issues/detail?id=3094 - Original Feature Request


