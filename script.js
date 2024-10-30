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
    loadFileBtn: document.getElementById('load-file-btn'),
    barcodeContainer: document.getElementById('barcode-container'),
    saveBarcodeBtn: document.getElementById('save-barcode-btn')
};

/**
 * バーコード生成時の設定値
 * JsBarcode ライブラリに渡すパラメータ
 */
// const BARCODE_CONFIG = {
//     format: "EAN13",     // バーコードのフォーマット
//     displayValue: true,  // バーコード番号を表示するか
//     fontSize: 40,        // バーコード番号のフォントサイズ
//     lineColor: "#000",   // バーコードの色
//     width: 4,            // バーのwidth
//     height: 140          // バーコードの高さ
// };
const BARCODE_CONFIG = {
    format: "EAN13",     // バーコードのフォーマット
    displayValue: true,  // バーコード番号を表示するか
    fontSize: 80,        // バーコード番号のフォントサイズ
    lineColor: "#000",   // バーコードの色
    width: 8,            // バーのwidth
    height: 240          // バーコードの高さ
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
    canvas.width = 450 * scaleFactor;
    canvas.height = 200 * scaleFactor;
    const ctx = canvas.getContext('2d');

    // 背景を白で塗りつぶし
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // バーコードの生成（有効なJANコードを使用）
    const validJANCode = getValidJANCode(barcodeNumber);
    const barcodeCanvas = document.createElement('canvas');
    JsBarcode(barcodeCanvas, validJANCode, BARCODE_CONFIG);

    // バーコードを画像の中央に配置
    const xPos = (canvas.width - barcodeCanvas.width) / 2;
    const yPos = (canvas.height - barcodeCanvas.height) / 2;
    ctx.drawImage(barcodeCanvas, xPos, yPos, barcodeCanvas.width, barcodeCanvas.height);

    // 完成した画像をimg要素として出力
    const imgElement = document.createElement('img');
    imgElement.src = canvas.toDataURL('image/png');
    imgElement.width = 450;
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
        // A列: JANコード
        bufferedData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
            .slice(1)
            .map(row => ({
                C: row[0]  // JANコード
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
            '',                // 商品名1
            '',                // 商品名2
            '',                // 商品名3
            '',                // 商品名4
            '',                // 商品コード
            getValidJANCode(row.C)       // 有効なJANコード
        );

        // バーコード画像を包む要素
        const wrapper = document.createElement('div');
        wrapper.style.marginBottom = '20px';
        wrapper.appendChild(barcodeImage);
        elements.barcodeContainer.appendChild(wrapper);
    });
}

// ===== バーコード画像保存関連の関数 =====

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
