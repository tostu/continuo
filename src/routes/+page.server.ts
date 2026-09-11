import { universeBySlug } from '$lib/universe/registry';
import { charactersFor, workBySlug } from '$lib/universe/derive';
import { loadTmdbData } from '$lib/server/tmdb';
import type { PageServerLoad } from './$types';

// Fotos für das Zoom-Beispiel (Episode IV) – nur zur Build-Zeit; ohne Token bleibt es bei Initialen.
export const load: PageServerLoad = async () => {
	const universe = universeBySlug('star-wars')!;
	const work = workBySlug(universe, 'episode-iv')!;
	const { photosByCharacterId } = await loadTmdbData(work, charactersFor(universe, work.slug));
	return { photosByCharacterId };
};
