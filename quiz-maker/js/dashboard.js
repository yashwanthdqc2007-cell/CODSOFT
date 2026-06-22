// Dashboard and Creator Wizard Controller
document.addEventListener('DOMContentLoaded', () => {
  if (window.AppState.isLoaded) {
    initDashboard();
  } else {
    document.addEventListener('appDataLoaded', initDashboard);
  }
});

function initDashboard() {
  const user = window.AppState.currentUser;
  
  // Guard clause: requires user session
  const requiresAuth = document.body.classList.contains('auth-required');
  if (requiresAuth && !user) {
    window.showToast('Please sign in to access this page.', 'warning');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1000);
    return;
  }

  // Determine if we are on Dashboard page or Creator page
  const dashboardLayout = document.getElementById('dashboard-layout-container');
  const creatorWizard = document.getElementById('creator-wizard-container');

  if (dashboardLayout && user) {
    setupDashboardView(user);
  } else if (creatorWizard && user) {
    setupCreatorWizard(user);
  }
}

// ==========================================
// 1. DASHBOARD VIEW CONTROLLER
// ==========================================
function setupDashboardView(user) {
  // Render user info in profile card
  const avatarInitials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  const profileAvatar = document.getElementById('profile-avatar');
  const profileName = document.getElementById('profile-name');
  const profileJoined = document.getElementById('profile-joined');

  if (profileAvatar) {
    profileAvatar.textContent = avatarInitials;
    profileAvatar.style.backgroundColor = user.avatarColor || '#7c3aed';
  }
  if (profileName) profileName.textContent = user.name;
  if (profileJoined) {
    const dateObj = new Date(user.dateJoined);
    profileJoined.textContent = `Joined ${dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
  }

  // Calculate statistics
  const myCreatedQuizzes = window.AppState.quizzes.filter(q => q.creatorId === user.id);
  const myAttempts = window.AppState.attempts.filter(a => a.userId === user.id);
  
  let totalScorePercent = 0;
  myAttempts.forEach(a => totalScorePercent += (a.percentage || 0));
  const avgPercentage = myAttempts.length > 0 ? Math.round(totalScorePercent / myAttempts.length) : 0;

  // Render stats counters
  const createdCountVal = document.getElementById('created-count-value');
  const takenCountVal = document.getElementById('taken-count-value');
  const avgScoreVal = document.getElementById('avg-score-value');

  if (createdCountVal) createdCountVal.textContent = myCreatedQuizzes.length;
  if (takenCountVal) takenCountVal.textContent = myAttempts.length;
  if (avgScoreVal) avgScoreVal.textContent = `${avgPercentage}%`;

  // Render Badges
  renderBadges(myCreatedQuizzes, myAttempts);

  // Tab switching logic
  const tabButtons = document.querySelectorAll('.sidebar-menu-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      
      const targetTab = btn.getAttribute('data-tab');
      if (!targetTab) return;

      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(pane => pane.classList.remove('active'));

      btn.classList.add('active');
      const activePane = document.getElementById(targetTab);
      if (activePane) activePane.classList.add('active');
    });
  });

  // Load tabs lists content
  renderMyQuizzesTable(myCreatedQuizzes);
  renderHistoryTable(myAttempts);
  renderOverallStatsView(myCreatedQuizzes, myAttempts, avgPercentage);
}

// Render earned badges based on user stats
function renderBadges(created, attempts) {
  const container = document.getElementById('badges-box');
  if (!container) return;

  const badges = [
    {
      id: 'badge-first',
      name: 'First Attempt',
      icon: '🚀',
      desc: 'Completed your first quiz attempt',
      eligible: attempts.length >= 1
    },
    {
      id: 'badge-perfect',
      name: 'Perfect Score',
      icon: '🎯',
      desc: 'Scored 100% on a quiz',
      eligible: attempts.some(a => a.percentage === 100)
    },
    {
      id: 'badge-master',
      name: 'Quiz Master',
      icon: '👑',
      desc: 'Created at least 3 custom quizzes',
      eligible: created.length >= 3
    },
    {
      id: 'badge-scholar',
      name: 'Fast Scholar',
      icon: '⚡',
      desc: 'Finished a quiz under timed constraints',
      eligible: attempts.length > 0 // Simplification for demo
    }
  ];

  const earnedMarkup = badges.map(badge => {
    const opacityStyle = badge.eligible ? '' : 'style="opacity: 0.25; filter: grayscale(1);"';
    const earnedText = badge.eligible ? 'Earned' : 'Locked';
    return `
      <div class="badge-item" ${opacityStyle}>
        <span class="badge-icon">${badge.icon}</span>
        <span>${badge.name}</span>
        <div class="badge-tooltip"><strong>${badge.name}</strong><br>${badge.desc}<br>(Status: ${earnedText})</div>
      </div>
    `;
  }).join('');

  container.innerHTML = earnedMarkup;
}

// Render "My Quizzes" Created List
function renderMyQuizzesTable(quizzes) {
  const container = document.getElementById('my-quizzes-table-body');
  if (!container) return;

  if (quizzes.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="5" class="table-empty">
          <div class="table-empty-icon">➕</div>
          <p>You haven't created any quizzes yet.</p>
          <a href="create.html" class="btn btn-primary btn-sm" style="margin-top: 12px;">Create A Quiz</a>
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = quizzes.map((quiz, index) => {
    return `
      <tr id="row-quiz-${quiz.id}">
        <td>${index + 1}</td>
        <td>
          <div class="quiz-row-title">
            <span style="background-color: ${quiz.thumbnailColor}15; color: ${quiz.thumbnailColor}; padding: 4px 8px; border-radius: 4px;">
              ${quiz.thumbnailEmoji}
            </span>
            <strong>${quiz.title}</strong>
          </div>
        </td>
        <td><span class="badge badge-neutral">${quiz.category}</span></td>
        <td>🔥 ${quiz.playsCount || 0} plays</td>
        <td>⭐ ${quiz.averageScore ? Number(quiz.averageScore).toFixed(1) + '/5' : 'New'}</td>
        <td class="quiz-table-actions">
          <button class="btn btn-secondary btn-sm delete-quiz-btn" data-id="${quiz.id}" style="color: var(--danger); border-color: var(--danger-light);">Delete</button>
        </td>
      </tr>
    `;
  }).join('');

  // Attach delete click listeners
  container.querySelectorAll('.delete-quiz-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this quiz? This cannot be undone.')) {
        deleteQuiz(id);
      }
    });
  });
}

function deleteQuiz(id) {
  window.AppState.quizzes = window.AppState.quizzes.filter(q => q.id !== id);
  localStorage.setItem('quiz-maker-quizzes', JSON.stringify(window.AppState.quizzes));
  
  // Re-render
  const user = window.AppState.currentUser;
  const myCreatedQuizzes = window.AppState.quizzes.filter(q => q.creatorId === user.id);
  renderMyQuizzesTable(myCreatedQuizzes);

  // Update total counts
  const createdCountVal = document.getElementById('created-count-value');
  if (createdCountVal) createdCountVal.textContent = myCreatedQuizzes.length;

  window.showToast('Quiz deleted successfully.', 'success');
}

// Render "Attempts History" List
function renderHistoryTable(attempts) {
  const container = document.getElementById('history-table-body');
  if (!container) return;

  if (attempts.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="5" class="table-empty">
          <div class="table-empty-icon">🎮</div>
          <p>No attempts recorded yet.</p>
          <a href="browse.html" class="btn btn-primary btn-sm" style="margin-top: 12px;">Browse Quizzes</a>
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = attempts.map((attempt, index) => {
    const dateStr = new Date(attempt.dateTaken).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const pctBadgeClass = attempt.percentage >= 80 ? 'badge-secondary' : attempt.percentage >= 50 ? 'badge-warning' : 'badge-danger';

    return `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${attempt.quizTitle}</strong></td>
        <td><span class="badge ${pctBadgeClass}">${attempt.percentage}% (${attempt.score}/${attempt.totalQuestions})</span></td>
        <td><span class="text-muted" style="font-size: 0.82rem;">${dateStr}</span></td>
        <td class="quiz-table-actions">
          <a href="results.html?attemptId=${attempt.id}" class="btn btn-secondary btn-sm">Review</a>
          <a href="take.html?id=${attempt.quizId}" class="btn btn-primary btn-sm btn-outline">Retake</a>
        </td>
      </tr>
    `;
  }).join('');
}

// Render Overall Stats Tab Sheets
function renderOverallStatsView(created, attempts, avgScore) {
  const container = document.getElementById('tab-stats-inner');
  if (!container) return;

  // Construct charts, detailed listings
  container.innerHTML = `
    <div class="stats-cards-grid" style="margin-bottom: 32px;">
      <div class="dashboard-stat-card">
        <div class="stat-icon-wrapper yellow">👑</div>
        <div class="dashboard-stat-info">
          <span class="dashboard-stat-value">${created.length}</span>
          <span class="dashboard-stat-label">Quizzes Created</span>
        </div>
      </div>
      <div class="dashboard-stat-card">
        <div class="stat-icon-wrapper">🎮</div>
        <div class="dashboard-stat-info">
          <span class="dashboard-stat-value">${attempts.length}</span>
          <span class="dashboard-stat-label">Quizzes Attempted</span>
        </div>
      </div>
      <div class="dashboard-stat-card">
        <div class="stat-icon-wrapper green">🎯</div>
        <div class="dashboard-stat-info">
          <span class="dashboard-stat-value">${avgScore}%</span>
          <span class="dashboard-stat-label">Average Score</span>
        </div>
      </div>
    </div>

    <div class="table-container" style="padding: 24px;">
      <h3 style="margin-bottom: 16px;">Platform Performance Insights</h3>
      <p class="text-muted" style="margin-bottom: 24px; font-size: 0.95rem;">
        This metrics breakdown shows how you score across all attempts. Create more quizzes or answer pre-seeded quizzes to claim all the achievements badges!
      </p>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
        <div style="border: 1px solid var(--border); padding: 20px; border-radius: var(--radius-md); background-color: var(--background);">
          <h4 style="margin-bottom: 12px; color: var(--primary);">Creator Analytics</h4>
          <ul style="display: flex; flex-direction: column; gap: 10px; font-size: 0.92rem;">
            <li class="flex justify-between"><span>Total Plays of Your Quizzes:</span> <strong>${created.reduce((acc, q) => acc + (q.playsCount || 0), 0)} plays</strong></li>
            <li class="flex justify-between"><span>Average Creator Rating:</span> <strong>${created.length > 0 ? (created.reduce((acc, q) => acc + (q.averageScore || 0), 0) / created.length).toFixed(1) + ' / 5' : 'No ratings'}</strong></li>
          </ul>
        </div>
        
        <div style="border: 1px solid var(--border); padding: 20px; border-radius: var(--radius-md); background-color: var(--background);">
          <h4 style="margin-bottom: 12px; color: var(--secondary);">Candidate Analytics</h4>
          <ul style="display: flex; flex-direction: column; gap: 10px; font-size: 0.92rem;">
            <li class="flex justify-between"><span>Best Score:</span> <strong>${attempts.length > 0 ? Math.max(...attempts.map(a => a.percentage)) + '%' : '0%'}</strong></li>
            <li class="flex justify-between"><span>Total Questions Solved:</span> <strong>${attempts.reduce((acc, a) => acc + a.totalQuestions, 0)} questions</strong></li>
          </ul>
        </div>
      </div>
    </div>
  `;
}


// ==========================================
// 2. CREATOR WIZARD CONTROLLER
// ==========================================
let wizardData = {
  title: '',
  description: '',
  category: 'General',
  difficulty: 'Medium',
  thumbnailEmoji: '🧠',
  thumbnailColor: '#3b82f6',
  timeLimit: 30,
  questions: []
};

function setupCreatorWizard(user) {
  let currentStep = 1;
  
  const stepIndicators = document.querySelectorAll('.step-indicator');
  const panelStep1 = document.getElementById('panel-step-1');
  const panelStep2 = document.getElementById('panel-step-2');
  const panelStep3 = document.getElementById('panel-step-3');

  const btnPrev = document.getElementById('prev-step-btn');
  const btnNext = document.getElementById('next-step-btn');

  const qListContainer = document.getElementById('questions-list-container');
  const addQuestionBtn = document.getElementById('add-question-btn');

  // --- STEP 1 UI BINDINGS ---
  // Color Picker
  const colors = document.querySelectorAll('.palette-color');
  colors.forEach(c => {
    c.addEventListener('click', () => {
      colors.forEach(col => col.classList.remove('selected'));
      c.classList.add('selected');
      wizardData.thumbnailColor = c.getAttribute('data-color');
    });
  });

  // Emoji Picker
  const emojis = document.querySelectorAll('.emoji-select-btn');
  emojis.forEach(em => {
    em.addEventListener('click', () => {
      emojis.forEach(e => e.classList.remove('selected'));
      em.classList.add('selected');
      wizardData.thumbnailEmoji = em.getAttribute('data-emoji');
    });
  });

  // --- STEP 2 BINDINGS ---
  // Dynamic add question button
  if (addQuestionBtn) {
    addQuestionBtn.addEventListener('click', () => {
      addNewQuestionCard();
    });
  }

  // Pre-populate with 1 question card
  if (qListContainer && qListContainer.children.length === 0) {
    addNewQuestionCard();
  }

  // --- NAVIGATION WIZARD BUTTONS ---
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (currentStep === 1) {
        // Validate Step 1
        const title = document.getElementById('quiz-title-input').value.trim();
        const desc = document.getElementById('quiz-desc-input').value.trim();
        const category = document.getElementById('quiz-category-select').value;
        const difficulty = document.getElementById('quiz-difficulty-select').value;
        const timeLimit = parseInt(document.getElementById('quiz-time-select').value);

        if (!title || !desc) {
          window.showToast('Please provide a Quiz Title and Description.', 'error');
          return;
        }

        wizardData.title = title;
        wizardData.description = desc;
        wizardData.category = category;
        wizardData.difficulty = difficulty;
        wizardData.timeLimit = timeLimit;

        // Transition to Step 2
        currentStep = 2;
        updateWizardUI(currentStep);
      } else if (currentStep === 2) {
        // Compile and Validate Step 2 Questions
        const compiled = compileQuestions();
        if (!compiled) return; // Errors already raised inside helper

        if (compiled.length < 2) {
          window.showToast('You must add at least 2 questions to publish a quiz.', 'error');
          return;
        }

        wizardData.questions = compiled;

        // Transition to Step 3
        currentStep = 3;
        updateWizardUI(currentStep);
        renderStep3Summary();
      } else if (currentStep === 3) {
        // Publish action!
        publishQuiz(user);
      }
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (currentStep > 1) {
        currentStep--;
        updateWizardUI(currentStep);
      }
    });
  }
}

function updateWizardUI(step) {
  const stepIndicators = document.querySelectorAll('.step-indicator');
  const panelStep1 = document.getElementById('panel-step-1');
  const panelStep2 = document.getElementById('panel-step-2');
  const panelStep3 = document.getElementById('panel-step-3');

  const btnPrev = document.getElementById('prev-step-btn');
  const btnNext = document.getElementById('next-step-btn');

  // Set panels visibility
  panelStep1.classList.remove('active');
  panelStep2.classList.remove('active');
  panelStep3.classList.remove('active');

  if (step === 1) {
    panelStep1.classList.add('active');
    btnPrev.style.visibility = 'hidden';
    btnNext.textContent = 'Next: Questions';
  } else if (step === 2) {
    panelStep2.classList.add('active');
    btnPrev.style.visibility = 'visible';
    btnNext.textContent = 'Next: Review';
  } else if (step === 3) {
    panelStep3.classList.add('active');
    btnPrev.style.visibility = 'visible';
    btnNext.textContent = 'Publish Quiz';
  }

  // Update indicators
  stepIndicators.forEach((ind, idx) => {
    const stepNum = idx + 1;
    ind.classList.remove('active', 'completed');
    if (stepNum === step) {
      ind.classList.add('active');
    } else if (stepNum < step) {
      ind.classList.add('completed');
    }
  });
}

// Appends a new question card element to the list
function addNewQuestionCard() {
  const container = document.getElementById('questions-list-container');
  if (!container) return;

  const cardIdx = container.children.length + 1;

  const card = document.createElement('div');
  card.className = 'question-builder-card';
  card.innerHTML = `
    <div class="qb-header">
      <div class="qb-number-drag">
        <span class="drag-handle">☰</span>
        <span>Question ${cardIdx}</span>
      </div>
      <button class="qb-delete-btn" title="Delete Question">🗑️</button>
    </div>
    
    <div class="form-group">
      <label>Question Text</label>
      <input type="text" class="form-control qb-q-text-input" placeholder="e.g. What is the speed of light in a vacuum?" required>
    </div>

    <div class="form-group" style="margin-bottom: 8px;">
      <label>Answer Options & Correct Option Choice</label>
    </div>
    <div class="qb-options-grid">
      <div class="qb-option-row">
        <span class="qb-option-letter">A</span>
        <input type="text" class="qb-option-input" placeholder="Option A text" required>
        <input type="radio" name="correct-radio-${cardIdx}" value="A" class="qb-correct-radio" title="Mark Option A as correct">
      </div>
      <div class="qb-option-row">
        <span class="qb-option-letter">B</span>
        <input type="text" class="qb-option-input" placeholder="Option B text" required>
        <input type="radio" name="correct-radio-${cardIdx}" value="B" class="qb-correct-radio" title="Mark Option B as correct">
      </div>
      <div class="qb-option-row">
        <span class="qb-option-letter">C</span>
        <input type="text" class="qb-option-input" placeholder="Option C text" required>
        <input type="radio" name="correct-radio-${cardIdx}" value="C" class="qb-correct-radio" title="Mark Option C as correct">
      </div>
      <div class="qb-option-row">
        <span class="qb-option-letter">D</span>
        <input type="text" class="qb-option-input" placeholder="Option D text" required>
        <input type="radio" name="correct-radio-${cardIdx}" value="D" class="qb-correct-radio" title="Mark Option D as correct">
      </div>
    </div>

    <div class="form-group">
      <label>Explanation (Optional)</label>
      <input type="text" class="form-control qb-q-exp-input" placeholder="Explain why the selected option is correct.">
    </div>
  `;

  // Option row highlight on radio checked
  const radios = card.querySelectorAll('.qb-correct-radio');
  const rows = card.querySelectorAll('.qb-option-row');

  radios.forEach(rad => {
    rad.addEventListener('change', () => {
      rows.forEach(row => row.classList.remove('correct-option-selected'));
      rad.parentElement.classList.add('correct-option-selected');
    });
  });

  // Delete question card trigger
  card.querySelector('.qb-delete-btn').addEventListener('click', () => {
    if (container.children.length <= 1) {
      window.showToast('You must have at least 1 question to edit.', 'warning');
      return;
    }
    card.remove();
    reindexQuestionNumbers();
  });

  container.appendChild(card);
}

function reindexQuestionNumbers() {
  const container = document.getElementById('questions-list-container');
  if (!container) return;

  const cards = container.querySelectorAll('.question-builder-card');
  cards.forEach((card, idx) => {
    const cardIdx = idx + 1;
    card.querySelector('.qb-number-drag span:last-child').textContent = `Question ${cardIdx}`;
    
    // update radios name grouping to keep independent selections
    const radios = card.querySelectorAll('.qb-correct-radio');
    radios.forEach(rad => {
      rad.setAttribute('name', `correct-radio-${cardIdx}`);
    });
  });
}

// Complies option values into array models
function compileQuestions() {
  const container = document.getElementById('questions-list-container');
  if (!container) return null;

  const cards = container.querySelectorAll('.question-builder-card');
  const list = [];

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const textVal = card.querySelector('.qb-q-text-input').value.trim();
    const expVal = card.querySelector('.qb-q-exp-input').value.trim();

    const optionInputs = card.querySelectorAll('.qb-option-input');
    const options = Array.from(optionInputs).map(opt => opt.value.trim());

    // Validate inputs
    if (!textVal) {
      window.showToast(`Question ${i + 1} text is empty.`, 'error');
      return null;
    }

    if (options.some(o => !o)) {
      window.showToast(`Question ${i + 1} has empty options. Fill out A, B, C, and D.`, 'error');
      return null;
    }

    // Check correct radio selection
    const checkedRadio = card.querySelector('.qb-correct-radio:checked');
    if (!checkedRadio) {
      window.showToast(`Please select the correct option (A, B, C, or D) for Question ${i + 1}.`, 'error');
      return null;
    }

    list.push({
      id: `q-custom-${Date.now()}-${i}`,
      text: textVal,
      options: [options[0], options[1], options[2], options[3]],
      correctOption: checkedRadio.value,
      explanation: expVal || undefined
    });
  }

  return list;
}

// Renders step 3 summary
function renderStep3Summary() {
  const container = document.getElementById('review-summary-container');
  if (!container) return;

  const timeLimitText = wizardData.timeLimit > 0 ? `${wizardData.timeLimit} seconds / question` : 'No time limit';

  let reviewQuestionsHtml = wizardData.questions.map((q, idx) => {
    return `
      <div class="review-q-card">
        <div class="review-q-text">Question ${idx + 1}: ${q.text}</div>
        <div class="review-options-list">
          <div class="review-option-item ${q.correctOption === 'A' ? 'correct' : ''}">A. ${q.options[0]}</div>
          <div class="review-option-item ${q.correctOption === 'B' ? 'correct' : ''}">B. ${q.options[1]}</div>
          <div class="review-option-item ${q.correctOption === 'C' ? 'correct' : ''}">C. ${q.options[2]}</div>
          <div class="review-option-item ${q.correctOption === 'D' ? 'correct' : ''}">D. ${q.options[3]}</div>
        </div>
        ${q.explanation ? `<div style="margin-top: 12px; font-size: 0.85rem; color: var(--text-muted);">💡 Explanation: ${q.explanation}</div>` : ''}
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="review-quiz-info">
      <div class="quiz-thumbnail" style="background-color: ${wizardData.thumbnailColor}15; color: ${wizardData.thumbnailColor}; font-size: 2rem; width: 64px; height: 64px;">
        ${wizardData.thumbnailEmoji}
      </div>
      <div class="review-meta">
        <h3 style="font-size: 1.5rem;">${wizardData.title}</h3>
        <p class="text-muted" style="font-size: 0.95rem;">${wizardData.description}</p>
        <div style="display: flex; gap: 12px; margin-top: 8px; flex-wrap: wrap;">
          <span class="badge badge-neutral">📂 ${wizardData.category}</span>
          <span class="badge badge-neutral">📊 ${wizardData.difficulty}</span>
          <span class="badge badge-neutral">⏱️ ${timeLimitText}</span>
        </div>
      </div>
    </div>

    <h4 style="margin-bottom: 16px;">Questions Review (${wizardData.questions.length})</h4>
    <div class="review-questions-summary">
      ${reviewQuestionsHtml}
    </div>
  `;
}

// Publish quiz action
function publishQuiz(user) {
  const newQuiz = {
    id: `quiz-custom-${Date.now()}`,
    creatorId: user.id,
    creatorName: user.name,
    title: wizardData.title,
    description: wizardData.description,
    category: wizardData.category,
    difficulty: wizardData.difficulty,
    thumbnailEmoji: wizardData.thumbnailEmoji,
    thumbnailColor: wizardData.thumbnailColor,
    timeLimit: wizardData.timeLimit,
    playsCount: 0,
    averageScore: 0,
    questions: wizardData.questions,
    dateCreated: new Date().toISOString()
  };

  // Save Quiz state
  window.saveQuiz(newQuiz);

  window.showToast('Quiz published successfully!', 'success');

  // Trigger modal overlay reveal
  const modal = document.getElementById('publish-modal');
  const codeBox = document.getElementById('modal-share-code');
  const closeBtn = document.getElementById('modal-close-btn');

  if (modal && codeBox) {
    codeBox.innerHTML = `
      <span>${newQuiz.id}</span>
      <span class="copy-btn" id="copy-code-btn" title="Copy Code">📋</span>
    `;
    modal.classList.add('active');

    document.getElementById('copy-code-btn').addEventListener('click', () => {
      navigator.clipboard.writeText(newQuiz.id).then(() => {
        window.showToast('Quiz ID code copied to clipboard!', 'success');
      });
    });

    closeBtn.onclick = () => {
      modal.classList.remove('active');
      window.location.href = 'dashboard.html';
    };
  } else {
    // Failover redirect
    window.location.href = 'dashboard.html';
  }
}
