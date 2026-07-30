// Cubbes Resource Drive - Google Apps Script Backend
// Deploy as a Web App with "Execute as: your email" and "Anyone" access

// ===== CONFIG =====
const CONFIG = {
  SHEET_ID: "1JzjlmQLkz8-fqi7gKY1hpGXeYmj9zw2OVql2L9IIK4s", // Replace with actual Sheet ID
  DRIVE_FOLDER_ID: "13Gp1uDl6G5_MousGVESyf8ebWRef3Gts", // Folder for uploaded files
  ADMIN_PIN: "1234", // Change this to a secure PIN
  CREDITS_PER_APPROVAL: 100, // Points awarded per approved submission
};

// ===== MAIN HANDLER =====
function doGet(e) {
  const action = e.parameter.action;

  try {
    switch (action) {
      case "getUniversities":
        return respond(getUniversities());
      case "getDepartments":
        return respond(getDepartments(e.parameter.universityId));
      case "searchCourses":
        return respond(searchCourses(e.parameter.universityId, e.parameter.departmentId, e.parameter.searchTerm));
      case "getLeaderboard":
        return respond(getLeaderboard(e.parameter.period || "alltime"));
      case "getPendingSubmissions":
        return respond(getPendingSubmissions());
      case "getAllCourses":
        return respond(getAllCourses());
      default:
        return respond({ error: "Unknown action", code: "invalid_action" });
    }
  } catch (err) {
    return respond({ error: err.toString(), code: "server_error" });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;

    switch (action) {
      case "submitUpload":
        return respond(submitUpload(payload));
      case "verifyAdminPin":
        return respond(verifyAdminPin(payload.pin));
      case "approveSubmission":
        return respond(approveSubmission(payload.submissionId, payload.courseId));
      case "rejectSubmission":
        return respond(rejectSubmission(payload.submissionId, payload.reason));
      case "flagAccount":
        return respond(flagAccount(payload.userTag));
      default:
        return respond({ error: "Unknown action", code: "invalid_action" });
    }
  } catch (err) {
    return respond({ error: err.toString(), code: "server_error" });
  }
}

function respond(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== SHEETS & DATA HELPERS =====
function getSheet(name) {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function initializeSheets() {
  // Universities
  let sheet = getSheet("Universities");
  if (sheet.getLastRow() <= 1) {
    sheet.clear();
    sheet.appendRow(["id", "name", "code"]);
    sheet.appendRow(["uni-1", "University of Lagos", "UNILAG"]);
    sheet.appendRow(["uni-2", "University of Ibadan", "UI"]);
    sheet.appendRow(["uni-3", "Covenant University", "CU"]);
  }

  // Departments
  sheet = getSheet("Departments");
  if (sheet.getLastRow() <= 1) {
    sheet.clear();
    sheet.appendRow(["id", "universityId", "name"]);
    sheet.appendRow(["dept-1", "uni-1", "Computer Science"]);
    sheet.appendRow(["dept-2", "uni-1", "Mathematics"]);
    sheet.appendRow(["dept-3", "uni-2", "Engineering"]);
  }

  // Courses
  sheet = getSheet("Courses");
  if (sheet.getLastRow() <= 1) {
    sheet.clear();
    sheet.appendRow(["id", "code", "title", "level", "universityId", "departmentId", "createdAt"]);
    sheet.appendRow(["course-1", "STA 141", "Probability I", "100L", "uni-1", "dept-2", new Date().toISOString()]);
    sheet.appendRow(["course-2", "STA 241", "Probability II", "200L", "uni-1", "dept-2", new Date().toISOString()]);
  }

  // Materials (submissions)
  sheet = getSheet("Materials");
  if (sheet.getLastRow() <= 1) {
    sheet.clear();
    sheet.appendRow(["id", "courseId", "fileUrl", "fileName", "type", "status", "uploadedBy", "reviewedBy", "rejectionReason", "createdAt", "updatedAt"]);
  }

  // Leaderboard Cache
  sheet = getSheet("Leaderboard");
  if (sheet.getLastRow() <= 1) {
    sheet.clear();
    sheet.appendRow(["userTag", "approvedCount", "totalCredits", "lastUpdated"]);
  }

  // Flagged Accounts
  sheet = getSheet("FlaggedAccounts");
  if (sheet.getLastRow() <= 1) {
    sheet.clear();
    sheet.appendRow(["userTag", "flaggedAt", "reason"]);
  }
}

// ===== API IMPLEMENTATIONS =====

function getUniversities() {
  initializeSheets();
  const sheet = getSheet("Universities");
  const data = sheet.getDataRange().getValues();
  const universities = [];

  for (let i = 1; i < data.length; i++) {
    universities.push({
      id: data[i][0],
      name: data[i][1],
      code: data[i][2],
    });
  }

  return { universities };
}

function getDepartments(universityId) {
  const sheet = getSheet("Departments");
  const data = sheet.getDataRange().getValues();
  const departments = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === universityId) {
      departments.push({
        id: data[i][0],
        name: data[i][2],
        universityId: data[i][1],
      });
    }
  }

  return { departments };
}

