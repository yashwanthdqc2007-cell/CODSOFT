// Auth Logic Controller
document.addEventListener('DOMContentLoaded', () => {
  // Wait until AppState finishes loading
  if (window.AppState.isLoaded) {
    initAuth();
  } else {
    document.addEventListener('appDataLoaded', initAuth);
  }
});

function initAuth() {
  // Pre-seed a demo account if no users exist
  if (window.AppState.users.length === 0) {
    const demoUser = {
      id: 'user-demo',
      name: 'Demo Candidate',
      email: 'demo@careergo.com',
      passwordHash: 'password123', // Client-side direct matching for simplicity
      avatarColor: '#10b981',
      dateJoined: new Date().toISOString()
    };
    window.AppState.users.push(demoUser);
    localStorage.setItem('quiz-maker-users', JSON.stringify(window.AppState.users));
  }

  // Determine which page we are on
  const registerForm = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');

  if (registerForm) {
    setupRegistration(registerForm);
  } else if (loginForm) {
    setupLogin(loginForm);
  }
}

// 1. Registration Flow
function setupRegistration(form) {
  const nameInput = document.getElementById('reg-name');
  const emailInput = document.getElementById('reg-email');
  const passwordInput = document.getElementById('reg-password');
  const confirmPasswordInput = document.getElementById('reg-confirm-password');
  const avatarColorInput = document.getElementById('reg-avatar-color');
  
  // Avatar Color Picker Bubble selectors
  const bubbles = document.querySelectorAll('.avatar-color-bubble');
  bubbles.forEach(bubble => {
    bubble.addEventListener('click', () => {
      bubbles.forEach(b => b.classList.remove('selected'));
      bubble.classList.add('selected');
      const selectedColor = bubble.getAttribute('data-color');
      avatarColorInput.value = selectedColor;
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const avatarColor = avatarColorInput.value || '#7c3aed';

    // Validation checks
    if (!name || !email || !password || !confirmPassword) {
      window.showToast('Please fill out all fields.', 'error');
      return;
    }

    if (password.length < 6) {
      window.showToast('Password must be at least 6 characters long.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      window.showToast('Passwords do not match.', 'error');
      return;
    }

    // Email Uniqueness
    const emailExists = window.AppState.users.some(u => u.email === email);
    if (emailExists) {
      window.showToast('An account with this email already exists.', 'error');
      return;
    }

    // Create User Object
    const newUser = {
      id: 'user-' + Date.now(),
      name: name,
      email: email,
      passwordHash: password, // client side mock
      avatarColor: avatarColor,
      dateJoined: new Date().toISOString()
    };

    window.AppState.users.push(newUser);
    localStorage.setItem('quiz-maker-users', JSON.stringify(window.AppState.users));
    localStorage.setItem('quiz-maker-current-user', JSON.stringify(newUser));
    window.AppState.currentUser = newUser;

    window.showToast('Registration successful! Welcome.', 'success');
    
    // Redirect to Dashboard
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1200);
  });
}

// 2. Login Flow
function setupLogin(form) {
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const rememberCheckbox = document.getElementById('login-remember');

  // Autofill remembered email if present
  const rememberedEmail = localStorage.getItem('quiz-maker-remembered-email');
  if (rememberedEmail && emailInput) {
    emailInput.value = rememberedEmail;
    if (rememberCheckbox) rememberCheckbox.checked = true;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (!email || !password) {
      window.showToast('Please fill out all fields.', 'error');
      return;
    }

    // Find User
    const user = window.AppState.users.find(u => u.email === email);

    if (!user || user.passwordHash !== password) {
      window.showToast('Invalid email or password.', 'error');
      return;
    }

    // Success Authentication
    localStorage.setItem('quiz-maker-current-user', JSON.stringify(user));
    window.AppState.currentUser = user;

    // Remember email logic
    if (rememberCheckbox && rememberCheckbox.checked) {
      localStorage.setItem('quiz-maker-remembered-email', email);
    } else {
      localStorage.removeItem('quiz-maker-remembered-email');
    }

    window.showToast(`Welcome back, ${user.name}!`, 'success');

    // Redirect to Dashboard
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1200);
  });
}
