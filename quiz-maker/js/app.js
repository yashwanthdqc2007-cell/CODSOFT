// Global App State
window.AppState = {
  currentUser: null,
  quizzes: [],
  users: [],
  attempts: [],
  isLoaded: false
};

// LocalStorage Keys
const KEYS = {
  THEME: 'quiz-maker-theme',
  CURRENT_USER: 'quiz-maker-current-user',
  USERS: 'quiz-maker-users',
  QUIZZES: 'quiz-maker-quizzes',
  ATTEMPTS: 'quiz-maker-attempts'
};

// Initialize Application State
async function initApp() {
  // 1. Theme Initialization
  const savedTheme = localStorage.getItem(KEYS.THEME) || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // 2. Load Users
  const savedUsers = localStorage.getItem(KEYS.USERS);
  window.AppState.users = savedUsers ? JSON.parse(savedUsers) : [];

  // 3. Load Current User Session
  const savedUser = localStorage.getItem(KEYS.CURRENT_USER);
  window.AppState.currentUser = savedUser ? JSON.parse(savedUser) : null;

  // 4. Load Attempts History
  const savedAttempts = localStorage.getItem(KEYS.ATTEMPTS);
  window.AppState.attempts = savedAttempts ? JSON.parse(savedAttempts) : [];

  // 5. Load Quizzes (with Seed fallback)
  const savedQuizzes = localStorage.getItem(KEYS.QUIZZES);
  if (savedQuizzes) {
    window.AppState.quizzes = JSON.parse(savedQuizzes);
    window.AppState.isLoaded = true;
    document.dispatchEvent(new CustomEvent('appDataLoaded'));
  } else {
    try {
      const response = await fetch('data/quizzes.json');
      if (!response.ok) throw new Error('Failed to load JSON');
      const data = await response.json();
      window.AppState.quizzes = data;
      localStorage.setItem(KEYS.QUIZZES, JSON.stringify(data));
    } catch (error) {
      console.warn('CORS / Fetch issue detected. Loading built-in seed quizzes...', error);
      // Hard fallback with 3 of the quizzes to make sure the app works without any server
      window.AppState.quizzes = [
        {
          "id": "quiz-1",
          "creatorId": "admin",
          "creatorName": "CareerGo Team",
          "title": "General Knowledge Challenge",
          "description": "Test your knowledge across a wide variety of topics including geography, literature, science, and world trivia. A perfect starting point for trivia lovers!",
          "category": "General",
          "difficulty": "Medium",
          "thumbnailEmoji": "🧠",
          "thumbnailColor": "#3b82f6",
          "timeLimit": 30,
          "playsCount": 345,
          "averageScore": 3.8,
          "dateCreated": "2026-06-01T08:00:00.000Z",
          "featured": true,
          "questions": [
            {
              "id": "q1-1",
              "text": "Which country is home to the Great Barrier Reef?",
              "options": ["Indonesia", "Australia", "New Zealand", "South Africa"],
              "correctOption": "B",
              "explanation": "The Great Barrier Reef is the world's largest coral reef system, located in the Coral Sea, off the coast of Queensland, Australia."
            },
            {
              "id": "q1-2",
              "text": "Who wrote the famous play 'Romeo and Juliet'?",
              "options": ["Geoffrey Chaucer", "Charles Dickens", "William Shakespeare", "Jane Austen"],
              "correctOption": "C",
              "explanation": "Romeo and Juliet is a tragedy written by William Shakespeare early in his career, about two young Italian star-crossed lovers."
            },
            {
              "id": "q1-3",
              "text": "What is the capital city of Japan?",
              "options": ["Kyoto", "Osaka", "Hiroshima", "Tokyo"],
              "correctOption": "D",
              "explanation": "Tokyo is the capital and most populous city of Japan, serving as the country's economic and cultural hub."
            }
          ]
        },
        {
          "id": "quiz-2",
          "creatorId": "admin",
          "creatorName": "CareerGo Team",
          "title": "Web Development Basics",
          "description": "Assess your basic understanding of frontend web development. Includes questions on HTML structure, CSS styling rules, and basic JavaScript triggers.",
          "category": "Tech",
          "difficulty": "Easy",
          "thumbnailEmoji": "💻",
          "thumbnailColor": "#7c3aed",
          "timeLimit": 15,
          "playsCount": 421,
          "averageScore": 4.2,
          "dateCreated": "2026-06-03T10:00:00.000Z",
          "featured": true,
          "questions": [
            {
              "id": "q2-1",
              "text": "What does HTML stand for?",
              "options": [
                "Hyper Text Markup Language",
                "Home Tool Markup Language",
                "Hyperlinks and Text Markup Language",
                "Hyper Text Makeup Language"
              ],
              "correctOption": "A",
              "explanation": "HTML stands for Hyper Text Markup Language. It is the standard markup language for creating web pages."
            },
            {
              "id": "q2-2",
              "text": "Which HTML element is used to insert a line break?",
              "options": ["<lb>", "<br>", "<break>", "<newline>"],
              "correctOption": "B",
              "explanation": "The <br> tag is an empty element, which means that it has no end tag. It inserts a single line break."
            },
            {
              "id": "q2-3",
              "text": "What does CSS stand for?",
              "options": [
                "Computer Style Sheets",
                "Colorful Style Sheets",
                "Cascading Style Sheets",
                "Creative Style Sheets"
              ],
              "correctOption": "C",
              "explanation": "CSS stands for Cascading Style Sheets. It describes how HTML elements are to be displayed on screen, paper, or in other media."
            }
          ]
        }
      ];
      localStorage.setItem(KEYS.QUIZZES, JSON.stringify(window.AppState.quizzes));
    } finally {
      window.AppState.isLoaded = true;
      document.dispatchEvent(new CustomEvent('appDataLoaded'));
    }
  }

  // 6. Setup Common Page Logic (Header, Mobile Menu, Theme Toggle)
  setupHeader();
  setupThemeToggle();
}