function searchCourses(universityId, departmentId, searchTerm) {
  const sheet = getSheet("Courses");
  const data = sheet.getDataRange().getValues();
  const courses = [];
  const term = searchTerm.toUpperCase();

  for (let i = 1; i < data.length; i++) {
    if (
      data[i][4] === universityId &&
      data[i][5] === departmentId &&
      (data[i][1].toUpperCase().includes(term) || data[i][2].toUpperCase().includes(term))
    ) {
      courses.push({
        id: data[i][0],
        code: data[i][1],
        title: data[i][2],
        level: data[i][3],
      });
    }
  }

  return { courses };
}

function getAllCourses() {
  const sheet = getSheet("Courses");
  const data = sheet.getDataRange().getValues();
  const courses = [];

  for (let i = 1; i < data.length; i++) {
    courses.push({
      id: data[i][0],
      code: data[i][1],
      title: data[i][2],
      level: data[i][3],
      universityId: data[i][4],
      departmentId: data[i][5],
    });
  }

  return { courses };
}

function submitUpload(payload) {
  // Check if account is flagged
  const flagged = getSheet("FlaggedAccounts");
  const flaggedData = flagged.getDataRange().getValues();
  for (let i = 1; i < flaggedData.length; i++) {
    if (flaggedData[i][0] === payload.contributor) {
      return { error: "This account has been flagged and cannot submit.", code: "account_flagged" };
    }
  }

  try {
    // If manual course entry, create new course
    let courseId = payload.courseId;
    if (!courseId && payload.manualCode) {
      courseId = "course-" + Utilities.getUuid();
      const coursesSheet = getSheet("Courses");
      coursesSheet.appendRow([
        courseId,
        payload.manualCode,
        payload.manualTitle,
        payload.academicLevel,
        payload.university,
        payload.department,
        new Date().toISOString(),
      ]);
    }

    if (!courseId) {
      return { error: "Please select or create a course.", code: "no_course" };
    }

    // Decode base64 file and save to Google Drive
    const fileName = payload.fileName;
    const fileData = Utilities.newBlob(Utilities.base64Decode(payload.fileData), getMimeType(fileName), fileName);
    const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    const file = folder.createFile(fileData);
    const fileUrl = file.getUrl();

    // Create submission record
    const id = "sub-" + Utilities.getUuid();
    const materialsSheet = getSheet("Materials");
    materialsSheet.appendRow([
      id,
      courseId,
      fileUrl,
      fileName,
      payload.resourceType,
      "PENDING",
      payload.contributor,
      "",
      "",
      new Date().toISOString(),
      new Date().toISOString(),
    ]);

    return { success: true, submissionId: id };
  } catch (err) {
    return { error: "Failed to save submission: " + err, code: "upload_error" };
  }
}

