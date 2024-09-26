// ボタンと数字表示部分を取得
const generateBtn = document.getElementById('generate-btn');
const randomNumberDisplay = document.getElementById('random-number');

// 13桁のランダムな数字を生成する関数
function generateRandomNumber() {
    let randomNumber = '';
    for (let i = 0; i < 13; i++) {
        randomNumber += Math.floor(Math.random() * 10);
    }
    return randomNumber;
}

// ボタンをクリックしたときにランダムな数字を表示する
generateBtn.addEventListener('click', () => {
    const randomNumber = generateRandomNumber();
    randomNumberDisplay.textContent = randomNumber;
});
