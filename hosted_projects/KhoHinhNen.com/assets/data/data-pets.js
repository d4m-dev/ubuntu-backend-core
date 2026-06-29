
// Dữ liệu link hình nền Thú cưng
const petsData = [
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751554589/rkgqywimoffut6e1zgvd.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751554590/bric7eabhqnjsyo6bf2m.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751554590/gnbrizhx2dhx9aekpujw.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751554590/yzzp7bofmena64d6fixk.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751554590/mexgnlfysa90ctlrvk01.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751554590/wxomvdsmtwmrpde5ul3z.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751554590/xwi6aehj4laabwdgoqd5.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751554591/bqwf08oydj9loxwdlsgp.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751554591/fnje9kyefgawwjdzsa5s.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751554591/ycdi0wefxv40hb0ocpvj.jpg",
    
];

// Hàm thêm link hình nền pets mới
function addNewPetsWallpaper(imageUrl) {
    if (imageUrl && !petsData.includes(imageUrl)) {
        petsData.unshift(imageUrl);
        return true;
    }
    return false;
}
