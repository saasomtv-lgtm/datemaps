const Anthropic = require("@anthropic-ai/sdk");
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

ansync function analyzeConversation(imageBuffers) {
  const imageContents = imageBuffers.map((buf) => ({
    type: "image",
    source: { type: "base64", media_type: buf.mediaType || "image/jpeg", data: buf.data },
  }));
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514", max_tokens: 1024,
    messages: [{ role: "user", content: [...imageContents, { type: "text", text: `Analise esses prints de conversa e extraia informações para montar um date perfeito. Retorne APENAS um JSON válido sem markdown: { "interests": [], "vibe": "", "foodPreferences": [], "musicTaste": [], "conversationStyle": "", "avoidances": [], "keywords": [], "insights": [] }` }] }],
  });
  const text = response.content[0].text.trim();
  try { return JSON.parse(text); } catch { const m = text.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : {}; }
}

async function generateDatePlan({ analysis, socialProfiles, location, date, budget }) {
  const prompt = `Você é um especialista em dates memoráveis.
DADOS: Localização: ${location} | Orçamento: R$${budget} | Data: ${date||'a definir'}
Analise: ${JSON.stringify(analysis)}
Perfis: IG:${socialProfiles.instagram || 'n/a'} Spot:${socialProfiles.spotify||'n/a'}
Crie o plano de date perfeito E sugira 5 lugares reais que existem em ${location}.
Retorne APENAS JSON: {"dateType":"","matchScore":85,"description":"","tags":[],"insights":[{"title":"","value":""}],"tips":[{"title":"","text":""}],"places":[{"place_id":"p1","rank":1,"name":"","address":"","rating":4.5,"price":"$$","distance":"2km","types":["bar"],"reason":"","matchScore":90,"openNow":true,"location":{"lat":-23.55,"lng":-46.63}}],"itinerary":[{"time":"20h00","activity":"","place":"","tip":""}]}`;
  const response = await client.messages.create({ model: "claude-sonnet-4-20250514", max_tokens: 2500, messages: [{ role: "user", content: prompt }] });
  const text = response.content[0].text.trim();
  try { return JSON.parse(text); } catch { const m = text.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : null; }
}

module.exports = { analyzeConversation, generateDatePlan };
