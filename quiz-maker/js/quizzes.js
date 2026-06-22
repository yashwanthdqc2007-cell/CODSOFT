// Browse Quizzes Controller
document.addEventListener('DOMContentLoaded', () => {
  if (window.AppState.isLoaded) {
    initBrowse();
  } else {
    document.addEventListener('appDataLoaded', initBrowse);
  }
});

let activeFilters = {
  searchQuery: '',
  categories: [],
  difficulty: '',
  sortBy: 'popular'
};

function initBrowse() {
  const searchInput = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort-select');
  const difficultyButtons = document.querySelectorAll('.difficulty-filter-btn');
  const categoryChecks = document.querySelectorAll('.category-check');
  const resetFiltersBtn = document.getElementById('reset-filters');

  // Load initial search query if passed from landing page url parameter (?search=xyz)
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get('search');
  if (searchParam && searchInput) {
    searchInput.value = searchParam;
    activeFilters.searchQuery = searchParam.toLowerCase();
  }
  const categoryParam = urlParams.get('category');
  if (categoryParam) {
    activeFilters.categories.push(categoryParam);
    categoryChecks.forEach(check => {
      if (check.value === categoryParam) check.checked = true;
    });
  }

  // 1. Search Query Bindings
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      activeFilters.searchQuery = e.target.value.toLowerCase().trim();
      renderFilteredQuizzes();
    });
  }

  // 2. Sorting Bindings
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      activeFilters.sortBy = e.target.value;
      renderFilteredQuizzes();
    });
  }

  // 3. Difficulty Tags Bindings
  difficultyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      difficultyButtons.forEach(b => b.classList.remove('active'));
      
      const level = btn.getAttribute('data-difficulty');
      if (activeFilters.difficulty === level) {
        // Toggle off if clicking the already active button
        activeFilters.difficulty = '';
      } else {
        activeFilters.difficulty = level;
        btn.classList.add('active');
      }
      renderFilteredQuizzes();
    });
  });

  // 4. Category Checkbox Bindings
  categoryChecks.forEach(check => {
    check.addEventListener('change', () => {
      const selected = Array.from(categoryChecks)
        .filter(c => c.checked)
        .map(c => c.value);
      activeFilters.categories = selected;
      renderFilteredQuizzes();
    });
  });

  // 5. Reset Filters
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (sortSelect) sortSelect.value = 'popular';
      difficultyButtons.forEach(b => b.classList.remove('active'));
      categoryChecks.forEach(c => c.checked = false);

      activeFilters = {
        searchQuery: '',
        categories: [],
        difficulty: '',
        sortBy: 'popular'
      };

      renderFilteredQuizzes();
    });
  }

  // Initial render
  renderFilteredQuizzes();
}

function renderFilteredQuizzes() {
  const grid = document.getElementById('quizzes-grid');
  const countSpan = document.getElementById('results-count');
  if (!grid) return;

  let filtered = [...window.AppState.quizzes];

  // A. Filter by Search Query
  if (activeFilters.searchQuery) {
    filtered = filtered.filter(quiz => 
      quiz.title.toLowerCase().includes(activeFilters.searchQuery) ||
      quiz.description.toLowerCase().includes(activeFilters.searchQuery)
    );
  }

  // B. Filter by Categories
  if (activeFilters.categories.length > 0) {
    filtered = filtered.filter(quiz => activeFilters.categories.includes(quiz.category));
  }

  // C. Filter by Difficulty
  if (activeFilters.difficulty) {
    filtered = filtered.filter(quiz => quiz.difficulty.toLowerCase() === activeFilters.difficulty.toLowerCase());
  }

  // D. Sorting Logic
  filtered.sort((a, b) => {
    if (activeFilters.sortBy === 'popular') {
      return (b.playsCount || 0) - (a.playsCount || 0);
    }
    if (activeFilters.sortBy === 'newest') {
      return new Date(b.dateCreated) - new Date(a.dateCreated);
    }
    if (activeFilters.sortBy === 'difficulty-asc') {
      const diffWeight = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
      return diffWeight[a.difficulty] - diffWeight[b.difficulty];
    }
    if (activeFilters.sortBy === 'difficulty-desc') {
      const diffWeight = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
      return diffWeight[b.difficulty] - diffWeight[a.difficulty];
    }
    return 0;
  });

  // E. Update Results Count Text
  if (countSpan) {
    countSpan.textContent = `Showing ${filtered.length} of ${window.AppState.quizzes.length} Quizzes`;
  }

  // F. Empty State Check
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;" class="table-empty">
        <div class="table-empty-icon">🔍</div>
        <h3>No Quizzes Found</h3>
        <p class="text-muted" style="margin-top: 8px;">Try modifying your search keywords or relaxing the filter restrictions.</p>
      </div>
    `;
    return;
  }

  // G. Render Grid
  grid.innerHTML = filtered.map(quiz => {
    const isPinnedClass = quiz.featured ? 'featured-pinned' : '';
    const badgeMarkup = quiz.featured ? `<span class="badge badge-primary" style="position: absolute; top: 16px; right: 16px;">Featured</span>` : '';
    const diffBadgeClass = quiz.difficulty === 'Easy' ? 'badge-secondary' : quiz.difficulty === 'Medium' ? 'badge-warning' : 'badge-danger';
    
    // Creator Mini Bubble Initials
    const creatorInitials = quiz.creatorName ? quiz.creatorName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'A';
    const creatorColor = quiz.creatorId === 'admin' ? '#7c3aed' : '#10b981';

    return `
      <div class="quiz-card ${isPinnedClass}" style="position: relative;">
        ${badgeMarkup}
        <div class="quiz-card-header">
          <div class="quiz-thumbnail" style="background-color: ${quiz.thumbnailColor || '#7c3aed'}15; color: ${quiz.thumbnailColor || '#7c3aed'}">
            ${quiz.thumbnailEmoji || '📝'}
          </div>
          <span class="badge ${diffBadgeClass}">${quiz.difficulty}</span>
        </div>
        <h3 class="quiz-card-title">${quiz.title}</h3>
        <p class="quiz-card-desc">${quiz.description}</p>
        <div class="quiz-meta-info">
          <span>📂 ${quiz.category}</span>
          <span>⏱️ ${quiz.timeLimit > 0 ? quiz.timeLimit + 's / Q' : 'No Limit'}</span>
          <span>🔥 ${quiz.playsCount || 0} plays</span>
          <span>⭐ ${quiz.averageScore ? Number(quiz.averageScore).toFixed(1) + '/5' : 'New'}</span>
        </div>
        <div class="quiz-card-footer">
          <div class="quiz-creator-bubble" title="Created by ${quiz.creatorName}">
            <div class="creator-avatar-mini" style="background-color: ${creatorColor}">
              ${creatorInitials}
            </div>
            <span class="text-muted" style="font-weight: 500;">By ${quiz.creatorName}</span>
          </div>
          <a href="take.html?id=${quiz.id}" class="btn btn-primary btn-sm">Take Quiz</a>
        </div>
      </div>
    `;
  }).join('');
}
