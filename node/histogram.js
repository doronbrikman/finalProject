(function () {
    'use strict';

    var _ = require('lodash');

    function Histogram(options) {
        if (!options) {
            options = {
                ranges: 10,
                maxValue: 2000,
                minValue: 200
            }
        }

        var numOfRanges = options.ranges || 10,
            maxValue = options.maxValue || 1,
            minValue = options.minValue || 0,
            hist = new Array(numOfRanges);

        // fill the array with zeroes
        hist = _.fill(hist, 0);

        function submitResponse(time) {
            var jumps = (maxValue - minValue) / numOfRanges;

            for (var i = 0; i < numOfRanges; i++) {
                if (time < (jumps + minValue) * (i + 1)) {
                    hist[i]++;
                    break;
                }
            }
        }

        // get the histogram in an array format for the server
        function finalObj() {
            return hist;
        }

        function clearHist() {
            console.log('clear');
            hist = _.fill(hist, 0);
        }

        // get the new range for the histogram, by index from the server
        function getRange(index) {
            var jumps = (maxValue - minValue) / numOfRanges;

            var max = minValue + (jumps * (index));
            var min = max - jumps;

            return {max: max, min: min};
        }

        function changeResolution(newRange) {
            maxValue = newRange.max;
            minValue = newRange.min;

            // restart the histogram
            clearHist();
        }

        return {
            submitResponse: submitResponse,
            getRange: getRange,
            changeResolution: changeResolution,
            finalObj: finalObj
        };
    }

    module.exports = Histogram;
})();