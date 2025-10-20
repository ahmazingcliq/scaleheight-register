// === CONFIGURATION ===
const webAppUrl = "https://script.google.com/macros/s/AKfycbxi4ixomXSmEGQFeix3vjJHNwkl-ZMMib5T77y0A9QtcLw2-5l1VPWZknrcFJX1tt90Zw/exec";
const dashboardUrl = "https://sites.google.com/view/scaleheight/dashboard";

// === ELEMENT REFERENCES ===
const step1 = document.getElementById('signupStep1');
const step2 = document.getElementById('signupStep2');
const continueBtn = document.getElementById('continueBtn');
const backBtn = document.getElementById('backBtn');
const submitBtn = document.getElementById('submitBtn');
const packageCard = document.getElementById('packageCard');
const popupOverlay = document.getElementById('popup-overlay');
const closePopupBtn = document.getElementById('closePopupBtn');

// Step 1 Fields
const first = document.getElementById('firstName');
const last = document.getElementById('lastName');
const phone = document.getElementById('phone');
const email = document.getElementById('email');

// Step 2 Fields
const password = document.getElementById('password');
const confirmPassword = document.getElementById('confirmPassword');
const coupon = document.getElementById('coupon');

// === VALIDATION HELPERS ===
const showErr = (id, msg) => {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.style.display = msg ? 'block' : 'none';
};

const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const validPhone = (v) => v.replace(/\s+/g, '').length >= 8;

// === COPY FUNCTION ===
function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('Copied: ' + text);
  }).catch(err => {
    console.error('Could not copy text: ', err);
    alert('Failed to copy. Please manually select the text.');
  });
}

// === POPUP ===
function showPopup() {
  popupOverlay.style.display = 'flex';
  setTimeout(() => popupOverlay.style.opacity = '1', 10);
}

function closePopup() {
  popupOverlay.style.opacity = '0';
  setTimeout(() => popupOverlay.style.display = 'none', 300);
}

// === STEP NAVIGATION ===
backBtn.addEventListener('click', () => {
  step2.style.display = 'none';
  step1.style.display = 'block';
});

continueBtn.addEventListener('click', () => {
  // Clear old errors
  showErr('errFirst', '');
  showErr('errLast', '');
  showErr('errPhone', '');
  showErr('errEmail', '');

  const vFirst = first.value.trim();
  const vLast = last.value.trim();
  const vPhone = phone.value.trim();
  const vEmail = email.value.trim().toLowerCase();

  let ok = true;
  if (!vFirst) { showErr('errFirst', 'First name is required'); ok = false; }
  if (!vLast) { showErr('errLast', 'Last name is required'); ok = false; }
  if (!vPhone || !validPhone(vPhone)) { showErr('errPhone', 'Enter a valid phone number'); ok = false; }
  if (!vEmail || !validEmail(vEmail)) { showErr('errEmail', 'Enter a valid email address'); ok = false; }

  if (!ok) return;

  // Move to Step 2
  step1.style.display = 'none';
  step2.style.display = 'block';

  // Save data
  const payload = { firstName: vFirst, lastName: vLast, phone: vPhone, email: vEmail };
  localStorage.setItem('scaleheight_signup_step1', JSON.stringify(payload));
});

// === FINAL SUBMISSION ===
submitBtn.addEventListener('click', async () => {
  showErr('errPassword', '');
  showErr('errConfirmPassword', '');

  const vPassword = password.value.trim();
  const vConfirmPassword = confirmPassword.value.trim();
  const vCoupon = coupon.value.trim();

  let ok = true;
  if (vPassword.length < 6) { showErr('errPassword', 'Password must be at least 6 characters.'); ok = false; }
  if (vPassword !== vConfirmPassword) { showErr('errConfirmPassword', 'Passwords do not match.'); ok = false; }
  if (vCoupon.length === 0) { alert("Please enter the coupon code you were given."); return; }

  if (!ok) return;

  let userData = {};
  try {
    const step1Data = localStorage.getItem('scaleheight_signup_step1');
    if (step1Data) userData = JSON.parse(step1Data);
    userData.password = vPassword;
    userData.couponCode = vCoupon;
  } catch (err) {
    alert('Error: Could not retrieve form data. Please refresh and try again.');
    return;
  }

  submitBtn.innerText = "Verifying...";
  submitBtn.disabled = true;

  try {
    // Step 1: Validate Coupon
    const validate = await fetch(webAppUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: 'VALIDATE_COUPON', couponCode: vCoupon })
    });
    const res1 = await validate.json();

    if (res1.status === "error") {
      alert("❌ Invalid Coupon: " + res1.message);
      return;
    }

    // Step 2: Register User
    userData.action = 'REGISTER_USER';
    const register = await fetch(webAppUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    });
    const res2 = await register.json();

    if (res2.status === "success") {
      alert("✅ Registration Successful! Redirecting...");
      localStorage.removeItem('scaleheight_signup_step1');
      window.top.location.href = dashboardUrl;
    } else {
      alert("❌ Registration Failed: " + (res2.message || "Server error."));
    }

  } catch (err) {
    alert("⚠️ Connection error. Please check your internet.");
    console.error(err);
  } finally {
    submitBtn.innerText = "Submit";
    submitBtn.disabled = false;
  }
});

// === POPUP EVENTS ===
packageCard.addEventListener('click', showPopup);
closePopupBtn.addEventListener('click', closePopup);
popupOverlay.addEventListener('click', (e) => {
  if (e.target === popupOverlay) closePopup();
});
popupOverlay.style.opacity = '0';
