// Beautify CSS Tests
function run_css_tests(st, Urlencoded, js_beautify, html_beautify, css_beautify) {
    st.test('simple css_beautify', function() {
        var input = 'body{margin:0;padding:0;}';
        var expected = 'body {\n    margin: 0;\n    padding: 0;\n}';
        st.expect(css_beautify(input), expected);
    });

    st.test('css_beautify with multiple selectors', function() {
        var input = 'h1,h2,h3{color:#333;}';
        var expected = 'h1, h2, h3 {\n    color: #333;\n}';
        st.expect(css_beautify(input), expected);
    });

    st.test('css_beautify with nested rules', function() {
        var input = '.container{width:100%;}.container .item{padding:10px;}';
        var expected = '.container {\n    width: 100%;\n}\n\n.container .item {\n    padding: 10px;\n}';
        st.expect(css_beautify(input), expected);
    });

    st.test('css_beautify with media query', function() {
        var input = '@media screen and (max-width:768px){body{font-size:14px;}}';
        var expected = '@media screen and (max-width: 768px) {\n    body {\n        font-size: 14px;\n    }\n}';
        st.expect(css_beautify(input), expected);
    });

    st.test('css_beautify with comments', function() {
        var input = '/* comment */body{margin:0;}';
        var expected = '/* comment */\nbody {\n    margin: 0;\n}';
        st.expect(css_beautify(input), expected);
    });
}
