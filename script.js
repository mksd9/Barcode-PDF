// ボタンと表示部分を取得
const generateBtn = document.getElementById('generate-btn');
const pdfBtn = document.getElementById('pdf-btn');
const barcodeSvg = document.getElementById('barcode');
const imageArea = document.getElementById('image-area'); // 画像表示エリアを追加

// テキストボックスと表示エリアを取得
const textbox1 = document.getElementById('textbox1');
const textbox2 = document.getElementById('textbox2');
const textbox3 = document.getElementById('textbox3');
const userText1 = document.getElementById('user-text1');
const userText2 = document.getElementById('user-text2');
const userText3 = document.getElementById('user-text3');

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

// 12桁のランダムな数字を生成し、先頭2桁を45に固定し、チェックディジットを追加して13桁にする関数
function generateRandomNumber() {
    let randomNumber = '45';
    for (let i = 0; i < 10; i++) {
        randomNumber += Math.floor(Math.random() * 10);
    }
    const checkDigit = calculateCheckDigit(randomNumber);
    return randomNumber + checkDigit;
}

// バーコードを生成する関数
function generateBarcode(number) {
    JsBarcode(barcodeSvg, number, {
        format: "EAN13",
        flat: false,
        lineColor: "#000",
        width: 2,
        height: 100,
        displayValue: true,
        fontSize: 18,
        textMargin: 0,
        fontOptions: "bold",
    });
}

// 「バーコード」画像を生成し、テキストボックスの内容を上端に配置し、バーコードを右下に寄せる関数
function generateBarcodeImage(number) {
    const canvas = document.createElement('canvas');
    const scaleFactor = 2;  // 高精細のためのスケーリング要素
    canvas.width = 400 * scaleFactor;  // 矩形の幅を高精細に
    canvas.height = 200 * scaleFactor;  // 矩形の高さを高精細に
    const ctx = canvas.getContext('2d');

    // 背景を白色に設定
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 黒色の枠線を描画
    ctx.strokeStyle = "black";
    ctx.lineWidth = 5;  // 枠線の太さ
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // テキストを上端に寄せて表示（最初のテキストを右に10px、下に10px移動）
    ctx.fillStyle = "black";
    ctx.font = `${16 * scaleFactor}px Arial`;  // フォントサイズを16に設定
    ctx.textAlign = "left";  // テキストを左揃えに設定
    const textXPosition = (10 + 10) * scaleFactor;  // テキストのX位置（左端から10pxの位置をさらに10px右に移動）
    const textYPosition = (20 + 10) * scaleFactor;  // 最初のテキストのY位置（上端から20pxの位置をさらに10px下に移動）

    // テキストボックス1, 2, 3の内容を取得して描画
    ctx.fillText(textbox1.value, textXPosition, textYPosition);  // テキスト1
    ctx.fillText(textbox2.value, textXPosition, textYPosition + 20 * scaleFactor);  // テキスト2
    ctx.fillText(textbox3.value, textXPosition, textYPosition + 40 * scaleFactor);  // テキスト3

    // バーコードを生成してキャンバスに描画
    const barcodeCanvas = document.createElement('canvas');
    JsBarcode(barcodeCanvas, number, {
        format: "EAN13",
        displayValue: true,
        fontSize: 20 * scaleFactor,  // バーコード下の数字のフォントサイズ
        lineColor: "#000",
        width: 2 * scaleFactor,
        height: 70 * scaleFactor,  // バーコードの高さを70に設定
    });

    // バーコードを白矩形内の右下に配置する（右端から20px、下端から15pxの余白）
    const barcodeWidth = barcodeCanvas.width;  // バーコードの幅
    const barcodeHeight = barcodeCanvas.height;  // バーコードの高さ
    const xPosition = canvas.width - barcodeWidth - 20 * scaleFactor;  // 右端に20pxの余白を設けて配置
    const yPosition = canvas.height - barcodeHeight - 15 * scaleFactor;  // 下端に15pxの余白を設けて配置
    ctx.drawImage(barcodeCanvas, xPosition, yPosition, barcodeWidth, barcodeHeight);  // 右下に描画

    // PNG画像を生成して表示（スケーリングを反映して縮小）
    const dataURL = canvas.toDataURL('image/png');
    const imgElement = document.createElement('img');
    imgElement.src = dataURL;
    imgElement.width = 400;  // 表示する画像の幅を400に設定
    imgElement.height = 200;  // 表示する画像の高さを200に設定

    // 既存の画像を消して新しい画像を表示
    imageArea.innerHTML = '';
    imageArea.appendChild(imgElement);
}

// 初期状態でテキストボックスの内容を表示
function displayInitialText() {
    userText1.textContent = textbox1.value;
    userText2.textContent = textbox2.value;
    userText3.textContent = textbox3.value;
}

// ボタンをクリックしたときにランダムな数字を生成し、バーコードと画像を表示
generateBtn.addEventListener('click', () => {
    const randomNumber = generateRandomNumber();
    displayInitialText();
    generateBarcode(randomNumber);
    generateBarcodeImage(randomNumber);  // 白矩形内にバーコードを表示
});

// 初期のバーコードとテキストを表示
window.onload = () => {
    displayInitialText();
    generateBarcode("0000000000000");
};

// PDF生成ボタンのクリックイベント
pdfBtn.addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    // 用紙の余白設定
    const marginX = 8.4;  // 左右の余白
    const marginY = 8.8;  // 上下の余白

    // セルのサイズ設定
    const cellWidth = 48.3;  // 各セルの横幅
    const cellHeight = 25.4; // 各セルの縦幅（297mmから上下の余白を引いた高さを11分割）

    // 行数と列数
    const columns = 4;
    const rows = 11;

    // 外枠の描画（A4の余白内）
    const totalWidth = (columns * cellWidth);
    const totalHeight = (rows * cellHeight);
    
    doc.rect(marginX, marginY, totalWidth, totalHeight);

    // 行の罫線を描画
    for (let row = 0; row <= rows; row++) {
        const yPos = marginY + row * cellHeight;
        doc.line(marginX, yPos, marginX + totalWidth, yPos);
    }

    // 列の罫線を描画
    for (let col = 0; col <= columns; col++) {
        const xPos = marginX + col * cellWidth;
        doc.line(xPos, marginY, xPos, marginY + totalHeight);
    }

    // 新しいウィンドウまたはタブでPDFを表示
    doc.output('dataurlnewwindow');
});
