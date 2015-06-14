/*master server*/

'use strict';

var app = require('express')(),
    server = require('http').Server(app),
    bodyParser = require('body-parser'),
    io = require('socket.io')(server),
    mySocket = new require('./socket')(),
    timeseries = require("timeseries-analysis");

var PORT = 8080;
var nodeNumber = 1;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var nodeHists = {
    nodes: [],
    superArray: [],

    clearNodes: function () {
        this.nodes = [];
        this.superArray = [];

        for (var i = 0; i < 12; i++) {
            nodeHists.superArray[i] = 0;
        }
    }
};

var webSocket;

io.on('connection', function (socket) {
    console.log('Connected!');

    socket.emit('check', {hello: 'world'});
    socket.on('node', function () {
        mySocket.addSocket(socket);
    });
    socket.on('web', function () {
        webSocket = socket;
    });
});

var count = 0;
var lastPercentile;

var rangesTimeArray = [];

function initForcast() {
    var date = new Date(),
        value = 2000,
        max;

    for (var i = 0; i < 200; i++) {
        var newDate = date.setSeconds(date.getSeconds() + 5);

        if (i < 10) {
            max = value;
        }
        else if (i < 100) {
            max = value - (i.toString().slice(0, 1) * 10);
        }
        else if (i < 200) {
            max = value - (i.toString().slice(0, 2) * 10);
        }

        var min = 200;

        rangesTimeArray.push({date: newDate, max: max, min: min});
    }
}

for (var r = 0; r < 30; r++) {
    //initForcast();
}

function doForcast(time) {
    rangesTimeArray.push({date: new Date(), time: time});

    var timeAnalysis = new timeseries.main(timeseries.adapter.fromDB(rangesTimeArray, {
        date: 'date',
        value: 'time'
    }));

    timeAnalysis.smoother({period: 40}).save('smoothed');

    var N = timeAnalysis.data.length;

    var coeffs = timeAnalysis.ARMaxEntropy({
        data: timeAnalysis.data,
        degree: N - 1
    });

    if (N > 50 && coeffs[0]) {
        var forecast = 0;
        for (var i = 0; i < coeffs.length; i++) {
            forecast -= timeAnalysis.data[N - 1 - i][1] * coeffs[i];
        }
        //webSocket.emit("forecast", {
        //    realMax: maxAnalysis.original.slice(maxAnalysis.data.length - 400),
        //    max: maxAnalysis.data.slice(maxAnalysis.data.length - 400),
        //    forecast: forecast
        //});

        return forecast;
    }
}

app.get('/', function (req, res) {
    //res.redirect(doForcast({max: 1810, min: 200}).ma({period: 14}).chart());
});

var returnHist = [];

app.post('/', function (req, res) {
    var result = req.body;

    var forecast = doForcast(result.lastTime);

    if (!nodeHists.nodes[result.nodePort]) {

        nodeHists.nodes.push(result.nodePort);

        for (var i = 0; i < result.histogram.length; i++) {
            nodeHists.superArray[i] = (nodeHists.superArray[i] || 0) + result.histogram[i];
        }

        if (nodeHists.nodes.length === nodeNumber) {
            var sum = nodeHists.superArray.reduce(function (a, b) {
                return a + b;
            });

            var adder = 0;
            var percentile;
            for (var j = 0; j < nodeHists.superArray.length; j++) {
                adder += nodeHists.superArray[j];

                if (adder > sum * 0.99) {
                    percentile = j + 1;
                    break;
                }
            }

            if (lastPercentile === percentile) {
                count++;
            }
            else {
                lastPercentile = percentile;
                count = 0;
            }

            returnHist = nodeHists.superArray;
            nodeHists.clearNodes();
        }
    }

    console.log(result.nodePort + ": " + result.histogram);
    webSocket.emit("forecast", {
        timeAvg: result.timeAvg,
        lastTime: result.lastTime,
        resulotion: (result.ranges.max - result.ranges.min) / 10,
        forecast: forecast || 0
    });

    if (percentile) {
        console.log("The percentile is " + percentile);

        if (count === 10) {
            var sockets = mySocket.getSockets();
            count = 0;

            webSocket.emit("histogram", {
                histogram: result.histogram,
                ranges: result.ranges,
                percentile: percentile
            });

            sockets.forEach(function (socket) {
                socket.emit("percentile", {percentile: percentile});
            });
        }
    }

    res.send();
});

server.listen(PORT);
console.log('Running on http://localhost:' + PORT);