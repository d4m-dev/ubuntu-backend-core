
// Dữ liệu link hình nền Dễ thương / Cute
const cuteData = [
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553930/ch20gvyrqhgzmrrwva03.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553930/gnncafvipkpb2js265hk.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553931/qnbca6ic3wscrg3pvm28.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553931/bqmehnk9d1ekulsp810k.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553931/lvk1svephkauxxchypni.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553931/tvw6majiwl9jzdymlygy.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553931/p3mtvsql8ns85q9nwbfd.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553931/vs19t5opc2ohbigbkbct.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553931/wuhnzger2s6dp6knt5za.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553931/rabnjrcmhov2sfsgu6pk.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553932/ymklrd7lpzaiyishzmos.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553932/brrumddtwpsk3nm5ceho.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553932/gckw5coslzwfqjro39iz.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553932/g2gtm7tffuf0urck8wuu.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553932/ebssuz0fumumnlltidiu.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553932/ztup9mcqgp0hckgrwv8y.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553933/ihpvxxqu15kocoyl2cy4.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553933/a2khokc7c6tcic18lud5.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553932/tiigah8pimbqbuepsrik.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553933/p1u0izjwhee32wpiasxa.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553933/g8n0s5agebrzjkwvjczt.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553933/iyds2a509c1cfntdixhu.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553933/no1qufvbvumkngadi4pz.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553934/lmqv0kzpqtawldajcekr.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553933/ltbfdlall4kotydeunvk.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553934/h6pkz2lteube7yafsarb.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553934/voraozk2vuf9prdemfwh.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553934/uzurmlacky6rh0ecwiu5.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553934/byzxavkemuwzje6hb6vh.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553934/oshlfosbbyrlmucqflrr.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553934/fbhf6wtyfgvhjrjfcdsp.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553935/x3oq4ujk63ig0i9mqft7.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553934/uq5yq9rif46tboltvgca.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553935/ve2v0t54nwsm5limgsjc.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553935/ilq6uigbi6fxju8hoayb.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553935/ga0ji9suzejssowh95w4.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553935/nlwsp08t7kys1twwa0ye.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553935/eg9ww0xkvdt9bnrcdoo9.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553935/o1zl6yuk1dl6cklivuzg.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553936/sb7klenbaexgirxslzrx.jpg",
    "https://res.cloudinary.com/dr5ubqih7/image/upload/v1751553936/fyvkdg3rc8a66uupypcl.jpg",
];

// Hàm thêm link hình nền cute mới
function addNewCuteWallpaper(imageUrl) {
    if (imageUrl && !cuteData.includes(imageUrl)) {
        cuteData.unshift(imageUrl);
        return true;
    }
    return false;
}
