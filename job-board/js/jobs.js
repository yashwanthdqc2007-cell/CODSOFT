// --- JOBS CONTROLLER (LISTINGS & SEARCH) ---

// Pagination and filters state
let currentLimit = 5;
let filteredJobs = [];
let selectedSkillFilter = null;

// Popular skills list
const POPULAR_SKILLS = [
  'React', 'Node.js', 'AWS', 'Figma', 'TypeScript', 
  'Docker', 'Go', 'Python', 'Kubernetes', 'Product Strategy', 'Agile'
];

document.addEventListener('DOMContentLoaded', () => {
  if (window.AppState && window.AppState.isLoaded) {
    initJobsPage();
  } else {
    document.addEventListener('appDataLoaded', () => {
      initJobsPage();
    });
  }
});

function initJobsPage() {
  parseUrlParams();
  renderPopularSkillsSidebar();
  setupFiltersListeners();
  applyFiltersAndRender();
}

// --- PARSE URL PARAMS (FROM HERO SEARCH) ---
function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  
  const query = params.get('q');
  const location = params.get('location');
  const category = params.get('category');

  if (query) document.getElementById('filterKeyword').value = query;
  if (location) document.getElementById('filterLocation').value = location;
  if (category) document.getElementById('filterCategory').value = category;
}

// --- RENDER POPULAR SKILLS TAG CLOUD ---
function renderPopularSkillsSidebar() {
  const container = document.getElementById('sidebarSkillsContainer');
  if (!container) return;

  container.innerHTML = POPULAR_SKILLS.map(skill => `
    <button type="button" class="skill-tag-btn" data-skill="${skill}" onclick="toggleSkillTagFilter('${skill}')">
      ${skill}
    </button>
  `).join('');
}

// Toggle skill filter from sidebar click
window.toggleSkillTagFilter = function(skill) {
  const buttons = document.querySelectorAll('.skill-tag-btn');
  
  if (selectedSkillFilter === skill) {
    selectedSkillFilter = null;
    buttons.forEach(btn => btn.classList.remove('active'));
  } else {
    selectedSkillFilter = skill;
    buttons.forEach(btn => {
      if (btn.dataset.skill === skill) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  currentLimit = 5; // Reset limit
  applyFiltersAndRender();
};

// --- SETUP EVENT LISTENERS FOR FILTERS ---
function setupFiltersListeners() {
  const inputs = [
    document.getElementById('filterKeyword'),
    document.getElementById('filterCompany'),
    document.getElementById('filterLocation'),
    document.getElementById('filterCategory'),
    document.getElementById('sortSelect')
  ];

  inputs.forEach(input => {
    if (input) {
      input.addEventListener('input', () => {
        currentLimit = 5; // Reset pagination limit on filter change
        applyFiltersAndRender();
      });
    }
  });

  // Salary range slider change
  const salaryRange = document.getElementById('filterSalary');
  const salaryVal = document.getElementById('salaryVal');
  if (salaryRange) {
    salaryRange.addEventListener('input', (e) => {
      salaryVal.textContent = `$${parseInt(e.target.value).toLocaleString()}`;
      currentLimit = 5;
      applyFiltersAndRender();
    });
  }

  // Job type checkboxes
  const checkboxes = document.querySelectorAll('input[name="jobType"]');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      currentLimit = 5;
      applyFiltersAndRender();
    });
  });

  // Load More Button
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      currentLimit += 5;
      renderJobsList();
    });
  }
}

// --- MAIN FILTER LOGIC ---
function applyFiltersAndRender() {
  const keyword = document.getElementById('filterKeyword').value.toLowerCase().trim();
  const company = document.getElementById('filterCompany').value.toLowerCase().trim();
  const location = document.getElementById('filterLocation').value.toLowerCase().trim();
  const category = document.getElementById('filterCategory').value;
  const salary = parseInt(document.getElementById('filterSalary').value);
  const sort = document.getElementById('sortSelect').value;

  // Selected job types checkboxes
  const checkedTypes = Array.from(document.querySelectorAll('input[name="jobType"]:checked')).map(cb => cb.value);

  // Filter Jobs Array
  filteredJobs = (window.AppState.jobs || []).filter(job => {
    // 1. Keyword search (title / description / skills)
    if (keyword) {
      const matchTitle = job.title.toLowerCase().includes(keyword);
      const matchDesc = job.description.toLowerCase().includes(keyword);
      const matchSkills = job.skills.some(skill => skill.toLowerCase().includes(keyword));
      
      if (!matchTitle && !matchDesc && !matchSkills) return false;
    }

    // 2. Company search
    if (company && !job.companyName.toLowerCase().includes(company)) return false;

    // 3. Location filter
    if (location && !job.location.toLowerCase().includes(location)) return false;

    // 4. Category filter
    if (category && job.category !== category) return false;

    // 5. Job Type filter
    if (checkedTypes.length > 0 && !checkedTypes.includes(job.type)) return false;

    // 6. Salary filter
    if (salary > 0 && job.salaryMax < salary) return false;

    // 7. Skill tag cloud filter
    if (selectedSkillFilter && !job.skills.includes(selectedSkillFilter)) return false;

    return true;
  });

  // Apply Sorting
  if (sort === 'relevance') {
    // Relevance: Pinned/Featured listings first, then by newest
    filteredJobs.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.postedDate) - new Date(a.postedDate);
    });
  } else if (sort === 'newest') {
    filteredJobs.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
  } else if (sort === 'highest-salary') {
    filteredJobs.sort((a, b) => b.salaryMax - a.salaryMax);
  } else if (sort === 'lowest-salary') {
    filteredJobs.sort((a, b) => a.salaryMin - b.salaryMin);
  }

  // Update Filters Sidebar tags UI
  renderFilterTags();
  
  // Render list
  renderJobsList();
}

