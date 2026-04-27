# Issue Reporting System - Setup Guide

## Overview
This is a location-based issue reporting system with a Leaflet map integration and SQLite database backend.

## Requirements
- Node.js 14+
- npm or yarn

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

## Quick Start (Recommended)

**Single command to start backend AND open UI:**
```bash
npm start
```

This will:
- ✅ Start the SQLite backend server on `http://localhost:3000`
- ✅ Automatically open `index-tabbed.html` in your browser
- ✅ Keep both running live

## Alternative Commands

**Start only the server (without opening browser):**
```bash
npm run server
```

**Development mode with auto-reload:**
```bash
npm run dev
```
Server will restart automatically when you change files.

## Manual Browser Access

If the browser doesn't open automatically, visit:
```
http://localhost:3000/index-tabbed.html
```

Or use one of these alternate UIs:
- `http://localhost:3000/index.html` - Basic tabbed interface
- `http://localhost:3000/index-with-map.html` - Map-focused view

## Database

- The application uses **SQLite** instead of localStorage
- Database file: `issues.db` (created automatically on first run)
- The database schema includes tables for:
  - `issues`: Main issue records
  - `comments`: Comments on issues

## API Endpoints

### Issues

- **GET** `/api/issues` - Get all issues
- **GET** `/api/issues?status=open` - Filter by status
- **GET** `/api/issues?category=Pothole` - Filter by category
- **GET** `/api/issues/:id` - Get single issue
- **POST** `/api/issues` - Create issue
- **PUT** `/api/issues/:id` - Update issue status/details
- **DELETE** `/api/issues/:id` - Delete issue

### Statistics

- **GET** `/api/statistics` - Get issue statistics and category breakdown

### Search

- **GET** `/api/search?q=search_term` - Search issues

### Comments

- **GET** `/api/issues/:id/comments` - Get comments for issue
- **POST** `/api/issues/:id/comments` - Add comment to issue

## Frontend

Open `index-with-map.html` in your browser to use the application.

### Features

1. **Report Issues**
   - Fill out issue description and category
   - Set location manually or use current location
   - Upload an image
   - Submit to database

2. **View Map**
   - Interactive Leaflet map showing all issues
   - Filter by status (open, in-progress, resolved)
   - Change map tiles (OpenStreetMap, Topographic, CartoDB, USGS)
   - Click markers to see issue details

3. **Manage Issues**
   - View all, open, or completed issues
   - Update issue status
   - Delete issues
   - View recent issues and statistics

4. **Statistics**
   - Total issue count
   - Open issues count
   - Category breakdown

## Data Storage

- All data is stored in SQLite database (`issues.db`)
- Images are stored as Base64 encoded data
- No more localStorage usage - everything goes through the API