// Toast Notification System
window.showToast = function(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = '🔔';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';
  if (type === 'warning') icon = '⚠️';

  toast.innerHTML = `
    <span>${icon}</span>
    <div>${message}</div>
    <span class="toast-close">&times;</span>
  `;

  container.appendChild(toast);

  const closeToast = () => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => {
      toast.remove();
      if (container.children.length === 0) {
        container.remove();
      }
    });
  };

  toast.querySelector('.toast-close').addEventListener('click', closeToast);
  setTimeout(closeToast, 4000);
};

// Setup Header Elements & Dropdowns
function setupHeader() {
  const navActions = document.getElementById('nav-actions');
  const mobileNavToggle = document.getElementById('mobile-nav-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (mobileNavToggle && navMenu) {
    mobileNavToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      mobileNavToggle.textContent = navMenu.classList.contains('active') ? '✕' : '☰';
    });
  }

  if (!navActions) return;

  const user = window.AppState.currentUser;
  if (user) {
    // Render logged-in state (user bubble and options dropdown)
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    navActions.innerHTML = `
      <button class="btn-icon" id="theme-toggle" title="Toggle Theme">🌓</button>
      <div class="nav-user-dropdown" id="user-dropdown">
        <div class="nav-avatar-bubble" style="background-color: ${user.avatarColor || '#7c3aed'}">
          ${initials}
        </div>
        <div class="dropdown-menu">
          <div style="padding: 10px 16px; font-weight: 700; font-size: 0.85rem; border-bottom: 1px solid var(--border)">
            Hi, ${user.name}
          </div>
          <a href="dashboard.html" class="dropdown-item">👤 Dashboard</a>
          <a href="create.html" class="dropdown-item">➕ Create Quiz</a>
          <div class="dropdown-divider"></div>
          <a href="#" class="dropdown-item" id="logout-btn" style="color: var(--danger)">🚪 Sign Out</a>
        </div>
      </div>
    `;

    // Dropdown toggle logic
    const dropdown = document.getElementById('user-dropdown');
    dropdown.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('active');
    });

    document.addEventListener('click', () => {
      dropdown.classList.remove('active');
    });

    // Logout trigger
    document.getElementById('logout-btn').addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem(KEYS.CURRENT_USER);
      window.AppState.currentUser = null;
      window.showToast('Successfully logged out!', 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
    });
  } else {
    // Render logged-out actions
    navActions.innerHTML = `
      <button class="btn-icon" id="theme-toggle" title="Toggle Theme">🌓</button>
      <a href="login.html" class="btn btn-secondary btn-sm">Sign In</a>
      <a href="register.html" class="btn btn-primary btn-sm">Sign Up</a>
    `;
  }
}

// Setup Theme Toggle Trigger
function setupThemeToggle() {
  document.body.addEventListener('click', (e) => {
    if (e.target.id === 'theme-toggle') {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem(KEYS.THEME, newTheme);
      window.showToast(`Switched to ${newTheme} theme`, 'info');
    }
  });
}

// Global API Helper for Saving Quizzes
window.saveQuiz = function(quiz) {
  window.AppState.quizzes.push(quiz);
  localStorage.setItem(KEYS.QUIZZES, JSON.stringify(window.AppState.quizzes));
};

// Global API Helper for Saving Attempts
window.saveAttempt = function(attempt) {
  window.AppState.attempts.push(attempt);
  localStorage.setItem(KEYS.ATTEMPTS, JSON.stringify(window.AppState.attempts));
};

// Start application loading
document.addEventListener('DOMContentLoaded', initApp);