// --- RENDER ACTIVE FILTER TAGS BAR ---
function renderFilterTags() {
  const panel = document.getElementById('activeFiltersPanel');
  const container = document.getElementById('activeTagsContainer');
  if (!panel || !container) return;

  const keyword = document.getElementById('filterKeyword').value.trim();
  const company = document.getElementById('filterCompany').value.trim();
  const location = document.getElementById('filterLocation').value.trim();
  const category = document.getElementById('filterCategory').value;
  const salary = parseInt(document.getElementById('filterSalary').value);
  const checkedTypes = Array.from(document.querySelectorAll('input[name="jobType"]:checked')).map(cb => cb.value);

  let tagsHtml = '';

  if (keyword) tagsHtml += `<span class="filter-tag">Keyword: "${keyword}" <i class="fas fa-times" onclick="clearSpecificFilter('keyword')"></i></span>`;
  if (company) tagsHtml += `<span class="filter-tag">Company: "${company}" <i class="fas fa-times" onclick="clearSpecificFilter('company')"></i></span>`;
  if (location) tagsHtml += `<span class="filter-tag">Location: "${location}" <i class="fas fa-times" onclick="clearSpecificFilter('location')"></i></span>`;
  if (category) tagsHtml += `<span class="filter-tag">Category: "${category}" <i class="fas fa-times" onclick="clearSpecificFilter('category')"></i></span>`;
  if (salary > 0) tagsHtml += `<span class="filter-tag">Salary >= $${salary.toLocaleString()} <i class="fas fa-times" onclick="clearSpecificFilter('salary')"></i></span>`;
  if (selectedSkillFilter) tagsHtml += `<span class="filter-tag">Skill: ${selectedSkillFilter} <i class="fas fa-times" onclick="clearSpecificFilter('skill')"></i></span>`;
  
  checkedTypes.forEach(type => {
    tagsHtml += `<span class="filter-tag">Type: ${type} <i class="fas fa-times" onclick="clearSpecificFilter('type', '${type}')"></i></span>`;
  });

  if (tagsHtml) {
    container.innerHTML = tagsHtml;
    panel.style.display = 'flex';
  } else {
    panel.style.display = 'none';
  }
}

