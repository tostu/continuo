/** Farbton aus dem Design-System; `neutral` für gruppenübergreifende Elemente. */
export type Tone = 'arc-1' | 'arc-2' | 'arc-3' | 'neutral';

export interface Saga {
	id: string;
	name: string;
	tone: Tone;
}

export interface Work {
	slug: string;
	title: string;
	/** Kurzname für den Zeitstrahl. */
	short: string;
	kind: 'film' | 'serie';
	/** ISO-Datum der Erstveröffentlichung. */
	released: string;
	/** Position in der In-Universe-Chronologie (nicht das Erscheinungsdatum), bestimmt die historische Reihenfolge. */
	chronology: number;
	/** Anzeige-Datum der Handlung selbst (z.B. „19 BBY" oder „1994"), statt Erscheinungsjahr. */
	loreDate: string;
	sagaId: string;
	required: boolean;
	/** Einheit der werkinternen Achse: Filmminute oder Folge. */
	unit: 'Min.' | 'Folge';
	range: [number, number];
	nowPlaying?: boolean;
}

/**
 * Eine Staffel eines Werks mit eigener Chronologie-Position, damit ein Film zeitlich
 * zwischen zwei Staffeln derselben Serie einsortiert werden kann. `range` ist ein
 * Teilbereich der werkinternen Achse (`Work.range`), nicht eine eigene Achse.
 */
export interface Season {
	id: string;
	workSlug: string;
	seasonNumber: number;
	label: string;
	released: string;
	chronology: number;
	loreDate: string;
	range: [number, number];
	/** Überschreibt die Saga des Werks, falls eine Serie über mehrere Ären hinweg läuft. */
	sagaId?: string;
}

/** Handlungsstrang innerhalb eines Werks. */
export interface Arc {
	id: string;
	workSlug: string;
	name: string;
	tone: Tone;
}

export interface Character {
	id: string;
	workSlug: string;
	name: string;
	initials: string;
	/** Foto der Figur (manuell kuratiert). */
	photo?: string;
	/** Quellenangabe fürs Foto, z. B. für die Zitatrecht-Attribution. */
	photoCredit?: string;
}

export interface PlotPoint {
	id: string;
	workSlug: string;
	characterId: string;
	arcId: string;
	/** Position auf der Werkachse (Minute oder Folgennummer). */
	at: number;
	text: string;
}

export interface Universe {
	name: string;
	sagas: Saga[];
	works: Work[];
	seasons: Season[];
	arcs: Arc[];
	characters: Character[];
	plotPoints: PlotPoint[];
}

/**
 * Zugeschnittenes Modell für `ZoomDemo` – nur die drei Stufen des Beispiels, damit die
 * Startseite nicht das ganze Universum als JSON mitschleppt. Gebaut in `+page.server.ts`.
 */
export interface ZoomModel {
	universeName: string;
	work: Work;
	arcs: Arc[];
	railWorks: { work: Work; tone: Tone }[];
	cast: {
		character: Character;
		/** Anteil je Handlungsstrang – Farbring des Avatars. */
		shares: { arc: Arc; count: number }[];
		points: PlotPoint[];
	}[];
}
