// Javascript Obfuscator Unpacker
var JavascriptObfuscator = {
    detect: function(code) {
        return code && code.indexOf('_0x') !== -1;
    },

    unpack: function(code) {
        return code;
    },

    run_tests: function(st) {
        st.test('JavascriptObfuscator detect', function() {
            st.expect(JavascriptObfuscator.detect('_0x1234'), true);
        });
    }
};
