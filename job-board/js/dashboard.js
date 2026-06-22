// --- UNIFIED DASHBOARD CONTROLLER (CANDIDATE & EMPLOYER) ---

let activeSkillsList = []; // Candidate profile skills list state
let activeApplicationReview = null; // Currently reviewed application in modal

document.addEventListener('DOMContentLoaded', () => {
  // 1. Session check & Role validation
  if (!checkSessionAndRedirect()) return;

  // 2. Setup panel navigation
  setupPanelNavigation();

  // 3. Wait for data to load and initialize dashboard statistics/lists
  if (window.AppState && window.AppState.isLoaded) {
    initDashboard();
  } else {
    document.addEventListener('appDataLoaded', () => {
      initDashboard();
    });
  }
});

function initDashboard() {
  const user = window.AppState.currentUser;
  if (user.role === 'candidate') {
    initCandidateDashboard();
  } else if (user.role === 'employer') {
    initEmployerDashboard();
  }
}

// --- SESSION VERIFICATION ---
function checkSessionAndRedirect() {
  const user = window.AppState.currentUser;
  const path = window.location.pathname;

  if (!user) {
    showToast('Please log in to access this page.', 'warning');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1000);
    return false;
  }

  // Validate path access
  if (path.includes('candidate-dashboard.html') && user.role !== 'candidate') {
    window.location.href = 'employer-dashboard.html';
    return false;
  }
  if (path.includes('employer-dashboard.html') && user.role !== 'employer') {
    window.location.href = 'candidate-dashboard.html';
    return false;
  }

  return true;
}

// --- PANEL NAVIGATION & TAB CONTROLS ---
function setupPanelNavigation() {
  const sidebarButtons = document.querySelectorAll('.sidebar-menu-btn');
  sidebarButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      switchTab(target);
    });
  });

  // Check URL query parameters for deep linking
  const params = new URLSearchParams(window.location.search);
  const deepTab = params.get('tab');
  if (deepTab) {
    let panelId = 'panel-overview';
    if (deepTab === 'post-job') panelId = 'panel-post-job';
    if (deepTab === 'jobs') panelId = 'panel-manage-jobs';
    if (deepTab === 'applicants') panelId = 'panel-view-applicants';
    if (deepTab === 'profile') panelId = 'panel-profile';
    if (deepTab === 'bookmarks') panelId = 'panel-bookmarks';
    if (deepTab === 'resume') panelId = 'panel-profile';
    
    switchTab(panelId);
  }
}

function switchTab(panelId) {
  const panels = document.querySelectorAll('.dashboard-panel-content');
  const sidebarButtons = document.querySelectorAll('.sidebar-menu-btn');

  // Deactivate all panels and buttons
  panels.forEach(p => p.classList.remove('active'));
  sidebarButtons.forEach(b => b.classList.remove('active'));

  // Activate target panel
  const targetPanel = document.getElementById(panelId);
  if (targetPanel) {
    targetPanel.classList.add('active');
  }

  // Activate matching sidebar button
  const matchingBtn = document.querySelector(`.sidebar-menu-btn[data-target="${panelId}"]`);
  if (matchingBtn) {
    matchingBtn.classList.add('active');
  }

  // Update dynamic titles
  const titleEl = document.getElementById('panelTitle');
  const subtitleEl = document.getElementById('panelSubtitle');
  if (titleEl && subtitleEl) {
    const user = window.AppState.currentUser;
    if (panelId === 'panel-overview') {
      titleEl.textContent = 'Dashboard Overview';
      subtitleEl.textContent = user.role === 'candidate' 
        ? 'Track your progress and view updates' 
        : 'Recruitment statistics and candidate pipelines';
    } else if (panelId === 'panel-applications') {
      titleEl.textContent = 'My Applications';
      subtitleEl.textContent = 'Track the status of all your submitted job applications';
    } else if (panelId === 'panel-bookmarks') {
      titleEl.textContent = 'Bookmarked Jobs';
      subtitleEl.textContent = 'Manage your saved jobs and apply easily';
    } else if (panelId === 'panel-profile') {
      titleEl.textContent = 'Profile & Resume';
      subtitleEl.textContent = 'Build a premium profile to stand out to employers';
    } else if (panelId === 'panel-manage-jobs') {
      titleEl.textContent = 'Manage Jobs';
      subtitleEl.textContent = 'Create, edit, or delete your active job listings';
    } else if (panelId === 'panel-post-job') {
      const jobId = document.getElementById('postJobId').value;
      titleEl.textContent = jobId ? 'Edit Job Opening' : 'Post a Job';
      subtitleEl.textContent = 'Provide accurate details to attract qualified candidates';
    } else if (panelId === 'panel-view-applicants') {
      titleEl.textContent = 'View Applicants';
      subtitleEl.textContent = 'Review applications, check resumes, and shortlist talent';
    } else if (panelId === 'panel-company-profile') {
      titleEl.textContent = 'Company Profile';
      subtitleEl.textContent = 'Customize details that candidates see on listings';
    }
  }
}

