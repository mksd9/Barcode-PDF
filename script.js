/**
 * バーコード生成アプリケーション
 * 
 * このスクリプトは以下の主要な機能を提供します：
 * 1. Excelファイルからのデータ読み込み
 * 2. バーコード画像の生成と表示
 * 3. 生成したバーコードの画像保存
 * 4. バーコードを含むPDFの生成
 * 5. JANコードのチェックディジット計算と検証
 */

// アプリケーションのバージョン
const APP_VERSION = "2.2.0";
// ===== グローバル変数と定数の定義 =====

/**
 * デフォルトのバーコード番号（チェックディジットを除く12桁）
 * データが存在しない場合にこの番号が使用されます
 */
const DEFAULT_BARCODE_NUMBER = "451234567890";

/**
 * 読み込んだExcelデータを保持する配列
 * 各要素は { A: 商品コード, B: 商品名, C: JANコード } の形式
 */
let bufferedData = [];

/**
 * アプリケーションで使用するDOM要素
 * 初期化時に一括で取得し、以降はこのオブジェクトから参照
 */
const elements = {
    pdfBtn: document.getElementById('pdf-btn'),
    loadFileBtn: document.getElementById('load-file-btn'),
    barcodeContainer: document.getElementById('barcode-container'),
    saveBarcodeBtn: document.getElementById('save-barcode-btn')
};

/**
 * PDF生成時の設定値
 * A4用紙に対するバーコードの配置とサイズを定義
 */
const PDF_CONFIG = {
    marginX: 8.4,      // 左右マージン（mm）
    marginY: 8.8,      // 上下マージン（mm）
    cellWidth: 48.3,   // 各セルの幅（mm）
    cellHeight: 25.4,  // 各セルの高さ（mm）
    columns: 4,        // 1ページあたりの列数
    rows: 11           // 1ページあたりの行数
};

/**
 * バーコード生成時の設定値
 * JsBarcode ライブラリに渡すパラメータ
 */
const BARCODE_CONFIG = {
    format: "EAN13",     // バーコードのフォーマット
    displayValue: true,  // バーコード番号を表示するか
    fontSize: 40,        // バーコード番号のフォントサイズ
    lineColor: "#000",   // バーコードの色
    width: 4,            // バーのwidth
    height: 140          // バーコードの高さ
};

// ===== 初期化関数 =====

/**
 * アプリケーションの初期化を行う関数
 */
function initializeApp() {
    // バージョン情報を表示
    const versionInfoElement = document.getElementById('version-info');
    if (versionInfoElement) {
        versionInfoElement.textContent = `バージョン ${APP_VERSION}`;
    }

    // その他の初期化処理をここに追加
}

// ===== JANコード関連の関数 =====

/**
 * JANコードのチェックディジットを計算する関数
 * 
 * @param {string} code - チェックディジットを除く12桁の数字
 * @returns {string} チェックディジットを含む13桁のJANコード
 */
function calculateJANWithCheckDigit(code) {
    // 入力が12桁でない場合、エラーを投げる
    if (code.length !== 12 || !/^\d+$/.test(code)) {
        throw new Error('入力は12桁の数字である必要があります');
    }

    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return code + checkDigit;
}

/**
 * 有効なJANコードを取得する関数
 * 入力が13桁で有効な場合はそのまま返し、
 * 12桁の場合はチェックディジットを計算して返す
 * それ以外の場合はデフォルト値を使用
 * 
 * @param {string} input - 入力されたJANコード
 * @returns {string} 有効な13桁のJANコード
 */
function getValidJANCode(input) {
    if (input && input.length === 13 && /^\d+$/.test(input)) {
        return input; // 既に13桁の有効なJANコード
    } else if (input && input.length === 12 && /^\d+$/.test(input)) {
        return calculateJANWithCheckDigit(input);
    } else {
        return calculateJANWithCheckDigit(DEFAULT_BARCODE_NUMBER);
    }
}

