define([
    'dojo/node!istanbul/lib/collector',
    'dojo/node!istanbul/lib/object-utils',
    'dojo/node!grunt'
], function (Collector, utils, grunt) {
    var collector;

    function GruntCoverage(config) {
        this.config = config || { threshold: { overall: 75 } };
        collector = new Collector();
    }

    function enforceThreshold(threshold, actual, expected) {
        var name = threshold[0].toUpperCase() + threshold.slice(1),
            success = actual >= expected,
            placing = success ? 'above' : 'below',
            passed = success ? 'PASSED! ' : 'FAILED! ',
            status = success ? 'ok' : 'error',
            msg = passed + name + ': ' + actual + '%, ' + placing + ' threshold of ' + expected + '%';

        grunt.log[status](msg);
        return success;
    }

    GruntCoverage.prototype.coverage = function (sessionId, coverage) {
        collector.add(coverage);
    };

    GruntCoverage.prototype.runEnd = function () {
        var summaries = [],
            total = 0,
            overall = 0,
            success = true,
            finalSummary;

        collector.files().forEach(function (file) {
            summaries.push(utils.summarizeFileCoverage(collector.fileCoverageFor(file)));
        });

        finalSummary = utils.mergeSummaryObjects.apply(null, summaries);

        for (var key in finalSummary) {
            if (finalSummary[key].pct) {
                if (this.config.threshold[key]) {
                    success = success && enforceThreshold(key, finalSummary[key].pct, this.config.threshold[key]);
                }
                overall += finalSummary[key].pct;
                total++;
            }
        }

        overall = overall / total;

        if (this.config.threshold.overall) {
            success = success && enforceThreshold('Overall', overall, this.config.threshold.overall);
        }

        if (!success) {
            grunt.fail.warn('Coverage threshold not met!');
        }
    };

    return GruntCoverage;
});
