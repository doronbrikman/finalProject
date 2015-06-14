var socket = io('http://10.0.0.10:8080');

socket.on('check', function () {
    socket.emit('web', {my: 'data'});
});

//var forecasts = new Array(400);
//
//_.fill(forecasts, null);

var labels = [];
var times = [];
var originals = [];
var forecasts = [];

socket.on('forecast', function (data) {
   var res = data.resulotion;
    var time = data.lastTime;
    var fore = data.forecast;

    labels.push(new Date().toISOString().slice(11, 19));
    times.push(time);
    originals.push(res);
    forecasts.push(fore);

    if (times.length > 50) {
        labels.splice(0, 1);
        times.splice(0, 1);
        originals.splice(0, 1);
        forecasts.splice(0, 1);
    }

    var chart = {
        labels: labels,
        series: [
            times, forecasts
        ]
    };

    var chart2 = {
        labels: labels,
        series: [
            originals
        ]
    };

    var options = {
        showPoint: false,
        width: '100%',
        //height: '50%',
        axisX: {
            showLabel: false,
            showGrid: false
        },
        lineSmooth: false
    };

    new Chartist.Line('.times', chart, options);
    new Chartist.Line('.resolution', chart2, options);
});

//socket.on("forecast", function (data) {
//    var maxData = data.max;
//    var realMax = data.realMax;
//    forecasts = _.drop(forecasts);
//    forecasts.push(data.forecast);
//    var labels = [];
//    var originals = [];
//    var series = [];
//
//    for (var i = 0; i < maxData.length; i++) {
//        labels.push(new Date(maxData[i][0]).toTimeString());
//        originals.push(realMax[i][1]);
//        series.push(maxData[i][1]);
//    }
//
//    var chart = {
//        labels: labels,
//        series: [
//            originals, series, forecasts
//        ]
//    };
//
//    var options = {
//        showPoint: false,
//        width: '100%',
//        height: '50%',
//        axisX: {
//            showLabel: false,
//            showGrid: false
//        }
//    };
//
//    new Chartist.Line('.ct-chart', chart, options);
//});

//socket.on("forecast", function (data) {
//    var elm = document.getElementById("forecast");
//
//    elm.innerHTML = data;
//});