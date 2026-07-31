/**
 * STUDFREE — backend server
 * Plain Node.js (http, fs, url) — no external packages required.
 * Data is persisted to data.json, acting as a lightweight database.
 *
 * Run:  node server.js
 * Open: http://localhost:3000
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
// ===== Multer Configuration =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  }
});
const { loadDB, saveDB } = require("./utils/db");
const { hashPassword } = require("./utils/auth");
const url = require("url");
const crypto = require("crypto");
const authRoutes = require("./routes/auth");

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data.json");
const PUBLIC_DIR = path.join(__dirname, "public");

// ---------- tiny "database" helpers ----------

function newId(prefix) {
  return prefix + "_" + crypto.randomBytes(4).toString("hex");
}

function publicStudent(s) {
  const { password, ...rest } = s;
  return rest;
}

// ---------- request helpers ----------
function sendJSON(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let chunks = "";
    req.on("data", (c) => (chunks += c));
    req.on("end", () => {
      if (!chunks) return resolve({});
      try {
        resolve(JSON.parse(chunks));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function serveStatic(req, res, pathname) {
  let filePath = path.join(PUBLIC_DIR, pathname === "/" ? "index.html" : pathname);
  // basic traversal guard
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/html" });
      return res.end("<h1>404</h1><p>Not found. <a href='/'>Go home</a></p>");
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(content);
  });
}

// ---------- API route handlers ----------
async function handleApi(req, res, pathname, query) {
  const db = loadDB();
  // ---- ADMIN LOGIN ----
if (pathname === "/api/admin/login" && req.method === "POST") {

    const b = await readBody(req);

    if (
        b.username === "admin" &&
        b.password === "studfree123"
    ) {
        return sendJSON(res, 200, { success: true });
    }

    return sendJSON(res, 401, {
        error: "Invalid admin credentials"
    });
}

  // ---- AUTH ----
  // ---- COMPANY SIGNUP ----
if (pathname === "/api/company/signup" && req.method === "POST") {

    const b = await readBody(req);

    if (!b.companyName || !b.email || !b.password) {
        return sendJSON(res, 400, {
            error: "Company name, email and password are required"
        });
    }

    if (db.companies.some(c => c.email.toLowerCase() === b.email.toLowerCase())) {
        return sendJSON(res, 409, {
            error: "Company already exists"
        });
    }

    const company = {
        id: newId("cmp"),
        companyName: b.companyName,
        email: b.email,
        password: hashPassword(b.password),
        website: b.website || "",
        description: b.description || "",
        joined: new Date().toISOString()
    };

    db.companies.push(company);

    saveDB(db);

    return sendJSON(res, 201, {
        company: {
            id: company.id,
            companyName: company.companyName,
            email: company.email
        }
    });

}
// ---- COMPANY LOGIN ----
if (pathname === "/api/company/login" && req.method === "POST") {

    const b = await readBody(req);

    const company = db.companies.find(
        c => c.email.toLowerCase() === (b.email || "").toLowerCase()
    );

    if (!company || company.password !== (b.password || "")) {
        return sendJSON(res,401,{
            error:"Invalid company email or password"
        });
    }

    return sendJSON(res,200,{
        company:{
            id:company.id,
            companyName:company.companyName,
            email:company.email
        }
    });

}
  if (pathname === "/api/admin/login" && req.method === "POST") {
  const b = await readBody(req);

console.log("Email:", b.email);
console.log("Password entered:", b.password);

const student = db.students.find(
  s => s.email.toLowerCase() === (b.email || "").toLowerCase()
);

console.log("Student found:", !!student);

if (student) {
  console.log("Stored password:", student.password);
  console.log("Entered hash:", hashPassword(b.password || ""));
}

if (!student || student.password !== hashPassword(b.password || "")) {
  return sendJSON(res, 401, { error: "Invalid email or password" });
}

return sendJSON(res, 200, { student: publicStudent(student) });

  if (!admin) {
    return sendJSON(res, 401, { error: "Invalid admin credentials" });
  }

  return sendJSON(res, 200, {
    success: true,
    admin: {
      username: admin.username
    }
  });
}
  if (pathname === "/api/signup" && req.method === "POST") {
    const b = await readBody(req);
    if (!b.name || !b.email || !b.password) {
      return sendJSON(res, 400, { error: "name, email and password are required" });
    }
    if (db.students.some((s) => s.email.toLowerCase() === b.email.toLowerCase())) {
      return sendJSON(res, 409, { error: "An account with this email already exists" });
    }
    const student = {
      id: newId("stu"),
      name: b.name,
      email: b.email,
      password: hashPassword(b.password),
      college: b.college || "",
      year: b.year || "",
      bio: b.bio || "",
      skills: Array.isArray(b.skills) ? b.skills : [],
      projects: Array.isArray(b.projects) ? b.projects : [],
      resumeLink: b.resumeLink || "",
      joined: new Date().toISOString(),
    };
    db.students.push(student);
    saveDB(db);
    return sendJSON(res, 201, { student: publicStudent(student) });
  }

  if (pathname === "/api/login" && req.method === "POST") {
    const b = await readBody(req);
    const student = db.students.find((s) => s.email.toLowerCase() === (b.email || "").toLowerCase());
    if (!student || student.password !== hashPassword(b.password || "")) {
      return sendJSON(res, 401, { error: "Invalid email or password" });
    }
    return sendJSON(res, 200, { student: publicStudent(student) });
  }

  // ---- STUDENTS ----
  if (pathname === "/api/students" && req.method === "GET") {
    let list = db.students.map(publicStudent);
    if (query.skill) {
      const skill = query.skill.toLowerCase();
      list = list.filter((s) => s.skills.some((sk) => sk.toLowerCase() === skill));
    }
    if (query.q) {
      const q = query.q.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.skills.some((sk) => sk.toLowerCase().includes(q))
      );
    }
    return sendJSON(res, 200, { students: list.reverse() });
  }

  const studentMatch = pathname.match(/^\/api\/students\/([^/]+)$/);
  if (studentMatch && req.method === "GET") {
    const student = db.students.find((s) => s.id === studentMatch[1]);
    if (!student) return sendJSON(res, 404, { error: "Student not found" });
    return sendJSON(res, 200, { student: publicStudent(student) });
  }
  if (studentMatch && req.method === "DELETE") {
    const index = db.students.findIndex(s => s.id === studentMatch[1]);

    if (index === -1) {
        return sendJSON(res, 404, { error: "Student not found" });
    }
    if (studentMatch && req.method === "PATCH") {

    const student = db.students.find(s => s.id === studentMatch[1]);

    if (!student) {
        return sendJSON(res, 404, { error: "Student not found" });
    }

    const b = await readBody(req);

    student.name = b.name || student.name;
    student.college = b.college || student.college;
    student.year = b.year || student.year;
    student.bio = b.bio || student.bio;

    saveDB(db);

    return sendJSON(res, 200, { student: publicStudent(student) });

}

    db.students.splice(index, 1);
    saveDB(db);

    return sendJSON(res, 200, { success: true });
}
  // DELETE student
if (studentMatch && req.method === "DELETE") {
  const index = db.students.findIndex((s) => s.id === studentMatch[1]);

  if (index === -1) {
    return sendJSON(res, 404, { error: "Student not found" });
  }

  db.students.splice(index, 1);
  saveDB(db);

  return sendJSON(res, 200, {
    success: true,
    message: "Student deleted successfully"
  });
}

  // add a project to an existing student profile (dashboard)
  const addProjectMatch = pathname.match(/^\/api\/students\/([^/]+)\/projects$/);
  if (addProjectMatch && req.method === "POST") {
    const student = db.students.find((s) => s.id === addProjectMatch[1]);
    if (!student) return sendJSON(res, 404, { error: "Student not found" });
    const b = await readBody(req);
    if (!b.title) return sendJSON(res, 400, { error: "Project title is required" });
    student.projects.push({
      title: b.title,
      link: b.link || "",
      description: b.description || "",
    });
    saveDB(db);
    return sendJSON(res, 201, { projects: student.projects });
  }

  // applications for a given student (dashboard)
  const appsMatch = pathname.match(/^\/api\/students\/([^/]+)\/applications$/);
  if (appsMatch && req.method === "GET") {
    const sid = appsMatch[1];
    const applied = [];
    db.jobs.forEach((j) => {
      const app = (j.applicants || []).find((a) => a.studentId === sid);
      if (app) applied.push({ job: j, application: app });
    });
    return sendJSON(res, 200, { applications: applied.reverse() });
  }

  // ---- JOBS ----
  if (pathname === "/api/jobs" && req.method === "GET") {
    let list = db.jobs;
    if (query.skill) {
      const skill = query.skill.toLowerCase();
      list = list.filter((j) => j.skillsNeeded.some((sk) => sk.toLowerCase() === skill));
    }
    if (query.q) {
      const q = query.q.toLowerCase();
      list = list.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.skillsNeeded.some((sk) => sk.toLowerCase().includes(q))
      );
    }
    return sendJSON(res, 200, { jobs: [...list].reverse() });
  }

  if (pathname === "/api/jobs" && req.method === "POST") {
    const b = await readBody(req);
    if (!b.title || !b.company) {
      return sendJSON(res, 400, { error: "title and company are required" });
    }
    const job = {
      id: newId("job"),
      title: b.title,
      company: b.company,
      description: b.description || "",
      skillsNeeded: Array.isArray(b.skillsNeeded) ? b.skillsNeeded : [],
      budget: b.budget || "",
      posted: new Date().toISOString(),
      applicants: [],
    };
    db.jobs.push(job);
    saveDB(db);
    return sendJSON(res, 201, { job });
  }

  const jobMatch = pathname.match(/^\/api\/jobs\/([^/]+)$/);
  if (jobMatch && req.method === "GET") {
    const job = db.jobs.find((j) => j.id === jobMatch[1]);
    if (!job) return sendJSON(res, 404, { error: "Job not found" });
    return sendJSON(res, 200, { job });
  }
  if (jobMatch && req.method === "DELETE") {
    const index = db.jobs.findIndex(j => j.id === jobMatch[1]);

    if (index === -1) {
        return sendJSON(res, 404, { error: "Job not found" });
    }

    db.jobs.splice(index, 1);
    saveDB(db);

    return sendJSON(res, 200, { success: true });
}

  const applyMatch = pathname.match(/^\/api\/jobs\/([^/]+)\/apply$/);
  if (applyMatch && req.method === "POST") {
    const job = db.jobs.find((j) => j.id === applyMatch[1]);
    if (!job) return sendJSON(res, 404, { error: "Job not found" });
    const b = await readBody(req);
    if (!b.studentId) return sendJSON(res, 400, { error: "studentId is required" });
    const student = db.students.find((s) => s.id === b.studentId);
    if (!student) return sendJSON(res, 404, { error: "Student not found" });
    if (job.applicants.some((a) => a.studentId === b.studentId)) {
      return sendJSON(res, 409, { error: "Already applied to this job" });
    }
    // ---- HIRE APPLICANT ----
const hireMatch = pathname.match(/^\/api\/jobs\/([^/]+)\/hire\/([^/]+)$/);

if (hireMatch && req.method === "POST") {

    const job = db.jobs.find(j => j.id === hireMatch[1]);

    if (!job) {
        return sendJSON(res, 404, { error: "Job not found" });
    }

    const applicant = job.applicants.find(
        a => a.studentId === hireMatch[2]
    );

    if (!applicant) {
        return sendJSON(res, 404, { error: "Applicant not found" });
    }

    applicant.status = "hired";

    saveDB(db);

    return sendJSON(res, 200, {
        success: true
    });

}
    job.applicants.push({
      studentId: b.studentId,
      studentName: student.name,
      message: b.message || "",
      status: "pending",
      date: new Date().toISOString(),
    });
    saveDB(db);
    return sendJSON(res, 201, { ok: true });
  }

  const statusMatch = pathname.match(/^\/api\/jobs\/([^/]+)\/applicants\/([^/]+)$/);
  if (statusMatch && req.method === "PATCH") {
    const job = db.jobs.find((j) => j.id === statusMatch[1]);
    if (!job) return sendJSON(res, 404, { error: "Job not found" });
    const app = (job.applicants || []).find((a) => a.studentId === statusMatch[2]);
    if (!app) return sendJSON(res, 404, { error: "Application not found" });
    const b = await readBody(req);
    app.status = b.status || app.status;
    saveDB(db);
    return sendJSON(res, 200, { ok: true });
  }

  // ---- STATS (for homepage strip) ----
  if (pathname === "/api/stats" && req.method === "GET") {
    const hired = db.jobs.reduce(
      (n, j) => n + (j.applicants || []).filter((a) => a.status === "hired").length,
      0
    );
    return sendJSON(res, 200, {
      students: db.students.length,
      jobs: db.jobs.length,
      hired,
    });
  }

  return sendJSON(res, 404, { error: "Unknown API route" });
}

// ---------- server ----------
const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = decodeURIComponent(parsed.pathname);

  if (pathname.startsWith("/api/")) {
    try {
      await handleApi(req, res, pathname, parsed.query);
    } catch (err) {
      console.error(err);
      sendJSON(res, 500, { error: "Server error", detail: err.message });
    }
    return;
  }
  serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log(`STUDFREE running → http://localhost:${PORT}`);
});
