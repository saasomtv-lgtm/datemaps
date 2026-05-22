require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const path = require("path");

const dateRoute = require("./routes/date");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || "*",
  methods: ["GET", "POST"],
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/api/", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Muitas requisições. Tente em 15 minutos." },
}));

app.get("/health", (_, res) => res.json({ status: "ok" }));
app.use("/api/date", dateRoute);

// Serve frontend em produção
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend")));
  app.get("*", (_, res) =>
    res.sendFile(path.join(__dirname, "../frontend/index.html"))
  );
}

app.use((err, req, res, next) => {
  console.error("Erro:", err.message);
  res.status(err.status || 500).json({ error: err.message || "Erro interno." });
});

app.listen(PORT, () => {
  console.log(`✅ DateMaps rodando em http://localhost:${PORT}`);
  console.log(`   Anthropic: ${process.env.ANTHROPIC_API_KEY ? "✓" : "✗ faltando"}`);
});
