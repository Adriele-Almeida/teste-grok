const KEY = "planejamento-instagram-v1";
const WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const FORMATS = [
  ["", "Sem formato"],
  ["post", "Post"],
  ["reel", "Reel"],
  ["story", "Story"],
  ["carrossel", "Carrossel"],
];

let posts = load();
let cursor = parseDate(today());
let editing = null;
let draftImage = "";
let clearImage = false;

const app = document.getElementById("app");
const editor = document.getElementById("editor");

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(posts));
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function today() {
  return iso(new Date());
}

function parseDate(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function iso(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return date.getFullYear() + "-" + month + "-" + day;
}

function addDays(date, amount) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
  return next;
}

function startOfWeek(date) {
  return addDays(date, -date.getDay());
}

function cap(text) {
  const value = String(text || "");
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    if (char === "&") return "&" + "amp;";
    if (char === "<") return "&" + "lt;";
    if (char === ">") return "&" + "gt;";
    if (char === '"') return "&" + "quot;";
    return "&" + "#39;";
  });
}

function formatLabel(value) {
  const found = FORMATS.find((item) => item[0] === value);
  return found && found[0] ? found[1] : "";
}

function route() {
  const raw = (location.hash || "#/").slice(1);
  const path = raw.startsWith("/") ? raw : "/" + raw;
  const admin = path === "/admin" || path.startsWith("/admin/");
  const match = path.match(/\/dia\/(\d{4}-\d{2}-\d{2})/);
  return { admin, day: match ? match[1] : "" };
}

function go(path) {
  const next = "#" + path;
  if (location.hash === next) render();
  else location.hash = path;
}

function postsOn(date) {
  return posts
    .filter((post) => post.date === date)
    .sort((a, b) => String(a.time || "99:99").localeCompare(String(b.time || "99:99")));
}

function monthCount(date) {
  const prefix = iso(date).slice(0, 7);
  return posts.filter((post) => String(post.date || "").startsWith(prefix)).length;
}

function linkHref(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^[a-z]+:/i.test(text)) return text;
  return "https://" + text;
}

function thumb(post) {
  if (post.image) return '<img class="thumb" alt="" src="' + esc(post.image) + '" />';
  const mark = post.time || "•";
  return '<span class="ph">' + esc(mark) + "</span>";
}

function render() {
  const current = route();
  app.innerHTML = current.day ? dayHtml(current) : homeHtml(current);
}

