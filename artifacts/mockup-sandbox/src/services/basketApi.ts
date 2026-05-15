// Splendor V3 - Live API Data Bridge
// Connected to: BasketAPI by REcodeX (RapidAPI)

const API_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const HOST = import.meta.env.VITE_RAPIDAPI_HOST;

export const fetchLiveMatches = async () => {
    if (!API_KEY) {
        console.error("🔒 SECURITY LOCK: API Key missing from .env file");
        return null;
    }

    const url = `https://${HOST}/events/live`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': API_KEY,
                'x-rapidapi-host': HOST
            }
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("📡 API BRIDGE ERROR:", error);
        return null;
    }
};
