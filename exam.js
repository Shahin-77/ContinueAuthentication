/***********************
 * KEYBOARD BEHAVIOR
 ***********************/
let keyEvents = [];
let lastKeyDownTime = null;

document.addEventListener("keydown", (e) => {
  const time = performance.now();

  if (lastKeyDownTime !== null) {
    keyEvents.push({
      type: "interval",
      value: time - lastKeyDownTime
    });
  }

  lastKeyDownTime = time;

  keyEvents.push({
    key: e.key,
    type: "keydown",
    time
  });
});

document.addEventListener("keyup", (e) => {
  keyEvents.push({
    key: e.key,
    type: "keyup",
    time: performance.now()
  });
});

/***********************
 * MOUSE BEHAVIOR
 ***********************/
let mouseEvents = [];
let lastMousePos = null;
let lastMouseTime = null;

document.addEventListener("mousemove", (e) => {
  const time = performance.now();

  if (lastMousePos && lastMouseTime) {
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = dist / (time - lastMouseTime);

    mouseEvents.push({
      type: "move",
      speed,
      time
    });
  }

  lastMousePos = { x: e.clientX, y: e.clientY };
  lastMouseTime = time;
});

document.addEventListener("click", () => {
  mouseEvents.push({
    type: "click",
    time: performance.now()
  });
});

/***********************
 * CONFIG
 ***********************/
const API_BASE = "http://127.0.0.1:5000/api";
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "index.html";
}

let timerInterval = null;
let realtimeInterval = null;
let otpVerified = false;

/***********************
 * TIMER
 ***********************/
function startTimer(duration) {
  let timeLeft = duration;
  const timerEl = document.getElementById("timer");

  timerInterval = setInterval(() => {
    timeLeft--;

    const min = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const sec = String(timeLeft % 60).padStart(2, "0");

    timerEl.innerText = `${min}:${sec}`;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      submitExam();
    }
  }, 1000);
}

/***********************
 * LOAD QUESTIONS
 ***********************/
async function loadQuestions() {
  try {
    const res = await fetch(`${API_BASE}/exam/questions`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    const container = document.getElementById("questions");
    container.innerHTML = "";

    startTimer(data.duration);
    startRealtimeCheck(); // ⭐ START CONTINUOUS AUTH

    data.questions.forEach((q, i) => {
      const div = document.createElement("div");
      div.className = "bg-slate-700 p-4 rounded-xl mb-4";
      div.innerHTML = `
        <p class="font-semibold mb-2">Q${i + 1}. ${q.q}</p>
        <input class="w-full p-3 rounded-lg bg-slate-800 text-white" />
      `;
      container.appendChild(div);
    });
  } catch {
    alert("Backend not reachable");
    forceLogout();
  }
}

/***********************
 * REAL-TIME CONTINUOUS CHECK
 ***********************/
function startRealtimeCheck() {
  realtimeInterval = setInterval(sendBehaviorRealtime, 15000); // every 15 sec
}

async function sendBehaviorRealtime() {
  try {
    const res = await fetch(`${API_BASE}/exam/keystrokes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        keystrokes: keyEvents,
        mouse: mouseEvents
      })
    });

    const data = await res.json();
    realtimeActionHandler(data.action, data.final_trust);

  } catch {
    console.log("Realtime check failed");
  }
}

/***********************
 * REAL-TIME ACTION HANDLER
 ***********************/
function realtimeActionHandler(action, trust) {

  // SAFE
  if (action === "allow") return;

  // SUSPICIOUS → OTP
  if (action === "warn" && !otpVerified) {
    otpFlow(trust);
  }

  // VERY LOW TRUST → IMMEDIATE LOGOUT
  if (action === "logout") {
    alert("❌ Session terminated due to suspicious behavior");
    forceLogout();
  }
}

/***********************
 * OTP FLOW (MID-EXAM)
 ***********************/
function otpFlow(trust) {
  const otp = prompt(
    `⚠️ Suspicious activity detected\nTrust Score: ${trust}\n\nEnter OTP to continue exam:`
  );

  if (otp === "123456") {
    otpVerified = true;
    alert("✅ OTP verified. Continue exam.");
  } else {
    alert("❌ OTP failed. Logging out.");
    forceLogout();
  }
}

/***********************
 * FINAL SUBMIT
 ***********************/
async function submitExam() {
  clearInterval(realtimeInterval);

  try {
    await fetch(`${API_BASE}/exam/keystrokes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        keystrokes: keyEvents,
        mouse: mouseEvents
      })
    });

    alert("✅ Exam submitted successfully");
  } catch {
    alert("Submission failed");
  }

  forceLogout();
}

/***********************
 * LOGOUT
 ***********************/
function forceLogout() {
  clearInterval(realtimeInterval);
  clearInterval(timerInterval);
  localStorage.removeItem("token");
  window.location.href = "index.html";
}

/***********************
 * INIT
 ***********************/
loadQuestions();
