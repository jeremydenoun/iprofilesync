### Configuration Details

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
