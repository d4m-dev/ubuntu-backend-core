// --- MANIFEST ---
// Đây là danh sách các file cấu hình.
// BẠN PHẢI THÊM ĐƯỜNG DẪN ĐẾN FILE images.js CỦA THƯ MỤC MỚI VÀO ĐÂY.
const manifest = [
    { path: './images/aodai/dthuha.05/images.js' },
    { path: './images/aodai/ngh.mninh/images.js' },
    { path: './images/aodai/i.ambichtram_/images.js' },
    { path: './images/aodai/tab1.17/images.js' },
    { path: './images/aodai/internet/images.js' },
    { path: './images/damlua/oah.yeni/images.js' },
    { path: './images/damlua/ingc.becs/images.js' },
    { path: './images/nicebody/internet/images.js' },
    { path: './images/bikini/internet/images.js' },
    { path: './images/ngaunhien/images.js' },
];

/**
 * Tạo tên danh mục từ đường dẫn file config.
 * @param {string} path - Đường dẫn đến file config.
 * @returns {string} Tên danh mục đã được định dạng.
 */
function formatCategoryName(path) {
    // Ví dụ: './images/aodai/dthuha.05/images.js' -> 'Ao Dai / Dthuha.05'
    const parts = path.split('/').slice(2, -1);
    return parts
        .map(part => part.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
        .join(' / ');
}

/**
 * Trích xuất danh mục cấp cao nhất từ đường dẫn.
 * @param {string} path - Đường dẫn đến file config.
 * @returns {string} Tên danh mục cấp cao nhất (ví dụ: 'aodai').
 */
function getTopLevelCategory(path) {
    const parts = path.split('/');
    // path: './images/aodai/dthuha.05/images.js' -> parts[2] is 'aodai'
    if (parts.length > 2) {
        return parts[2];
    }
    return 'unknown';
}

/**
 * Tải động tất cả hình nền từ manifest.
 * @returns {Promise<Array>} Một promise trả về mảng chứa tất cả đối tượng hình nền.
 */
export async function loadAllWallpapers() {
    const allWallpapers = [];
    let globalId = 1;

    const loadPromises = manifest.map(entry =>
        import(entry.path).then(module => {
            const config = module.GALLERY_CONFIG;
            const categoryName = formatCategoryName(entry.path);
            const topLevelCategory = getTopLevelCategory(entry.path);
            const wallpapersInCategory = [];

            for (let i = 1; i <= config.totalImages; i++) {
                const imageUrl = `${config.baseUrl}/${config.imagePattern.replace('{id}', i)}`;
                wallpapersInCategory.push({
                    id: globalId++,
                    title: `${categoryName} - Ảnh ${i}`,
                    category: categoryName,
                    topLevelCategory: topLevelCategory,
                    url: imageUrl,
                    author: 'Unknown'
                });
            }
            return wallpapersInCategory;
        }).catch(error => {
            console.error(`❌ Lỗi khi tải ${entry.path}:`, error);
            return []; // Trả về mảng rỗng nếu có lỗi để không làm hỏng toàn bộ quá trình
        })
    );

    const wallpaperGroups = await Promise.all(loadPromises);
    return wallpaperGroups.flat(); // Làm phẳng mảng các mảng thành một mảng duy nhất
}