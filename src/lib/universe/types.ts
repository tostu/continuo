/** Farbton aus dem Design-System; `neutral` für gruppenübergreifende Elemente. */
export type Tone = 'arc-1' | 'arc-2' | 'arc-3' | 'neutral';

export interface Saga {
	id: string;
	name: string;
	tone: Tone;
}

/** Erzählstrang über mehrere Werke hinweg (Grundlage für den Modus „Story-Arc"). */
export interface Strand {
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
	/** ISO-Datum der Erstveröffentlichung, bestimmt die Reihenfolge. */
	released: string;
	sagaId: string;
	strandId: string;
	required: boolean;
	/** Einheit der werkinternen Achse: Filmminute oder Folge. */
	unit: 'Min.' | 'Folge';
	range: [number, number];
	nowPlaying?: boolean;
	/** Poster- bzw. Cover-Bild für Teaser und Zeitstrahl. */
	cover?: string;
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
	strands: Strand[];
	works: Work[];
	arcs: Arc[];
	characters: Character[];
	plotPoints: PlotPoint[];
}
