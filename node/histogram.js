(function () {
    'use strict';

    var _ = require('lodash');

    module.exports = Histogram;

    function Histogram(options) {
        if (!options) {
            options = {
                ranges: 10,
                maxValue: 1
            }
        }

        var numOfRanges = options.ranges || 10,
            maxValue = options.maxValue || 1,
            hist = new Array(numOfRanges);

        // fill the array with zeroes
        hist = _.fill(hist, 0);

        function submitResponse(time) {
            var jumps = maxValue / numOfRanges;

            for (var i = 0; i < numOfRanges; i++) {
                if (time < jumps * (i + 1)) {
                    hist[i]++;
                    break;
                }
            }
        }

        function finalObj() {
            return hist;
        }

        return {
            submitResponse: submitResponse,
            finalObj: finalObj
        };
    }

})();