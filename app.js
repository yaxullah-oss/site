const readResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
};

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const payload = await readResponse(response);

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && payload.message
        ? payload.message
        : typeof payload === "string" && payload.trim()
          ? payload
          : `API error: ${response.status}`;
    throw new Error(message);
  }

  return payload;
};

const renderFeatured = (items) => {
  const list = document.querySelector("#featured-list");
  list.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    const topic = document.createElement("span");
    topic.className = "topic";
    topic.textContent = item.title;

    const meta = document.createElement("span");
    meta.className = "meta";
    meta.textContent = `${item.replies} yanıt · ${item.views} görüntülenme`;

    li.append(topic, meta);
    list.appendChild(li);
  });
};

const renderCategories = (items) => {
  const container = document.querySelector("#category-cards");
  container.innerHTML = "";
  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "card";

    const title = document.createElement("h3");
    title.textContent = item.name;

    const description = document.createElement("p");
    description.textContent = item.description;

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = `${item.members} üye`;

    card.append(title, description, badge);
    container.appendChild(card);
  });
};

const renderTopics = (items) => {
  const list = document.querySelector("#topic-list");
  list.innerHTML = "";
  items.forEach((item) => {
    const row = document.createElement("article");
    row.className = "topic-row";

    const content = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = item.title;
    const description = document.createElement("p");
    description.textContent = item.description;
    content.append(title, description);

    const meta = document.createElement("div");
    meta.className = "topic-meta";
    const replies = document.createElement("span");
    replies.textContent = `${item.replies} yanıt`;
    const time = document.createElement("span");
    time.textContent = item.time;
    meta.append(replies, time);

    row.append(content, meta);
    list.appendChild(row);
  });
};

const renderEvents = (events) => {
  const title = document.querySelector("#events-title");
  const description = document.querySelector("#events-description");
  const list = document.querySelector("#events-list");

  title.textContent = events.title;
  description.textContent = events.description;
  list.innerHTML = "";
  events.schedule.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = entry;
    list.appendChild(li);
  });
};

const renderMember = (member) => {
  const name = document.querySelector("#member-name");
  const quote = document.querySelector("#member-quote");
  const stats = document.querySelector("#member-stats");

  name.textContent = member.name;
  quote.textContent = `"${member.quote}"`;
  stats.innerHTML = "";

  member.stats.forEach((stat) => {
    const block = document.createElement("div");
    const value = document.createElement("span");
    value.textContent = stat.value;
    const label = document.createElement("small");
    label.textContent = stat.label;
    block.append(value, label);
    stats.appendChild(block);
  });
};

const setMessage = (element, message, type) => {
  element.textContent = message;
  element.classList.remove("success", "error");
  if (type) {
    element.classList.add(type);
  }
};

const handleAuth = (formId, endpoint, messageId) => {
  const form = document.querySelector(formId);
  const message = document.querySelector(messageId);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    setMessage(message, "İşleniyor...", null);

    try {
      const response = await fetchJson(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      setMessage(message, response.message, "success");
      form.reset();
    } catch (error) {
      setMessage(message, error.message, "error");
    }
  });
};

const renderError = (error) => {
  console.error(error);
  document.querySelector("#featured-list").innerHTML =
    "<li>Veriler yüklenemedi. Lütfen daha sonra tekrar deneyin.</li>";
  document.querySelector("#category-cards").innerHTML =
    "<article class=\"card\">Veriler yüklenemedi.</article>";
  document.querySelector("#topic-list").innerHTML =
    "<article class=\"topic-row\">Veriler yüklenemedi.</article>";
  document.querySelector("#events-list").innerHTML =
    "<li>Veriler yüklenemedi.</li>";
  document.querySelector("#member-quote").textContent =
    "Veriler yüklenemedi.";
};

const init = async () => {
  handleAuth("#login-form", "/api/login", "#login-message");
  handleAuth("#register-form", "/api/register", "#register-message");

  try {
    const [featured, categories, topics, events, member] = await Promise.all([
      fetchJson("/api/featured"),
      fetchJson("/api/categories"),
      fetchJson("/api/topics"),
      fetchJson("/api/events"),
      fetchJson("/api/member"),
    ]);

    renderFeatured(featured);
    renderCategories(categories);
    renderTopics(topics);
    renderEvents(events);
    renderMember(member);
  } catch (error) {
    renderError(error);
  }
};

init();
