// Quiz Taking Client Controller
document.addEventListener('DOMContentLoaded', () => {
  if (window.AppState.isLoaded) {
    initTake();
  } else {
    document.addEventListener('appDataLoaded', initTake);
  }
});

let quiz = null;
let currentQuestionIndex = 0;
let score = 0;
let timerInterval = null;
let timeLeft = 0;
let userAnswers = [];
let isAnswered = false;

function initTake() {
  const urlParams = new URLSearchParams(window.location.search);
  const quizId = urlParams.get('id');

  if (!quizId) {
    window.showToast('No Quiz ID specified!', 'error');
    setTimeout(() => { window.location.href = 'browse.html'; }, 1000);
    return;
  }

  quiz = window.AppState.quizzes.find(q => q.id === quizId);

  if (!quiz) {
    window.showToast('Quiz not found!', 'error');
    setTimeout(() => { window.location.href = 'browse.html'; }, 1000);
    return;
  }

  renderStartPanel();
}

// 1. Render Rules Welcome Screen
function renderStartPanel() {
  const container = document.getElementById('take-container');
  if (!container) return;

  const user = window.AppState.currentUser;
  const timeLimitText = quiz.timeLimit > 0 ? `${quiz.timeLimit} seconds per question` : 'No time limit';
  
  container.innerHTML = `
    <div class="take-card" style="text-align: center; justify-content: center; min-height: auto; padding: 48px;">
      <div class="quiz-thumbnail" style="width: 72px; height: 72px; font-size: 2.5rem; margin: 0 auto 24px; background-color: ${quiz.thumbnailColor || '#7c3aed'}15; color: ${quiz.thumbnailColor || '#7c3aed'}">
        ${quiz.thumbnailEmoji || '📝'}
      </div>
      <h2 style="font-size: 2.25rem; margin-bottom: 8px;">${quiz.title}</h2>
      <p class="text-muted" style="margin-bottom: 24px; font-size: 1.1rem; max-width: 600px; margin-left: auto; margin-right: auto;">
        ${quiz.description}
      </p>
      
      <div style="display: flex; justify-content: center; gap: 16px; margin-bottom: 32px; flex-wrap: wrap;">
        <span class="badge badge-neutral" style="font-size: 0.85rem; padding: 6px 16px;">📂 ${quiz.category}</span>
        <span class="badge badge-neutral" style="font-size: 0.85rem; padding: 6px 16px;">📊 ${quiz.difficulty}</span>
        <span class="badge badge-neutral" style="font-size: 0.85rem; padding: 6px 16px;">❓ ${quiz.questions.length} Questions</span>
        <span class="badge badge-neutral" style="font-size: 0.85rem; padding: 6px 16px;">⏱️ ${timeLimitText}</span>
      </div>

      <div style="border-top: 1px solid var(--border); padding-top: 32px; max-width: 480px; margin: 0 auto; text-align: left;">
        <h4 style="margin-bottom: 12px; font-size: 1.1rem;">Quiz Instructions:</h4>
        <ul style="list-style: disc; padding-left: 20px; color: var(--text-muted); font-size: 0.95rem; display: flex; flex-direction: column; gap: 8px;">
          <li>Once started, you cannot pause the quiz.</li>
          ${quiz.timeLimit > 0 ? `<li>You have <strong>${quiz.timeLimit}s</strong> to answer each question. The clock turns red in the last 5s.</li>` : ''}
          <li>Immediate feedback and explanations are displayed after selecting an answer.</li>
          <li>Your progress and scores will be saved to your dashboard.</li>
        </ul>
      </div>

      <div style="margin-top: 40px; display: flex; justify-content: center; gap: 16px;">
        <a href="browse.html" class="btn btn-secondary">Cancel</a>
        <button id="start-quiz-btn" class="btn btn-primary">Start Quiz Now</button>
      </div>
    </div>
  `;

  document.getElementById('start-quiz-btn').addEventListener('click', startQuiz);
}

// 2. Start Taker Execution
function startQuiz() {
  currentQuestionIndex = 0;
  score = 0;
  userAnswers = [];
  
  // Render Take Layout Framework
  const container = document.getElementById('take-container');
  if (!container) return;

  container.innerHTML = `
    <div class="quiz-take-layout">
      <div class="take-header">
        <div class="take-progress-container">
          <div class="take-progress-text">
            <span id="take-progress-label">Question 1 of 10</span>
            <span id="take-progress-percent">0% Complete</span>
          </div>
          <div class="take-progress-bar-bg">
            <div class="take-progress-bar-fill" id="take-progress-fill"></div>
          </div>
        </div>
        
        ${quiz.timeLimit > 0 ? `
          <div class="timer-container" id="timer-box">
            ⏱️ <span id="timer-count">00:00</span>
          </div>
        ` : ''}
      </div>

      <div class="take-card" id="question-card">
        <!-- Question & Options inject here -->
      </div>

      <div class="take-footer">
        <button id="next-q-btn" class="btn btn-primary" style="display: none;">Next Question</button>
      </div>
    </div>
  `;

  renderQuestion();
}

