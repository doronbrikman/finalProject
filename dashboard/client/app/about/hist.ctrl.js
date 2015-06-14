angular.module('app')
  .controller('histController', ['$rootScope', 'socket', function($rootScope, socket) {

    socket.on('histogram', function(data) {
      var ranges = data.ranges;
      var tickjump = (ranges.max - ranges.min) / 10;

      var histogram = data.histogram;
      var percentile = data.percentile;

      var labels = [];
      var regHist = histogram;
      var outHist = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

      var percentileArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      percentileArray[percentile - 1] = histogram[percentile - 1];

      outHist[0] = histogram[0];
      outHist[11] = histogram[11];

      regHist[0] = 0;
      regHist[11] = 0;

      regHist[percentile - 1] = 0;
      outHist[percentile - 1] = 0;

      labels.push(' < ' + ranges.min);
      for (var i = 0; i < 10; i++) {
        labels.push(Math.round(ranges.min + (tickjump * i)) + ' - ' + Math.round(ranges.min + (tickjump * (i + 1))));
      }

      labels.push(' > ' + ranges.max);

      new Chartist.Bar('.ct-chart', {
        labels: labels,
        series: [
          regHist,
          percentileArray,
          outHist
        ]
      }, {
        stackBars: true
      });
    });
  }]);
