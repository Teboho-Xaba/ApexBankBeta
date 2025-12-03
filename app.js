"use strict";

// -----------------------------
// OOP CLASSES
// -----------------------------
class User {
  constructor(name, surname, idNumber, dob, nationality = "South African") {
    this.name = name;
    this.surname = surname;
    this.idNumber = idNumber;
    this.dob = dob;
    this.nationality = nationality;
    this.username = (name[0] + surname[0]).toLowerCase();
    this.pin = String(Math.floor(1000 + Math.random() * 9000));
    this.balance = 50; // Initial bonus R50.00
    this.transactions = [{ type: "Deposit", amount: 50, date: new Date() }];
  }
}

// -----------------------------
// STORAGE FUNCTIONS
// -----------------------------
function loadUsers() {
  const users = localStorage.getItem("users");
  return users ? JSON.parse(users) : [];
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function getLoggedUser() {
  const username = localStorage.getItem("loggedUser");
  if (!username) return null;
  const users = loadUsers();
  return users.find((u) => u.username === username);
}

function setLoggedUser(user) {
  localStorage.setItem("loggedUser", user.username);
  const users = loadUsers();
  const idx = users.findIndex((u) => u.username === user.username);
  if (idx >= 0) users[idx] = user;
  saveUsers(users);
}

// -----------------------------
// LOGIN (index.html)
// -----------------------------
if (document.getElementById("loginForm")) {
  const form = document.getElementById("loginForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const pin = document.getElementById("pin").value;
    const users = loadUsers();
    const user = users.find((u) => u.username === username && u.pin === pin);
    if (user) {
      localStorage.setItem("loggedUser", user.username);
      window.location.href = "dashboard.html";
    } else alert("Invalid credentials");
  });
}

// -----------------------------
// SIGNUP (signup.html)
// -----------------------------
if (document.getElementById("signupForm")) {
  const form = document.getElementById("signupForm");
  const pinSection = document.getElementById("pinSection");
  const pinDisplay = document.getElementById("generatedPin");
  const pinInput = document.getElementById("pinInput");
  const loginBtn = document.getElementById("loginBtn");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const surname = document.getElementById("surname").value;
    const idNumber = document.getElementById("idNumber").value;
    const dob = document.getElementById("dob").value;
    const nationality = document.getElementById("nationality").value;

    const users = loadUsers();
    if (users.some((u) => u.idNumber === idNumber))
      return alert("ID already registered");

    const user = new User(name, surname, idNumber, dob, nationality);
    users.push(user);
    saveUsers(users);

    form.style.display = "none";
    pinSection.style.display = "block";
    pinDisplay.textContent = user.pin;

    loginBtn.onclick = () => {
      if (pinInput.value === user.pin) {
        localStorage.setItem("loggedUser", user.username);
        window.location.href = "dashboard.html";
      } else alert("Incorrect PIN");
    };
  });
}

// -----------------------------
// DASHBOARD (dashboard.html)
// -----------------------------
if (document.querySelector(".app")) {
  let user = getLoggedUser();
  if (!user) window.location.href = "index.html";

  const welcomeEl = document.querySelector(".welcome");
  const balanceEl = document.querySelector(".balance__value");
  const dateEl = document.querySelector(".date");
  const movementsEl = document.querySelector(".movements");
  const summaryIn = document.querySelector(".summary__value--in");
  const summaryOut = document.querySelector(".summary__value--out");
  const summaryInterest = document.querySelector(".summary__value--interest");
  const logoutBtn = document.getElementById("logoutBtn");
  const timerEl = document.querySelector(".timer");

  let timer;

  function formatCurrency(amount) {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  }

  function startTimer(durationSeconds) {
    let time = durationSeconds;

    const tick = () => {
      const min = String(Math.floor(time / 60)).padStart(2, "0");
      const sec = String(time % 60).padStart(2, "0");
      timerEl.textContent = `${min}:${sec}`;

      if (time === 0) {
        clearInterval(timer);
        alert("Session expired. Logging out...");
        localStorage.removeItem("loggedUser");
        window.location.href = "index.html";
      }

      time--;
    };

    tick();
    timer = setInterval(tick, 1000);
  }

  function renderDashboard() {
    welcomeEl.textContent = `Welcome back, ${user.name}`;
    dateEl.textContent = new Intl.DateTimeFormat("en-ZA").format(new Date());
    balanceEl.textContent = formatCurrency(user.balance);

    movementsEl.innerHTML = "";
    user.transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .forEach((t, i) => {
        const type = t.amount > 0 ? "deposit" : "withdrawal";
        const html = `
          <div class="movements__row">
            <div class="movements__type movements__type--${type}">${
          i + 1
        } ${type}</div>
            <div class="movements__date">${new Date(t.date).toLocaleDateString(
              "en-ZA"
            )}</div>
            <div class="movements__value">${formatCurrency(
              Math.abs(t.amount)
            )}</div>
          </div>`;
        movementsEl.insertAdjacentHTML("afterbegin", html);
      });

    const deposits = user.transactions
      .filter((t) => t.amount > 0)
      .reduce((a, c) => a + c.amount, 0);
    const withdrawals = user.transactions
      .filter((t) => t.amount < 0)
      .reduce((a, c) => a + c.amount, 0);

    summaryIn.textContent = formatCurrency(deposits);
    summaryOut.textContent = formatCurrency(Math.abs(withdrawals));
    summaryInterest.textContent = formatCurrency(deposits * 0.01);
  }

  renderDashboard();
  startTimer(10 * 60); // 10 minutes

  // Transfer
  const transferForm = document.querySelector(".form--transfer");
  transferForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const toUser = transferForm.querySelector(".form__input--to").value;
    const amount = Number(
      transferForm.querySelector(".form__input--amount").value
    );
    if (amount <= 0) return alert("Enter valid amount");

    const users = loadUsers();
    const recipient = users.find((u) => u.username === toUser);
    if (!recipient) return alert("Recipient not found");
    if (amount > user.balance) return alert("Insufficient funds");

    user.balance -= amount;
    user.transactions.push({
      type: "Transfer Out",
      amount: -amount,
      date: new Date(),
    });
    recipient.balance += amount;
    recipient.transactions.push({
      type: "Transfer In",
      amount: amount,
      date: new Date(),
    });

    saveUsers(users);
    localStorage.setItem("loggedUser", user.username);
    renderDashboard();
    transferForm.reset();
  });

  // Loan
  const loanForm = document.querySelector(".form--loan");
  loanForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const amount = Number(
      loanForm.querySelector(".form__input--loan-amount").value
    );
    if (amount <= 0) return alert("Enter valid amount");

    user.balance += amount;
    user.transactions.push({ type: "Loan", amount: amount, date: new Date() });

    const users = loadUsers();
    const idx = users.findIndex((u) => u.username === user.username);
    users[idx] = user;
    saveUsers(users);
    localStorage.setItem("loggedUser", user.username);
    renderDashboard();
    loanForm.reset();
  });

  // Close account
  const closeForm = document.querySelector(".form--close");
  closeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const usernameInput = closeForm.querySelector(".form__input--user").value;
    const pinInput = closeForm.querySelector(".form__input--pin").value;
    if (usernameInput !== user.username || pinInput !== user.pin)
      return alert("Credentials do not match");

    const users = loadUsers().filter((u) => u.username !== user.username);
    saveUsers(users);
    localStorage.removeItem("loggedUser");
    window.location.href = "index.html";
  });

  // Logout
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("loggedUser");
    window.location.href = "index.html";
  });
}
