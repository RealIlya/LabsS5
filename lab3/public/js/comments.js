const API_BASE = "/api/comments";
const listEl = document.getElementById("comments-list");
const formEl = document.getElementById("comment-form");
const authorEl = document.getElementById("author");
const textEl = document.getElementById("text");
const toggleAdminBtn = document.getElementById("toggle-admin");

const ADMIN_FLAG_KEY = "comments:isAdmin";
const ADMIN_TOKEN_KEY = "comments:adminToken";

function isAdmin() {
  return localStorage.getItem(ADMIN_FLAG_KEY) === "1";
}
function setAdmin(on) {
  localStorage.setItem(ADMIN_FLAG_KEY, on ? "1" : "0");
  renderControlsVisibility();
}

function escapeHTML(str) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function fmtDate(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

function renderControlsVisibility() {
  const show = isAdmin();
  document.querySelectorAll(".comment-item .controls").forEach((el) => {
    el.style.display = show ? "flex" : "none";
  });
}

function createItemNode(c) {
  const li = document.createElement("li");
  li.className = "comment-item";
  li.dataset.id = c.id;
  if (c._local) li.dataset.local = "1";
  li.innerHTML = `
      <div class="meta">
        <strong>${escapeHTML(c.author || "Аноним")}</strong>
        <span>•</span>
        <time datetime="${new Date(c.created_at).toISOString()}">${fmtDate(
    c.created_at
  )}</time>
        ${
          c.updated_at && c.updated_at !== c.created_at
            ? `<span>• изменено ${fmtDate(c.updated_at)}</span>`
            : ""
        }
        ${
          c._local
            ? `<span class="badge-local" title="Не синхронизировано с сервером">локально</span>`
            : ""
        }
      </div>
      <div class="text">${escapeHTML(c.text || "")}</div>
      <div class="controls" style="display:none">
        <button class="btn ghost btn-edit" type="button">Редактировать</button>
        <button class="btn ghost btn-delete" type="button">Удалить</button>
      </div>
    `;
  li.querySelector(".btn-edit").addEventListener("click", () =>
    handleEdit(li, c)
  );
  li.querySelector(".btn-delete").addEventListener("click", () =>
    handleDelete(li, c)
  );
  return li;
}

function localKey() {
  return "comments:local";
}
function readLocal() {
  return JSON.parse(localStorage.getItem(localKey()) || "[]");
}
function writeLocal(arr) {
  localStorage.setItem(localKey(), JSON.stringify(arr));
}
function upsertLocal(c) {
  const arr = readLocal();
  const i = arr.findIndex((x) => x.id === c.id);
  if (i >= 0) arr[i] = c;
  else arr.unshift(c);
  writeLocal(arr);
}
function removeLocal(id) {
  const arr = readLocal().filter((x) => x.id !== id);
  writeLocal(arr);
}

async function fetchJSON(url, opts = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(opts.headers || {}),
  };
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (token) headers["X-Admin-Token"] = token;
  const res = await fetch(url, { ...opts, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    const err = new Error(`HTTP ${res.status} ${res.statusText} - ${text}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

async function loadComments() {
  listEl.setAttribute("aria-busy", "true");
  listEl.innerHTML = "";
  try {
    const server = await fetchJSON(API_BASE);
    server.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    for (const c of server) listEl.appendChild(createItemNode(c));
    // merge local unsynced on top (optional)
    readLocal().forEach((c) => {
      c._local = true;
      listEl.prepend(createItemNode(c));
    });
  } catch (e) {
    console.warn("Сервер недоступен:", e);
    // Only local
    readLocal().forEach((c) => {
      c._local = true;
      listEl.appendChild(createItemNode(c));
    });
  } finally {
    listEl.setAttribute("aria-busy", "false");
    renderControlsVisibility();
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  const author = (authorEl.value || "").trim();
  const text = (textEl.value || "").trim();
  if (!author || !text) {
    alert("Пожалуйста, заполните имя и комментарий.");
    return;
  }
  if (text.length > 1000) {
    alert("Слишком длинный комментарий (макс 1000 символов).");
    return;
  }

  const tempId = "local_" + Date.now();
  const now = Date.now();
  const optimistic = {
    id: tempId,
    author,
    text,
    created_at: now,
    updated_at: now,
    _local: true,
  };
  listEl.prepend(createItemNode(optimistic));
  formEl.reset();

  try {
    const saved = await fetchJSON(API_BASE, {
      method: "POST",
      body: JSON.stringify({ author, text }),
    });
    const node = listEl.querySelector(`.comment-item[data-id="${tempId}"]`);
    if (node) node.remove();
    listEl.prepend(createItemNode(saved));
    removeLocal(tempId);
  } catch (e) {
    console.error("POST fail:", e);
    upsertLocal(optimistic);
    alert("Сервер недоступен - комментарий сохранён локально.");
  } finally {
    renderControlsVisibility();
  }
}

async function handleEdit(li, c) {
  const current = li.querySelector(".text").textContent;
  const next = prompt("Изменить комментарий:", current);
  if (next == null) return;
  const text = next.trim();
  if (!text) {
    alert("Комментарий не может быть пустым.");
    return;
  }

  // For purely local comments, just update locally
  if (String(c.id).startsWith("local_") || li.dataset.local === "1") {
    c.text = text;
    c.updated_at = Date.now();
    upsertLocal(c);
    li.replaceWith(createItemNode({ ...c, _local: true }));
    renderControlsVisibility();
    return;
  }

  li.querySelector(".text").textContent = text; // optimistic
  try {
    const updated = await fetchJSON(`${API_BASE}/${encodeURIComponent(c.id)}`, {
      method: "PUT",
      body: JSON.stringify({ text }),
    });
    li.replaceWith(createItemNode(updated));
  } catch (e) {
    alert(
      "Не удалось обновить на сервере. Проверьте режим автора/токен. (" +
        (e.status || "") +
        ")"
    );
    console.error(e);
  } finally {
    renderControlsVisibility();
  }
}

async function handleDelete(li, c) {
  if (!confirm("Удалить комментарий?")) return;

  // If local-only comment, remove without contacting server
  if (String(c.id).startsWith("local_") || li.dataset.local === "1") {
    removeLocal(c.id);
    li.remove();
    return;
  }

  li.style.opacity = "0.6";
  try {
    await fetchJSON(`${API_BASE}/${encodeURIComponent(c.id)}`, {
      method: "DELETE",
    });
    li.remove();
    removeLocal(c.id);
  } catch (e) {
    // If server says Forbidden (403) or server unreachable - offer local removal as fallback for lab demo
    console.error("DELETE fail:", e);
    if (e.status === 403) {
      alert(
        "Не удалось удалить на сервере (403). Убедитесь, что введён корректный admin-токен.\n" +
          "Запустите сервер с ADMIN_TOKEN=... и в UI нажмите «Режим автора», затем введите тот же токен."
      );
    } else {
      // Network or other error: allow local removal to avoid dead comments in demo
      const ok = confirm(
        "Сервер недоступен. Удалить локальную копию комментария?"
      );
      if (ok) {
        removeLocal(c.id);
        li.remove();
      } else {
        li.style.opacity = "";
      }
    }
  }
}

// Admin toggle
toggleAdminBtn?.addEventListener("click", () => {
  const on = !isAdmin();
  setAdmin(on);
  if (on && !localStorage.getItem(ADMIN_TOKEN_KEY)) {
    const token = prompt(
      "Введите admin-токен (если сервер запущен с ADMIN_TOKEN):",
      ""
    );
    if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
  }
});

// Auto-enable admin via ?admin=1
const params = new URLSearchParams(location.search);
if (params.get("admin") === "1") setAdmin(true);

formEl?.addEventListener("submit", handleSubmit);
if (listEl) loadComments();