// Clear specific filter field
window.clearSpecificFilter = function(filterName, detail = null) {
  if (filterName === 'keyword') document.getElementById('filterKeyword').value = '';
  if (filterName === 'company') document.getElementById('filterCompany').value = '';
  if (filterName === 'location') document.getElementById('filterLocation').value = '';
  if (filterName === 'category') document.getElementById('filterCategory').value = '';
  if (filterName === 'salary') {
    document.getElementById('filterSalary').value = 0;
    document.getElementById('salaryVal').textContent = '$0';
  }
  if (filterName === 'type') {
    const checkboxes = document.querySelectorAll(`input[name="jobType"][value="${detail}"]`);
    checkboxes.forEach(cb => cb.checked = false);
  }
  if (filterName === 'skill') {
    selectedSkillFilter = null;
    const buttons = document.querySelectorAll('.skill-tag-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
  }

  currentLimit = 5;
  applyFiltersAndRender();
};

// Clear all filter values
window.clearAllFilters = function() {
  document.getElementById('filterKeyword').value = '';
  document.getElementById('filterCompany').value = '';
  document.getElementById('filterLocation').value = '';
  document.getElementById('filterCategory').value = '';
  document.getElementById('filterSalary').value = 0;
  document.getElementById('salaryVal').textContent = '$0';
  
  selectedSkillFilter = null;
  const buttons = document.querySelectorAll('.skill-tag-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  const checkboxes = document.querySelectorAll('input[name="jobType"]');
  checkboxes.forEach(cb => cb.checked = false);

  currentLimit = 5;
  applyFiltersAndRender();
  showToast('All filters cleared', 'info');
};

// --- RENDER FILTERED JOBS CARDS ---
function renderJobsList() {
  const container = document.getElementById('listingsContainer');
  const resultsCount = document.getElementById('resultsCount');
  const paginationBox = document.getElementById('paginationBox');
  if (!container || !resultsCount) return;

  resultsCount.textContent = `Showing ${Math.min(filteredJobs.length, currentLimit)} of ${filteredJobs.length} Job${filteredJobs.length === 1 ? '' : 's'}`;

  if (filteredJobs.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><i class="fas fa-search-minus"></i></div>
        <h3>No matching jobs found</h3>
        <p>Try refining your keyword search, choosing a different category, or adjusting the salary criteria.</p>
        <button onclick="clearAllFilters()" class="btn btn-primary btn-sm">Clear All Filters</button>
      </div>
    `;
    paginationBox.style.display = 'none';
    return;
  }

  // Slice list based on pagination limit
  const visibleJobs = filteredJobs.slice(0, currentLimit);
  
  const bookmarks = window.AppState.bookmarks || [];
  const user = window.AppState.currentUser;

  container.innerHTML = visibleJobs.map(job => {
    const isBookmarked = user && bookmarks.some(b => b.candidateId === user.id && b.jobId === job.id);
    const activeClass = isBookmarked ? 'active' : '';
    const bookmarkIcon = isBookmarked ? 'fas fa-bookmark' : 'far fa-bookmark';
    
    // Check if new (posted within last 2 days)
    const isNew = isWithinLastTwoDays(job.postedDate);
    const isRemote = job.location.toLowerCase().includes('remote');

    // Build badge markers HTML
    let badgesHtml = `<div class="badge badge-primary">${job.category}</div>`;
    if (job.pinned) {
      badgesHtml += `<span class="badge badge-warning" style="margin-left: 6px;"><i class="fas fa-star"></i> Featured</span>`;
    }
    if (isNew) {
      badgesHtml += `<span class="badge badge-secondary" style="margin-left: 6px; background-color: var(--secondary-light); color: var(--secondary);">New</span>`;
    }
    if (isRemote) {
      badgesHtml += `<span class="badge badge-neutral" style="margin-left: 6px; background-color: var(--neutral-200); color: var(--neutral-800);">Remote</span>`;
    }

    const pinnedClass = job.pinned ? 'pinned-premium' : '';

    return `
      <div class="job-card ${pinnedClass}" onclick="navigateToDetails('${job.id}')" style="flex-direction: row; align-items: center; justify-content: space-between; gap: 24px; text-align: left; padding: 24px; cursor: pointer;">
        <div class="flex align-center gap-3" style="flex: 2;">
          <img src="${job.companyLogo || 'https://images.unsplash.com/photo-1561070791-26c113006238?w=100&h=100&fit=crop&q=80'}" alt="${job.companyName} logo" class="company-logo-img" style="width: 56px; height: 56px;">
          <div>
            <h3 class="job-card-title" style="margin-bottom: 4px; font-size: 1.25rem;">${job.title}</h3>
            <div class="job-card-company" style="margin-bottom: 8px;">${job.companyName}</div>
            <div class="job-details-meta" style="margin-bottom: 8px;">
              <span><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
              <span><i class="far fa-clock"></i> ${job.type}</span>
              <span><i class="far fa-calendar"></i> ${formatDaysAgo(job.postedDate)}</span>
            </div>
            <div class="flex align-center">
              ${badgesHtml}
            </div>
          </div>
        </div>

        <div class="flex align-center gap-3" style="flex-shrink: 0;" onclick="event.stopPropagation()">
          <span class="job-salary" style="font-size: 1.15rem; min-width: 140px; text-align: right;">${job.salaryRange}</span>
          
          <button onclick="toggleBookmark('${job.id}')" class="bookmark-btn ${activeClass} btn-icon" style="margin-left: 8px;" title="Bookmark job">
            <i class="${bookmarkIcon}"></i>
          </button>
          
          <a href="job-details.html?id=${job.id}" class="btn btn-primary btn-sm">View Details</a>
        </div>
      </div>
    `;
  }).join('');

  // Toggle load more visibility
  if (filteredJobs.length > currentLimit) {
    paginationBox.style.display = 'block';
  } else {
    paginationBox.style.display = 'none';
  }
}

// Click anywhere on card routes to detail view
window.navigateToDetails = function(jobId) {
  window.location.href = `job-details.html?id=${jobId}`;
};

// Check if date is within last 2 days
function isWithinLastTwoDays(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= 2;
}

// Days ago helper
function formatDaysAgo(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

// Bookmark toggler
function toggleBookmark(jobId) {
  const user = window.AppState.currentUser;
  if (!user) {
    showToast('Please log in as a candidate to bookmark jobs!', 'warning');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
    return;
  }

  if (user.role !== 'candidate') {
    showToast('Only candidate accounts can bookmark listings.', 'error');
    return;
  }

  let bookmarks = JSON.parse(localStorage.getItem('job-board-bookmarks')) || [];
  const index = bookmarks.findIndex(b => b.candidateId === user.id && b.jobId === jobId);

  if (index > -1) {
    bookmarks.splice(index, 1);
    showToast('Job removed from bookmarks.', 'info');
  } else {
    bookmarks.push({ candidateId: user.id, jobId: jobId });
    showToast('Job bookmarked successfully!', 'success');
  }

  localStorage.setItem('job-board-bookmarks', JSON.stringify(bookmarks));
  window.AppState.bookmarks = bookmarks;
  applyFiltersAndRender(); // update indicators
}