// Helper switch external trigger
window.switchTab = switchTab;

// --- CANDIDATE DASHBOARD CONTROLLER ---
function initCandidateDashboard() {
  const user = window.AppState.currentUser;
  
  // Fill sidebar
  document.getElementById('sidebarName').textContent = user.profile.name;
  document.getElementById('sidebarAvatar').src = user.profile.logo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&q=80';

  // Fill profile details form
  document.getElementById('profileName').value = user.profile.name;
  document.getElementById('profileTitle').value = user.profile.title || '';
  document.getElementById('profileLocation').value = user.profile.location || '';
  document.getElementById('profileEmail').value = user.email;
  document.getElementById('profileBio').value = user.profile.bio || '';
  document.getElementById('profileEducation').value = user.profile.education || '';
  document.getElementById('profileExperience').value = user.profile.experience || '';
  document.getElementById('profileUploaderName').textContent = user.profile.name;
  document.getElementById('profileUploaderTitle').textContent = user.profile.title || 'Developer';
  document.getElementById('profileAvatarImg').src = user.profile.logo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&q=80';

  // Initialize skills tags
  activeSkillsList = user.profile.skills || [];
  renderSkillsTags();

  // Setup Skills tag listener
  setupSkillsTagsInput();

  // Setup profile image change
  setupAvatarUploader('avatarFileInput', 'profileAvatarImg', (base64) => {
    updateCandidateField('logo', base64);
    document.getElementById('sidebarAvatar').src = base64;
  });

  // Setup Candidate resume uploader
  setupCandidateResumeUploader();

  // Render applications tables
  renderCandidateApplications();

  // Render bookmarked list
  renderCandidateBookmarks();

  // Form submit
  document.getElementById('profileEditForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Save state
    const editUser = window.AppState.currentUser;
    editUser.profile.name = document.getElementById('profileName').value.trim();
    editUser.profile.title = document.getElementById('profileTitle').value.trim();
    editUser.profile.location = document.getElementById('profileLocation').value.trim();
    editUser.profile.bio = document.getElementById('profileBio').value.trim();
    editUser.profile.education = document.getElementById('profileEducation').value.trim();
    editUser.profile.experience = document.getElementById('profileExperience').value.trim();
    editUser.profile.skills = activeSkillsList;

    saveUserUpdates(editUser);
    showToast('Profile updated successfully!', 'success');

    // Update uploader texts
    document.getElementById('profileUploaderName').textContent = editUser.profile.name;
    document.getElementById('profileUploaderTitle').textContent = editUser.profile.title || 'Developer';
    document.getElementById('sidebarName').textContent = editUser.profile.name;
  });
}

// Update single candidate field helper
function updateCandidateField(key, val) {
  const user = window.AppState.currentUser;
  user.profile[key] = val;
  saveUserUpdates(user);
}

// Save back to user lists helper
function saveUserUpdates(updatedUser) {
  localStorage.setItem('job-board-current-user', JSON.stringify(updatedUser));
  window.AppState.currentUser = updatedUser;

  const users = JSON.parse(localStorage.getItem('job-board-users')) || [];
  const index = users.findIndex(u => u.id === updatedUser.id);
  if (index > -1) {
    users[index] = updatedUser;
    localStorage.setItem('job-board-users', JSON.stringify(users));
  }
}

// Skills Tag editor functions
function setupSkillsTagsInput() {
  const input = document.getElementById('skillsInput');
  if (!input) return;

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = input.value.trim();
      if (val && !activeSkillsList.includes(val)) {
        activeSkillsList.push(val);
        input.value = '';
        renderSkillsTags();
      }
    }
  });
}