// ===== バーコード生成関連の関数 =====

/**
 * バーコード画像を生成する関数
 * Canvas要素を使用して、テキストとバーコードを組み合わせた画像を生成します
 * 
 * @param {string} text1 - 上部に表示する商品名など
 * @param {string} itemCode - 商品コード
 * @param {string} barcodeNumber - バーコード番号（JANコード）
 * @returns {HTMLImageElement} 生成された画像要素
 */
function generateBarcodeImage(text1, text2, text3, text4, itemCode, barcodeNumber) {
    // 高解像度対応のためのスケールファクター
    const scaleFactor = 2;
    
    // キャンバスの作成と設定
    const canvas = document.createElement('canvas');
    canvas.width = 400 * scaleFactor;
    canvas.height = 200 * scaleFactor;
    const ctx = canvas.getContext('2d');

    // 背景を白で塗りつぶし
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // テキスト描画の設定
    ctx.fillStyle = "black";
    ctx.font = `${16 * scaleFactor}px Arial`;

    // キャンバスの中央のx座標を計算
    const centerX = canvas.width / 2;

    // 商品名の各行を描画（中央揃え）
    ctx.textAlign = "center"; // 中央揃えに設定
    ctx.fillText(text1, centerX, 20 * scaleFactor);    // 商品名1
    ctx.fillText(text2, centerX, 40 * scaleFactor);    // 商品名2
    ctx.fillText(text3, centerX, 60 * scaleFactor);    // 商品名3
    ctx.fillText(text4, centerX, 80 * scaleFactor);    // 商品名4

    // 商品コードの描画（左揃え）
    ctx.textAlign = "left"; // 左揃えに設定
    const textX = 20 * scaleFactor;
    ctx.fillText(itemCode, textX, 120 * scaleFactor); // 商品コード

    // バーコードの生成（有効なJANコードを使用）
    const validJANCode = getValidJANCode(barcodeNumber);
    const barcodeCanvas = document.createElement('canvas');
    JsBarcode(barcodeCanvas, validJANCode, BARCODE_CONFIG);

    // バーコードを画像の下部に配置
    const xPos = canvas.width - barcodeCanvas.width - 20 * scaleFactor;
    const yPos = canvas.height - barcodeCanvas.height - 15 * scaleFactor;
    ctx.drawImage(barcodeCanvas, xPos, yPos, barcodeCanvas.width, barcodeCanvas.height);

    // 完成した画像をimg要素として出力
    const imgElement = document.createElement('img');
    imgElement.src = canvas.toDataURL('image/png');
    imgElement.width = 400;
    imgElement.height = 200;

    return imgElement;
}

// ===== ファイル読み込み関連の関数 =====

/**
 * Excelファイルを読み込んでデータを処理する関数
 * XLSX.jsライブラリを使用してExcelファイルを解析し、
 * 必要なデータを抽出してバッファに保存します
 * 
 * @param {Event} event - ファイル選択イベントオブジェクト
 */
function handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        // Excelファイルの解析
        const workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // 1行目（ヘッダー）を除いてデータを取得
        // A列: 商品コード, B列: 商品名1, C列: 商品名2, D列: 商品名3, E列: 商品名4, F列: JANコード
        bufferedData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
            .slice(1)
            .map(row => ({
                A: row[0], // 商品コード
                B1: row[1], // 商品名1
                B2: row[2], // 商品名2
                B3: row[3], // 商品名3
                B4: row[4], // 商品名4
                C: row[5]  // JANコード
            }));

        // データを元にバーコードを表示
        displayBarcodeData();
    };
    reader.readAsArrayBuffer(file);
}

/**
 * 読み込んだデータを元にバーコードを画面に表示する関数
 * bufferedDataの各要素に対してバーコードを生成し、
 * #barcode-container内に表示します
 */
