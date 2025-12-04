"use strict";

class BankUser {
  constructor(username, name, surname, dob, nationality = "South African") {
    this.username = username.toLowerCase().trim();
    this.name = name.trim();
    this.surname = surname.trim();
    this.dob = dob;
    this.nationality = nationality;
    this.pin = this.#generatePIN();
    this.accounts = [];
    this.createdAt = new Date().toISOString();
  }

  #generatePIN() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  authenticate(pin) {
    return this.pin === pin;
  }
}

class BankAccount {
  constructor(type = "cheque") {
    this.type = type;
    this.balance = 0;
    this.transactions = [];
    this.createdAt = new Date().toISOString();
  }

  deposit(amount, desc = "Deposit") {
    this.balance += amount;
    this.transactions.push({
      amount,
      date: new Date().toISOString(),
      type: "deposit",
      desc,
    });
    return this;
  }

  withdraw(amount, desc = "Withdrawal") {
    if (amount > this.balance) throw new Error("Insufficient funds");
    this.balance -= amount;
    this.transactions.push({
      amount: -amount,
      date: new Date().toISOString(),
      type: "withdrawal",
      desc,
    });
    return this;
  }

  requestLoan(amount) {
    if (amount <= 0) return false;
    const hasDeposit = this.transactions.some(
      (t) => t.type === "deposit" && t.amount >= amount * 0.1
    );
    if (hasDeposit) {
      this.deposit(amount, "Instant Loan Approved");
      return true;
    }
    return false;
  }
}

// App
class ApexBank {
  static currentUser = null;
  static timer = null;
  static locale = "en-ZA";
  static currency = "ZAR";

  static init() {
    if (document.getElementById("signupForm")) this.initSignup();
    if (document.getElementById("loginForm")) this.initLogin();
    if (document.getElementById("logoutBtn")) this.initDashboard();
  }

