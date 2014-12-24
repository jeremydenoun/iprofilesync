iProfilSync dynamic profil exporter
===

### Prerequisites (Unix only):

    * node (tested with v0.10.32)
    * for chef usage :
          * correct knife configuration (tested with Chef: 11.12.8)

In future version I will improve connectivity checking and you will need to install node-gyp (npm -g install node-gyp) 
for rebuild raw socket lib to your platform for ping test

### Usage

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
```

### Configuration

@TODO

### Example

@TODO


### Link
https://iterm2.com/dynamic-profiles.html - iTerm2 Dynamic Profil Feature
https://code.google.com/p/iterm2/issues/detail?id=3094 - Original Feature Request


