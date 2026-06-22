// --- AUTH CONTROLLER ---

document.addEventListener('DOMContentLoaded', () => {
  setupRegistrationForm();
  setupLoginForm();
  setupDemoLogins();
});

// --- REGISTRATION PROCESS ---
function setupRegistrationForm() {
  const regForm = document.getElementById('registerForm');
  if (!regForm) return;

  // Handle Role Toggle Selection
  const roleButtons = document.querySelectorAll('.role-toggle-btn');
  const roleInput = document.getElementById('userRole');

  roleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      roleButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      roleInput.value = btn.dataset.role;

      // Update placeholders or dynamic fields if needed
      const nameLabel = document.querySelector('label[for="registerName"]');
      if (btn.dataset.role === 'employer') {
        nameLabel.textContent = 'Company Name';
      } else {
        nameLabel.textContent = 'Full Name';
      }
    });
  });

  regForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const role = roleInput.value;
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const termsChecked = document.getElementById('registerTerms').checked;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      showToast('Please fill in all fields.', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    if (!termsChecked) {
      showToast('You must accept the terms & conditions.', 'warning');
      return;
    }

    // Check if user email already exists
    const users = JSON.parse(localStorage.getItem('job-board-users')) || [];
    const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (emailExists) {
      showToast('A user with this email already exists.', 'error');
      return;
    }

    // Create profile defaults based on role
    const newUser = {
      id: (role === 'employer' ? 'emp-' : 'cand-') + Date.now(),
      email: email,
      passwordHash: password, // Simulated plain password hash
      role: role,
      profile: {
        name: name,
        logo: role === 'employer' 
          ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop&q=80' // default abstract company logo
          : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&q=80', // default candidate avatar
        location: '',
        bio: ''
      }
    };

    if (role === 'employer') {
      newUser.profile.companyName = name;
      newUser.profile.website = '';
    } else {
      newUser.profile.title = '';
      newUser.profile.skills = [];
      newUser.profile.resumeName = '';
      newUser.profile.education = '';
      newUser.profile.experience = '';
    }

    // Save user
    users.push(newUser);
    localStorage.setItem('job-board-users', JSON.stringify(users));

    // Log user in directly
    localStorage.setItem('job-board-current-user', JSON.stringify(newUser));

    showToast('Registration successful! Redirecting...', 'success');

    // Redirect to dashboard
    setTimeout(() => {
      if (role === 'employer') {
        window.location.href = 'employer-dashboard.html';
      } else {
        window.location.href = 'candidate-dashboard.html';
      }
    }, 1500);
  });
}

// --- LOGIN PROCESS ---
function setupLoginForm() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
      showToast('Please enter both email and password.', 'error');
      return;
    }

    const users = JSON.parse(localStorage.getItem('job-board-users')) || [];
    const matchedUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === password);

    if (!matchedUser) {
      showToast('Invalid email or password.', 'error');
      return;
    }

    // Login successful
    localStorage.setItem('job-board-current-user', JSON.stringify(matchedUser));
    showToast(`Welcome back, ${matchedUser.profile.name}!`, 'success');

    setTimeout(() => {
      if (matchedUser.role === 'employer') {
        window.location.href = 'employer-dashboard.html';
      } else {
        window.location.href = 'candidate-dashboard.html';
      }
    }, 1500);
  });
}

// --- DEMO MOCK LOGINS CONFIG ---
function setupDemoLogins() {
  const demoCandidateBtn = document.getElementById('demoCandidateLogin');
  const demoEmployerBtn = document.getElementById('demoEmployerLogin');

  if (demoCandidateBtn) {
    demoCandidateBtn.addEventListener('click', () => {
      document.getElementById('loginEmail').value = 'candidate@demo.com';
      document.getElementById('loginPassword').value = 'demo123';
      showToast('Candidate credentials prefilled! Click Login or wait.', 'info');
      
      // Auto-trigger submit after brief delay
      setTimeout(() => {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.requestSubmit();
      }, 800);
    });
  }

  if (demoEmployerBtn) {
    demoEmployerBtn.addEventListener('click', () => {
      document.getElementById('loginEmail').value = 'employer@demo.com';
      document.getElementById('loginPassword').value = 'demo123';
      showToast('Employer credentials prefilled! Click Login or wait.', 'info');
      
      // Auto-trigger submit after brief delay
      setTimeout(() => {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.requestSubmit();
      }, 800);
    });
  }
}
