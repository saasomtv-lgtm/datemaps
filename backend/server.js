require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");

const dateRoute = require("./routes/date");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || "*",
  methods: ["GET", "POST"],
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use("/api/", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Muitas requisicoes. Tente em 15 minutos." },
}));

app.get("/health", (_, res) => res.json({ status: "ok" }));
app.use("/api/date", dateRoute);

// Serve frontend from public/ folder
const publicDir = path.join(__dirname, "public");
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get("*", (_, res) => res.sendFile(path.join(publicDir, "index.html")));
} else {
  app.get("/", (_, res) => res.send(`<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><title>DateMaps AI</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;background:#f6f5f3}
.hero{background:linear-gradient(135deg,#b03870,#f83f3f);color:#fff;padding:80px 40px;text-align:center}
.hero h1{font-size:2.8rem;margin-bottom:16px}.hero p{font-size:1.2rem;opacity:.9;margin-bottom:32px}
.btn{background:#fff;color:#b03870;padding:14px 36px;border-radius:8px;font-size:1rem;font-weight:700;text-decoration:none;display:inline-block}
.box{max-width:700px;margin:60px auto;padding:32px;background:#fff;border-radius:12px;text-align:center}
code{background:#f0f0f0;padding:4px 8px;border-radius:4px;font-size:.9rem}</style></head>
<body><div class="hero"><h1>💝 DateMaps AI</h1><p>Backend no ar e funcionando</p>
<a href="/health" class="btn">Checar status</a></div>
<div class="box"><h2 style="margin-bottom:16px;color:#b03870">API Ativa</h2>
<p style="margin-bottom:12px"><code>GET /health</code></p>
<p><code>POST /api/date/generate</code></p></div></body></html>`));
  app.get("*", (_, res) => res.status(404).json({ error: "Not found" }));
}

app.use((err, req, res, next) => {
  console.error("Erro:", err.message);
  res.status(err.status || 500).json({ error: err.message || "Erro interno." });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("DateMaps rodando na porta " + PORT);
  console.log("Anthropic key: " + (process.env.ANTHROPIC_API_KEY ? "ok" : "FALTANDO"));
  console.log("public/ existe: " + fs.existsSync(publicDir));
});
