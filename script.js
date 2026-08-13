// 24 Categories Definition
const ALL_CATEGORIES = [
    { id: 'daily', name: 'يوميات', emoji: '📅' },
    { id: 'school', name: 'مدرسة', emoji: '🏫' },
    { id: 'restaurants', name: 'مطاعم', emoji: '🍔' },
    { id: 'travel', name: 'سفر', emoji: '✈️' },
    { id: 'cinema', name: 'سينما', emoji: '🎬' },
    { id: 'sports', name: 'رياضة', emoji: '⚽' },
    { id: 'tech', name: 'تقنية', emoji: '💻' },
    { id: 'history', name: 'تاريخ', emoji: '📜' },
    { id: 'games', name: 'ألعاب', emoji: '🎮' },
    { id: 'fantasy', name: 'خيال', emoji: '🧜‍♂️' },
    { id: 'food', name: 'أكل وشرب', emoji: '🍕' },
    { id: 'jobs', name: 'مهن', emoji: '💼' },
    { id: 'animals', name: 'حيوانات', emoji: '🦁' },
    { id: 'countries', name: 'دول ومدن', emoji: '🌍' },
    { id: 'fashion', name: 'أزياء', emoji: '👗' },
    { id: 'celebs', name: 'مشاهير', emoji: '🌟' },
    { id: 'cars', name: 'سيارات', emoji: '🚗' },
    { id: 'science', name: 'علوم', emoji: '🔬' },
    { id: 'nature', name: 'طبيعة', emoji: '🌿' },
    { id: 'proverbs', name: 'أمثال', emoji: '📜' },
    { id: 'music', name: 'موسيقا', emoji: '🎵' },
    { id: 'cartoons', name: 'كرتون', emoji: '📺' },
    { id: 'home', name: 'أشياء بالبيت', emoji: '🏠' },
    { id: 'events', name: 'مناسبات', emoji: '🎉' }
];

// Game State
let selectedCategories = [];
let playersCount = 4;
let playerNames = [];
let usedTopics = [];

let currentRoundData = null; // { realTopic, fakeTopic, hints }
let spyIndex = -1;
let currentDistributionIndex = 0;

let timerInterval = null;
let timeLeft = 180;

let currentVoterIndex = 0;
let votesMap = {}; // { voterIndex: votedPlayerIndex }

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    renderCategories();
    renderCountSelector();
    renderPlayerInputs();
});

// Screen Switcher
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function selectMode(mode) {
    if (mode === 'blind') {
        showScreen('screen-categories');
    }
}

// 1. Categories logic
function renderCategories() {
    const container = document.getElementById('categoriesContainer');
    container.innerHTML = '';
    
    ALL_CATEGORIES.forEach(cat => {
        const div = document.createElement('div');
        div.className = `category-card ${selectedCategories.includes(cat.name) ? 'selected' : ''}`;
        div.innerHTML = `<span>${cat.emoji}</span> <span>${cat.name}</span>`;
        div.onclick = () => toggleCategory(cat.name, div);
        container.appendChild(div);
    });
}

function toggleCategory(catName, element) {
    if (selectedCategories.includes(catName)) {
        selectedCategories = selectedCategories.filter(c => c !== catName);
        element.classList.remove('selected');
    } else {
        selectedCategories.push(catName);
        element.classList.add('selected');
    }
}

function selectAllCategories(select) {
    if (select) {
        selectedCategories = ALL_CATEGORIES.map(c => c.name);
    } else {
        selectedCategories = [];
    }
    renderCategories();
}

function goToPlayersScreen() {
    if (selectedCategories.length === 0) {
        alert("يرجى اختيار تصنيف واحد على الأقل للمتابعة!");
        return;
    }
    showScreen('screen-players');
}

// 2. Players logic
function renderCountSelector() {
    const container = document.getElementById('countSelector');
    container.innerHTML = '';
    
    for (let i = 3; i <= 8; i++) {
        const btn = document.createElement('button');
        btn.className = `count-btn ${i === playersCount ? 'active' : ''}`;
        btn.innerText = i;
        btn.onclick = () => {
            playersCount = i;
            renderCountSelector();
            renderPlayerInputs();
        };
        container.appendChild(btn);
    }
}

function renderPlayerInputs() {
    const container = document.getElementById('playerInputs');
    container.innerHTML = '';
    
    for (let i = 0; i < playersCount; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'input-neon';
        input.placeholder = `اسم اللاعب ${i + 1}`;
        input.value = playerNames[i] || `لاعب ${i + 1}`;
        container.appendChild(input);
    }
}

// 3. Start Game & Fetch AI
async function startNewGame() {
    // Collect names
    const inputs = document.querySelectorAll('#playerInputs input');
    playerNames = [];
    inputs.forEach((inp, idx) => {
        const val = inp.value.trim() || `لاعب ${idx + 1}`;
        playerNames.push(val);
    });

    await fetchTopicAndStart();
}

