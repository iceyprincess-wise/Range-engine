// ==========================================
// 🌐 MATRIX API BRIDGE 
// ==========================================
// Automatically detects environment: 
// Local testing uses Port 5000. 
// Production uses the exact same Render domain (relative path).

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.MODE === 'development' ? 'http://localhost:5000' : '');

export const pingMatrixServer = async () => {
  try {
    console.log("📡 [MATRIX] Pinging Hunter Server...");
    const response = await fetch(`${API_BASE_URL}/api/status`);

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    console.log("🟢 [MATRIX] CONNECTION ESTABLISHED:", data);
    return data;
  } catch (error) {
    console.error("🔴 [MATRIX] CONNECTION FAILED. Is the server running?", error);
    return null;
  }
};

export async function fetchLiveSportsData(params?: {
  league?: string;
  homeTeam?: string;
  awayTeam?: string;
  matchId?: string;
}) {
  try {
    const queryParams = new URLSearchParams(
      Object.entries(params || {}).reduce<Record<string, string>>((acc, [key, value]) => {
        if (value) acc[key] = value;
        return acc;
      }, {}),
    );
    const endpoint = `${API_BASE_URL}/api/basketball/live${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;

    console.log("📡 [MATRIX] Fetching live sports payload from backend...", endpoint);
    const response = await fetch(endpoint);

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    console.log("[MATRIX DATA] Genuine Payload Received:", data);

    if (data?.event) {
      return data.event;
    }

    return data;
  } catch (error) {
    console.error("🔴 [MATRIX] LIVE SPORTS FETCH FAILED:", error);
    return null;
  }
};
