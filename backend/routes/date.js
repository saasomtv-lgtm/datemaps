const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const { analyzeConversation, generateDatePlan } = require("../services/claude");
const { geocodeLocation, searchNearbyPlaces } = require("../services/places");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Apenas imagens são aceitas (JPG, PNG, WEBP)"));
  },
});

router.post("/generate", upload.array("images", 10), async (req, res) => {
  const requestId = uuidv4().slice(0, 8);
  console.log(`\n[${requestId}] Nova requisição`);

  try {
    if (!req.files || req.files.length === 0)
      return res.status(400).json({ error: "Envie ao menos um print da conversa." });

    const { instagram, spotify, tiktok, location, date, budget } = req.body;
    if (!location) return res.status(400).json({ error: "Localização obrigatória." });
    if (!budget)   return res.status(400).json({ error: "Orçamento obrigatório." });

    console.log(`[${requestId}] [1/3] Processando imagens...`);
    const imageBuffers = await Promise.all(
      req.files.map(async (file) => {
        const resized = await sharp(file.buffer)
          .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();
        return { data: resized.toString("base64"), mediaType: "image/jpeg" };
      })
    );

    console.log(`[${requestId}] [2/3] Analisando conversa...`);
    const analysis = await analyzeConversation(imageBuffers);

    console.log(`[$requestId}] [3/3] Gerando date e lugares...`);
    const coords = await geocodeLocation(location);
    const contextPlaces = await searchNearbyPlaces({ lat: coords.lat, lng: coords.lng, budget: parseInt(budget) });

    const plan = await generateDatePlan({
      analysis,
      socialProfiles: { instagram, spotify, tiktok },
      location: coords.formattedAddress,
      date,
      budget,
      places: contextPlaces,
    });

    if (!plan) throw new Error("Não foi possível gerar o plano. Tente novamente.");

    const response = {
      requestId,
      dateType:          plan.dateType,
      matchScore:        plan.matchScore,
      description:       plan.description,
      tags:              plan.tags || [],
      insights:          plan.insights || [],
      tips:              plan.tips || [],
      itinerary:         plan.itinerary || [],
      places:            plan.places || [],
      userCoords:        { lat: coords.lat, lng: coords.lng },
      formattedLocation: coords.formattedAddress,
      generatedAt:       new Date().toISOString(),
    };

    console.log(`[${requestId}] ✅ Sucesso`);
    res.json(response);

  } catch (err) {
    console.error(`[${requestId}] ➌ ${err.message}`);
    res.status(500).json({ error: err.message || "Erro interno. Tente novamente." });
  }
});

module.exports = router;