async function fetchTopicAndStart() {
    showScreen('screen-loading');

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                categories: selectedCategories,
                playersCount: playerNames.length,
                usedTopics: usedTopics
            })
        });

        currentRoundData = await response.json();
        if (currentRoundData.realTopic) {
            usedTopics.push(currentRoundData.realTopic);
        }
    } catch (e) {
        console.error("Fetch failed:", e);
        currentRoundData = {
            realTopic: "مطعم برجر يقدم ألعاب خفة يد",
            fakeTopic: "مطعم بيتزا يقدم عروض سيرك",
            hints: Array(playerNames.length).fill("المكان فيه إثارة وتسلية ممتازة مع الأكل!")
        };
    }

    // Pick Spy randomly
    spyIndex = Math.floor(Math.random() * playerNames.length);

    // Start distribution
    currentDistributionIndex = 0;
    setupPassPhoneScreen();
}

// 4. Distribution Flow
function setupPassPhoneScreen() {
    const name = playerNames[currentDistributionIndex];
    document.getElementById('passPlayerName').innerText = name;
    document.getElementById('btnPassPlayerName').innerText = name;
    showScreen('screen-pass');
}

function showCurrentPlayerCard() {
    const name = playerNames[currentDistributionIndex];
    document.getElementById('cardPlayerName').innerText = name;

    const isSpy = (currentDistributionIndex === spyIndex);
    const topicToDisplay = isSpy ? currentRoundData.fakeTopic : currentRoundData.realTopic;
    const hintText = currentRoundData.hints?.[currentDistributionIndex] || "تحدث بذكاء ودون إفصاح مباشر!";

    document.getElementById('cardTopic').innerText = topicToDisplay;
    document.getElementById('cardHint').innerText = `💡 تلميحك: ${hintText}`;

    showScreen('screen-card');
}

function finishPlayerTurn() {
    currentDistributionIndex++;
    if (currentDistributionIndex < playerNames.length) {
        setupPassPhoneScreen();
    } else {
        startDiscussionPhase();
    }
}

// 5. Discussion Timer Phase
function startDiscussionPhase() {
    showScreen('screen-discussion');
    timeLeft = 180; // 3 minutes
    updateTimerDisplay();

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            endDiscussionAndStartVoting();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const timerElem = document.getElementById('timerDisplay');
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    timerElem.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    timerElem.classList.remove('warning', 'danger');
    if (timeLeft <= 30 && timeLeft > 10) {
        timerElem.classList.add('warning');
    } else if (timeLeft <= 10) {
        timerElem.classList.add('danger');
    }
}

function endDiscussionAndStartVoting() {
    if (timerInterval) clearInterval(timerInterval);
    currentVoterIndex = 0;
    votesMap = {};
    setupVotingScreen();
}

// 6. Secret Voting Phase
function setupVotingScreen() {
    const voterName = playerNames[currentVoterIndex];
    document.getElementById('voterName').innerText = voterName;

    const container = document.getElementById('voteOptions');
    container.innerHTML = '';

    playerNames.forEach((pName, idx) => {
        if (idx !== currentVoterIndex) { // Can't vote for yourself
            const btn = document.createElement('button');
            btn.className = 'vote-btn';
            btn.innerText = `👈 ${pName}`;
            btn.onclick = () => recordVote(idx);
            container.appendChild(btn);
        }
    });

    showScreen('screen-voting');
}

function recordVote(targetIndex) {
    votesMap[currentVoterIndex] = targetIndex;
    currentVoterIndex++;

    if (currentVoterIndex < playerNames.length) {
        setupVotingScreen();
    } else {
        revealResults();
    }
}

// 7. Reveal Results
function revealResults() {
    // Tally votes
    const voteCounts = Array(playerNames.length).fill(0);
    Object.values(votesMap).forEach(votedIdx => {
        voteCounts[votedIdx]++;
    });

    // Find highest voted
    let maxVotes = -1;
    let mostVotedIndex = 0;
    voteCounts.forEach((count, idx) => {
        if (count > maxVotes) {
            maxVotes = count;
            mostVotedIndex = idx;
        }
    });

    const isSpyDiscovered = (mostVotedIndex === spyIndex);

    const titleElem = document.getElementById('revealResultTitle');
    const subElem = document.getElementById('revealResultSubtitle');

    if (isSpyDiscovered) {
        titleElem.innerText = "🎉 فاز الجميع!";
        titleElem.style.color = "var(--neon-green)";
        subElem.innerText = `مبروك! نجحتم في كشف الجاسوس (${playerNames[spyIndex]})!`;
    } else {
        titleElem.innerText = "😂 فاز الجاسوس!";
        titleElem.style.color = "var(--neon-pink)";
        subElem.innerText = `اتهمتم ${playerNames[mostVotedIndex]}، لكن الجاسوس الحقيقي هو ${playerNames[spyIndex]}!`;
    }

    document.getElementById('spyNameDisplay').innerText = playerNames[spyIndex];
    document.getElementById('realTopicDisplay').innerText = currentRoundData.realTopic;
    document.getElementById('fakeTopicDisplay').innerText = currentRoundData.fakeTopic;

    showScreen('screen-reveal');
}

// 8. Loop / Play Again
async function playAgainSamePlayers() {
    await fetchTopicAndStart();
}

function returnToMainMenu() {
    showScreen('screen-menu');
}
