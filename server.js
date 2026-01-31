const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const categories = [
  {
    id: "dev",
    name: "Geliştirme",
    description: "Web, mobil ve yapay zeka projeleri üzerine sohbetler.",
    members: 12400,
  },
  {
    id: "design",
    name: "Tasarım",
    description: "UI/UX, marka tasarımı ve ilham panoları.",
    members: 8100,
  },
  {
    id: "career",
    name: "Kariyer",
    description: "İş ilanları, mentorluk ve kariyer tavsiyeleri.",
    members: 5900,
  },
  {
    id: "news",
    name: "Güncel",
    description: "Teknoloji haberleri, etkinlikler ve duyurular.",
    members: 3200,
  },
];

const topics = [
  {
    id: 1,
    title: "TypeScript Performans İpuçları",
    category: "dev",
    replies: 236,
    views: 1200,
    createdAt: "2024-05-07T09:15:00Z",
    author: "Deniz Y.",
  },
  {
    id: 2,
    title: "Tasarım Sistemi Oluşturma",
    category: "design",
    replies: 87,
    views: 740,
    createdAt: "2024-05-06T14:40:00Z",
    author: "Mira Ç.",
  },
  {
    id: 3,
    title: "Uzaktan Çalışmada Üretkenlik",
    category: "career",
    replies: 51,
    views: 512,
    createdAt: "2024-05-05T18:30:00Z",
    author: "Emre S.",
  },
];

const events = [
  {
    id: "ui-clinic",
    day: "Salı",
    title: "UI Clinic",
    time: "20:30",
  },
  {
    id: "code-review",
    day: "Perşembe",
    title: "Kod İncelemesi",
    time: "19:00",
  },
  {
    id: "community-meetup",
    day: "Cumartesi",
    title: "Topluluk Buluşması",
    time: "16:00",
  },
];

const memberSpotlight = {
  name: "Elif Y.",
  quote: "Forumix sayesinde projelerime geri bildirim almak çok daha kolay. Harika bir topluluk!",
  stats: [
    { label: "katkı", value: 128 },
    { label: "takdir", value: 42 },
    { label: "mentorluk", value: 9 },
  ],
};

let nextTopicId = topics.length + 1;

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/categories", (_req, res) => {
  res.json({ categories });
});

app.get("/api/topics", (req, res) => {
  const limit = Number.parseInt(req.query.limit, 10);
  const sorted = [...topics].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({
    topics: Number.isNaN(limit) ? sorted : sorted.slice(0, Math.max(1, limit)),
  });
});

app.post("/api/topics", (req, res) => {
  const { title, category, author } = req.body;

  if (!title || !category || !author) {
    return res.status(400).json({
      error: "title, category ve author alanları zorunludur.",
    });
  }

  const categoryExists = categories.some((item) => item.id === category);
  if (!categoryExists) {
    return res.status(400).json({
      error: "Geçersiz kategori seçimi.",
    });
  }

  const newTopic = {
    id: nextTopicId,
    title,
    category,
    replies: 0,
    views: 0,
    createdAt: new Date().toISOString(),
    author,
  };

  nextTopicId += 1;
  topics.unshift(newTopic);

  return res.status(201).json({ topic: newTopic });
});

app.get("/api/events", (_req, res) => {
  res.json({ events });
});

app.get("/api/member-spotlight", (_req, res) => {
  res.json({ member: memberSpotlight });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Forumix API listening on http://localhost:${port}`);
});
