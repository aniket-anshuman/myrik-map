// ============================================================
// Issue Reporting System - Main Application
// ============================================================

class IssueReportingApp {
  constructor() {
    console.log('👷 IssueReportingApp constructor called');
    this.issues = [];
    this.filteredIssues = [];
    this.currentImageFile = null;
    this.apiBaseUrl = 'http://localhost:3000/api';
    this.listenersSetup = false; // Prevent duplicate listeners
    this.attachedListeners = new Set(); // Track which elements have listeners
    this.categories = [
      'Road Damage',
      'Pothole',
      'Street Light',
      'Sidewalk Issue',
      'Traffic Sign',
      'Drainage Issue',
      'Vegetation Issue',
      'Other'
    ];

    this.init();
  }

  // ============================================================
  // Initialization
  // ============================================================

  init() {
    console.log('📍 IssueReportingApp.init() called, listenersSetup =', this.listenersSetup);
    this.loadIssuesFromAPI();
    this.setupEventListeners();
    this.populateCategoryFilter();
  }

  setupEventListeners() {
    console.log('🔧 Parent setupEventListeners() called, listenersSetup =', this.listenersSetup);
    // Only setup listeners once
    if (this.listenersSetup) {
      console.log('⚠️ Listeners already setup, skipping');
      return;
    }

    this.listenersSetup = true;
    console.log('✅ Setting listenersSetup = true, adding listeners');

    // Form submission - only add listener once
    const issueForm = document.getElementById('issueForm');
    if (issueForm && !this.attachedListeners.has('issueForm')) {
      issueForm.addEventListener('submit', (e) => {
        console.log('📝 Form submit event triggered');
        this.handleFormSubmit(e);
      });
      this.attachedListeners.add('issueForm');
    }

    // Image upload
    const uploadArea = document.getElementById('uploadArea');
    const imageInput = document.getElementById('imageInput');

    if (uploadArea && imageInput && !this.attachedListeners.has('uploadArea')) {
      // Click handler - open file picker
      uploadArea.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('🖱️ Upload area clicked, opening file picker');
        imageInput.click();
      });

      // Change handler - process selected file
      imageInput.addEventListener('change', (e) => {
        console.log('📂 File selected, processing');
        this.handleImageSelect(e);
      });

