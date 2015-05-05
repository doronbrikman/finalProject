/*master server*/

'use strict';

var app = require('express')(),
    bodyParser = require('body-parser');

var PORT = 8080;
var nodeNumber = 3;

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

                if (adder > sum * 0.99) {
                    percentile = j + 1;
                }
            }

            nodeHists.clearNodes();
        }
    }

    console.log(result.nodePort + ": " + result.histogram);

    if (percentile)
        console.log("The percentile is " + percentile);

    res.send();
});

app.listen(PORT);
console.log('Running on http://localhost:' + PORT);