let keyTimes = [];
let lastKeyTime = null;

let mouseMoves = [];
let lastMouse = null;

function login() {
    fetch("http://127.0.0.1:5000/login", { method: "POST" });
    document.getElementById("status").innerText = "Status: Logged in";
}

document.addEventListener("keydown", () => {
    const now = Date.now();
    if (lastKeyTime) {
        keyTimes.push(now - lastKeyTime);
    }
    lastKeyTime = now;
});

document.addEventListener("mousemove", (e) => {
    if (lastMouse) {
        const dx = e.clientX - lastMouse.x;
        const dy = e.clientY - lastMouse.y;
        mouseMoves.push(Math.sqrt(dx * dx + dy * dy));
    }
    lastMouse = { x: e.clientX, y: e.clientY };
});

setInterval(sendBehavior, 5000);

function sendBehavior() {
    if (keyTimes.length < 2 || mouseMoves.length < 2) return;

    const avgKeyDelay = average(keyTimes);
    const keyStd = std(keyTimes);
    const mouseSpeed = average(mouseMoves);
    const mouseRand = std(mouseMoves);

    fetch("http://127.0.0.1:5000/behavior", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            avg_key_delay: avgKeyDelay,
            key_delay_std: keyStd,
            mouse_speed: mouseSpeed,
            mouse_randomness: mouseRand
        })
    })
    .then(res => res.json())
    .then(updateUI);

    keyTimes = [];
    mouseMoves = [];
}

function updateUI(data) {
    const riskPercent = data.risk * 100;
    const bar = document.getElementById("riskBar");
    bar.style.width = riskPercent + "%";

    if (data.state === "FULL_ACCESS") {
        bar.style.background = "green";
        document.getElementById("deleteBtn").disabled = false;
    }
    else if (data.state === "RESTRICTED") {
        bar.style.background = "orange";
        document.getElementById("deleteBtn").disabled = true;
    }
    else {
        bar.style.background = "red";
        document.getElementById("deleteBtn").disabled = true;
        document.getElementById("status").innerText = "SESSION LOCKED";
    }

    document.getElementById("trustState").innerText =
        "Trust State: " + data.state;
}

function average(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function std(arr) {
    const avg = average(arr);
    return Math.sqrt(arr.map(x => (x - avg) ** 2).reduce((a, b) => a + b) / arr.length);
}