      // Drag and drop
      uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.style.background = '#f0f2ff';
      });

      uploadArea.addEventListener('dragleave', (e) => {
        e.stopPropagation();
        uploadArea.style.background = '#f8f9ff';
      });

      uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.style.background = '#f8f9ff';
        if (e.dataTransfer.files.length > 0) {
          console.log('📥 File dropped, processing');
          // Only call handleImageSelect directly, don't set imageInput.files
          // to avoid triggering the change event
          this.handleImageSelect({ target: { files: e.dataTransfer.files } });
        }
      });

      this.attachedListeners.add('uploadArea');
    }

    // Geolocation - only add listener once (check attachedListeners set)
    const getCurrentLocationBtn = document.getElementById('getCurrentLocation');
    if (getCurrentLocationBtn && !this.attachedListeners.has('getCurrentLocation')) {
      console.log('📍 Adding listener to getCurrentLocation button');
      getCurrentLocationBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🎯 Get current location CLICKED');
        this.getCurrentLocation();
      });
      this.attachedListeners.add('getCurrentLocation');
      console.log('✅ Geolocation listener added successfully');
    } else if (this.attachedListeners.has('getCurrentLocation')) {
      console.log('⚠️ getCurrentLocation listener already attached, skipping');
    }

    // Search and filter
    const searchInput = document.getElementById('searchInput');
    if (searchInput && !this.attachedListeners.has('searchInput')) {
      searchInput.addEventListener('input', (e) =>
        this.filterIssues(e.target.value)
      );
      this.attachedListeners.add('searchInput');
    }

    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter && !this.attachedListeners.has('categoryFilter')) {
      categoryFilter.addEventListener('change', (e) =>
        this.filterByCategory(e.target.value)
      );
      this.attachedListeners.add('categoryFilter');
    }

    // Tabs - only add listeners once (extended class uses setupTabNavigation instead)
    if (!this.attachedListeners.has('tab-buttons')) {
      document.querySelectorAll('.tab-btn').forEach((btn) => {
        btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
      });
      this.attachedListeners.add('tab-buttons');
    }

    // Modal
    const closeModal = document.getElementById('closeModal');
    const imageModal = document.getElementById('imageModal');
    if (closeModal && !this.attachedListeners.has('closeModal')) {
      closeModal.addEventListener('click', () =>
        this.closeImageModal()
      );
      this.attachedListeners.add('closeModal');
    }
    if (imageModal && !this.attachedListeners.has('imageModal')) {
      imageModal.addEventListener('click', (e) => {
        if (e.target.id === 'imageModal') {
          this.closeImageModal();
        }
      });
      this.attachedListeners.add('imageModal');
    }
  }

  // ============================================================
  // Form Handling
  // ============================================================

  async handleFormSubmit(e) {
    e.preventDefault();

    // Get form data
    const formData = new FormData(document.getElementById('issueForm'));
    const issue = formData.get('issue');
    const category = formData.get('category');
    const latitude = parseFloat(formData.get('latitude'));
    const longitude = parseFloat(formData.get('longitude'));

    // Validate
    if (!this.currentImageFile) {
      this.showAlert('Please select an image', 'danger');
      return;
    }

    if (!this.validateCoordinates(latitude, longitude)) {
      this.showAlert('Invalid coordinates', 'danger');
      return;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue: issue,
          category: category,
          latitude: latitude,
          longitude: longitude,
          imageData: this.currentImageFile,
          imageName: this.currentImageFile.name || 'image'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error creating issue');
      }

      this.resetForm();
      this.loadIssuesFromAPI();
      this.showAlert('Issue reported successfully!', 'success');
    } catch (error) {
      console.error('Error:', error);
      this.showAlert(`Error: ${error.message}`, 'danger');
    }
  }

  // ============================================================
  // Image Handling
  // ============================================================

  handleImageSelect(e) {
    const file = e.target.files[0];

    if (!file) return;

    // Validate file
    if (!this.validateImageFile(file)) {
      this.showAlert('Invalid file. Only images up to 5MB allowed.', 'danger');
      return;
    }

    // Read file as base64
    const reader = new FileReader();
    reader.onload = (event) => {
      this.currentImageFile = {
        data: event.target.result,
        name: file.name,
        size: file.size,
        type: file.type
      };
      this.showImagePreview(event.target.result, file.name);
    };
    reader.readAsDataURL(file);
  }

  validateImageFile(file) {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    return allowedMimes.includes(file.type) && file.size <= maxSize;
  }

  showImagePreview(imageData, fileName) {
    const preview = document.getElementById('imagePreviewContainer');
    const nameDisplay = document.getElementById('imageName');

    preview.innerHTML = `<img src="${imageData}" class="image-preview" alt="Preview">`;
    nameDisplay.textContent = `✓ ${fileName}`;
  }

  // ============================================================
  // Geolocation
  // ============================================================

  getCurrentLocation() {
    if (!navigator.geolocation) {
      this.showAlert('Geolocation is not supported by your browser', 'warning');
      return;
    }

    document.getElementById('getCurrentLocation').disabled = true;
    document.getElementById('getCurrentLocation').textContent = '📍 Getting location...';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        document.getElementById('latitude').value = latitude.toFixed(6);
        document.getElementById('longitude').value = longitude.toFixed(6);
        this.showAlert('Location retrieved successfully', 'success');
        document.getElementById('getCurrentLocation').disabled = false;
        document.getElementById('getCurrentLocation').textContent = '📍 Use Current Location';
      },
      (error) => {
        this.showAlert(`Location error: ${error.message}`, 'danger');
        document.getElementById('getCurrentLocation').disabled = false;
        document.getElementById('getCurrentLocation').textContent = '📍 Use Current Location';
      }
    );
  }

  // ============================================================
  // Issue Management
  // ============================================================

  async deleteIssue(id) {
    if (!confirm('Are you sure you want to delete this issue?')) return;

    try {
      const response = await fetch(`${this.apiBaseUrl}/issues/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error deleting issue');
      }

      this.loadIssuesFromAPI();
      this.showAlert('Issue deleted successfully', 'success');
    } catch (error) {
      console.error('Error:', error);
      this.showAlert(`Error: ${error.message}`, 'danger');
    }
  }

  async updateIssueStatus(id, status) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/issues/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: status })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error updating issue');
      }

      this.loadIssuesFromAPI();
      this.showAlert(`Issue marked as ${status}`, 'success');
    } catch (error) {
      console.error('Error:', error);
      this.showAlert(`Error: ${error.message}`, 'danger');
    }
  }

  // ============================================================
  // Rendering
  // ============================================================

  renderIssues() {
    this.renderAllIssues();
    this.renderOpenIssues();
    this.renderCompletedIssues();
    this.renderRecentIssues();
  }

  renderAllIssues() {
    const container = document.getElementById('issuesList');
    if (!container) return; // Skip if element doesn't exist

    console.log('Rendering all issues:', this.issues.length === 0);
    if (this.issues.length === 0) {
      container.innerHTML = this.getEmptyStateHTML();
      return;
    }
    console.log('Issues to render:', this.issues);
    container.innerHTML = this.issues.map((issue) => this.createIssueHTML(issue)).join('');
    this.attachIssueEventListeners();
  }

  renderOpenIssues() {
    const container = document.getElementById('openIssuesList');
    if (!container) return; // Skip if element doesn't exist

    const openIssues = this.issues.filter((i) => i.status === 'open');

    if (openIssues.length === 0) {
      container.innerHTML = this.getEmptyStateHTML('No open issues');
      return;
    }

    container.innerHTML = openIssues.map((issue) => this.createIssueHTML(issue)).join('');
    this.attachIssueEventListeners();
  }

  renderCompletedIssues() {
    const container = document.getElementById('completedIssuesList');
    if (!container) return; // Skip if element doesn't exist

    const completedIssues = this.issues.filter((i) => i.status === 'resolved');

    if (completedIssues.length === 0) {
      container.innerHTML = this.getEmptyStateHTML('No resolved issues');
      return;
    }

    container.innerHTML = completedIssues.map((issue) => this.createIssueHTML(issue)).join('');
    this.attachIssueEventListeners();
  }

  renderRecentIssues() {
    const container = document.getElementById('recentIssues');
    if (!container) return; // Skip if element doesn't exist

    const recent = this.issues.slice(0, 5);

    if (recent.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #999;">No issues yet</p>';
      return;
    }

    container.innerHTML = recent
      .map((issue) => {
        return `
        <div class="issue-item">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong>${this.escapeHtml(issue.issue)}</strong>
            <span class="issue-badge">${issue.category}</span>
          </div>
          <small style="color: #999;">${new Date(issue.createdAt).toLocaleDateString()}</small>
        </div>
      `;
      })
      .join('');
  }

  createIssueHTML(issue) {
    const date = new Date(issue.createdAt);
    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

    console.log('Creating HTML for issue:', issue);
    return `
      <div class="issue-item" data-id="${issue.id}">
        <div class="issue-header">
          <span class="issue-title">${this.escapeHtml(issue.issue)}</span>
          <span class="issue-badge">${issue.category}</span>
        </div>

        <div class="issue-details">
          <div class="issue-detail">
            <strong>📍</strong>
            <span>${issue.latitude.toFixed(4)}, ${issue.longitude.toFixed(4)}</span>
          </div>
          <div class="issue-detail">
            <strong>Status:</strong>
            <span>${issue.status}</span>
          </div>
        </div>

        ${
          issue.imageData
            ? `<img src="${issue.imageData.data}" class="issue-image" alt="Issue image" data-id="${issue.id}">`
            : ''
        }

        <div class="issue-actions">
          ${
            issue.status === 'open'
              ? `<button class="btn btn-secondary btn-small mark-progress" data-id="${issue.id}">In Progress</button>
                 <button class="btn btn-secondary btn-small mark-resolved" data-id="${issue.id}">✓ Resolved</button>`
              : `<button class="btn btn-secondary btn-small mark-open" data-id="${issue.id}">Reopen</button>`
          }
          <button class="btn btn-danger btn-small delete-issue" data-id="${issue.id}">Delete</button>
        </div>

        <div class="issue-date">Created: ${formattedDate}</div>
      </div>
    `;
  }

  getEmptyStateHTML(message = 'No issues reported yet') {
    return `
      <div class="empty-state">
        <p style="font-size: 1.2em; margin-bottom: 10px;">📭</p>
        <p>${message}</p>
      </div>
    `;
  }

  attachIssueEventListeners() {
    // Image click to open modal
    document.querySelectorAll('.issue-image').forEach((img) => {
      img.addEventListener('click', () => this.openImageModal(img));
    });

    // Delete buttons
    document.querySelectorAll('.delete-issue').forEach((btn) => {
      btn.addEventListener('click', () => this.deleteIssue(btn.dataset.id));
    });

    // Status buttons
    document.querySelectorAll('.mark-progress').forEach((btn) => {
      btn.addEventListener('click', () => this.updateIssueStatus(btn.dataset.id, 'in-progress'));
    });

    document.querySelectorAll('.mark-resolved').forEach((btn) => {
      btn.addEventListener('click', () => this.updateIssueStatus(btn.dataset.id, 'resolved'));
    });

    document.querySelectorAll('.mark-open').forEach((btn) => {
      btn.addEventListener('click', () => this.updateIssueStatus(btn.dataset.id, 'open'));
    });
  }

  // ============================================================
  // Statistics
  // ============================================================

  updateStatistics() {
    // Total count
    const totalCountEl = document.getElementById('totalCount');
    if (totalCountEl) {
      totalCountEl.textContent = this.issues.length;
    }

    // Open count
    const openCountEl = document.getElementById('openCount');
    if (openCountEl) {
      const openCount = this.issues.filter((i) => i.status === 'open').length;
      openCountEl.textContent = openCount;
    }

    // Category breakdown
    this.updateCategoryStats();
  }

  updateCategoryStats() {
    const container = document.getElementById('categoryStats');
    if (!container) return; // Skip if element doesn't exist

    const stats = {};

    this.issues.forEach((issue) => {
      stats[issue.category] = (stats[issue.category] || 0) + 1;
    });

    if (Object.keys(stats).length === 0) {
      container.innerHTML = '<p style="color: #999;">No data yet</p>';
      return;
    }

    const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]);

    container.innerHTML = sorted
      .map(
        ([category, count]) => `
      <div style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <strong>${category}</strong>
          <span style="background: #667eea; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.85em;">${count}</span>
        </div>
        <div style="background: #f0f0f0; height: 8px; border-radius: 4px; overflow: hidden;">
          <div style="background: linear-gradient(90deg, #667eea, #764ba2); height: 100%; width: ${
          (count / this.issues.length) * 100
        }%;" ></div>
        </div>
      </div>
    `
      )
      .join('');
  }

  // ============================================================
  // Filtering and Search
  // ============================================================

  filterIssues(searchTerm) {
    this.filteredIssues = this.issues.filter((issue) => {
      const search = searchTerm.toLowerCase();
      return (
        issue.issue.toLowerCase().includes(search) ||
        issue.category.toLowerCase().includes(search)
      );
    });

    this.renderFilteredIssues();
  }

  filterByCategory(category) {
    this.filteredIssues = category
      ? this.issues.filter((i) => i.category === category)
      : this.issues;

    this.renderFilteredIssues();
  }

  renderFilteredIssues() {
    const container = document.getElementById('issuesList');
    if (!container) return; // Skip if element doesn't exist

    if (this.filteredIssues.length === 0) {
      container.innerHTML = this.getEmptyStateHTML('No issues found');
      return;
    }

    container.innerHTML = this.filteredIssues
      .map((issue) => this.createIssueHTML(issue))
      .join('');
    this.attachIssueEventListeners();
  }

  populateCategoryFilter() {
    const filter = document.getElementById('categoryFilter');
    if (!filter) return; // Skip if element doesn't exist

    const options = this.categories
      .map((cat) => `<option value="${cat}">${cat}</option>`)
      .join('');
    filter.innerHTML = '<option value="">All Categories</option>' + options;
  }

  // ============================================================
  // Modal
  // ============================================================

  openImageModal(imgElement) {
    const issue = this.issues.find((i) => i.id === imgElement.dataset.id);
    if (!issue) return;

    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');

    if (!modal || !modalImg || !modalTitle) return; // Skip if elements don't exist

    if (issue.imageData) {
      modalImg.src = issue.imageData.data;
    }
    modalTitle.textContent = this.escapeHtml(issue.issue);
    modal.classList.add('active');
  }

  closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  // ============================================================
  // Tabs
  // ============================================================

  switchTab(tabName) {
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update content
    document.querySelectorAll('.tab-content').forEach((content) => {
      content.classList.remove('active');
    });
    console.log('Switching to tab:', tabName, document.getElementById(tabName));
    const tabContent = document.getElementById(tabName + 'Tab');
    if (tabContent) {
      tabContent.classList.add('active');
    }
  }

  // ============================================================
  // API Data Fetching
  // ============================================================

  async loadIssuesFromAPI(boundingBox = null) {
    try {
      let url = `${this.apiBaseUrl}/issues`;

      // If bounding box is provided, add it as query parameters for faster filtering
      if (boundingBox && boundingBox.minLat !== undefined) {
        const params = new URLSearchParams({
          minLat: boundingBox.minLat,
          maxLat: boundingBox.maxLat,
          minLng: boundingBox.minLng,
          maxLng: boundingBox.maxLng
        });
        url += `?${params.toString()}`;
        console.log(`📦 Fetching issues with bounding box: ${url}`);
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Error fetching issues');
      }

      const result = await response.json();
      console.log(`📥 Loaded ${result.data.length} issues from API`);
      this.issues = result.data || [];
      this.renderIssues();
      this.updateStatistics();
    } catch (error) {
      console.error('Error loading issues:', error);
      this.showAlert('Failed to load issues. Make sure the server is running on port 3000.', 'danger');
      this.issues = [];
    }
  }

  // ============================================================
  // Utilities
  // ============================================================

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  validateCoordinates(lat, lng) {
    return (
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  }

  resetForm() {
    console.log('🔄 Resetting form...');

    // Reset form and all inputs
    const issueForm = document.getElementById('issueForm');
    if (issueForm) {
      issueForm.reset();
    }

    // Clear image preview
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    if (imagePreviewContainer) {
      imagePreviewContainer.innerHTML = '';
    }

    // Clear image name
    const imageName = document.getElementById('imageName');
    if (imageName) {
      imageName.textContent = '';
    }

    // Clear image input completely
    const imageInput = document.getElementById('imageInput');
    if (imageInput) {
      imageInput.value = '';
    }

    // Clear stored image
    this.currentImageFile = null;

    // Clear coordinates
    const latInput = document.getElementById('latitude');
    const lngInput = document.getElementById('longitude');
    if (latInput) latInput.value = '';
    if (lngInput) lngInput.value = '';

    // Hide detected constituency box
    const detectedDiv = document.getElementById('detectedConstituency');
    if (detectedDiv) {
      detectedDiv.style.display = 'none';
    }

    console.log('✅ Form reset complete');
  }

  showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} show`;
    alertDiv.textContent = message;

    alertContainer.appendChild(alertDiv);

    setTimeout(() => {
      alertDiv.remove();
    }, 4000);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// ============================================================
// Initialize App
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  new IssueReportingApp();
});
