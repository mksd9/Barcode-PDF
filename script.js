/**
 * バーコード生成アプリケーション
 * 
 * このスクリプトは以下の主要な機能を提供します：
 * 1. Excelファイルからのデータ読み込み
 * 2. 編集可能なPDFの生成
 *    - テキストレイヤー（編集可能）
 *    - バーコード画像（個別の画像として配置）
 * 3. JANコードのチェックディジット計算と検証
 */

// アプリケーションのバージョン
const APP_VERSION = "3.0.0";

// ===== グローバル変数と定数の定義 =====

/**
 * デフォルトのバーコード番号（チェックディジットを除く12桁）
 * データが存在しない場合にこの番号が使用されます
 */
const DEFAULT_BARCODE_NUMBER = "451234567890";

/**
 * 読み込んだExcelデータを保持する配列
 * 各要素は { A: 商品コード, B1-B4: 商品名1-4, C: JANコード } の形式
 */
let bufferedData = [];

/**
 * アプリケーションで使用するDOM要素
 */
const elements = {
    pdfBtn: document.getElementById('pdf-btn'),
    loadFileBtn: document.getElementById('load-file-btn'),
    barcodeContainer: document.getElementById('barcode-container')
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
    rows: 11,          // 1ページあたりの行数
    textMarginX: 2,    // テキストの左マージン（mm）
    barcodeWidth: 44,  // バーコードの幅（mm）
    barcodeHeight: 7   // バーコードの高さ（mm）
};

// ===== 初期化関数 =====

/**
 * アプリケーションの初期化を行う関数
 */
function initializeApp() {
    const versionInfoElement = document.getElementById('version-info');
    if (versionInfoElement) {
        versionInfoElement.textContent = `バージョン ${APP_VERSION}`;
    }
}

// ===== JANコード関連の関数 =====

/**
 * JANコードのチェックディジットを計算する関数
 * 
 * @param {string} code - チェックディジットを除く12桁の数字
 * @returns {string} チェックディジットを含む13桁のJANコード
 */
function calculateJANWithCheckDigit(code) {
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
 * 
 * @param {string} input - 入力されたJANコード
 * @returns {string} 有効な13桁のJANコード
 */
function getValidJANCode(input) {
    if (input && input.length === 13 && /^\d+$/.test(input)) {
        return input;
    } else if (input && input.length === 12 && /^\d+$/.test(input)) {
        return calculateJANWithCheckDigit(input);
    } else {
        return calculateJANWithCheckDigit(DEFAULT_BARCODE_NUMBER);
    }
}

// ===== バーコード生成関連の関数 =====

/**
 * バーコードのみの画像を生成する関数
 * 
 * @param {string} barcodeNumber - JANコード
 * @returns {HTMLImageElement} バーコード画像要素
 */
function generateBarcodeOnly(barcodeNumber) {
    const barcodeCanvas = document.createElement('canvas');
    const barcodeConfig = {
        format: "EAN13",
        displayValue: true,
        fontSize: 40,
        lineColor: "#000",
        width: 4,
        height: 140
    };
    
    JsBarcode(barcodeCanvas, getValidJANCode(barcodeNumber), barcodeConfig);
    
    const imgElement = document.createElement('img');
    imgElement.src = barcodeCanvas.toDataURL('image/png');
    return imgElement;
}

// ===== ファイル読み込み関連の関数 =====

/**
 * Excelファイルを読み込んでデータを処理する関数
 * 
 * @param {Event} event - ファイル選択イベントオブジェクト
 */
function handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        bufferedData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
            .slice(1)
            .map(row => ({
                A: row[0],   // 商品コード
                B1: row[1],  // 商品名1
                B2: row[2],  // 商品名2
                B3: row[3],  // 商品名3
                B4: row[4],  // 商品名4
                C: row[5]    // JANコード
            }));

        alert("ファイルの読み込みが完了しました。");
    };
    reader.readAsArrayBuffer(file);
}

// ===== PDF生成関連の関数 =====

/**
 * PDFを生成する関数
 */
async function generatePDF() {
    if (bufferedData.length === 0) {
        alert("データが存在しないためPDFを生成できません。");
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        let processedCount = 0;
        const totalCount = bufferedData.length;

        const processBatch = async (startIndex, batchSize) => {
            for (let i = startIndex; i < Math.min(startIndex + batchSize, totalCount); i++) {
                const row = bufferedData[i];
                
                const doc = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });

                doc.setFont("helvetica");
                doc.setFontSize(10);

                for (let gridRow = 0; gridRow < PDF_CONFIG.rows; gridRow++) {
                    for (let gridCol = 0; gridCol < PDF_CONFIG.columns; gridCol++) {
                        const xPos = PDF_CONFIG.marginX + gridCol * PDF_CONFIG.cellWidth;
                        const yPos = PDF_CONFIG.marginY + gridRow * PDF_CONFIG.cellHeight;

                        // テキスト配置
                        doc.setFontSize(8);
                        const textX = xPos + PDF_CONFIG.textMarginX;
                        doc.text(row.B1 || '', textX, yPos + 4);
                        doc.text(row.B2 || '', textX, yPos + 7);
                        doc.text(row.B3 || '', textX, yPos + 10);
                        doc.text(row.B4 || '', textX, yPos + 13);
                        doc.text(row.A || '', textX, yPos + 16);

                        // バーコード配置
                        const barcodeImage = generateBarcodeOnly(row.C);
                        await new Promise(resolve => {
                            if (barcodeImage.complete) resolve();
                            else barcodeImage.onload = resolve;
                        });

                        doc.addImage(
                            barcodeImage,
                            'PNG',
                            xPos + PDF_CONFIG.textMarginX,
                            yPos + 17,
                            PDF_CONFIG.barcodeWidth,
                            PDF_CONFIG.barcodeHeight
                        );
                    }
                }

                const fileName = `barcode-${row.A || 'unknown'}.pdf`;
                doc.save(fileName);

                processedCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        };

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

// ===== イベントリスナーの設定 =====

document.addEventListener('DOMContentLoaded', initializeApp);

elements.loadFileBtn.addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xls, .xlsx';
    fileInput.addEventListener('change', handleFile);
    fileInput.click();
});

elements.pdfBtn.addEventListener('click', generatePDF);