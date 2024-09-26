// ボタンと数字表示部分を取得
const generateBtn = document.getElementById('generate-btn');
const randomNumberDisplay = document.getElementById('random-number');
const barcodeSvg = document.getElementById('barcode');

// JANコードのチェックディジットを計算する関数
function calculateCheckDigit(number) {
    const digits = number.split('').map(num => parseInt(num, 10));
    let sum = 0;
    digits.forEach((digit, index) => {
        sum += digit * (index % 2 === 0 ? 1 : 3);
    });
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit;
}

// 12桁のランダムな数字を生成し、チェックディジットを追加して13桁にする関数
function generateRandomNumber() {
    let randomNumber = '';
    for (let i = 0; i < 12; i++) {
        randomNumber += Math.floor(Math.random() * 10);
    }
    const checkDigit = calculateCheckDigit(randomNumber);
    return randomNumber + checkDigit;
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
