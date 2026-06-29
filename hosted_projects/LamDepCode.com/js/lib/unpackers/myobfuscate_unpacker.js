// MyObfuscate Unpacker
var MyObfuscate = {
    detect: function(code) {
        return code && (code.indexOf('__obfuscate') !== -1 || code.indexOf('myobfuscate') !== -1);
    },

    unpack: function(code) {
        return code;
    },

    run_tests: function(st) {
        st.test('MyObfuscate detect', function() {
            st.expect(MyObfuscate.detect('__obfuscate'), true);
        });
    }
};
