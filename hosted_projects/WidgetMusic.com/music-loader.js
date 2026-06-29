(function() {
    // 1. Xác định vị trí thẻ script đang chạy
    var scriptElement = document.currentScript || (function() {
        var scripts = document.getElementsByTagName('script');
        return scripts[scripts.length - 1];
    })();

    // 2. CẤU HÌNH ĐƯỜNG DẪN MẶC ĐỊNH
    // Lưu ý: Bạn nên đổi tên file 'music_widget.html' trên GitHub thành 'index.html' 
    // để đường dẫn này hoạt động chuẩn nhất.
    var defaultUrl = 'https://d4m-dev.github.io/WidgetMusic.com/'; 
    
    // Lấy link từ thuộc tính data-source, nếu không có thì dùng link mặc định
    var widgetUrl = scriptElement.getAttribute('data-source') || defaultUrl;

    // 3. CSS tạo khung và Responsive cho Music Player
    var css = `
        .music-widget-wrapper {
            width: 100%;
            max-width: 400px; /* Kích thước chuẩn giao diện Mobile */
            margin: 30px auto;
            overflow: hidden;
            border-radius: 25px; /* Bo góc tròn hơn cho giống App nhạc */
            position: relative;
            z-index: 1;
            box-shadow: 0 20px 50px rgba(0,0,0,0.15); /* Bóng đổ sâu hơn */
            background: transparent;
            transition: all 0.3s ease;
        }

        .music-widget-frame {
            width: 100%;
            border: none;
            display: block;
            /* Chiều cao đủ lớn để hiển thị Playlist và Lyric mà không bị cuộn trong iframe */
            height: 680px; 
            background: transparent;
        }

        /* Responsive cho điện thoại */
        @media (max-width: 480px) {
            .music-widget-wrapper {
                max-width: 100%;
                margin: 0;
                border-radius: 0;
                box-shadow: none;
            }
            .music-widget-frame {
                height: 100vh; /* Full màn hình trên mobile */
                min-height: 650px;
            }
        }
    `;
    
    // Chèn CSS vào đầu trang
    var style = document.createElement('style');
    style.type = 'text/css';
    if (style.styleSheet){
        style.styleSheet.cssText = css;
    } else {
        style.appendChild(document.createTextNode(css));
    }
    document.head.appendChild(style);

    // 4. Tạo Iframe chứa Widget Nhạc
    var wrapper = document.createElement('div');
    wrapper.className = 'music-widget-wrapper';

    var iframe = document.createElement('iframe');
    iframe.className = 'music-widget-frame';
    iframe.src = widgetUrl;
    iframe.title = "Music Player";
    iframe.setAttribute('allow', 'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share'); 
    iframe.setAttribute('loading', 'lazy');     

    wrapper.appendChild(iframe);

    // 5. Chèn vào trang web
    scriptElement.parentNode.insertBefore(wrapper, scriptElement.nextSibling);

})();