function renderSkillsTags() {
  const wrapper = document.getElementById('skillsInputWrapper');
  const input = document.getElementById('skillsInput');
  if (!wrapper || !input) return;

  // Remove existing tags
  const existingTags = wrapper.querySelectorAll('.skill-tag');
  existingTags.forEach(t => t.remove());

  // Insert active list before the input element
  activeSkillsList.forEach((skill, idx) => {
    const tag = document.createElement('span');
    tag.className = 'skill-tag';
    tag.innerHTML = `${skill} <i class="fas fa-times" onclick="removeSkillTag(${idx})"></i>`;
    wrapper.insertBefore(tag, input);
  });
}

window.removeSkillTag = function(idx) {
  activeSkillsList.splice(idx, 1);
  renderSkillsTags();
};

// Candidate resume upload simulator
function setupCandidateResumeUploader() {
  const dropzone = document.getElementById('dashResumeDropzone');
  const fileInput = document.getElementById('dashResumeFileInput');
  const fileInfo = document.getElementById('dashResumeFileInfo');
  
  if (!dropzone) return;

  const user = window.AppState.currentUser;
  if (user.profile.resumeName) {
    displayDashResumeInfo(user.profile.resumeName);
  }

  window.triggerDashResumeUpload = () => {
    fileInput.click();
  };

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Update user CV profile
      updateCandidateField('resumeName', file.name);
      displayDashResumeInfo(file.name);
      showToast(`Uploaded resume: ${file.name}`, 'success');
      
      // Update metrics resume label
      document.getElementById('metricResumeStatus').textContent = 'Active';
      document.getElementById('metricResumeStatus').style.color = 'var(--secondary)';
    }
  });
}

function displayDashResumeInfo(name) {
  document.getElementById('dashResumeDropzone').style.display = 'none';
  document.getElementById('dashResumeFileInfo').style.display = 'flex';
  document.getElementById('dashResumeName').textContent = name;
}

window.removeDashResume = function(e) {
  e.stopPropagation();
  updateCandidateField('resumeName', '');
  document.getElementById('dashResumeDropzone').style.display = 'block';
  document.getElementById('dashResumeFileInfo').style.display = 'none';
  document.getElementById('dashResumeFileInput').value = '';
  
  // Update metrics resume label
  document.getElementById('metricResumeStatus').textContent = 'Incomplete';
  document.getElementById('metricResumeStatus').style.color = 'var(--danger)';
  showToast('Resume file removed from profile.', 'info');
};

