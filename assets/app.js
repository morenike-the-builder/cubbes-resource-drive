// Shared helpers for Cubbes Resource Drive

// Toast notification
function showToast(message, isError = false) {
  const toast = document.createElement("div");
  toast.className = isError ? "toast toast-error" : "toast toast-success";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// HTML escape
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Debounce helper
function debounce(fn, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// Config check
function configIsMissing() {
  return !CUBBES_CONFIG.APPS_SCRIPT_URL || CUBBES_CONFIG.APPS_SCRIPT_URL.includes("YOUR_DEPLOYMENT_ID");
}

// API helper
function apiUrl(params) {
  const base = CUBBES_CONFIG.APPS_SCRIPT_URL;
  const query = new URLSearchParams(params).toString();
  return `${base}?${query}`;
}

function throwIfError(data) {
  if (!data.error) return data;
  const err = new Error(data.error);
  err.code = data.code;
  throw err;
}

async function postToApi(action, payload) {
  const res = await fetch(CUBBES_CONFIG.APPS_SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify({ action, ...payload }),
  });
  return throwIfError(await res.json());
}

// ===== API CALLS =====

async function loadUniversities(selectElement) {
  try {
    const result = await fetch(apiUrl({ action: "getUniversities" })).then(r => r.json());
    const universities = result.universities || [];
    selectElement.innerHTML = '<option value="">Select a university...</option>' +
      universities.map(u => `<option value="${u.id}">${escapeHtml(u.name)}</option>`).join("");
  } catch (err) {
    console.error("Failed to load universities:", err);
  }
}

async function loadDepartments(universityId, selectElement) {
  try {
    const result = await fetch(apiUrl({ action: "getDepartments", universityId })).then(r => r.json());
    const departments = result.departments || [];
    selectElement.innerHTML = '<option value="">Select a department...</option>' +
      departments.map(d => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join("");
  } catch (err) {
    console.error("Failed to load departments:", err);
  }
}

async function searchCourses(universityId, departmentId, searchTerm, dropdownElement) {
  try {
    const result = await fetch(apiUrl({
      action: "searchCourses",
      universityId,
      departmentId,
      searchTerm,
    })).then(r => r.json());
    const courses = result.courses || [];

    if (courses.length > 0) {
      dropdownElement.innerHTML = courses.slice(0, 10).map(c => `
        <div class="course-option" data-id="${c.id}">
          ${escapeHtml(c.code)} - ${escapeHtml(c.title)}
        </div>
      `).join("");
      dropdownElement.style.display = "block";

      document.querySelectorAll(".course-option").forEach(opt => {
        opt.addEventListener("click", () => {
          document.getElementById("courseSearch").value = `${opt.textContent}`;
          document.getElementById("courseId").value = opt.getAttribute("data-id");
          dropdownElement.style.display = "none";
          document.getElementById("manualCourseFields").style.display = "none";
        });
      });
    } else {
      dropdownElement.style.display = "none";
    }
  } catch (err) {
    console.error("Failed to search courses:", err);
  }
}

async function submitUpload(uploadData) {
  return postToApi("submitUpload", uploadData);
}

async function getLeaderboard(period) {
  try {
    const result = await fetch(apiUrl({ action: "getLeaderboard", period })).then(r => r.json());
    return throwIfError(result);
  } catch (err) {
    console.error("Failed to get leaderboard:", err);
    return { entries: [] };
  }
}

async function verifyAdminPin(pin) {
  return postToApi("verifyAdminPin", { pin });
}

async function getPendingSubmissions() {
  try {
    const result = await fetch(apiUrl({ action: "getPendingSubmissions" })).then(r => r.json());
    return throwIfError(result);
  } catch (err) {
    console.error("Failed to get pending submissions:", err);
    return { submissions: [] };
  }
}

async function getAllCourses() {
  try {
    const result = await fetch(apiUrl({ action: "getAllCourses" })).then(r => r.json());
    return throwIfError(result);
  } catch (err) {
    console.error("Failed to get courses:", err);
    return { courses: [] };
  }
}

async function approveSubmission(submissionId, courseId) {
  return postToApi("approveSubmission", { submissionId, courseId });
}

async function rejectSubmission(submissionId, reason) {
  return postToApi("rejectSubmission", { submissionId, reason });
}

async function flagAccount(userTag) {
  return postToApi("flagAccount", { userTag });
}
