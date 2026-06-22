// --- GLOBAL STATE & CONFIGURATION ---
const APP_CONFIG = {
  themeKey: 'job-board-theme',
  userKey: 'job-board-current-user',
  jobsKey: 'job-board-jobs',
  usersListKey: 'job-board-users',
  applicationsKey: 'job-board-applications',
  bookmarksKey: 'job-board-bookmarks',
  notificationsKey: 'job-board-notifications'
};

// Global State Object
window.AppState = {
  currentUser: null,
  jobs: [],
  users: [],
  applications: [],
  bookmarks: [],
  notifications: []
};

// --- INIT APP ---
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  await initData();
  renderHeader();
  initMobileMenu();
  setupFooterNewsletter();
});

// --- THEME MANAGEMENT (LIGHT/DARK) ---
function initTheme() {
  const savedTheme = localStorage.getItem(APP_CONFIG.themeKey);
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem(APP_CONFIG.themeKey, newTheme);
  
  // Update theme icons if they exist in the header
  updateThemeIcon(newTheme);
  showToast(`Switched to ${newTheme} mode!`, 'info');
}

function updateThemeIcon(theme) {
  const themeIcon = document.querySelector('.theme-toggle i');
  if (themeIcon) {
    if (theme === 'dark') {
      themeIcon.className = 'fas fa-sun';
    } else {
      themeIcon.className = 'fas fa-moon';
    }
  }
}

// --- DATA PERSISTENCE & INITIAL SEED ---
async function initData() {
  // 1. Get current logged in user
  try {
    window.AppState.currentUser = JSON.parse(localStorage.getItem(APP_CONFIG.userKey)) || null;
  } catch (e) {
    window.AppState.currentUser = null;
  }

  // 2. Fetch/Load jobs
  let localJobs = localStorage.getItem(APP_CONFIG.jobsKey);
  let needsSeed = false;
  if (localJobs) {
    try {
      const parsedJobs = JSON.parse(localJobs);
      if (parsedJobs.length < 15) {
        needsSeed = true;
      } else {
        window.AppState.jobs = parsedJobs;
      }
    } catch (e) {
      needsSeed = true;
    }
  } else {
    needsSeed = true;
  }

  if (needsSeed) {
    try {
      const response = await fetch('./data/jobs.json');
      const seedJobs = await response.json();
      localStorage.setItem(APP_CONFIG.jobsKey, JSON.stringify(seedJobs));
      window.AppState.jobs = seedJobs;
    } catch (e) {
      console.error('Failed to load seed jobs data:', e);
      window.AppState.jobs = [];
    }
  }

  // 3. Load other models
  window.AppState.users = JSON.parse(localStorage.getItem(APP_CONFIG.usersListKey)) || [];
  window.AppState.applications = JSON.parse(localStorage.getItem(APP_CONFIG.applicationsKey)) || [];
  window.AppState.bookmarks = JSON.parse(localStorage.getItem(APP_CONFIG.bookmarksKey)) || [];
  window.AppState.notifications = JSON.parse(localStorage.getItem(APP_CONFIG.notificationsKey)) || [];

  // Seed standard employer demo accounts if they don't exist
  if (window.AppState.users.length === 0) {
    const demoUsers = [
      {
        id: "emp-demo",
        email: "employer@demo.com",
        passwordHash: "demo123",
        role: "employer",
        profile: {
          name: "HR Lead",
          companyName: "TechVibe Systems",
          logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop&q=80",
          bio: "Innovating frontend and cloud computing spaces.",
          location: "San Francisco, CA",
          website: "https://techvibe.com"
        }
      },
      {
        id: "cand-demo",
        email: "candidate@demo.com",
        passwordHash: "demo123",
        role: "candidate",
        profile: {
          name: "Alex Johnson",
          title: "Full Stack Developer",
          logo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80",
          bio: "Enthusiastic JavaScript software engineer with 3 years experience building responsive applications.",
          location: "Austin, TX",
          skills: ["React", "Node.js", "JavaScript", "CSS Grid", "SQL"],
          resumeName: "alex_johnson_cv.pdf",
          experience: "Frontend Dev at LaunchPad (2024 - Present)\nJunior Engineer at PixelCraft (2023 - 2024)",
          education: "B.S. in Computer Science - UT Austin"
        }
      }
    ];
    localStorage.setItem(APP_CONFIG.usersListKey, JSON.stringify(demoUsers));
    window.AppState.users = demoUsers;
  }
  
  // Flag and dispatch event that data has loaded
  window.AppState.isLoaded = true;
  document.dispatchEvent(new CustomEvent('appDataLoaded'));
}

// Save specific model back to localStorage
function saveAppState(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// --- TOAST NOTIFICATIONS ---
function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let iconClass = 'fa-check-circle';
  if (type === 'error') iconClass = 'fa-times-circle';
  if (type === 'info') iconClass = 'fa-info-circle';
  if (type === 'warning') iconClass = 'fa-exclamation-triangle';

  toast.innerHTML = `
    <i class="fas ${iconClass}"></i>
    <span class="toast-message">${message}</span>
    <i class="fas fa-times toast-close"></i>
  `;

  container.appendChild(toast);

  // Close toast on click
  toast.querySelector('.toast-close').addEventListener('click', () => {
    dismissToast(toast);
  });

  // Auto dismiss after 4 seconds
  setTimeout(() => {
    dismissToast(toast);
  }, 4000);
}

function dismissToast(toast) {
  toast.classList.add('fade-out');
  toast.addEventListener('animationend', () => {
    toast.remove();
    // remove container if empty
    const container = document.querySelector('.toast-container');
    if (container && container.children.length === 0) {
      container.remove();
    }
  });
}