// Render Candidate applications
function renderCandidateApplications() {
  const recentTable = document.getElementById('recentAppsTableBody');
  const allTable = document.getElementById('allAppsTableBody');
  if (!recentTable || !allTable) return;

  const user = window.AppState.currentUser;
  const allApps = window.AppState.applications || [];
  const candidateApps = allApps.filter(app => app.candidateId === user.id);
  const jobs = window.AppState.jobs || [];

  // Update metrics counter
  document.getElementById('metricAppsCount').textContent = candidateApps.length;
  
  // Set resume completeness metric status
  const resumeStatusEl = document.getElementById('metricResumeStatus');
  if (user.profile.resumeName) {
    resumeStatusEl.textContent = 'Active';
    resumeStatusEl.style.color = 'var(--secondary)';
  } else {
    resumeStatusEl.textContent = 'Incomplete';
    resumeStatusEl.style.color = 'var(--danger)';
  }

  if (candidateApps.length === 0) {
    const emptyRow = `<tr><td colspan="4" style="text-align: center;" class="text-muted">You have not submitted any applications yet.</td></tr>`;
    recentTable.innerHTML = `<tr><td colspan="3" style="text-align: center;" class="text-muted">No applications found.</td></tr>`;
    allTable.innerHTML = emptyRow;
    return;
  }

  // Sort candidate applications by date desc
  candidateApps.sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));

  // Render recent 3 applications
  const recentApps = candidateApps.slice(0, 3);
  recentTable.innerHTML = recentApps.map(app => {
    const job = jobs.find(j => j.id === app.jobId) || { title: 'Unknown Job', companyName: 'Unknown Company', companyLogo: '' };
    return `
      <tr>
        <td>
          <div class="table-job-info">
            <img src="${job.companyLogo || 'https://images.unsplash.com/photo-1561070791-26c113006238?w=100&h=100&fit=crop&q=80'}" alt="" class="table-job-logo">
            <div class="table-job-meta">
              <h4>${job.title}</h4>
              <span>${job.companyName}</span>
            </div>
          </div>
        </td>
        <td>${formatDate(app.appliedDate)}</td>
        <td>${getStatusBadge(app.status)}</td>
      </tr>
    `;
  }).join('');

  // Render all applications list
  allTable.innerHTML = candidateApps.map(app => {
    const job = jobs.find(j => j.id === app.jobId) || { id: '', title: 'Unknown Job', companyName: 'Unknown Company', companyLogo: '' };
    return `
      <tr>
        <td>
          <div class="table-job-info">
            <img src="${job.companyLogo || 'https://images.unsplash.com/photo-1561070791-26c113006238?w=100&h=100&fit=crop&q=80'}" alt="" class="table-job-logo">
            <div class="table-job-meta">
              <h4>${job.title}</h4>
              <span>${job.companyName}</span>
            </div>
          </div>
        </td>
        <td>${formatDate(app.appliedDate)}</td>
        <td>${getStatusBadge(app.status)}</td>
        <td>
          <div class="table-actions">
            ${job.id ? `<a href="job-details.html?id=${job.id}" class="btn btn-secondary btn-sm" style="padding: 6px 12px;"><i class="fas fa-eye"></i> View Job</a>` : ''}
            <button onclick="withdrawApplication('${app.id}')" class="btn btn-danger btn-sm" style="padding: 6px 12px;" ${app.status !== 'Pending' ? 'disabled title="Only pending applications can be withdrawn"' : ''}><i class="fas fa-trash-alt"></i> Withdraw</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.withdrawApplication = function(appId) {
  if (!confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) return;

  let allApps = JSON.parse(localStorage.getItem('job-board-applications')) || [];
  const index = allApps.findIndex(app => app.id === appId);

  if (index > -1) {
    allApps.splice(index, 1);
    localStorage.setItem('job-board-applications', JSON.stringify(allApps));
    window.AppState.applications = allApps;
    showToast('Application withdrawn successfully', 'info');
    renderCandidateApplications(); // reload
  }
};

// Render Candidate bookmarks
function renderCandidateBookmarks() {
  const container = document.getElementById('bookmarksContainer');
  if (!container) return;

  const user = window.AppState.currentUser;
  const bookmarks = window.AppState.bookmarks || [];
  const candidateBookmarks = bookmarks.filter(b => b.candidateId === user.id);
  const jobs = window.AppState.jobs || [];

  // Update metrics counter
  document.getElementById('metricBookmarksCount').textContent = candidateBookmarks.length;

  if (candidateBookmarks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><i class="far fa-bookmark"></i></div>
        <h3>No bookmarked jobs</h3>
        <p>Save job openings from the listing page to review them here later.</p>
        <a href="jobs.html" class="btn btn-primary btn-sm">Find Jobs Now</a>
      </div>
    `;
    return;
  }

  container.innerHTML = candidateBookmarks.map(b => {
    const job = jobs.find(j => j.id === b.jobId);
    if (!job) return '';

    return `
      <div class="job-card" style="flex-direction: row; align-items: center; justify-content: space-between; gap: 24px; text-align: left; padding: 20px;">
        <div class="flex align-center gap-3">
          <img src="${job.companyLogo || 'https://images.unsplash.com/photo-1561070791-26c113006238?w=100&h=100&fit=crop&q=80'}" alt="" class="company-logo-img" style="width: 44px; height: 44px;">
          <div>
            <h3 class="job-card-title" style="font-size: 1.15rem; margin-bottom: 2px;">${job.title}</h3>
            <div class="job-card-company" style="margin-bottom: 0;">${job.companyName}</div>
          </div>
        </div>

        <div class="flex align-center gap-3">
          <span><i class="fas fa-map-marker-alt text-muted"></i> ${job.location}</span>
          <span class="job-salary" style="font-size: 1rem;">${job.salaryRange}</span>
          <a href="job-details.html?id=${job.id}" class="btn btn-primary btn-sm" style="padding: 6px 12px;">Apply</a>
          <button onclick="removeBookmarkDash('${job.id}')" class="btn btn-secondary btn-sm" style="padding: 6px 12px; color: var(--danger);"><i class="fas fa-trash-alt"></i> Remove</button>
        </div>
      </div>
    `;
  }).join('');
}

window.removeBookmarkDash = function(jobId) {
  const user = window.AppState.currentUser;
  let bookmarks = JSON.parse(localStorage.getItem('job-board-bookmarks')) || [];
  const idx = bookmarks.findIndex(b => b.candidateId === user.id && b.jobId === jobId);

  if (idx > -1) {
    bookmarks.splice(idx, 1);
    localStorage.setItem('job-board-bookmarks', JSON.stringify(bookmarks));
    window.AppState.bookmarks = bookmarks;
    showToast('Job removed from bookmarks.', 'info');
    renderCandidateBookmarks(); // reload
  }
};

