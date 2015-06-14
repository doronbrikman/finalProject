angular.module('app')
  .controller('MainCtrl', ['$rootScope', 'socket', function($rootScope, socket) {
    var labels = $rootScope.labels;
    var times = $rootScope.times;
    var originals = $rootScope.originals;
    var forecasts = $rootScope.forecasts;

    socket.on('forecast', function(data) {
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
          times
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
        axisX: {
          showLabel: false,
          showGrid: false
        },
        lineSmooth: false
      };

      new Chartist.Line('.times', chart, options);
      new Chartist.Line('.resolution', chart2, options);
    })
  }]);
