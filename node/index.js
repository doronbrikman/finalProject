// /*The regular node server*/

'use strict';

var app = require('express')(),
    responseTime = require('response-time'),
    http = require('http'),
    histogram = new require('./histogram')(),
    io = require('socket.io-client');

//var arguments = process.argv.splice(2);

var address2 = process.env.MASTER_PORT_8080_TCP_ADDR || "localhost";
var port2 = process.env.MASTER_PORT_8080_TCP_PORT || 8080;

var options = {
    host: address2 || "localhost",
    path: '/',
    port: port2 || 8080,
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    }
};

var PORT = 8000; // arguments[0] || 8000;

var socket = io.connect("http://" + address2 + ":" + port2, {reconnect: true});

// Add a connect listener
socket.on('connect', function (socket) {
    console.log('Connected!');
});

socket.on('check', function (data) {
    console.log(data);
    socket.emit('node', {my: 'data'});
});

socket.on('percentile', function (data) {
    var range = histogram.getRange(data.percentile);
    histogram.changeResolution(range);

    console.log("max:" + range.max + " | min: " + range.min);
});

var timeSum = 0;
var countTime = 0;
var lastTime = 0;

app.use(responseTime(function (req, res, time) {
    timeSum += time;
    countTime++;
    lastTime = time;

    histogram.submitResponse(time);
}));

app.get('/', function (req, res) {
    res.send(histogram.finalObj() + " " + estimatePi());
});

function estimatePi() {
    var n = getRandomArbitrary(100000, 10000000), inside = 0, i, x, y;

    for (i = 0; i < n; i++) {
        x = Math.random();
        y = Math.random();
        if (Math.sqrt(x * x + y * y) <= 1)
            inside++;
    }

    return 4 * inside / n;

    function getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }
}

var count = 0;

setInterval(function () {
    console.log('send');
    var req = http.request(options);
    //req.write(JSON.stringify({nodePort: PORT, histogram: histogram.finalObj(), ranges: histogram.getRange()}));

    if (count < 10) {
        req.write(JSON.stringify({
            nodePort: PORT,
            timeAvg: timeSum / countTime,
            lastTime: lastTime,
            histogram: histogram.finalObj(),
            ranges: histogram.getRange()
        }));
    } else {
        req.write(JSON.stringify({
            nodePort: PORT,
            histogram: histogram.finalObj(),
            ranges: {max: 1810 + (count.toString().slice(0, 1) * 10), min: 200}
        }));
    }
    //count++;
    timeSum = 0;
    countTime = 0;

    req.end();
}, 1000);

app.listen(PORT);
console.log('Running on http://localhost:' + PORT);