function homeHtml(current) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const gridStart = startOfWeek(first);
  let cells = "";
  for (let index = 0; index < 42; index += 1) {
    const date = addDays(gridStart, index);
    const key = iso(date);
    const items = postsOn(key).slice(0, 4);
    const outside = date.getMonth() !== month ? " out" : "";
    const todayClass = key === today() ? " today" : "";
    cells +=
      '<div class="cell' + outside + todayClass + '" role="button" tabindex="0" data-day="' + key + '">' +
      '<span class="n">' + date.getDate() + "</span>" +
      '<span class="thumbs' + (items.length === 1 ? " n1" : "") + '">' +
      items.map(thumb).join("") +
      "</span></div>";
  }

  const weekStart = startOfWeek(cursor);
  let week = "";
  for (let index = 0; index < 7; index += 1) {
    const date = addDays(weekStart, index);
    const key = iso(date);
    const items = postsOn(key);
    week +=
      '<div class="wday" role="button" tabindex="0" data-day="' + key + '">' +
      "<h3>" + WEEK[date.getDay()] + " " + date.getDate() + "</h3>" +
      items.map((post) => {
        return '<span class="mini">' + thumb(post) + "<span>" + esc(post.time || "Sem horário") + (post.title ? " · " + esc(post.title) : "") + "</span></span>";
      }).join("") +
      "</div>";
  }

  const weekEnd = addDays(weekStart, 6);
  const weekLabel = weekStart.getMonth() === weekEnd.getMonth()
    ? weekStart.getDate() + " a " + weekEnd.getDate() + " de " + MONTHS[weekStart.getMonth()]
    : weekStart.getDate() + " de " + MONTHS[weekStart.getMonth()] + " a " + weekEnd.getDate() + " de " + MONTHS[weekEnd.getMonth()];

  const undated = posts.filter((post) => !post.date);
  const extra = current.admin && undated.length
    ? '<section class="section"><h2>Sem data</h2><div class="day-list" style="margin-top:10px">' + undated.map((post) => adminCard(post)).join("") + "</div></section>"
    : "";

  const empty = monthCount(cursor) === 0
    ? '<p class="note">' + (current.admin ? "Nenhuma postagem neste mês. Use Novo post para incluir." : "Nenhuma postagem neste mês.") + "</p>"
    : "";

  return (
    '<main class="app">' +
    '<header class="row between">' +
    "<div><h1>Planejamento de Postagens no Instagram</h1>" +
    (current.admin ? '<p class="note">Visão da administradora. Neste teste, as postagens ficam só neste navegador.</p>' : "") +
    "</div>" +
    '<div class="row">' +
    (current.admin ? '<button class="btn quiet" type="button" data-client>Ver como o cliente</button><button class="btn solid" type="button" data-new>Novo post</button>' : "") +
    "</div></header>" +
    '<div class="toolbar">' +
    '<div class="row"><button class="btn" type="button" data-shift="-1" aria-label="Mês anterior">←</button>' +
    '<h2 class="month-name">' + cap(MONTHS[month]) + " " + year + "</h2>" +
    '<button class="btn" type="button" data-shift="1" aria-label="Próximo mês">→</button></div>' +
    '<button class="btn" type="button" data-today>Hoje</button></div>' +
    empty +
    '<div class="dow-row">' + WEEK.map((day) => '<div class="dow">' + day + "</div>").join("") + "</div>" +
    '<div class="month">' + cells + "</div>" +
    '<section class="section"><h2>Semana</h2><p class="note">' + weekLabel + "</p>" +
    '<div class="week" style="margin-top:10px">' + week + "</div></section>" +
    extra +
    "</main>"
  );
}

function dayHtml(current) {
  const date = parseDate(current.day);
  const items = postsOn(current.day);
  const heading = cap(date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }));
  const back = current.admin ? "/admin" : "/";
  const body = items.length
    ? items.map((post) => (current.admin ? adminCard(post) : clientCard(post))).join("")
    : '<p class="note">Nenhuma postagem neste dia.</p>';
  return (
    '<main class="app">' +
    '<button class="btn back" type="button" data-go="' + back + '">Voltar</button>' +
    "<h1>" + esc(heading) + "</h1>" +
    '<div class="day-list" style="margin-top:16px">' + body + "</div></main>"
  );
}

function clientCard(post) {
  const bits = [];
  if (post.time) bits.push("<strong>" + esc(post.time) + "</strong>");
  if (post.title) bits.push("<h2>" + esc(post.title) + "</h2>");
  if (formatLabel(post.format)) bits.push('<p class="muted">' + esc(formatLabel(post.format)) + "</p>");
  if (post.image) bits.push('<img class="art" alt="" src="' + esc(post.image) + '" />');
  bits.push('<div class="actions"><button class="btn" type="button" data-caption="' + esc(post.id) + '">Ver legenda</button>');
  if (String(post.link || "").trim()) bits.push('<a class="btn solid" href="' + esc(linkHref(post.link)) + '" target="_blank" rel="noopener">Ver imagem</a>');
  bits.push("</div>");
  bits.push('<p class="caption" id="cap-' + esc(post.id) + '" hidden>' + esc(post.caption || "Sem legenda.") + "</p>");
  return '<article class="card">' + bits.join("") + "</article>";
}

function adminCard(post) {
  return clientCard(post).replace(
    "</article>",
    '<div class="actions"><button class="btn" type="button" data-edit="' + esc(post.id) + '">Editar</button><button class="btn danger" type="button" data-delete="' + esc(post.id) + '">Excluir</button></div></article>'
  );
}

