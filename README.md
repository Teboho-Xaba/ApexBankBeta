# ApexBankBeta

**Fast,Simple & Convenient Banking**
A luxury, fully functional digital banking app built with pure vanilla HTML, CSS and Javascript

Live Demo -> [https://teboho-xaba.github.io/ApexBankBeta]

### Features That Make It Real Banking

## Each feature and associated description

**Permanent 4-Digit PIN** - Generated once at signup — shown only once — **never recoverable** (real private banking style)
**R50 Welcome Bonus** - Instant R50 credited to both Cheque & Savings accounts on signup
**Unified Transactions** - One dropdown: Deposit • Withdraw • Transfer
**Dynamic Recipient Field** - Appears only when "Transfer" is selected  
**PIN Required Every Action** - Deposit, withdraw, transfer, loan — **all need PIN confirmation**
**Instant Loan System** - Auto-approved if you have deposit history ≥ 10% of loan amount  
**10-Minute Auto Logout**- With 1-minute red warning — military-grade session security  
**100% Accurate Accounting** - Balance = Deposits + Incoming − Withdrawals − Outgoing
**ZAR Currency Formatting** - Proper South African Rand (R1 234,56) using `Intl.NumberFormat('en-ZA')`
**Fully Responsive** - Looks stunning on mobile, tablet, and desktop — single column under 968px
**Pure Offline-Capable** - Runs completely in browser using `localStorage` — no backend used.
**Account Deletion** - Close account permanently with username + PIN confirmation

## Tech Stack

**HTML5**
**CSS3**
**Vanilla Javascript** — OOP with classes, prototypes, `localStorage`, `Intl`

---

### How to Run

1. Clone or download the repo
2. Open `index.html` in your browser
3. Click "Sign up here" if you're a new user
4. Create your account → **write down your PIN** (shown only once!)
5. Login with username + PIN

---

### Security Notes (This Is Serious)

- PIN is **never stored in plain text** — it stays in the object only in memory
- After page refresh/login, user is reconstructed securely using `Object.setPrototypeOf`
- All methods (`deposit`, `withdraw`, `authenticate`) are restored properly
- Session ends after 10 minutes

---

### Why This Project Stands Out

Most "bank apps" are just UI mockups.  
**Apex Bank is a fully working banking system** — accurate and secure.

Apex Bank is inspired by Jonas Schmedtmann's tutorial project of a Bankist Banking App.

---

### Future Ideas (For when I Level Up)

- [ ] Use a backend server (firebase/supabase in mind)

---

### Made with Blood, Sweat & Gold

Built by a proud developer who believes:

> "If you're going to build a bank, build it to the best of your abilities."

---
