// ボタンと数字表示部分を取得
const generateBtn = document.getElementById('generate-btn');
const randomNumberDisplay = document.getElementById('random-number');
const barcodeSvg = document.getElementById('barcode');

// 13桁のランダムな数字を生成する関数
function generateRandomNumber() {
    let randomNumber = '';
    for (let i = 0; i < 13; i++) {
        randomNumber += Math.floor(Math.random() * 10);
    }
    return randomNumber;
}

// バーコードを生成する関数
function generateBarcode(number) {
    JsBarcode(barcodeSvg, number, {
        format: "EAN13",
        flat: true,
        lineColor: "#000",
        width: 2,
        height: 40,
        displayValue: false
    });
}

// ボタンをクリックしたときにランダムな数字を生成し、バーコードを表示
generateBtn.addEventListener('click', () => {
    const randomNumber = generateRandomNumber();
    randomNumberDisplay.textContent = randomNumber;
    generateBarcode(randomNumber);
});

// 初期のバーコードを表示
generateBarcode("0000000000000");
