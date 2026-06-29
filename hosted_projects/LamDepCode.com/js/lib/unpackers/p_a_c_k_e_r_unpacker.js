// P.A.C.K.E.R. Unpacker
var P_A_C_K_E_R = {
    detect: function(code) {
        return code && code.indexOf('eval(function(') !== -1;
    },

    unpack: function(code) {
        // Simple detection - return original for now
        return code;
    },

    run_tests: function(st) {
        st.test('P_A_C_K_E_R detect', function() {
            st.expect(P_A_C_K_E_R.detect('eval(function(p,a,c,k,e,d)'), true);
        });
    }
};
