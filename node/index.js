// /*The regular node server*/

//'use strict';

var express = require('express'),
    responseTime = require('response-time'),
    http = require('http'),
    histogram = new require('./histogram')();

var arguments = process.argv.splice(2);

// var address2 = process.env.MASTER_PORT_8080_TCP_ADDR;
// var port2 = process.env.MASTER_PORT_8080_TCP_PORT;

var logs = [];

 var options = {
     host: "localhost",
     path: '/',
     port: 8080,
     method: 'POST',
     headers: {
         "Content-Type": "application/json"
     }
 };

var PORT = arguments[0] || 8000;
var app = express();

app.use(responseTime(function (req, res, time) {
    var stat = (req.method + req.url).toLowerCase()
        .replace(/[:\.]/g, '')
        .replace(/\//g, '_');
    logs.push(time);

    histogram.submitResponse(time);
}));

app.get('/', function (req, res) {
    res.send(histogram.finalObj());
});

 setInterval(function() {
     console.log('send');
     var req = http.request(options);
     req.write(JSON.stringify({nodePort: PORT, histogram: histogram.finalObj()}));
     req.end();
 }, 5000);

app.listen(PORT);
console.log('Running on http://localhost:' + PORT);

// console.log(address2 + ":" + port2);