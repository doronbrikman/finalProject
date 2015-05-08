var arguments = process.argv.splice(2);
var http = require('http'),
    httpProxy = require('http-proxy');

//
// Addresses to use in the round robin proxy
//
var addresses = [{
    host: 'localhost',
    port: 8001
}, {
    host: 'localhost',
    port: 8002
}, {
    host: 'localhost',
    port: 8003
}];

var proxy = httpProxy.createProxyServer({});

var i = 0;

var server = http.createServer(function(req, res) {
    proxy.web(req, res, {
        target: 'http://' + addresses[i].host + ':' + addresses[i].port
    });

    i = (i + 1) % addresses.length;
});

server.listen(arguments[0] || 8000);