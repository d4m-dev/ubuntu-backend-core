// Beautify JavaScript Tests
function run_javascript_tests(st, Urlencoded, js_beautify, html_beautify, css_beautify) {
    st.test('simple js_beautify', function() {
        var input = 'function(){var a=1;return a;}';
        var expected = 'function() {\n    var a = 1;\n    return a;\n}';
        st.expect(js_beautify(input), expected);
    });

    st.test('js_beautify with var', function() {
        var input = 'var a=1,b=2;';
        var expected = 'var a = 1,\n    b = 2;';
        st.expect(js_beautify(input), expected);
    });

    st.test('js_beautify with function', function() {
        var input = 'function test(){return 1;}';
        var expected = 'function test() {\n    return 1;\n}';
        st.expect(js_beautify(input), expected);
    });

    st.test('js_beautify with object', function() {
        var input = 'var a={b:1,c:2};';
        var expected = 'var a = {\n    b: 1,\n    c: 2\n};';
        st.expect(js_beautify(input), expected);
    });

    st.test('js_beautify with array', function() {
        var input = 'var a=[1,2,3];';
        var expected = 'var a = [1, 2, 3];';
        st.expect(js_beautify(input), expected);
    });

    st.test('js_beautify with if statement', function() {
        var input = 'if(a==1){return true;}';
        var expected = 'if (a == 1) {\n    return true;\n}';
        st.expect(js_beautify(input), expected);
    });

    st.test('js_beautify with for loop', function() {
        var input = 'for(var i=0;i<10;i++){console.log(i);}';
        var expected = 'for (var i = 0; i < 10; i++) {\n    console.log(i);\n}';
        st.expect(js_beautify(input), expected);
    });

    st.test('js_beautify with while loop', function() {
        var input = 'while(a<10){a++;}';
        var expected = 'while (a < 10) {\n    a++;\n}';
        st.expect(js_beautify(input), expected);
    });

    st.test('js_beautify with switch', function() {
        var input = 'switch(a){case 1:break;case 2:return;}';
        var expected = 'switch (a) {\n    case 1:\n        break;\n    case 2:\n        return;\n}';
        st.expect(js_beautify(input), expected);
    });

    st.test('js_beautify with try-catch', function() {
        var input = 'try{a();}catch(e){console.log(e);}';
        var expected = 'try {\n    a();\n} catch (e) {\n    console.log(e);\n}';
        st.expect(js_beautify(input), expected);
    });
}
