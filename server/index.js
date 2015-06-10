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

        for (var i = 0; i < 10; i++) {
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
    initForcast();
}

function doForcast(range) {
    rangesTimeArray.push({date: new Date(), max: range.max, min: range.min});

    var maxAnalysis = new timeseries.main(timeseries.adapter.fromDB(rangesTimeArray, {
        date: 'date',
        value: 'max'
    }));

    var minAnalysis = new timeseries.main(rangesTimeArray, {
        date: 'date',
        value: 'min'
    });

    maxAnalysis.smoother({period: 40}).save('smoothed');

    var coeffs = maxAnalysis.ARMaxEntropy({
        data: maxAnalysis.data,
        degree: 5000
    });

    var N = maxAnalysis.data.length;
    console.log(coeffs);

    if (maxAnalysis.data.length > 50 && coeffs[0]) {
        var forecast = 0;
        for (var i = 0; i < coeffs.length; i++) {
            forecast -= maxAnalysis.data[N - 1 - i][1] * coeffs[i];
        }
        console.log("forecast", forecast);
        webSocket.emit("forecast", {
            realMax: maxAnalysis.original.slice(maxAnalysis.data.length - 400),
            max: maxAnalysis.data.slice(maxAnalysis.data.length - 400),
            forecast: forecast
        });
    }

    return maxAnalysis;
}

app.get('/', function (req, res) {
    //res.redirect(doForcast({max: 1810, min: 200}).ma({period: 14}).chart());
});

app.post('/', function (req, res) {
    var result = req.body;

    //var forcastChart = doForcast(result.ranges);

    //webSocket.emit("data", {data: forcastChart.data.slice(forcastChart.data.length - 400)});

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

            nodeHists.clearNodes();
        }
    }

    console.log(result.nodePort + ": " + result.histogram);
    webSocket.emit("forecast", {
        timeAvg: result.timeAvg,
        lastTime: result.lastTime,
        resulotion: (result.ranges.max - result.ranges.min) / 10
    });

    if (percentile) {
        console.log("The percentile is " + percentile);

        if (count === 10) {
            var sockets = mySocket.getSockets();
            count = 0;

            sockets.forEach(function (socket) {
                socket.emit("percentile", {percentile: percentile});
            });
        }
    }

    res.send();
});

server.listen(PORT);
console.log('Running on http://localhost:' + PORT);