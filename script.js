// 定数 barcodeNumber を定義
const barcodeNumber = "451234567890";

// ボタンと表示部分を取得
const generateBtn = document.getElementById('generate-btn');
const pdfBtn = document.getElementById('pdf-btn');
const imageArea = document.getElementById('image-area'); // 画像表示エリアを追加

// テキストボックスを取得
const textbox1 = document.getElementById('textbox1');
const textbox2 = document.getElementById('textbox2');
const textbox3 = document.getElementById('textbox3');
const textbox4 = document.getElementById('textbox4');
const errorMessage = document.getElementById('error-message');  // 【修正箇所】エラーメッセージの要素を取得

// テキストボックス4の初期値に barcodeNumber を設定
textbox4.value = barcodeNumber;

// テキストボックス4のリアルタイム入力バリデーション 【修正箇所】
textbox4.addEventListener('input', function() {
    const isValid = textbox4.checkValidity();  // `pattern`属性に基づいてバリデーションをチェック
    if (!isValid) {
        errorMessage.style.display = 'block';  // エラーメッセージを表示
    } else {
        errorMessage.style.display = 'none';  // エラーメッセージを非表示
    }
});

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

// 「バーコード」画像を生成し、テキストボックス1, 2, 3の内容を画像に埋め込み、バーコードを右下に寄せる関数
function generateBarcodeImage(number) {
    const canvas = document.createElement('canvas');
    const scaleFactor = 2;
    canvas.width = 400 * scaleFactor;
    canvas.height = 200 * scaleFactor;
    const ctx = canvas.getContext('2d');

    // 背景を白色に設定
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // テキストを埋め込む処理
    ctx.fillStyle = "black";
    ctx.font = `${16 * scaleFactor}px Arial`;
    ctx.textAlign = "left";
    const textXPosition = 20 * scaleFactor;
    const textYPosition = 30 * scaleFactor;

    // テキストボックス1, 2, 3の内容を取得して描画
    ctx.fillText(textbox1.value, textXPosition, textYPosition);
    ctx.fillText(textbox2.value, textXPosition, textYPosition + 20 * scaleFactor);
    ctx.fillText(textbox3.value, textXPosition, textYPosition + 40 * scaleFactor);

    // バーコードを生成してキャンバスに描画
    const barcodeCanvas = document.createElement('canvas');
    JsBarcode(barcodeCanvas, number, {
        format: "EAN13",
        displayValue: true,
        fontSize: 20 * scaleFactor,
        lineColor: "#000",
        width: 2 * scaleFactor,
        height: 70 * scaleFactor,
    });

    const barcodeWidth = barcodeCanvas.width;
    const barcodeHeight = barcodeCanvas.height;
    const xPosition = canvas.width - barcodeWidth - 20 * scaleFactor;
    const yPosition = canvas.height - barcodeHeight - 15 * scaleFactor;
    ctx.drawImage(barcodeCanvas, xPosition, yPosition, barcodeWidth, barcodeHeight);

    // PNG画像を生成して表示
    const dataURL = canvas.toDataURL('image/png');
    const imgElement = document.createElement('img');
    imgElement.src = dataURL;
    imgElement.width = 400;
    imgElement.height = 200;

    // 既存の画像を消して新しい画像を表示
    imageArea.innerHTML = '';
    imageArea.appendChild(imgElement);

    return canvas; // Return the canvas element for further use
}

// ボタンをクリックしたときにテキストボックス4の値を使用してバーコードを生成し、画像に表示
generateBtn.addEventListener('click', () => {
    generateBarcodeImage(textbox4.value);  // テキストボックス4の値を使用してバーコードを表示
});

// PDF生成ボタンのクリックイベント
pdfBtn.addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    // Barcode image generation (ensure it has been generated)
    const barcodeCanvas = generateBarcodeImage(textbox4.value);

    // Check if barcodeCanvas is available
    if (!barcodeCanvas) {
        alert("Error: Barcode image could not be generated.");
        return;
    }

    const imageData = barcodeCanvas.toDataURL('image/png'); // Get the barcode image as a PNG

    // 用紙の余白設定
    const marginX = 8.4;
    const marginY = 8.8;
    const cellWidth = 48.3;
    const cellHeight = 25.4;
    const columns = 4;
    const rows = 11;

    // 外枠の描画（A4の余白内）
    // const totalWidth = (columns * cellWidth);
    // const totalHeight = (rows * cellHeight);
    
    // doc.rect(marginX, marginY, totalWidth, totalHeight);

    // for (let row = 0; row <= rows; row++) {
    //     const yPos = marginY + row * cellHeight;
    //     doc.line(marginX, yPos, marginX + totalWidth, yPos);
    // }

    // for (let col = 0; col <= columns; col++) {
    //     const xPos = marginX + col * cellWidth;
    //     doc.line(xPos, marginY, xPos, marginY + totalHeight);
    // }

    // Loop through each cell and insert the barcode image
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            const xPos = marginX + col * cellWidth;
            const yPos = marginY + row * cellHeight;
            doc.addImage(imageData, 'PNG', xPos, yPos, cellWidth, cellHeight);
        }
    }

    // 新しいウィンドウまたはタブでPDFを表示
    doc.output('dataurlnewwindow');
});
