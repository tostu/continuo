// Statisch, weil $env/dynamic beim Prerendern nicht lesbar ist – TMDb wird nur zur Build-Zeit abgefragt.
import * as env from '$env/static/private';
import type { Character, Work } from '$lib/universe/types';

const API_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p';

interface TmdbSearchResult {
	id: number;
	poster_path: string | null;
	release_date?: string;
	first_air_date?: string;
}

interface TmdbCastMember {
	name: string;
	character: string;
	profile_path: string | null;
}

async function tmdb<T>(path: string, params: Record<string, string> = {}): Promise<T | null> {
	const token = env.TMDB_API_READ_ACCESS_TOKEN;
	if (!token) return null;

	const url = new URL(API_BASE + path);
	for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

	const res = await fetch(url, {
		headers: { Authorization: `Bearer ${token}`, accept: 'application/json' }
	});
	if (!res.ok) return null;
	return (await res.json()) as T;
}

export const posterUrl = (path: string | null | undefined, size: 'w342' | 'w500' = 'w500') =>
	path ? `${IMG_BASE}/${size}${path}` : undefined;

export const profileUrl = (path: string | null | undefined, size: 'w185' | 'w342' = 'w185') =>
	path ? `${IMG_BASE}/${size}${path}` : undefined;

/** Ein Werk kann in der de-DE-Suche fehlschlagen (übersetzter Titel) – dann bleibt es ohne Poster. */
/** TMDb kennt keine Staffelnummer im Serientitel – "The Mandalorian – Staffel 1" -> "The Mandalorian". */
const searchTitle = (title: string) => title.replace(/\s*[–-]\s*(Staffel|Season)\s*\d+$/i, '');

async function findWork(work: Work): Promise<TmdbSearchResult | undefined> {
	const year = work.released.slice(0, 4);
	const isFilm = work.kind === 'film';
	const result = await tmdb<{ results: TmdbSearchResult[] }>(
		isFilm ? '/search/movie' : '/search/tv',
		{
			query: searchTitle(work.title),
			language: 'de-DE',
			...(isFilm ? { year } : { first_air_date_year: year })
		}
	);
	return result?.results[0];
}

async function findCredits(work: Work, id: number): Promise<TmdbCastMember[]> {
	const endpoint = work.kind === 'film' ? `/movie/${id}/credits` : `/tv/${id}/credits`;
	const result = await tmdb<{ cast: TmdbCastMember[] }>(endpoint, { language: 'de-DE' });
	return result?.cast ?? [];
}

const norm = (s: string) => s.toLowerCase().trim();

function matchActor(cast: TmdbCastMember[], character: Character): TmdbCastMember | undefined {
	const name = norm(character.name);
	return cast.find((c) => norm(c.character).includes(name) || name.includes(norm(c.character)));
}

/** Poster-URL des Werks plus Schauspielerfotos je Figur, best effort – TMDb-Token fehlt oder Titel nicht gefunden -> leere Werte. */
export async function loadTmdbData(work: Work, characters: Character[]) {
	const found = await findWork(work);
	if (!found) return { poster: undefined, photosByCharacterId: {} as Record<string, string> };

	const cast = await findCredits(work, found.id);
	const photosByCharacterId: Record<string, string> = {};
	for (const character of characters) {
		const actor = matchActor(cast, character);
		const url = profileUrl(actor?.profile_path);
		if (url) photosByCharacterId[character.id] = url;
	}

	return { poster: posterUrl(found.poster_path), photosByCharacterId };
}