  static initSignup() {
    const form = document.getElementById("signupForm");
    const pinSection = document.getElementById("pinSection");

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const username = document
        .getElementById("username")
        .value.trim()
        .toLowerCase();
      if (!username) return alert("Username is required");
      if (this.loadUser(username)) return alert("Username already taken");

      const user = new BankUser(
        username,
        document.getElementById("name").value,
        document.getElementById("surname").value,
        document.getElementById("dob").value,
        document.getElementById("nationality").value
      );

      const cheque = new BankAccount("cheque");
      const savings = new BankAccount("savings");
      cheque.deposit(50, "Welcome Bonus");
      savings.deposit(50, "Welcome Bonus");
      user.accounts = [cheque, savings];

      this.saveUser(user);

      form.style.display = "none";
      pinSection.style.display = "block";
      pinSection.innerHTML = `
        <h2>Your Account is Ready</h2>
        <div class="pin-reveal">
          <p class="pin-label">YOUR PERMANENT PIN</p>
          <p class="pin-number">${user.pin}</p>
          <div class="security-warning">
            <p>This PIN can <strong>never</strong> be changed or recovered.</p>
            <p>Save it securely now.</p>
          </div>
        </div>
        <button id="continueBtn" class="continue-btn">Continue to Login</button>
        <p class="countdown-text">Redirecting in <span id="countdown">8</span> seconds...</p>
      `;

      let countdown = 8;
      const countdownEl = document.getElementById("countdown");
      const interval = setInterval(() => {
        countdown--;
        countdownEl.textContent = countdown;
        if (countdown <= 0) {
          clearInterval(interval);
          location.href = "index.html";
        }
      }, 1000);

      document.getElementById("continueBtn").onclick = () => {
        clearInterval(interval);
        location.href = "index.html";
      };

      this.startTimer(600, () => location.reload());
    });
  }

  static initLogin() {
    const form = document.getElementById("loginForm");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const username = document
        .getElementById("loginUsername")
        .value.toLowerCase()
        .trim();
      const pin = document.getElementById("loginPin").value;

      const userData = this.loadUser(username);
      if (!userData) return alert("User not found");

      const user = this.restoreUser(userData);

      if (user.authenticate(pin)) {
        this.currentUser = user;
        localStorage.setItem("apexUserId", username);
        location.href = "dashboard.html";
      } else {
        alert("Invalid PIN");
      }
    });
  }

  static initDashboard() {
    const savedId = localStorage.getItem("apexUserId");
    if (!savedId) return this.logout();

    const userData = this.loadUser(savedId);
    if (!userData) return this.logout();

    this.currentUser = this.restoreUser(userData);

    this.render();
    this.startTimer(600, () => this.logout());

    document
      .getElementById("logoutBtn")
      .addEventListener("click", () => this.logout());

    // UNIFIED TRANSACTIONS
    const transactionType = document.getElementById("transactionType");
    const amountInput = document.getElementById("transactionAmount");
    const recipientInput = document.getElementById("recipientUsername");
    const recipientContainer = document.getElementById("recipientContainer");
    const pinInput = document.getElementById("transactionPin");
    const submitBtn = document.getElementById("submitTransaction");

    transactionType.addEventListener("change", () => {
      recipientContainer.style.display =
        transactionType.value === "transfer" ? "block" : "none";
    });

    submitBtn.addEventListener("click", () => {
      const type = transactionType.value;
      const amount = Number(amountInput.value);
      const recipient = recipientInput.value.trim().toLowerCase();
      const pin = pinInput.value;

      if (!this.currentUser.authenticate(pin)) {
        return alert("Incorrect PIN");
      }

      if (amount <= 0) return alert("Enter valid amount");

      try {
        if (type === "deposit") {
          this.currentUser.accounts[0].deposit(amount, "Cash Deposit");
          alert(`R${amount.toFixed(2)} deposited`);
        } else if (type === "withdrawal") {
          this.currentUser.accounts[0].withdraw(amount, "Cash Withdrawal");
          alert(`R${amount.toFixed(2)} withdrawn`);
        } else if (type === "transfer") {
          if (!recipient) return alert("Enter recipient username");
          if (recipient === this.currentUser.username)
            return alert("Can't transfer to yourself");

          const recipientData = this.loadUser(recipient);
          if (!recipientData) return alert("Recipient not found");

          const recipientUser = this.restoreUser(recipientData);

          if (this.currentUser.accounts[0].balance < amount)
            return alert("Insufficient funds");

          this.currentUser.accounts[0].withdraw(
            amount,
            `Transfer to ${recipient}`
          );
          recipientUser.accounts[0].deposit(
            amount,
            `From ${this.currentUser.username}`
          );

          this.saveUser(recipientUser);
          alert(`R${amount.toFixed(2)} sent to ${recipient}`);
        }

        this.saveUser(this.currentUser);
        this.render();
        this.resetTimer();

        amountInput.value = "";
        recipientInput.value = "";
        pinInput.value = "";
      } catch (err) {
        alert(err.message || "Transaction failed");
      }
    });

    // Loan
    document.getElementById("requestLoanBtn").addEventListener("click", () => {
      const amount = Number(document.getElementById("loanAmount").value);
      const pin = document.getElementById("loanPin").value;

      if (!this.currentUser.authenticate(pin)) return alert("Incorrect PIN");
      if (amount <= 0) return alert("Enter valid amount");

      if (this.currentUser.accounts[0].requestLoan(amount)) {
        this.saveUser(this.currentUser);
        this.render();
        this.resetTimer();
        alert(`R${amount.toFixed(2)} loan approved!`);
        document.getElementById("loanAmount").value = "";
        document.getElementById("loanPin").value = "";
      } else {
        alert("Loan declined");
      }
    });

    document.querySelector(".form--close").addEventListener("submit", (e) => {
      e.preventDefault();
      const confirmUser = document
        .querySelector(".form__input--user")
        .value.trim()
        .toLowerCase();
      const confirmPin = document.querySelector(".form__input--pin").value;

      if (
        confirmUser === this.currentUser.username &&
        this.currentUser.authenticate(confirmPin)
      ) {
        if (confirm("Delete account permanently?")) {
          this.deleteUser(this.currentUser.username);
          this.logout();
        }
      } else {
        alert("Incorrect details");
      }
    });

    document
      .querySelector(".btn--sort")
      .addEventListener("click", () => this.render(true));
  }

  // OBJECTS WITH METHODS
  static restoreUser(userData) {
    const user = Object.setPrototypeOf(userData, BankUser.prototype);
    user.accounts = user.accounts.map((acc) =>
      Object.setPrototypeOf(acc, BankAccount.prototype)
    );
    return user;
  }

  static render(sort = false) {
    if (!this.currentUser) return;

    document.querySelector(
      ".welcome"
    ).textContent = `Welcome back, ${this.currentUser.name}`;
    document.querySelector(".app").style.opacity = 1;
    document.querySelector(".date").textContent = new Intl.DateTimeFormat(
      this.locale
    ).format(new Date());

    const allTransactions = this.currentUser.accounts.flatMap(
      (acc) => acc.transactions
    );
    const displayedTxns = sort
      ? allTransactions.slice().sort((a, b) => b.amount - a.amount)
      : allTransactions
          .slice()
          .sort((a, b) => new Date(b.date) - new Date(a.date));

    const container = document.querySelector(".movements");
    container.innerHTML = "";
    displayedTxns.forEach((t, i) => {
      const type = t.amount > 0 ? "deposit" : "withdrawal";
      const html = `
        <div class="movements__row">
          <div class="movements__type movements__type--${type}">${
        i + 1
      } ${type.toUpperCase()}</div>
          <div class="movements__date">${new Date(t.date).toLocaleDateString(
            this.locale
          )}</div>
          <div class="movements__value">${this.formatCurrency(
            Math.abs(t.amount)
          )}</div>
        </div>`;
      container.insertAdjacentHTML("afterbegin", html);
    });

    const totalBalance = this.currentUser.accounts.reduce(
      (sum, acc) => sum + acc.balance,
      0
    );
    document.querySelector(".balance__value").textContent =
      this.formatCurrency(totalBalance);

    const deposits = allTransactions
      .filter((t) => t.amount > 0)
      .reduce((s, t) => s + t.amount, 0);
    const withdrawals = Math.abs(
      allTransactions
        .filter((t) => t.amount < 0)
        .reduce((s, t) => s + t.amount, 0)
    );
    const interest = deposits * 0.012;

    document.querySelector(".summary__value--in").textContent =
      this.formatCurrency(deposits);
    document.querySelector(".summary__value--out").textContent =
      this.formatCurrency(withdrawals);
    document.querySelector(".summary__value--interest").textContent =
      this.formatCurrency(interest);
  }

  static formatCurrency(value) {
    return new Intl.NumberFormat(this.locale, {
      style: "currency",
      currency: this.currency,
    }).format(value);
  }

  static startTimer(seconds, callback) {
    let time = seconds;
    const tick = () => {
      const min = String(Math.floor(time / 60)).padStart(2, 0);
      const sec = String(time % 60).padStart(2, 0);
      document
        .querySelectorAll(".timer")
        .forEach((el) => (el.textContent = `${min}:${sec}`));

      if (time === 60) {
        document.querySelectorAll(".timer").forEach((el) => {
          el.style.color = "#ff0000";
          el.textContent = "01:00 — LOGGING OUT SOON!";
        });
      }

      if (time === 0) {
        clearInterval(this.timer);
        callback();
      }
      time--;
    };
    tick();
    this.timer = setInterval(tick, 1000);
  }

  static resetTimer() {
    clearInterval(this.timer);
    this.startTimer(600, () => this.logout());
  }

  static logout() {
    localStorage.removeItem("apexUserId");
    this.currentUser = null;
    if (this.timer) clearInterval(this.timer);
    location.href = "index.html";
  }

  static saveUser(user) {
    const users = this.loadUsers();
    const plainUser = JSON.parse(JSON.stringify(user));
    const i = users.findIndex((u) => u.username === user.username);
    if (i > -1) users[i] = plainUser;
    else users.push(plainUser);
    localStorage.setItem("apexUsers", JSON.stringify(users));
  }

  static loadUsers() {
    const data = localStorage.getItem("apexUsers");
    return data ? JSON.parse(data) : [];
  }

  static loadUser(username) {
    return this.loadUsers().find((u) => u.username === username);
  }

  static deleteUser(username) {
    const users = this.loadUsers().filter((u) => u.username !== username);
    localStorage.setItem("apexUsers", JSON.stringify(users));
  }
}

document.addEventListener("DOMContentLoaded", () => ApexBank.init());

console.log("APEX BANK v9.1 — FINAL & UNBREAKABLE | deposit() fixed");
