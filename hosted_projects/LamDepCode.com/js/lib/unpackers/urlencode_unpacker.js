// URL Encoder/Decoder Unpacker
var Urlencoded = {
    detect: function(code) {
        return code && code.indexOf('%') !== -1 && code.length < 500;
    },

    unpack: function(code) {
        try {
            return decodeURIComponent(code);
        } catch (e) {
            return code;
        }
    },

    run_tests: function(st) {
        st.test('Urlencoded detect', function() {
            st.expect(Urlencoded.detect('%3Cdiv%3E'), true);
        });

        st.test('Urlencoded unpack', function() {
            st.expect(Urlencoded.unpack('%3Cdiv%3E'), '<div>');
        });
    }
};
