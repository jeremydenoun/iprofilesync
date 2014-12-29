var fs = require('fs'),
    chef = require('chef'),
    key = fs.readFileSync('/Users/denoun_j/chef-repo/voxapp/.chef/denoun_j.pem'),
    client = chef.createClient('denoun_j', key, 'https://vox-chef-01.voxapp.lu');

client.get('/nodes', function(err, res, body) {
    console.log(res);
/*    if (err) { return console.log(err); }
    body.run_list.push('role[bar]');
    client.put('/nodes/foo', body, function(err, res, body) {
        console.log(err ? err : body);
    });*/
});
