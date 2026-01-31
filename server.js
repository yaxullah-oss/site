const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = process.env.PORT || 3000;

const data = {
  featured: [
    {
      title: "Tor ağında güvenli gezinme rehberi",
      replies: 236,
      views: "1,2k",
    },
    {
      title: "Minimal CLI araçları paylaşımı",
      replies: 87,
      views: "740",
    },
    {
      title: "Gece vardiyası üretkenlik rutini",
      replies: 51,
      views: "512",
    },
  ],
  categories: [
    {
      name: "Sığınak",
      description: "Anonim sohbetler ve güvenli tartışmalar.",
      members: "12.4k",
    },
    {
      name: "Karanlık Kod",
      description: "Düşük seviye yazılım, araçlar ve scriptler.",
      members: "8.1k",
    },
    {
      name: "Sinyal",
      description: "Haberler, sızıntılar ve duyurular.",
      members: "5.9k",
    },
    {
      name: "Gölge Sanat",
      description: "Tasarım, glitch estetiği ve ilham.",
      members: "3.2k",
    },
  ],
  topics: [
    {
      id: 1,
      title: "Basit VPN + Tor zinciri nasıl kurulur?",
      description: "Adım adım yapılandırma ipuçları ve riskler.",
      replies: 128,
      time: "3 saat önce",
      author: "raven",
    },
    {
      id: 2,
      title: "Zsh prompt için karanlık tema",
      description: "Minimal prompt örnekleri ve paylaşım.",
      replies: 64,
      time: "5 saat önce",
      author: "sade",
    },
    {
      id: 3,
      title: "İnternetsiz çalışma istasyonu",
      description: "Airgap kurulumları ve veri aktarımı stratejileri.",
      replies: 42,
      time: "Dün",
      author: "signal",
    },
  ],
  events: {
    title: "Topluluk ritüelleri",
    description:
      "Gece yayınları, açık mikrofonlar ve kod seansları ile ritmi yakala.",
    schedule: [
      "Salı: CLI atölyesi",
      "Perşembe: Dark UI incelemesi",
      "Cumartesi: Anonim sohbet",
    ],
  },
  member: {
    name: "Raven",
    quote: "Cadisme, sessizlikte bile bilgi üretiyor.",
    stats: [
      { label: "katkı", value: 128 },
      { label: "takdir", value: 42 },
      { label: "mentorluk", value: 9 },
    ],
  },
};

const users = [];
let topicId = data.topics.length + 1;

const apiRoutes = {
  "/api/featured": () => data.featured,
  "/api/categories": () => data.categories,
  "/api/topics": () => data.topics,
  "/api/events": () => data.events,
  "/api/member": () => data.member,
  "/health": () => ({ status: "ok" }),
};

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

const serveJson = (res, status, payload) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
};

const serveFile = (res, filePath) => {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const extension = path.extname(filePath);
    res.writeHead(200, { "Content-Type": mimeTypes[extension] || "text/plain" });
    res.end(content);
  });
};

const parseJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error("Payload too large"));
      }
    });

    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Invalid JSON"));
      }
    });
  });

const findUser = (username) => users.find((user) => user.username === username);

const handleAuth = (req, res, type) => {
  if (req.method !== "POST") {
    serveJson(res, 405, { message: "Method not allowed" });
    return;
  }

  parseJsonBody(req)
    .then((payload) => {
      if (type === "login") {
        if (!payload.username || !payload.password) {
          serveJson(res, 400, { message: "Kullanıcı adı ve şifre gerekli." });
          return;
        }

        const user = findUser(payload.username);
        if (!user || user.password !== payload.password) {
          serveJson(res, 401, { message: "Giriş bilgileri hatalı." });
          return;
        }

        serveJson(res, 200, {
          message: `Hoş geldin, ${payload.username}. Giriş başarılı.`,
          user: { username: user.username, email: user.email },
        });
        return;
      }

      if (!payload.email || !payload.username || !payload.password) {
        serveJson(res, 400, { message: "E-posta, kullanıcı adı ve şifre gerekli." });
        return;
      }

      if (findUser(payload.username)) {
        serveJson(res, 409, { message: "Bu kullanıcı adı zaten kayıtlı." });
        return;
      }

      if (users.some((user) => user.email === payload.email)) {
        serveJson(res, 409, { message: "Bu e-posta zaten kayıtlı." });
        return;
      }

      const newUser = {
        username: payload.username,
        email: payload.email,
        password: payload.password,
      };
      users.push(newUser);

      serveJson(res, 200, {
        message: `Kayıt tamamlandı. ${payload.username}, aramıza hoş geldin.`,
        user: { username: newUser.username, email: newUser.email },
      });
    })
    .catch((error) => {
      serveJson(res, 400, { message: error.message });
    });
};

const handleTopics = (req, res) => {
  if (req.method === "GET") {
    serveJson(res, 200, data.topics);
    return;
  }

  if (req.method !== "POST") {
    serveJson(res, 405, { message: "Method not allowed" });
    return;
  }

  parseJsonBody(req)
    .then((payload) => {
      if (!payload.title || !payload.body) {
        serveJson(res, 400, { message: "Başlık ve içerik gerekli." });
        return;
      }

      const newTopic = {
        id: topicId += 1,
        title: payload.title,
        body: payload.body,
        author: payload.author || "guest",
        replies: 0,
        time: "şimdi",
      };

      data.topics.unshift(newTopic);

      serveJson(res, 201, {
        message: "Konu başarıyla oluşturuldu.",
        topic: newTopic,
      });
    })
    .catch((error) => {
      serveJson(res, 400, { message: error.message });
    });
};

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = requestUrl.pathname;

  if (pathname === "/api/login") {
    handleAuth(req, res, "login");
    return;
  }

  if (pathname === "/api/register") {
    handleAuth(req, res, "register");
    return;
  }

  if (pathname === "/api/topics") {
    handleTopics(req, res);
    return;
  }

  if (apiRoutes[pathname]) {
    serveJson(res, 200, apiRoutes[pathname]());
    return;
  }

  const filePath = pathname === "/" ? "index.html" : pathname.slice(1);
  const resolvedPath = path.join(__dirname, filePath);

  serveFile(res, resolvedPath);
});

server.listen(PORT, () => {
  console.log(`Cadisme backend running on http://localhost:${PORT}`);
});
