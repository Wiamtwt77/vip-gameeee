// قائمة الكلمات السرية
const WORDS_DATABASE = [
    'مستشفى', 'مطار', 'مطعم', 'مدرسة', 'ملعب كرة قدم', 'سينما',
    'متحف', 'حديقة حيوان', 'محطة قطار', 'مكتبة', 'فندق', 'سوبرماركت'
];

// إعداد Supabase (اختياري عند توفر الرابط والمفتاح)
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
let supabaseClient = null;

if (typeof supabase !== 'undefined' && SUPABASE_URL !== "YOUR_SUPABASE_URL") {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// حالة اللعبة
let players = [];
let assignedRoles = [];
let currentSecretWord = '';
let currentTurnIndex = 0;

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function addPlayerInput() {
    const container = document.getElementById('players-container');
    const count = container.children.length + 1;
    const div = document.createElement('div');
    div.className = 'input-group';
    div.innerHTML = `<input type="text" placeholder="اللاعب ${count}" class="player-input">`;
    container.appendChild(div);
}

function startGame() {
    const inputs = document.querySelectorAll('.player-input');
    players = [];
    inputs.forEach(input => {
        if (input.value.trim() !== '') {
            players.push(input.value.trim());
        }
    });

    if (players.length < 3) {
        alert('يرجى إدخال أسماء 3 لاعبين على الأقل!');
        return;
    }

    // اختيار الكلمة العشوائية
    currentSecretWord = WORDS_DATABASE[Math.floor(Math.random() * WORDS_DATABASE.length)];

    // اختيار الجاسوس والمحقق
    const spyIdx = Math.floor(Math.random() * players.length);
    let detectiveIdx = Math.floor(Math.random() * players.length);
    while (detectiveIdx === spyIdx) {
        detectiveIdx = Math.floor(Math.random() * players.length);
    }

    assignedRoles = players.map((name, idx) => {
        if (idx === spyIdx) return { name, role: 'spy' };
        if (idx === detectiveIdx) return { name, role: 'detective' };
        return { name, role: 'civilian' };
    });

    currentTurnIndex = 0;
    setupRevealTurn();
    showScreen('screen-reveal');
}

function setupRevealTurn() {
    document.getElementById('btn-show-role').style.display = 'block';
    document.getElementById('role-card-container').style.display = 'none';
    document.getElementById('reveal-turn-title').innerText = `مرر الهاتف إلى: ${assignedRoles[currentTurnIndex].name}`;
}

function showCurrentRole() {
    const player = assignedRoles[currentTurnIndex];
    document.getElementById('btn-show-role').style.display = 'none';
    document.getElementById('role-card-container').style.display = 'block';

    const roleTitle = document.getElementById('role-title');
    const roleDesc = document.getElementById('role-desc');
    const wordDisplay = document.getElementById('word-display');
    const secretWordText = document.getElementById('secret-word-text');

    if (player.role === 'spy') {
        roleTitle.innerText = '🕵️‍♂️ أنت الجاسوس!';
        roleTitle.style.color = '#ef4444';
        roleDesc.innerText = 'أنت لا تعرف الكلمة السرية. حاول التخمين وتجنب كشف المحقق لك!';
        wordDisplay.style.display = 'none';
    } else if (player.role === 'detective') {
        roleTitle.innerText = '🔍 أنت المحقق!';
        roleTitle.style.color = '#3b82f6';
        roleDesc.innerText = 'تعرف الكلمة السرية! اسأل أسئلة ذكية لكشف الجاسوس بدون إفشاء دورك له.';
        wordDisplay.style.display = 'block';
        secretWordText.innerText = currentSecretWord;
    } else {
        roleTitle.innerText = '👥 أنت مواطن عالي!';
        roleTitle.style.color = '#10b981';
        roleDesc.innerText = 'تعرف الكلمة السرية. ساعد المحقق في العثور على الجاسوس!';
        wordDisplay.style.display = 'block';
        secretWordText.innerText = currentSecretWord;
    }
}

function nextPlayer() {
    currentTurnIndex++;
    if (currentTurnIndex < assignedRoles.length) {
        setupRevealTurn();
    } else {
        showScreen('screen-play');
    }
}

async function finishGame(winnerRole) {
    document.getElementById('result-word').innerText = currentSecretWord;
    const winnerText = document.getElementById('result-winner');

    if (winnerRole === 'spy') {
        winnerText.innerText = '🏆 الفائز: الجاسوس 🕵️‍♂️';
        winnerText.style.color = '#ef4444';
    } else {
        winnerText.innerText = '🏆 الفائز: المحقق والمواطنون 🔍';
        winnerText.style.color = '#10b981';
    }

    showScreen('screen-result');

    // حفظ النتيجة في Supabase إن وجد
    if (supabaseClient) {
        const spy = assignedRoles.find(r => r.role === 'spy')?.name;
        const detective = assignedRoles.find(r => r.role === 'detective')?.name;
        try {
            await supabaseClient.from('game_sessions').insert([{
                secret_word: currentSecretWord,
                detective_name: detective,
                spy_name: spy,
                winner_role: winnerRole
            }]);
        } catch (err) {
            console.error('Supabase error:', err);
        }
    }
}

function resetGame() {
    showScreen('screen-setup');
}