function displayBarcodeData() {
    // 既存のバーコードをクリア
    elements.barcodeContainer.innerHTML = '';
    
    // 各データ行に対してバーコードを生成
    bufferedData.forEach(row => {
        const barcodeImage = generateBarcodeImage(
            row.B1 || '',                // 商品名1
            row.B2 || '',                // 商品名2
            row.B3 || '',                // 商品名3
            row.B4 || '',                // 商品名4
            row.A || '',                 // 商品コード
            getValidJANCode(row.C)       // 有効なJANコード
        );

        // バーコード画像を包む要素
        const wrapper = document.createElement('div');
        wrapper.style.marginBottom = '20px';
        wrapper.appendChild(barcodeImage);
        elements.barcodeContainer.appendChild(wrapper);
    });
}
// ===== PDF生成関連の関数 =====

/**
 * バーコードを含むPDFを生成する関数
 * jsPDFライブラリを使用して、A4サイズのPDFを生成します
 * 1ページに複数のバーコードを配置します
 */
// async function generatePDF() {
//     if (bufferedData.length === 0) {
//         alert("データが存在しないためPDFを生成できません。");
//         return;
//     }

//     try {
//         const { jsPDF } = window.jspdf;

//         // 各データ行に対して個別のPDFを生成
//         for (let dataIndex = 0; dataIndex < bufferedData.length; dataIndex++) {
//             const row = bufferedData[dataIndex];

//             // PDF生成の初期化
//             const doc = new jsPDF({
//                 orientation: 'portrait',
//                 unit: 'mm',
//                 format: 'a4'
//             });

//             // バーコード画像の生成（有効なJANコードを使用）
//             const barcodeImage = generateBarcodeImage(
//                 row.B1 || '',                // 商品名1
//                 row.B2 || '',                // 商品名2
//                 row.B3 || '',                // 商品名3
//                 row.B4 || '',                // 商品名4
//                 row.A || '',                 // 商品コード
//                 getValidJANCode(row.C)       // 有効なJANコード
//             );

//             // 画像の読み込み完了を待機
//             await new Promise(resolve => {
//                 if (barcodeImage.complete) resolve();
//                 else barcodeImage.onload = resolve;
//             });

//             // ページ内にバーコードを格子状に配置
//             for (let row = 0; row < PDF_CONFIG.rows; row++) {
//                 for (let col = 0; col < PDF_CONFIG.columns; col++) {
//                     const xPos = PDF_CONFIG.marginX + col * PDF_CONFIG.cellWidth;
//                     const yPos = PDF_CONFIG.marginY + row * PDF_CONFIG.cellHeight;
                    
//                     doc.addImage(
//                         barcodeImage,
//                         'PNG',
//                         xPos,
//                         yPos,
//                         PDF_CONFIG.cellWidth,
//                         PDF_CONFIG.cellHeight
//                     );
//                 }
//             }

//             // 商品コードをファイル名に使用
//             const fileName = `barcode-${row.A || 'unknown'}.pdf`;

//             // PDFを保存
//             doc.save(fileName);
//         }
//     } catch (error) {
//         console.error('PDF生成エラー:', error);
//         alert('PDFの生成中にエラーが発生しました。');
//     }
// }

