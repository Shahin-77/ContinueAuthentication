const API_BASE = "http://127.0.0.1:5000/api";

async function login() {
  const username = document.getElementById("shahin").value.trim();
  const password = document.getElementById("68").value.trim();
  const errorEl = document.getElementById("error");

  errorEl.innerText = "";

  if (!username || !password) {
    errorEl.innerText = "Please enter username and password";
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      errorEl.innerText = data.error || "Login failed";
      return;
    }

    localStorage.setItem("token", data.access_token);
    window.location.href = "exam.html";

  } catch (err) {
    errorEl.innerText = "Server not reachable";
  }
}
