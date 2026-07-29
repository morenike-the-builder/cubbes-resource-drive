# Cubbes Resource Drive

A crowdsourcing platform for academic materials with a public upload portal, admin review dashboard, and gamified leaderboard. Built with static HTML/CSS/JS frontend and Google Sheets + Apps Script backend.

## Features

✅ **Public Upload Portal** (`/index.html`)
- Multi-step form with university/department/course selection
- Cascade dropdowns from database
- Fallback for courses not in database
- File upload with drag-and-drop
- Support for PDF, DOCX, PNG, JPG (max 50MB)
- Legal verification checkbox

✅ **Admin Review Dashboard** (`/admin.html`)
- PIN-protected access
- Side-by-side review layout (file viewer + metadata)
- Course reassignment capability
- Approve, reject (with reasons), or flag submissions
- Real-time leaderboard updates on approval

✅ **Leaderboard** (`/leaderboard.html`)
- Ranked by approved submissions
- Filter by all-time or monthly
- Display user tag, upload count, and credits earned
- Medal badges for top 3

## Architecture

**Frontend**: Static HTML/CSS/JS
- No build step required
- Communicates with Apps Script via fetch
- LocalStorage for caching and session state

**Backend**: Google Apps Script
- Web App deployment (anyone can access)
- Reads/writes to Google Sheets
- Stores files in Google Drive
- Handles all API logic

**Database**: Google Sheets
- `Universities` - University list
- `Departments` - Departments per university
- `Courses` - Courses per department
- `Materials` - File submissions
- `Leaderboard` - User scores
- `FlaggedAccounts` - Spam/abuse accounts

## Setup Instructions

### 1. Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Rename it to "Cubbes Resource Drive"
4. Copy the **Sheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
   ```

### 2. Create Google Drive Folder

1. Go to [Google Drive](https://drive.google.com)
2. Create a new folder named "Cubbes Resource Drive - Files"
3. Right-click → Share and set to "Anyone with the link can view"
4. Copy the **Folder ID** from the URL:
   ```
   https://drive.google.com/drive/folders/FOLDER_ID_HERE
   ```

### 3. Deploy Google Apps Script

1. Go to [Google Apps Script](https://script.google.com)
2. Create a new project
3. Copy the entire contents of `Code.gs` from this repo
4. Update the CONFIG at the top:
   ```javascript
   const CONFIG = {
     SHEET_ID: "YOUR_GOOGLE_SHEET_ID", 
     DRIVE_FOLDER_ID: "YOUR_GOOGLE_DRIVE_FOLDER_ID",
     ADMIN_PIN: "change-to-secure-pin",
     CREDITS_PER_APPROVAL: 100,
   };
   ```
5. Click **Deploy** → **New deployment** → **Web app**
   - Execute as: `Your Email`
   - Who has access: `Anyone`
6. Copy the deployment URL (looks like `https://script.google.com/macros/s/AKfycbx.../exec`)

### 4. Configure Frontend

1. Edit `config.js` in this folder:
   ```javascript
   const CUBBES_CONFIG = {
     APPS_SCRIPT_URL: "YOUR_DEPLOYMENT_URL_HERE",
   };
   ```

### 5. Deploy Frontend

Option A: **Vercel** (Recommended)
```bash
npm i -g vercel
vercel
```
Follow prompts, connect to this folder. Your site will be live instantly.

Option B: **GitHub Pages**
1. Create a GitHub repo
2. Push this folder's contents
3. Go to Settings → Pages
4. Set source to `main` branch

Option C: **Google Drive** (Simple)
1. Create a folder in Google Drive
2. Add all HTML/CSS/JS files
3. Right-click any HTML → Open with → Google Apps Script HTML Service
4. Share the folder

### 6. Share with Users

- **Upload Portal**: Share the main domain (e.g., `https://cubbes-resource.vercel.app/`)
- **Leaderboard**: Share `/leaderboard` URL
- **Admin Dashboard**: Share `/admin` URL + admin PIN (via secure channel)

## File Structure

```
cubbes-resource-drive/
├── index.html          # Upload portal
├── leaderboard.html    # Leaderboard
├── admin.html          # Admin review dashboard
├── config.js           # API configuration
├── Code.gs             # Google Apps Script backend
├── assets/
│   ├── style.css       # Shared styling
│   └── app.js          # Shared API utilities
└── README.md           # This file
```

## API Endpoints

All endpoints are handled by the Apps Script Web App.

### GET requests:

| Endpoint | Params | Returns |
|----------|--------|---------|
| `getUniversities` | - | List of universities |
| `getDepartments` | `universityId` | Departments for university |
| `searchCourses` | `universityId`, `departmentId`, `searchTerm` | Matching courses |
| `getLeaderboard` | `period` (alltime/monthly) | Ranked entries |
| `getPendingSubmissions` | - | Submissions awaiting review |
| `getAllCourses` | - | All courses in database |

### POST requests:

| Action | Payload | Returns |
|--------|---------|---------|
| `submitUpload` | Form data + base64 file | `{ submissionId }` |
| `verifyAdminPin` | `pin` | `{ authorized: bool }` |
| `approveSubmission` | `submissionId`, `courseId` | `{ success: true }` |
| `rejectSubmission` | `submissionId`, `reason` | `{ success: true }` |
| `flagAccount` | `userTag` | `{ success: true }` |

## Customization

### Change Admin PIN

Edit `Code.gs`:
```javascript
ADMIN_PIN: "your-new-pin",
```

### Adjust Credit Rewards

Edit `Code.gs`:
```javascript
CREDITS_PER_APPROVAL: 200, // Default is 100
```

### Add More Universities/Departments

Edit the Google Sheet manually or update the `initializeSheets()` function in `Code.gs`.

### Customize Styling

Edit `assets/style.css`. All colors use CSS variables:
```css
--brand: #2f4bff;        /* Primary blue */
--brand-soft: #eef0ff;   /* Light blue background */
--green-ink: #065f46;    /* Success color */
--red-ink: #b91c1c;      /* Error color */
```

## Troubleshooting

**"Set APPS_SCRIPT_URL in config.js"**
- Ensure you've updated `config.js` with your deployment URL
- Refresh the page

**Uploads failing**
- Check that Google Drive folder exists and is accessible
- Verify DRIVE_FOLDER_ID is correct in Code.gs
- Re-deploy the Apps Script

**Leaderboard not updating**
- Approve a submission via admin dashboard
- It may take a few seconds to update
- Refresh the page

**Admin PIN not working**
- Double-check PIN in Code.gs matches what you entered
- Clear browser cache and try again

## Privacy & Security

- Flagged accounts cannot submit
- File URLs are shared via Google Drive (respects folder sharing)
- Admin PIN should be strong and kept confidential
- Consider using environment variables for sensitive config in production

## Future Enhancements

- Email notifications on approval
- Batch upload for admins
- Monthly reward payouts
- Student profile pages
- Search and filter materials
- Rate/review submitted materials
- Integration with Cubbes wallet for real credits