// ===== バーコード画像保存関連の関数 =====
async function generatePDF() {
    if (bufferedData.length === 0) {
        alert("データが存在しないためPDFを生成できません。");
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        let processedCount = 0;
        const totalCount = bufferedData.length;

        // バッチ処理用の関数
        const processBatch = async (startIndex, batchSize) => {
            for (let i = startIndex; i < Math.min(startIndex + batchSize, totalCount); i++) {
                const row = bufferedData[i];

                // PDF生成の初期化
                const doc = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });

                // バーコード画像の生成
                const barcodeImage = generateBarcodeImage(
                    row.B1 || '',
                    row.B2 || '',
                    row.B3 || '',
                    row.B4 || '',
                    row.A || '',
                    getValidJANCode(row.C)
                );

                // 画像の読み込み完了を待機
                await new Promise(resolve => {
                    if (barcodeImage.complete) resolve();
                    else barcodeImage.onload = resolve;
                });

                // ページ内にバーコードを格子状に配置
                for (let row = 0; row < PDF_CONFIG.rows; row++) {
                    for (let col = 0; col < PDF_CONFIG.columns; col++) {
                        const xPos = PDF_CONFIG.marginX + col * PDF_CONFIG.cellWidth;
                        const yPos = PDF_CONFIG.marginY + row * PDF_CONFIG.cellHeight;
                        
                        doc.addImage(
                            barcodeImage,
                            'PNG',
                            xPos,
                            yPos,
                            PDF_CONFIG.cellWidth,
                            PDF_CONFIG.cellHeight
                        );
                    }
                }

                // 商品コードをファイル名に使用
                const fileName = `barcode-${row.A || 'unknown'}.pdf`;
                doc.save(fileName);

                // 進捗状況を更新
                processedCount++;
                
                // ブラウザの処理を空ける
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        };

        // バッチサイズを5に設定して処理
        const BATCH_SIZE = 5;
        for (let startIndex = 0; startIndex < totalCount; startIndex += BATCH_SIZE) {
            await processBatch(startIndex, BATCH_SIZE);
        }

        alert(`${processedCount}個のPDFが生成されました。`);
    } catch (error) {
        console.error('PDF生成エラー:', error);
        alert('PDFの生成中にエラーが発生しました。');
    }
}

/**
 * 指定された画像を非同期でダウンロードする関数
 * @param {string} imageUrl - 画像のURL
 * @param {string} fileName - ダウンロードするファイル名
 * @returns {Promise} ダウンロード処理の Promise
 */
function downloadImage(imageUrl, fileName) {
    return new Promise((resolve, reject) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);

        link.onclick = () => {
            document.body.removeChild(link);
            resolve();
        };

        link.onerror = () => {
            document.body.removeChild(link);
            reject(new Error(`Failed to download ${fileName}`));
        };

        link.click();
    });
}

/**
 * 指定されたミリ秒だけ待機する関数
 * @param {number} ms - 待機するミリ秒
 * @returns {Promise} 待機処理の Promise
 */
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== イベントリスナーの設定 =====

// DOMContentLoadedイベントで初期化関数を呼び出す
document.addEventListener('DOMContentLoaded', initializeApp);

/**
 * ファイル読み込みボタンのクリックイベント
 * Excelファイル選択ダイアログを表示します
 */
elements.loadFileBtn.addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xls, .xlsx';
    fileInput.addEventListener('change', handleFile);
    fileInput.click();
});

/**
 * PDF生成ボタンのクリックイベント
 * 現在のデータを元にPDFを生成します
 */
elements.pdfBtn.addEventListener('click', generatePDF);

/**
 * バーコード画像保存ボタンのクリックイベント
 * 表示中の全バーコードをPNG画像として保存します
 */
elements.saveBarcodeBtn.addEventListener('click', async () => {
    const barcodeImages = elements.barcodeContainer.getElementsByTagName('img');
    
    if (barcodeImages.length === 0) {
        alert("保存可能なバーコード画像がありません。");
        return;
    }

    try {
        // 各バーコード画像を個別のPNGファイルとして保存
        for (let index = 0; index < barcodeImages.length; index++) {
            const img = barcodeImages[index];
            const janCode = getValidJANCode(bufferedData[index].C);
            await downloadImage(img.src, `${janCode}.png`);
            // ダウンロード間に100ミリ秒の遅延を設ける
            await wait(100);
        }
        alert("すべての画像が正常にダウンロードされました。");
    } catch (error) {
        console.error('画像ダウンロードエラー:', error);
        alert('一部の画像のダウンロード中にエラーが発生しました。');
    }
});