/*master server*/

'use strict';

var app = require('express')(),
    server = require('http').Server(app),
    bodyParser = require('body-parser'),
    io = require('socket.io')(server);

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

var mySocket;

io.on('connection', function (socket) {
    mySocket = socket;
    console.log('Connected!');
});

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
                }
            }

            nodeHists.clearNodes();
        }
    }

    console.log(result.nodePort + ": " + result.histogram);

    if (percentile) {
        mySocket.emit("percentile", {percentile: percentile});
        console.log("The percentile is " + percentile);
    }

    res.send();
});

server.listen(PORT);
console.log('Running on http://localhost:' + PORT);