iprofilesync dynamic profil exporter
===
[![Code Climate](https://codeclimate.com/github/jeremydenoun/iprofilesync/badges/gpa.svg)](https://codeclimate.com/github/jeremydenoun/iprofilesync)
[![Test Coverage](https://codeclimate.com/github/jeremydenoun/iprofilesync/badges/coverage.svg)](https://codeclimate.com/github/jeremydenoun/iprofilesync)
[![NPM dependencies](https://david-dm.org/jeremydenoun/iprofilesync.png)](https://david-dm.org/jeremydenoun/iprofilesync)

### Prerequisites :

    * node (tested with v5.1.0)
    * for file usage :
          * nothing
    * for chef usage :
          * correct knife configuration (tested with last knife/Chef)
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

Actually we use 2 npm modules customized for assure correct behavior :

    * iprofilesync-chef (0.3.0-custom) => I replace forsake usage by rsautl wrapper module customized by myself
    to be synchronous (if no callback provided)
    * iprofilesync-commander (2.3.0-custom) => I would like a "interactive cli" not really functionnal in commander default

### Installation

```sh
npm install iprofilesync

or

git clone https://github.com/jeremydenoun/iprofilesync.git
```

### Usage

iprofilesync is a command line tool build for sync a data repository with another tools.

We have 4 process steps :

   * import data (adapter) - available in src/adapter/*
   * launch check (checker) - available in src/checker/*
   * format for export (indexer) - available in src/indexer/*
   * write it (exporter) - available in src/exporter/*

With a simple configuration you can execute task like :

   * generate/sync a CMDB or inventory
   * check your SSH connectivity
   * Auto Tag your data
   * export your hosts into specific format (simple file, iTerm2 dynamic profile)

A cli is available for all command :
```sh
node iprofilesync.js
#>
```

You can get available command with help command :
```sh
node iprofilesync.js
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
node iprofilesync.js config default
{ adapter: 'default',
  checker: 'default',
  indexer: 'default',
  exporter: 'default' }

node iprofilesync.js sync --help
  Usage: sync [options] <service>

  Options:

    -h, --help   output usage information
    -d, --debug  Debug display

  Examples:

    $ sync default

node iprofilesync sync chef
=> "~/Library/Application Support/iTerm2/DynamicProfiles/chef.plist"
export completed for chef : 42 nodes exported
```

### Configuration

You should write your own configuration into **config/profile/** directory and use it like a **service** into command line.

Some common demo configuration are available on **config/profile/demo\*.json**, you can find below a **complete** configuration but only [MANDATORY] field are needed, the [RECOMMENDED] field are recommended (depending your usage) and the others are optionnal.

You can find more configuration [here](CONFIG.md)

### Quick Start

chef => iterm2 usage

```sh
cd config/profile
cp demo-chef.json chef.json
#edit chef.json and fill {...} field (access, path, ..)
cd ../..
node iprofilesync.js sync -d chef # for debug version
node iprofilesync.js sync chef # for short version
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


