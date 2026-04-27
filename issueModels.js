// Issue Model/DTO
class Issue {
  constructor(issue, category, latitude, longitude, imageUrl, imageOriginalName) {
    this.id = this.generateId();
    this.issue = issue;
    this.category = category;
    this.latitude = latitude;
    this.longitude = longitude;
    this.imageUrl = imageUrl;
    this.imageOriginalName = imageOriginalName;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.status = 'open'; // open, in-progress, resolved, closed
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  toJSON() {
    return {
      id: this.id,
      issue: this.issue,
      category: this.category,
      latitude: this.latitude,
      longitude: this.longitude,
      imageUrl: this.imageUrl,
      createdAt: this.createdAt,
      status: this.status
    };
  }
}

// Request DTO for creating issue
class CreateIssueRequest {
  constructor(issue, category, latitude, longitude, image) {
    this.issue = issue;
    this.category = category;
    this.latitude = parseFloat(latitude);
    this.longitude = parseFloat(longitude);
    this.image = image;
  }

  validate() {
    const errors = [];

    if (!this.issue || this.issue.trim() === '') {
      errors.push('Issue description is required');
    }

    if (!this.category || this.category.trim() === '') {
      errors.push('Category is required');
    }

    if (isNaN(this.latitude) || this.latitude < -90 || this.latitude > 90) {
      errors.push('Latitude must be between -90 and 90');
    }

    if (isNaN(this.longitude) || this.longitude < -180 || this.longitude > 180) {
      errors.push('Longitude must be between -180 and 180');
    }

    if (!this.image) {
      errors.push('Image file is required');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}

// Response DTO
class ApiResponse {
  constructor(success, message, data = null, count = null) {
    this.success = success;
    this.message = message;
    if (data !== null) this.data = data;
    if (count !== null) this.count = count;
  }
}

// Error Response DTO
class ErrorResponse {
  constructor(message, error = null, statusCode = 500) {
    this.success = false;
    this.message = message;
    if (error) this.error = error;
    this.statusCode = statusCode;
  }
}

// Query Filter DTO
class IssueFilterQuery {
  constructor(category = null, latitude = null, longitude = null, radius = null, status = null) {
    this.category = category;
    this.latitude = latitude ? parseFloat(latitude) : null;
    this.longitude = longitude ? parseFloat(longitude) : null;
    this.radius = radius ? parseFloat(radius) : null; // in kilometers
    this.status = status;
  }
}

// Statistics DTO
class IssueStatistics {
  constructor(totalIssues, categories, byStatus, recent) {
    this.totalIssues = totalIssues;
    this.categories = categories;
    this.byStatus = byStatus;
    this.recentIssues = recent;
    this.generatedAt = new Date();
  }
}

module.exports = {
  Issue,
  CreateIssueRequest,
  ApiResponse,
  ErrorResponse,
  IssueFilterQuery,
  IssueStatistics
};