// --- EMPLOYER DASHBOARD CONTROLLER ---
function initEmployerDashboard() {
  const user = window.AppState.currentUser;

  // Fill sidebar info
  document.getElementById('sidebarName').textContent = user.profile.companyName || user.profile.name;
  document.getElementById('sidebarAvatar').src = user.profile.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop&q=80';

  // Prefill company details form
  document.getElementById('compName').value = user.profile.companyName || user.profile.name;
  document.getElementById('compWebsite').value = user.profile.website || '';
  document.getElementById('compLoc').value = user.profile.location || '';
  document.getElementById('compBio').value = user.profile.bio || '';
  document.getElementById('compProfileName').textContent = user.profile.companyName || user.profile.name;
  document.getElementById('compProfileLocation').textContent = user.profile.location || 'Location not specified';
  document.getElementById('compLogoImg').src = user.profile.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop&q=80';

  // Setup company logo uploader
  setupAvatarUploader('compLogoInput', 'compLogoImg', (base64) => {
    updateCandidateField('logo', base64);
    document.getElementById('sidebarAvatar').src = base64;
  });

  // Render employer elements
  renderEmployerMetricsAndFunnel();
  renderEmployerJobsTable();
  renderEmployerApplicants();

  // Setup Job Posting Form Submit
  setupPostJobFormSubmit();

  // Company Profile form save submit
  document.getElementById('companyEditForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const editUser = window.AppState.currentUser;
    const companyName = document.getElementById('compName').value.trim();
    editUser.profile.companyName = companyName;
    editUser.profile.name = companyName; // sync
    editUser.profile.website = document.getElementById('compWebsite').value.trim();
    editUser.profile.location = document.getElementById('compLoc').value.trim();
    editUser.profile.bio = document.getElementById('compBio').value.trim();

    saveUserUpdates(editUser);
    showToast('Company profile saved!', 'success');

    // Update headers
    document.getElementById('compProfileName').textContent = companyName;
    document.getElementById('compProfileLocation').textContent = editUser.profile.location || 'Location not specified';
    document.getElementById('sidebarName').textContent = companyName;
  });
}

// Render Employer Stats metrics
function renderEmployerMetricsAndFunnel() {
  const user = window.AppState.currentUser;
  const jobs = window.AppState.jobs || [];
  const employerJobs = jobs.filter(j => j.employerId === user.id);

  const allApps = window.AppState.applications || [];
  
  // Candidates count applied for my jobs
  const employerJobIds = employerJobs.map(j => j.id);
  const myApplicants = allApps.filter(app => employerJobIds.includes(app.jobId));

  document.getElementById('metricJobsCount').textContent = employerJobs.length;
  document.getElementById('metricActiveListingsCount').textContent = employerJobs.length; // assuming all are active
  document.getElementById('metricCandidatesCount').textContent = myApplicants.length;

  // funnel breakdown calculations
  if (myApplicants.length === 0) {
    updateFunnelUI(0, 0, 0);
    return;
  }

  const pendingCount = myApplicants.filter(a => a.status === 'Pending').length;
  const acceptedCount = myApplicants.filter(a => a.status === 'Accepted').length;
  const rejectedCount = myApplicants.filter(a => a.status === 'Rejected').length;

  const getPercent = (count) => Math.round((count / myApplicants.length) * 100);

  updateFunnelUI(getPercent(pendingCount), getPercent(acceptedCount), getPercent(rejectedCount));
}

function updateFunnelUI(pending, accepted, rejected) {
  document.getElementById('funnelPendingPercent').textContent = `${pending}%`;
  document.getElementById('funnelPendingBar').style.width = `${pending}%`;

  document.getElementById('funnelAcceptedPercent').textContent = `${accepted}%`;
  document.getElementById('funnelAcceptedBar').style.width = `${accepted}%`;

  document.getElementById('funnelRejectedPercent').textContent = `${rejected}%`;
  document.getElementById('funnelRejectedBar').style.width = `${rejected}%`;
}

