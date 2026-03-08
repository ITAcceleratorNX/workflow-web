// hooks/use-media-query.ts
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);
        const updateMatches = () => setMatches(media.matches);

        updateMatches();
        media.addEventListener('change', updateMatches);

        return () => media.removeEventListener('change', updateMatches);
    }, [query]);

    return matches;
}

/** Возвращает { matches, resolved }. resolved=true только после первой проверки на клиенте. */
export function useMediaQueryResolved(query: string): { matches: boolean; resolved: boolean } {
    const [state, setState] = useState({ matches: false, resolved: false });

    useEffect(() => {
        const media = window.matchMedia(query);
        const updateMatches = () => setState({ matches: media.matches, resolved: true });

        updateMatches();
        media.addEventListener('change', updateMatches);

        return () => media.removeEventListener('change', updateMatches);
    }, [query]);

    return state;
}