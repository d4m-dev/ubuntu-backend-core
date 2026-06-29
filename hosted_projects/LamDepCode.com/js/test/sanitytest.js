// SanityTest - Simple test framework
(function() {
    function SanityTest() {
        this.results = [];
    }

    SanityTest.prototype.test = function(name, fn) {
        try {
            fn(this);
            this.results.push({ name: name, passed: true });
        } catch (e) {
            this.results.push({ name: name, passed: false, error: e.message });
        }
    };

    SanityTest.prototype.expect = function(actual, expected) {
        if (actual !== expected) {
            throw new Error('Expected "' + expected + '" but got "' + actual + '"');
        }
    };

    SanityTest.prototype.results_raw = function() {
        var output = '';
        for (var i = 0; i < this.results.length; i++) {
            var r = this.results[i];
            if (r.passed) {
                output += 'PASS: ' + r.name + '\n';
            } else {
                output += 'FAIL: ' + r.name + ' - ' + r.error + '\n';
            }
        }
        var passed = this.results.filter(function(r) { return r.passed; }).length;
        output += '\n' + passed + '/' + this.results.length + ' tests passed';
        return output;
    };

    window.SanityTest = SanityTest;
})();