// Render Employer Manage Jobs table
function renderEmployerJobsTable() {
  const tableBody = document.getElementById('manageJobsTableBody');
  if (!tableBody) return;

  const user = window.AppState.currentUser;
  const jobs = window.AppState.jobs || [];
  const myJobs = jobs.filter(j => j.employerId === user.id);
  const allApps = window.AppState.applications || [];

  if (myJobs.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center;" class="text-muted">You have not posted any jobs yet.</td></tr>`;
    return;
  }

  tableBody.innerHTML = myJobs.map(job => {
    const applicantsCount = allApps.filter(app => app.jobId === job.id).length;
    return `
      <tr>
        <td>
          <div class="table-job-meta" style="padding-left: 0;">
            <h4 style="font-size: 1rem;">${job.title}</h4>
            <span>${job.category}</span>
          </div>
        </td>
        <td>
          <div class="flex flex-direction-column gap-1" style="font-size: 0.9rem;">
            <span><i class="fas fa-map-marker-alt text-muted" style="width: 14px;"></i> ${job.location}</span>
            <span><i class="far fa-clock text-muted" style="width: 14px;"></i> ${job.type}</span>
          </div>
        </td>
        <td>
          <span class="badge badge-primary" style="font-size: 0.85rem; padding: 6px 14px;">${applicantsCount} Candidate${applicantsCount === 1 ? '' : 's'}</span>
        </td>
        <td>
          <div class="table-actions">
            <button onclick="editJobOpening('${job.id}')" class="btn btn-secondary btn-sm" style="padding: 6px 12px;"><i class="fas fa-edit"></i> Edit</button>
            <button onclick="deleteJobOpening('${job.id}')" class="btn btn-danger btn-sm" style="padding: 6px 12px;"><i class="fas fa-trash-alt"></i> Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Delete job listing function
window.deleteJobOpening = function(jobId) {
  if (!confirm('Are you sure you want to delete this job listing? All submitted applications for this job will also be removed.')) return;

  // 1. Remove job from jobs list
  let jobs = JSON.parse(localStorage.getItem('job-board-jobs')) || [];
  jobs = jobs.filter(j => j.id !== jobId);
  localStorage.setItem('job-board-jobs', JSON.stringify(jobs));
  window.AppState.jobs = jobs;

  // 2. Remove associated applications
  let apps = JSON.parse(localStorage.getItem('job-board-applications')) || [];
  apps = apps.filter(app => app.jobId !== jobId);
  localStorage.setItem('job-board-applications', JSON.stringify(apps));
  window.AppState.applications = apps;

  showToast('Job opening deleted successfully.', 'info');
  
  // Reload employer stats & views
  renderEmployerMetricsAndFunnel();
  renderEmployerJobsTable();
  renderEmployerApplicants();
};

// Edit job opening: loads form details and redirects
window.editJobOpening = function(jobId) {
  const jobs = window.AppState.jobs || [];
  const job = jobs.find(j => j.id === jobId);
  if (!job) return;

  // Populate Post job form fields
  document.getElementById('postJobId').value = job.id;
  document.getElementById('postJobTitle').value = job.title;
  document.getElementById('postJobCategory').value = job.category;
  document.getElementById('postJobLocation').value = job.location;
  document.getElementById('postJobType').value = job.type;
  document.getElementById('postJobSalaryMin').value = job.salaryMin;
  document.getElementById('postJobSalaryMax').value = job.salaryMax;
  document.getElementById('postJobDescription').value = job.description;

  // Map array items back to text rows
  document.getElementById('postJobRequirements').value = job.requirements.join('\n');
  document.getElementById('postJobResponsibilities').value = job.responsibilities.join('\n');
  document.getElementById('postJobSkills').value = job.skills.join(', ');

  // Update button details & headers
  document.getElementById('postFormSectionTitle').textContent = 'Edit Job Opening Details';
  document.getElementById('postSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Save Job Changes';

  // Navigate to Post Panel sheet
  switchTab('panel-post-job');
};

// Cancel edit and clean form
window.cancelPostEdit = function() {
  resetPostForm();
  switchTab('panel-manage-jobs');
};

function resetPostForm() {
  document.getElementById('postJobId').value = '';
  document.getElementById('postJobForm').reset();
  
  document.getElementById('postFormSectionTitle').textContent = 'Create New Job Opening';
  document.getElementById('postSubmitBtn').innerHTML = '<i class="fas fa-paper-plane"></i> Publish Job Listing';
}

window.openPostJobTab = function() {
  resetPostForm();
  switchTab('panel-post-job');
};

// Submit job post/edit opening
function setupPostJobFormSubmit() {
  const form = document.getElementById('postJobForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const jobId = document.getElementById('postJobId').value;
    const title = document.getElementById('postJobTitle').value.trim();
    const category = document.getElementById('postJobCategory').value;
    const location = document.getElementById('postJobLocation').value.trim();
    const type = document.getElementById('postJobType').value;
    const salaryMin = parseInt(document.getElementById('postJobSalaryMin').value);
    const salaryMax = parseInt(document.getElementById('postJobSalaryMax').value);
    const description = document.getElementById('postJobDescription').value.trim();
    
    // Parse arrays
    const requirements = document.getElementById('postJobRequirements').value.split('\n').map(l => l.trim()).filter(l => l);
    const responsibilities = document.getElementById('postJobResponsibilities').value.split('\n').map(l => l.trim()).filter(l => l);
    
    // Parse comma separated skills
    const skills = document.getElementById('postJobSkills').value.split(',').map(s => s.trim()).filter(s => s);

    if (salaryMin > salaryMax) {
      showToast('Minimum salary cannot exceed maximum salary.', 'error');
      return;
    }

    const user = window.AppState.currentUser;
    let jobs = JSON.parse(localStorage.getItem('job-board-jobs')) || [];

    if (jobId) {
      // Editing
      const idx = jobs.findIndex(j => j.id === jobId);
      if (idx > -1) {
        jobs[idx].title = title;
        jobs[idx].category = category;
        jobs[idx].location = location;
        jobs[idx].type = type;
        jobs[idx].salaryMin = salaryMin;
        jobs[idx].salaryMax = salaryMax;
        jobs[idx].salaryRange = `$${salaryMin.toLocaleString()} - $${salaryMax.toLocaleString()}`;
        jobs[idx].description = description;
        jobs[idx].requirements = requirements;
        jobs[idx].responsibilities = responsibilities;
        jobs[idx].skills = skills;
        // Keep logo, company name, and employer id
        
        showToast('Job listing updated successfully!', 'success');
      }
    } else {
      // Creating new job
      const newJob = {
        id: 'job-' + Date.now(),
        employerId: user.id,
        title: title,
        companyName: user.profile.companyName || user.profile.name,
        companyLogo: user.profile.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop&q=80',
        salaryRange: `$${salaryMin.toLocaleString()} - $${salaryMax.toLocaleString()}`,
        salaryMin: salaryMin,
        salaryMax: salaryMax,
        location: location,
        type: type,
        category: category,
        postedDate: new Date().toISOString(),
        description: description,
        requirements: requirements,
        responsibilities: responsibilities,
        skills: skills
      };

      jobs.unshift(newJob); // place at top
      showToast('New job opening published successfully!', 'success');
    }

    // Save
    localStorage.setItem('job-board-jobs', JSON.stringify(jobs));
    window.AppState.jobs = jobs;

    // Reset, sync views, and redirect
    resetPostForm();
    renderEmployerMetricsAndFunnel();
    renderEmployerJobsTable();
    switchTab('panel-manage-jobs');
  });
}

// Render Employer View Applicants List
function renderEmployerApplicants() {
  const recentTable = document.getElementById('recentApplicantsBody');
  const allTable = document.getElementById('viewApplicantsTableBody');
  if (!recentTable || !allTable) return;

  const user = window.AppState.currentUser;
  const jobs = window.AppState.jobs || [];
  const myJobIds = jobs.filter(j => j.employerId === user.id).map(j => j.id);

  const allApps = window.AppState.applications || [];
  const myApplicants = allApps.filter(app => myJobIds.includes(app.jobId));

  if (myApplicants.length === 0) {
    const emptyRow = `<tr><td colspan="5" style="text-align: center;" class="text-muted">No candidate applications found yet.</td></tr>`;
    recentTable.innerHTML = `<tr><td colspan="3" style="text-align: center;" class="text-muted">No applicants found.</td></tr>`;
    allTable.innerHTML = emptyRow;
    return;
  }

  // Sort by date desc
  myApplicants.sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));

  // Render recent 4 candidates on overview panel
  const recentApplicants = myApplicants.slice(0, 4);
  recentTable.innerHTML = recentApplicants.map(app => {
    const job = jobs.find(j => j.id === app.jobId) || { title: 'Unknown job' };
    return `
      <tr>
        <td>
          <div class="table-job-meta" style="padding-left: 0;">
            <h4 style="font-size: 0.95rem;">${app.candidateName}</h4>
            <span>${app.candidateEmail}</span>
          </div>
        </td>
        <td>${job.title}</td>
        <td>${getStatusBadge(app.status)}</td>
      </tr>
    `;
  }).join('');

  // Render all candidates list on applicants panel
  allTable.innerHTML = myApplicants.map(app => {
    const job = jobs.find(j => j.id === app.jobId) || { title: 'Unknown job' };
    return `
      <tr>
        <td>
          <div class="table-job-meta" style="padding-left: 0;">
            <h4 style="font-size: 0.95rem;">${app.candidateName}</h4>
            <span>${app.candidateEmail}</span>
          </div>
        </td>
        <td>${job.title}</td>
        <td>${formatDate(app.appliedDate)}</td>
        <td>${getStatusBadge(app.status)}</td>
        <td>
          <div class="table-actions">
            <button onclick="reviewApplicantDetails('${app.id}')" class="btn btn-secondary btn-sm" style="padding: 6px 12px;"><i class="fas fa-user-search"></i> Review Details</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Review applicant details modal trigger
window.reviewApplicantDetails = function(appId) {
  const allApps = window.AppState.applications || [];
  const app = allApps.find(a => a.id === appId);
  if (!app) return;

  activeApplicationReview = app;

  const modal = document.getElementById('applicantModalOverlay');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Fill modal
  document.getElementById('appModalCandidateName').textContent = app.candidateName;
  document.getElementById('appModalCandidateTitle').textContent = `Applied: ${app.candidateEmail}`;
  document.getElementById('appModalCoverText').textContent = app.coverLetter || 'No cover letter provided by candidate.';
  document.getElementById('appModalResumeName').textContent = app.resumeName || 'cv_file.pdf';
  document.getElementById('appModalResumeSize').textContent = app.candidateId === 'guest' ? 'Guest CV File' : 'Profile CV';

  // Modal actions handlers
  document.getElementById('btnModalAccept').onclick = () => {
    updateApplicationReviewStatus('Accepted');
  };
  document.getElementById('btnModalReject').onclick = () => {
    updateApplicationReviewStatus('Rejected');
  };
};

function closeApplicantModal() {
  const modal = document.getElementById('applicantModalOverlay');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

window.closeApplicantModal = closeApplicantModal;

// Update status inside the review modal
function updateApplicationReviewStatus(status) {
  if (!activeApplicationReview) return;

  let allApps = JSON.parse(localStorage.getItem('job-board-applications')) || [];
  const idx = allApps.findIndex(a => a.id === activeApplicationReview.id);

  if (idx > -1) {
    allApps[idx].status = status;
    localStorage.setItem('job-board-applications', JSON.stringify(allApps));
    window.AppState.applications = allApps;

    // Send mock notification email to applicant
    const jobs = window.AppState.jobs || [];
    const job = jobs.find(j => j.id === activeApplicationReview.jobId) || { title: 'opening' };
    
    sendSimulatedNotification(
      activeApplicationReview.candidateId,
      `Application ${status}: ${job.title}`,
      `Your application status for the position of ${job.title} has been updated to: ${status}.`
    );

    showToast(`Applicant status marked as: ${status}`, 'success');
    closeApplicantModal();
    
    // Refresh employer admin panels
    renderEmployerMetricsAndFunnel();
    renderEmployerApplicants();
  }
}

// Download CV mock trigger
window.downloadMockCv = function() {
  if (activeApplicationReview) {
    showToast(`Downloading candidate resume: ${activeApplicationReview.resumeName || 'CV.pdf'}`, 'success');
  }
};

// --- SHARED UTILITY FUNCTIONS ---

// Date formatting helper
function formatDate(isoString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(isoString).toLocaleDateString(undefined, options);
}

// Return HTML status tags
function getStatusBadge(status) {
  if (status === 'Pending') return `<span class="badge badge-warning">Under Review</span>`;
  if (status === 'Accepted') return `<span class="badge badge-secondary">Accepted</span>`;
  if (status === 'Rejected') return `<span class="badge badge-danger">Rejected</span>`;
  return `<span class="badge badge-neutral">${status}</span>`;
}

// Shared Avatar base64 parser
function setupAvatarUploader(inputId, imgId, successCallback) {
  const fileInput = document.getElementById(inputId);
  const imgEl = document.getElementById(imgId);
  if (!fileInput || !imgEl) return;

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const base64 = event.target.result;
        imgEl.src = base64;
        successCallback(base64);
        showToast('Image uploaded successfully!', 'info');
      };
      
      reader.readAsDataURL(file);
    }
  });
}
