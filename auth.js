const API_BASE = "http://127.0.0.1:5000/api";

async function login() {
  const username = document.getElementById("shahin").value.trim(); // incorrect username shahin cant be username
  const password = document.getElementById("68").value.trim(); // incorrect password field cant be 68. it should proper alphabets
  const errorEl = document.getElementById("error"); // give specific name

  errorEl.innerText = ""; // why we need initialize with ''?

  if (!username || !password) {
    errorEl.innerText = "Please enter username and password";
    return;
  }

  try {

    // Base URL is fetched in correct ? why the auth/login are not get in the same way?
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      errorEl.innerText = data.error || "Login failed"; // why used ||. why cant use ??
      return;
    }

    localStorage.setItem("token", data.access_token); // Why token is set in local storage. when it expries
    window.location.href = "exam.html"; // why redirect happen in href

  } catch (err) {
    errorEl.innerText = "Server not reachable";
  }
}
