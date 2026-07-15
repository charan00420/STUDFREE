# STUDFREE — Campus Freelance Ledger

A full-stack freelance platform built for **currently-enrolled college students** to
list their skills and past projects, get discovered by companies, apply to small
paid jobs, and add verified work to their resume.

Built as a CSP (college submission project). No external npm packages required —
everything runs on plain Node.js.

## Tech stack

| Layer     | Technology                                      |
|-----------|--------------------------------------------------|
| Frontend  | HTML5, CSS3 (custom, no framework), vanilla JS   |
| Backend   | Node.js (built-in `http` module — no Express)    |
| Database  | `data.json` — a JSON file acting as the datastore |

Using only Node's built-in modules means the project runs anywhere Node is
installed, with zero `npm install` step — useful for a college lab machine or a
viva demo where internet access isn't guaranteed.

## How to run it

1. Make sure [Node.js](https://nodejs.org) is installed (v16 or newer). Check with:
   ```
   node -v
   ```
2. Open a terminal in this folder and run:
   ```
   node server.js
   ```
3. You should see:
   ```
   STUDFREE running → http://localhost:3000
   ```
4. Open that link in your browser.

The first time it runs, it creates an empty `data.json` automatically — that's
your database. Delete that file any time to reset all data.

## Pages

| Page              | File            | Purpose                                             |
|-------------------|-----------------|------------------------------------------------------|
| Home              | `index.html`    | Landing page, live stats, featured students          |
| Create listing    | `signup.html`   | Student signs up with skills, bio, projects          |
| Log in            | `login.html`    | Existing student logs back in                        |
| Browse students   | `browse.html`   | Companies browse/filter students by skill            |
| Student profile   | `student.html`  | Full profile view for a single student                |
| Job board         | `jobs.html`     | Post a job, browse jobs, apply to jobs                |
| Dashboard         | `dashboard.html`| Logged-in student's own profile + application status |

## API routes (backend)

```
POST   /api/signup                        create a student account
POST   /api/login                         log in
GET    /api/students?skill=&q=            list / filter / search students
GET    /api/students/:id                  single student profile
POST   /api/students/:id/projects         add a project to a profile
GET    /api/students/:id/applications     a student's job applications
GET    /api/jobs?skill=&q=                list / filter / search jobs
POST   /api/jobs                          post a new job
GET    /api/jobs/:id                      single job
POST   /api/jobs/:id/apply                apply to a job
PATCH  /api/jobs/:id/applicants/:sid      update an applicant's status
GET    /api/stats                         homepage counters
```

## Notes for your viva / submission

- **Why no Express/MongoDB?** To keep the project runnable with zero setup
  (no `npm install`, no database server to start). The architecture is still
  genuinely full-stack: a Node server, a REST API, JSON persistence, and a
  frontend that talks to it over `fetch()`. If you want to extend it, swapping
  `data.json` for MongoDB/SQLite and the routing for Express is a natural next step.
- **Passwords** are hashed with SHA-256 before storing — good enough to show
  you're not storing plain text for a college project, but a real production
  app should use bcrypt/argon2 with salting, which needs an external package.
- **Sessions** are kept simple: on login/signup the browser stores the logged-in
  student's public profile in `localStorage`. There's no cookie/JWT auth layer —
  fine for a demo, but call this out as a "future improvement" if asked.

## Possible extensions (good talking points for evaluation)

- Real authentication (JWT + hashed sessions)
- Employer accounts (separate from student accounts) with their own login
- Ratings/reviews after a job is completed
- Email notifications when a student is hired
- Move `data.json` to a real database (SQLite/MongoDB) for concurrent users