// 3. Render Question Card
function renderQuestion() {
  isAnswered = false;
  const question = quiz.questions[currentQuestionIndex];
  const totalQ = quiz.questions.length;
  
  // Update Header Progress UI
  document.getElementById('take-progress-label').textContent = `Question ${currentQuestionIndex + 1} of ${totalQ}`;
  const percentage = Math.round((currentQuestionIndex / totalQ) * 100);
  document.getElementById('take-progress-percent').textContent = `${percentage}% Complete`;
  document.getElementById('take-progress-fill').style.width = `${percentage}%`;

  // Update question contents
  const card = document.getElementById('question-card');
  const nextBtn = document.getElementById('next-q-btn');
  nextBtn.style.display = 'none';

  const optionLetters = ['A', 'B', 'C', 'D'];
  const optionsHtml = question.options.map((opt, idx) => {
    const letter = optionLetters[idx];
    return `
      <button class="take-option-btn" data-letter="${letter}">
        <div class="take-option-letter-box">${letter}</div>
        <div class="take-option-text">${opt}</div>
      </button>
    `;
  }).join('');

  card.innerHTML = `
    <h3 class="take-question-text">${question.text}</h3>
    <div class="take-options-grid" id="options-grid">
      ${optionsHtml}
    </div>
    <div id="explanation-container"></div>
  `;

  // Start question timer countdown
  if (quiz.timeLimit > 0) {
    startTimer();
  }

  // Bind clicks on option buttons
  const optionButtons = card.querySelectorAll('.take-option-btn');
  optionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedLetter = btn.getAttribute('data-letter');
      handleAnswerSelect(selectedLetter);
    });
  });
}

// 4. Timer Logic
function startTimer() {
  clearInterval(timerInterval);
  timeLeft = quiz.timeLimit;
  
  const timerBox = document.getElementById('timer-box');
  const timerCount = document.getElementById('timer-count');
  
  timerBox.classList.remove('timer-warning');
  timerCount.textContent = formatTime(timeLeft);

  timerInterval = setInterval(() => {
    timeLeft--;
    timerCount.textContent = formatTime(timeLeft);

    if (timeLeft <= 5) {
      timerBox.classList.add('timer-warning');
    }

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleAnswerSelect('none'); // Timeout registers as unanswered
    }
  }, 1000);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// 5. Answer Selection Handlers
function handleAnswerSelect(choice) {
  if (isAnswered) return;
  isAnswered = true;

  clearInterval(timerInterval);

  const question = quiz.questions[currentQuestionIndex];
  const correctChoice = question.correctOption; // 'A', 'B', 'C', 'D'
  const isCorrect = choice === correctChoice;

  if (isCorrect) score++;

  // Record Answer Attempt
  userAnswers.push({
    questionText: question.text,
    userChoice: choice,
    correctChoice: correctChoice,
    isCorrect: isCorrect,
    explanation: question.explanation
  });

  // Highlight Options Grid Visual Feedbacks
  const optionsGrid = document.getElementById('options-grid');
  const buttons = optionsGrid.querySelectorAll('.take-option-btn');

  buttons.forEach(btn => {
    btn.disabled = true; // Block double-clicks
    const letter = btn.getAttribute('data-letter');

    if (letter === correctChoice) {
      if (isCorrect) {
        btn.classList.add('selected-correct');
      } else {
        btn.classList.add('missed-correct');
      }
    } else if (letter === choice && !isCorrect) {
      btn.classList.add('selected-wrong');
    }
  });

  // Display Explanation Panel
  if (question.explanation) {
    const expContainer = document.getElementById('explanation-container');
    const headerTitle = isCorrect ? '🎉 Correct Answer!' : choice === 'none' ? '⏱️ Time is Up!' : '❌ Incorrect Answer';
    
    expContainer.innerHTML = `
      <div class="explanation-panel">
        <div class="explanation-icon">💡</div>
        <div class="explanation-content">
          <div class="explanation-title">${headerTitle}</div>
          <div class="explanation-text">${question.explanation}</div>
        </div>
      </div>
    `;
  }

  // Show Footer Nav Action Button
  const nextBtn = document.getElementById('next-q-btn');
  const isLast = currentQuestionIndex === quiz.questions.length - 1;
  nextBtn.textContent = isLast ? 'Finish Quiz' : 'Next Question';
  nextBtn.style.display = 'block';

  // Bind next button click
  nextBtn.onclick = () => {
    if (isLast) {
      finishQuiz();
    } else {
      currentQuestionIndex++;
      renderQuestion();
    }
  };
}

// 6. Finish & Write Record
function finishQuiz() {
  const totalQ = quiz.questions.length;
  const percentage = Math.round((score / totalQ) * 100);
  const user = window.AppState.currentUser;

  // Create Attempt Data Model
  const attempt = {
    id: 'attempt-' + Date.now(),
    userId: user ? user.id : 'guest',
    quizId: quiz.id,
    quizTitle: quiz.title,
    score: score,
    totalQuestions: totalQ,
    percentage: percentage,
    dateTaken: new Date().toISOString(),
    answers: userAnswers
  };

  // Save Attempt
  window.saveAttempt(attempt);

  // Update Quiz PlaysCount & Average Rating
  const plays = quiz.playsCount || 0;
  const avg = quiz.averageScore || 0;
  const scoreWeight5 = (score / totalQ) * 5;
  const newAvg = ((plays * avg) + scoreWeight5) / (plays + 1);

  // Mutate local state quiz
  quiz.playsCount = plays + 1;
  quiz.averageScore = newAvg;

  // Sync quizzes list
  const idx = window.AppState.quizzes.findIndex(q => q.id === quiz.id);
  if (idx !== -1) {
    window.AppState.quizzes[idx] = quiz;
    localStorage.setItem('quiz-maker-quizzes', JSON.stringify(window.AppState.quizzes));
  }

  window.showToast('Quiz complete! Saving results...', 'success');

  // Redirect to results screen
  setTimeout(() => {
    window.location.href = `results.html?attemptId=${attempt.id}`;
  }, 1000);
}