// --- DYNAMIC HEADER / NAVIGATION ---
function renderHeader() {
  const navContainer = document.querySelector('.nav-container');
  if (!navContainer) return;

  const user = window.AppState.currentUser;
  const currentPath = window.location.pathname;
  
  // Resolve base page path
  const isIndex = currentPath.endsWith('/') || currentPath.endsWith('index.html');
  const isJobs = currentPath.endsWith('jobs.html');
  const isDetails = currentPath.endsWith('job-details.html');
  
  // Build navigation items
  let navMenuHtml = `
    <a href="index.html" class="nav-link ${isIndex ? 'active' : ''}">Home</a>
    <a href="jobs.html" class="nav-link ${isJobs ? 'active' : ''}">Browse Jobs</a>
  `;

  let actionHtml = '';

  if (user) {
    // Menu based on role
    if (user.role === 'candidate') {
      navMenuHtml += `
        <a href="candidate-dashboard.html" class="nav-link ${currentPath.endsWith('candidate-dashboard.html') ? 'active' : ''}">Dashboard</a>
      `;
      actionHtml = `
        <span class="text-muted font-semibold align-center flex gap-1" style="font-size: 0.9rem;">
          <img src="${user.profile.logo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60&fit=crop&q=80'}" 
               style="width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--border);" alt="">
          Hi, ${user.profile.name.split(' ')[0]}
        </span>
        <button onclick="handleLogout()" class="btn btn-secondary btn-sm">Log Out</button>
      `;
    } else {
      navMenuHtml += `
        <a href="employer-dashboard.html" class="nav-link ${currentPath.endsWith('employer-dashboard.html') ? 'active' : ''}">Employer Admin</a>
      `;
      actionHtml = `
        <a href="employer-dashboard.html?tab=post-job" class="btn btn-primary btn-sm"><i class="fas fa-plus"></i> Post Job</a>
        <button onclick="handleLogout()" class="btn btn-secondary btn-sm">Log Out</button>
      `;
    }
  } else {
    // Guest
    actionHtml = `
      <a href="login.html?action=post" class="btn btn-primary btn-sm">Post a Job</a>
      <a href="login.html" class="btn btn-secondary btn-sm">Sign In</a>
    `;
  }

  // Get current theme state for icons
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const themeIconClass = isDark ? 'fas fa-sun' : 'fas fa-moon';

  // Construct complete navbar inner HTML
  navContainer.innerHTML = `
    <a href="index.html" class="logo-wrapper">
      <div class="logo-icon">
        <i class="fas fa-briefcase"></i>
      </div>
      <span>CareerGo</span>
    </a>
    
    <nav class="nav-menu">
      ${navMenuHtml}
      <div class="nav-actions mobile-visible" style="display: none; flex-direction: column; width: 100%; gap: 12px; margin-top: 16px;">
        ${actionHtml}
      </div>
    </nav>

    <div class="nav-actions">
      <button onclick="toggleTheme()" class="btn-icon theme-toggle" title="Toggle Light/Dark Theme">
        <i class="${themeIconClass}"></i>
      </button>
      ${actionHtml}
      <button class="mobile-nav-toggle btn-icon">
        <i class="fas fa-bars"></i>
      </button>
    </div>
  `;
}

// --- MOBILE MENU DRAWER ---
function initMobileMenu() {
  document.addEventListener('click', (e) => {
    const toggleBtn = e.target.closest('.mobile-nav-toggle');
    const menu = document.querySelector('.nav-menu');
    const toggleIcon = document.querySelector('.mobile-nav-toggle i');

    if (toggleBtn && menu) {
      menu.classList.toggle('active');
      if (menu.classList.contains('active')) {
        toggleIcon.className = 'fas fa-times';
        // Display actions drawer in mobile
        const mobActions = menu.querySelector('.mobile-visible');
        if (mobActions) mobActions.style.display = 'flex';
      } else {
        toggleIcon.className = 'fas fa-bars';
      }
    }
  });
}

// --- MOCK NOTIFICATION SYSTEM ---
function sendSimulatedNotification(userId, title, body) {
  const notifs = JSON.parse(localStorage.getItem(APP_CONFIG.notificationsKey)) || [];
  const newNotif = {
    id: 'notif-' + Date.now(),
    userId: userId,
    title: title,
    body: body,
    date: new Date().toISOString(),
    read: false
  };
  
  notifs.push(newNotif);
  localStorage.setItem(APP_CONFIG.notificationsKey, JSON.stringify(notifs));
  window.AppState.notifications = notifs;

  // If the user matches the currently logged in user, show toast
  if (window.AppState.currentUser && window.AppState.currentUser.id === userId) {
    showToast(`📧 Notification: ${title}`, 'info');
  }
}

// --- LOG OUT ACTION ---
function handleLogout() {
  localStorage.removeItem(APP_CONFIG.userKey);
  window.AppState.currentUser = null;
  showToast("Logged out successfully", "success");
  
  // Refresh or redirect to home page
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1000);
}

// --- FOOTER NEWSLETTER SIMULATOR ---
function setupFooterNewsletter() {
  document.addEventListener('submit', (e) => {
    const form = e.target.closest('.newsletter-form');
    if (form) {
      e.preventDefault();
      const input = form.querySelector('.newsletter-input');
      if (input && input.value.trim()) {
        showToast(`Thank you! Subscribed ${input.value} to newsletter.`, 'success');
        input.value = '';
      }
    }
  });
}
