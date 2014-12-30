var fs = require('fs'),
chef = require('chef'),
util = require('util'),
_    = require('underscore'),
key = fs.readFileSync('/Users/denoun_j/chef-repo/voxapp/.chef/denoun_j.pem'),
client = chef.createClient('denoun_j', key, 'https://vox-chef-01.voxapp.lu');

//console.log(client.get('/search/node?q=name%253A*&sort=&start=0&rows=9999'));
 
client.get('/search/node?q=name%253A*&sort=&start=0&rows=9999', function(err, res, body) {
    //console.log(util.inspect(body.rows, { depth: null }));
    console.log(_.map(body.rows, function (obj) {
        var res = {};
        res[obj.automatic.fqdn] = {"ipaddress":obj.automatic.ipaddress};
        return res;
    }));
});
