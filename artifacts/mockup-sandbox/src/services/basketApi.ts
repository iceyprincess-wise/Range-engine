// Splendor V3 - Live API Data Bridge
// Proxying BasketAPI through the backend service for secure hosting

const API_BASE = import.meta.env.VITE_API_BASE || "";

export const fetchLiveMatches = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/basket/live`);
    if (!response.ok) {
      throw new Error(`Backend live fetch failed: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error("📡 API BRIDGE ERROR:", error);
    return null;
  }
};
