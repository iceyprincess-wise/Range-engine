import { useEffect, useRef, useState } from 'react';

/**
 * 👻 GHOST-CLOCK AUTO-HALT PROTOCOL
 * 100% Accurate Timestamp tracking to prevent stale data analysis.
 */
export const useGhostClock = (lastApiUpdateTimestamp: number, thresholdMs: number = 45000) => {
    const [isStalled, setIsStalled] = useState<boolean>(false);
    const ghostTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (ghostTimer.current) clearInterval(ghostTimer.current);

        // Passive heartbeat: No React re-renders until the threshold is crossed.
        ghostTimer.current = setInterval(() => {
            const now = Date.now();
            if (now - lastApiUpdateTimestamp > thresholdMs) {
                if (!isStalled) setIsStalled(true); // Trigger UI Lock
            } else {
                if (isStalled) setIsStalled(false); // Unlock UI when feed syncs
            }
        }, 1000);

        return () => {
            if (ghostTimer.current) clearInterval(ghostTimer.current);
        };
    }, [lastApiUpdateTimestamp, thresholdMs, isStalled]);

    return isStalled;
};
