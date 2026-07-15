/* STUDFREE — shared frontend utilities */

const SESSION_KEY = "studfree_session";

const Session = {
  get() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
    catch (e) { return null; }
  },
  set(student) { localStorage.setItem(SESSION_KEY, JSON.stringify(student)); },
  clear() { localStorage.removeItem(SESSION_KEY); },
};

async function api(path, options = {}) {
  const res = await fetch("/api" + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  let data;
  try { data = await res.json(); } catch (e) { data = {}; }
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

function toast(message) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2600);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? "just now" : `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

/* Reflects login state in the masthead nav.
   Expects nav to contain elements with data-auth="guest" / data-auth="member". */
function paintNav() {
  const session = Session.get();
  document.querySelectorAll("[data-auth]").forEach((el) => {
    const show = session ? el.dataset.auth === "member" : el.dataset.auth === "guest";
    el.style.display = show ? "" : "none";
  });
  const nameEl = document.querySelector("[data-session-name]");
  if (nameEl && session) nameEl.textContent = session.name.split(" ")[0];

  const logoutBtn = document.querySelector("[data-logout]");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      Session.clear();
      toast("Logged out");
      setTimeout(() => (window.location.href = "/"), 400);
    });
  }
}

document.addEventListener("DOMContentLoaded", paintNav);
