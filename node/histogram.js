(function () {
    'use strict';

    var _ = require('lodash');

    function Histogram(options) {
        if (!options) {
            options = {
                ranges: 10,
                maxValue: 1300,
                minValue: 30,
                mode: 'none' // none or history
            }
        }

        var numOfRanges = options.ranges || 10,
            maxValue = options.maxValue || 1300,
            minValue = options.minValue || 30,
            mode = options.mode || 'none',
            hist = new Array(numOfRanges + 2),
            history = [];

        // initialize the histogram
        clearHist();
        //randomHistogram();

        return {
            submitResponse: submitResponse,
            getRange: getRange,
            changeResolution: changeResolution,
            finalObj: finalObj
        };

        function randomHistogram() {
            hist = hist.map(function (h) {
                return h + Math.floor(Math.random() * 200) + 1;
            });

            hist[0] = Math.floor(Math.random() * 30) + 1;
            hist[11] = Math.floor(Math.random() * 15) + 1;
        }

        function submitResponse(time) {
            if (time < minValue) {
                hist[0]++;
                return;
            }

            if (time > maxValue) {
                hist[11]++;
                return;
            }

            var jumps = (maxValue - minValue) / numOfRanges;

            for (var i = 0; i < numOfRanges; i++) {
                if (time < minValue + jumps * (i + 1)) {
                    hist[i + 1]++;
                    break;
                }
            }
        }

        // get the histogram in an array format for the server
        function finalObj() {
            return hist;
        }

        // clear the histogram
        function clearHist() {
            hist = _.fill(hist, 0);
        }

        // get the new range for the histogram, by index from the server
        function getRange(index) {
            var max = maxValue,
                min = minValue,
                jumps = (maxValue - minValue) / numOfRanges;

            // send the current ranges
            if (!index) {
                return {max: max, min: min};
            }

            if (index === 1) {
                var newRange = _getRangeFormHistory(index);
                if (newRange) {
                    return newRange;
                }

                if (min !== 0) {
                    min -= jumps;
                    min = min < 0 ? 0 : min;
                }

                console.log("min: " + max, min, jumps);
                return {max: max, min: min};
            }

            if (index === numOfRanges + 2) {
                var newRange = _getRangeFormHistory(index);
                if (newRange) {
                    return newRange;
                }

                max += jumps;

                console.log("max: " + max, min, jumps);
                return {max: max, min: min};
            }

            max = minValue + (jumps * (index - 1));
            min = max - jumps;

            console.log("regular: " + max, min, jumps);
            return {max: max, min: min};
        }

        function _saveHistory() {
            history.splice(0, 0, {max: maxValue, min: minValue});
        }

        function _getRangeFormHistory(index) {
            var returnValue = history.pop();

            if (!returnValue) return false;

            if (index === 1) {
                if (minValue <= returnValue.min) {
                    return _getRangeFormHistory(index);
                } else {
                    return {max: maxValue, min: returnValue.min};
                }
            } else if (index === numOfRanges + 2) {
                if (maxValue >= returnValue.max) {
                    return _getRangeFormHistory(index);
                } else {
                    return {max: returnValue.max, min: minValue};
                }
            }
        }

        function changeResolution(newRange) {
            _saveHistory();

            maxValue = Math.round(newRange.max);
            minValue = Math.round(newRange.min);

            // restart the histogram
            clearHist();
            //randomHistogram();
        }
    }

    module.exports = Histogram;
})();