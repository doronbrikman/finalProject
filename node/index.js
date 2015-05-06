// /*The regular node server*/

'use strict';

var app = require('express')(),
    responseTime = require('response-time'),
    http = require('http'),
    histogram = new require('./histogram')(),
    io = require('socket.io-client');

//var arguments = process.argv.splice(2);

var address2 = process.env.MASTER_PORT_8080_TCP_ADDR;
var port2 = process.env.MASTER_PORT_8080_TCP_PORT;

var logs = [];

var options = {
    host: address2,
    path: '/',
    port: port2,
    method: 'POST',
    headers: {
        "Content-Type": "application/json"
    }
};

var PORT = 8000; // arguments[0] || 8000;
//var app = express();

var socket = io.connect("http://" + address2 + ":" + port2, {reconnect: true});

// Add a connect listener
socket.on('connect', function(socket) {
    console.log('Connected!');
});

socket.on('percentile', function (data) {
    console.log(data);

    histogram.changeResolution(data.percentile);
});

app.use(responseTime(function (req, res, time) {
    logs.push(time);
    histogram.submitResponse(time);
}));

app.get('/', function (req, res) {
    res.send(histogram.finalObj() + " " + estimatePi());
});

function estimatePi() {
    var n = 100000000, inside = 0, i, x, y;

    for ( i = 0; i < n; i++ ) {
        x = Math.random();
        y = Math.random();
        if ( Math.sqrt(x * x + y * y) <= 1 )
            inside++;
    }

    return 4 * inside / n;
}

setInterval(function () {
    console.log('send');
    var req = http.request(options);
    req.write(JSON.stringify({nodePort: PORT, histogram: histogram.finalObj()}));
    req.end();
}, 5000);

app.listen(PORT);
console.log('Running on http://localhost:' + PORT);

console.log(address2,port2);