const axios = require("axios");
async function geocodeLocation(locationStr) {
  try {
    const res = await axios.get("https://nominatim.openstreetmap.org/search", { params: { q: locationStr, format: "json", limit: 1, "accept-language": "pt-BR" }, headers: { "User-Agent": "DateMaps/1.0" } });
    if (!res.data || res.data.length === 0) return { lat: -23.5505, lng: -46.6333, formattedAddress: locationStr };
    const r = res.data[0];
    return { lat: parseFloat(r.lat), lng: parseFloat(r.lon), formattedAddress: r.display_name.split(",").slice(0, 3).join(",").trim() };
  } catch { return { lat: -23.5505, lng: -46.6333, formattedAddress: locationStr }; }
}
async function searchNearbyPlaces({ lat, lng, budget }) { return [{ lat, lng, budget }]; }
function getPhotoUrl() { return null; }
function priceLevelToLabel(l) { return ["","$","$$","$$$","$$$$"][l]||"$$"; }
function calcDistance() { return (Math.random()*5+0.5).toFixed(1); }
module.exports = { geocodeLocation, searchNearbyPlaces, getPhotoUrl, priceLevelToLabel, calcDistance };
