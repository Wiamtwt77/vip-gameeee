let players = [];
let currentIndex = 0;
let topic = "";
let spyIndex = -1;

async function startGame() {
    const count = document.getElementById('playerCount').value;
    if (count < 3) { alert("أدخل 3 لاعبين على الأقل"); return; }
    
    // Fetch Topic
    const res = await fetch('/api/generate');
    const data = await res.json();
    topic = data.topic;
    
    // Assign Spy
    spyIndex = Math.floor(Math.random() * count);
    
    document.getElementById('app').style.display = 'none';
    document.getElementById('gameArea').style.display = 'block';
    console.log("Topic:", topic); // For debugging
}

let revealed = false;
function nextPlayer() {
    const btn = document.getElementById('actionBtn');
    const msg = document.getElementById('message');
    
    if (!revealed) {
        if (currentIndex === spyIndex) {
            msg.innerText = "أنت الجاسوس!";
        } else {
            msg.innerText = "الموضوع: " + topic;
        }
        btn.innerText = "تم، مرر للاعب التالي";
        revealed = true;
    } else {
        currentIndex++;
        if (currentIndex >= 3) { // Simplified for prototype
            msg.innerText = "انتهت عملية التوزيع، ابدأوا النقاش!";
            btn.style.display = 'none';
        } else {
            msg.innerText = "مرر الهاتف للاعب التالي واضغط للبدء";
            btn.innerText = "عرض كلمتي";
            revealed = false;
        }
    }
}