function getPendingSubmissions() {
  const materialsSheet = getSheet("Materials");
  const coursesSheet = getSheet("Courses");
  const universitiesSheet = getSheet("Universities");
  const departmentsSheet = getSheet("Departments");

  const materialsData = materialsSheet.getDataRange().getValues();
  const coursesData = coursesSheet.getDataRange().getValues();
  const universitiesData = universitiesSheet.getDataRange().getValues();
  const departmentsData = departmentsSheet.getDataRange().getValues();

  // Create lookup maps
  const courseMap = {};
  for (let i = 1; i < coursesData.length; i++) {
    courseMap[coursesData[i][0]] = {
      code: coursesData[i][1],
      title: coursesData[i][2],
      level: coursesData[i][3],
      universityId: coursesData[i][4],
      departmentId: coursesData[i][5],
    };
  }

  const uniMap = {};
  for (let i = 1; i < universitiesData.length; i++) {
    uniMap[universitiesData[i][0]] = universitiesData[i][1];
  }

  const deptMap = {};
  for (let i = 1; i < departmentsData.length; i++) {
    deptMap[departmentsData[i][0]] = departmentsData[i][2];
  }

  const submissions = [];
  for (let i = 1; i < materialsData.length; i++) {
    if (materialsData[i][5] === "PENDING") {
      const courseId = materialsData[i][1];
      const course = courseMap[courseId] || {};
      submissions.push({
        id: materialsData[i][0],
        courseId,
        courseCode: course.code || "Unknown",
        courseTitle: course.title || "Unknown",
        fileUrl: materialsData[i][2],
        fileName: materialsData[i][3],
        type: materialsData[i][4],
        status: materialsData[i][5],
        uploadedBy: materialsData[i][6],
        university: uniMap[course.universityId] || "Unknown",
        department: deptMap[course.departmentId] || "Unknown",
        createdAt: materialsData[i][9],
      });
    }
  }

  return { submissions };
}

function approveSubmission(submissionId, courseId) {
  const materialsSheet = getSheet("Materials");
  const materialsData = materialsSheet.getDataRange().getValues();

  for (let i = 1; i < materialsData.length; i++) {
    if (materialsData[i][0] === submissionId) {
      const userTag = materialsData[i][6];

      // Update submission status
      materialsSheet.getRange(i + 1, 6).setValue("APPROVED");
      materialsSheet.getRange(i + 1, 7).setValue("Admin");
      materialsSheet.getRange(i + 1, 11).setValue(new Date().toISOString());

      // Update leaderboard
      updateLeaderboard(userTag, true);

      return { success: true };
    }
  }

  return { error: "Submission not found", code: "not_found" };
}

function rejectSubmission(submissionId, reason) {
  const materialsSheet = getSheet("Materials");
  const materialsData = materialsSheet.getDataRange().getValues();

  for (let i = 1; i < materialsData.length; i++) {
    if (materialsData[i][0] === submissionId) {
      materialsSheet.getRange(i + 1, 6).setValue("REJECTED");
      materialsSheet.getRange(i + 1, 7).setValue("Admin");
      materialsSheet.getRange(i + 1, 8).setValue(reason);
      materialsSheet.getRange(i + 1, 11).setValue(new Date().toISOString());
      return { success: true };
    }
  }

  return { error: "Submission not found", code: "not_found" };
}

function flagAccount(userTag) {
  const flaggedSheet = getSheet("FlaggedAccounts");
  flaggedSheet.appendRow([userTag, new Date().toISOString(), "Spam/Abuse"]);
  return { success: true };
}

function updateLeaderboard(userTag, addCredit) {
  const leaderboardSheet = getSheet("Leaderboard");
  const data = leaderboardSheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userTag) {
      const newApprovedCount = data[i][1] + 1;
      const newCredits = data[i][2] + (addCredit ? CONFIG.CREDITS_PER_APPROVAL : 0);
      leaderboardSheet.getRange(i + 1, 2).setValue(newApprovedCount);
      leaderboardSheet.getRange(i + 1, 3).setValue(newCredits);
      leaderboardSheet.getRange(i + 1, 4).setValue(new Date().toISOString());
      return;
    }
  }

  // New user
  leaderboardSheet.appendRow([userTag, 1, CONFIG.CREDITS_PER_APPROVAL, new Date().toISOString()]);
}

function getLeaderboard(period) {
  const leaderboardSheet = getSheet("Leaderboard");
  const data = leaderboardSheet.getDataRange().getValues();
  const entries = [];

  for (let i = 1; i < data.length; i++) {
    entries.push({
      userTag: data[i][0],
      approvedCount: data[i][1],
      totalCredits: data[i][2],
    });
  }

  // Sort by credits descending
  entries.sort((a, b) => b.totalCredits - a.totalCredits);

  return { entries };
}

function verifyAdminPin(pin) {
  return { authorized: pin === CONFIG.ADMIN_PIN };
}

// ===== HELPERS =====
function getMimeType(filename) {
  const ext = filename.split(".").pop().toLowerCase();
  const mimes = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    doc: "application/msword",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
  };
  return mimes[ext] || "application/octet-stream";
}
