/*master server*/

'use strict';

var app = require('express')(),
    server = require('http').Server(app),
    bodyParser = require('body-parser'),
    io = require('socket.io')(server),
    mySocket = new require('./socket')();

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

io.on('connection', function (socket) {
    mySocket.addSocket(socket);
    console.log('Connected!');
});

var count = 0;
var lastPercentile;

app.post('/', function (req, res) {
    var result = req.body;

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

                if (adder > sum * 0.60) {
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

    if (percentile) {
        console.log("The percentile is " + percentile);

        if (count === 10) {
            var array = mySocket.getSockets();
            count = 0;

            for (var h = 0; h < array.length; h++) {
                array[h].emit("percentile", {percentile: percentile});
            }
        }
    }

    res.send();
});

server.listen(PORT);
console.log('Running on http://localhost:' + PORT);