function openEditor(post) {
  editing = post ? post.id : "";
  draftImage = post && post.image ? post.image : "";
  clearImage = false;
  const options = FORMATS.map((item) => {
    const selected = post && post.format === item[0] ? " selected" : "";
    return '<option value="' + esc(item[0]) + '"' + selected + ">" + esc(item[1]) + "</option>";
  }).join("");
  editor.innerHTML =
    "<form>" +
    "<h2>" + (post ? "Editar postagem" : "Nova postagem") + "</h2>" +
    '<label>Dia<input name="date" type="date" value="' + esc(post && post.date ? post.date : "") + '" /></label>' +
    '<label>Hora<input name="time" type="time" value="' + esc(post && post.time ? post.time : "") + '" /></label>' +
    '<label>Título<input name="title" maxlength="140" value="' + esc(post && post.title ? post.title : "") + '" /></label>' +
    '<label>Formato<select name="format">' + options + "</select></label>" +
    '<label>Miniatura<input name="file" type="file" accept="image/*" /></label>' +
    (draftImage ? '<img class="preview" alt="" src="' + esc(draftImage) + '" /><button class="btn quiet" type="button" data-clear-image>Tirar miniatura</button>' : "") +
    '<label>Link<input name="link" type="text" placeholder="https://" value="' + esc(post && post.link ? post.link : "") + '" /></label>' +
    '<label>Legenda<textarea name="caption">' + esc(post && post.caption ? post.caption : "") + "</textarea></label>" +
    '<div class="row"><button class="btn solid" type="submit">Salvar</button><button class="btn" type="button" data-close>Cancelar</button></div>' +
    "</form>";
  editor.showModal();
}

function compress(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      const max = 900;
      const scale = Math.min(1, max / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("imagem"));
    };
    image.src = url;
  });
}

app.addEventListener("click", (event) => {
  const current = route();
  const shift = event.target.closest("[data-shift]");
  const day = event.target.closest("[data-day]");
  const goButton = event.target.closest("[data-go]");
  const caption = event.target.closest("[data-caption]");
  const edit = event.target.closest("[data-edit]");
  const remove = event.target.closest("[data-delete]");
  if (shift) {
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + Number(shift.dataset.shift), 1);
    render();
    return;
  }
  if (event.target.closest("[data-today]")) {
    cursor = parseDate(today());
    render();
    return;
  }
  if (event.target.closest("[data-new]")) {
    openEditor(null);
    return;
  }
  if (event.target.closest("[data-client]")) {
    go("/");
    return;
  }
  if (goButton) {
    go(goButton.dataset.go);
    return;
  }
  if (day) {
    const prefix = current.admin ? "/admin" : "";
    go(prefix + "/dia/" + day.dataset.day);
    return;
  }
  if (caption) {
    const node = document.getElementById("cap-" + caption.dataset.caption);
    if (node) node.hidden = !node.hidden;
    return;
  }
  if (edit) {
    openEditor(posts.find((post) => post.id === edit.dataset.edit));
    return;
  }
  if (remove) {
    const post = posts.find((item) => item.id === remove.dataset.delete);
    if (post && confirm("Excluir esta postagem?")) {
      posts = posts.filter((item) => item.id !== post.id);
      save();
      render();
    }
  }
});

editor.addEventListener("click", (event) => {
  if (event.target.closest("[data-close]")) editor.close();
  if (event.target.closest("[data-clear-image]")) {
    draftImage = "";
    clearImage = true;
    const preview = editor.querySelector(".preview");
    if (preview) preview.remove();
    event.target.closest("[data-clear-image]").remove();
  }
});

editor.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  const file = form.file.files && form.file.files[0];
  let image = clearImage ? "" : draftImage;
  if (file) {
    try {
      image = await compress(file);
    } catch {
      alert("Não consegui ler essa miniatura.");
      return;
    }
  }
  const next = {
    id: editing || uid(),
    date: form.date.value,
    time: form.time.value,
    title: form.title.value.trim(),
    format: form.format.value,
    image,
    link: form.link.value.trim(),
    caption: form.caption.value,
  };
  if (editing) posts = posts.map((post) => (post.id === editing ? next : post));
  else posts = posts.concat(next);
  try {
    save();
  } catch {
    alert("A miniatura ficou grande demais para o teste neste navegador.");
    return;
  }
  editor.close();
  if (next.date) cursor = parseDate(next.date);
  render();
});

window.addEventListener("hashchange", render);
render();
