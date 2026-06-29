// Beautify HTML Tests
function run_html_tests(st, Urlencoded, js_beautify, html_beautify, css_beautify) {
    st.test('simple html_beautify', function() {
        var input = '<div><p>Hello</p></div>';
        var expected = '<div>\n    <p>Hello</p>\n</div>';
        st.expect(html_beautify(input), expected);
    });

    st.test('html_beautify with attributes', function() {
        var input = '<div class="test" id="main"><p>Content</p></div>';
        var expected = '<div class="test" id="main">\n    <p>Content</p>\n</div>';
        st.expect(html_beautify(input), expected);
    });

    st.test('html_beautify with nested elements', function() {
        var input = '<div><ul><li>Item 1</li><li>Item 2</li></ul></div>';
        var expected = '<div>\n    <ul>\n        <li>Item 1</li>\n        <li>Item 2</li>\n    </ul>\n</div>';
        st.expect(html_beautify(input), expected);
    });

    st.test('html_beautify with self-closing tags', function() {
        var input = '<div><img src="test.jpg" alt="Test"><br><hr></div>';
        var expected = '<div>\n    <img src="test.jpg" alt="Test">\n    <br>\n    <hr>\n</div>';
        st.expect(html_beautify(input), expected);
    });

    st.test('html_beautify with comments', function() {
        var input = '<div><!-- comment --><p>Text</p></div>';
        var expected = '<div>\n    <!-- comment -->\n    <p>Text</p>\n</div>';
        st.expect(html_beautify(input), expected);
    });

    st.test('html_beautify with script tag', function() {
        var input = '<div><script>var a=1;</script></div>';
        var expected = '<div>\n    <script>\n        var a = 1;\n    </script>\n</div>';
        st.expect(html_beautify(input), expected);
    });

    st.test('html_beautify with style tag', function() {
        var input = '<div><style>body{margin:0;}</style></div>';
        var expected = '<div>\n    <style>\n        body {\n            margin: 0;\n        }\n    </style>\n</div>';
        st.expect(html_beautify(input), expected);
    });
}
