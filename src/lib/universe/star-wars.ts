import type { Arc, Character, PlotPoint, Universe, Work } from './types';

const works: Work[] = [
	{
		slug: 'episode-iv',
		title: 'Episode IV – Eine neue Hoffnung',
		short: 'Episode IV',
		kind: 'film',
		released: '1977-05-25',
		sagaId: 'original',
		strandId: 'skywalker',
		required: true,
		unit: 'Min.',
		range: [0, 121]
	},
	{
		slug: 'episode-v',
		title: 'Episode V – Das Imperium schlägt zurück',
		short: 'Episode V',
		kind: 'film',
		released: '1980-05-21',
		sagaId: 'original',
		strandId: 'skywalker',
		required: true,
		unit: 'Min.',
		range: [0, 124]
	},
	{
		slug: 'episode-vi',
		title: 'Episode VI – Die Rückkehr der Jedi-Ritter',
		short: 'Episode VI',
		kind: 'film',
		released: '1983-05-25',
		sagaId: 'original',
		strandId: 'skywalker',
		required: true,
		unit: 'Min.',
		range: [0, 131]
	},
	{
		slug: 'episode-i',
		title: 'Episode I – Die dunkle Bedrohung',
		short: 'Episode I',
		kind: 'film',
		released: '1999-05-19',
		sagaId: 'prequel',
		strandId: 'skywalker',
		required: true,
		unit: 'Min.',
		range: [0, 136]
	},
	{
		slug: 'episode-ii',
		title: 'Episode II – Angriff der Klonkrieger',
		short: 'Episode II',
		kind: 'film',
		released: '2002-05-16',
		sagaId: 'prequel',
		strandId: 'skywalker',
		required: true,
		unit: 'Min.',
		range: [0, 142]
	},
	{
		slug: 'episode-iii',
		title: 'Episode III – Die Rache der Sith',
		short: 'Episode III',
		kind: 'film',
		released: '2005-05-19',
		sagaId: 'prequel',
		strandId: 'skywalker',
		required: true,
		unit: 'Min.',
		range: [0, 140]
	},
	{
		slug: 'the-clone-wars',
		title: 'The Clone Wars',
		short: 'Clone Wars',
		kind: 'serie',
		released: '2008-10-03',
		sagaId: 'prequel',
		strandId: 'mandoverse',
		required: false,
		unit: 'Folge',
		range: [1, 22]
	},
	{
		slug: 'episode-vii',
		title: 'Episode VII – Das Erwachen der Macht',
		short: 'Episode VII',
		kind: 'film',
		released: '2015-12-17',
		sagaId: 'neu',
		strandId: 'skywalker',
		required: true,
		unit: 'Min.',
		range: [0, 138]
	},
	{
		slug: 'rogue-one',
		title: 'Rogue One',
		short: 'Rogue One',
		kind: 'film',
		released: '2016-12-15',
		sagaId: 'neu',
		strandId: 'rebellion',
		required: false,
		unit: 'Min.',
		range: [0, 133]
	},
	{
		slug: 'episode-viii',
		title: 'Episode VIII – Die letzten Jedi',
		short: 'Episode VIII',
		kind: 'film',
		released: '2017-12-14',
		sagaId: 'neu',
		strandId: 'skywalker',
		required: true,
		unit: 'Min.',
		range: [0, 152]
	},
	{
		slug: 'solo',
		title: 'Solo',
		short: 'Solo',
		kind: 'film',
		released: '2018-05-24',
		sagaId: 'neu',
		strandId: 'rebellion',
		required: false,
		unit: 'Min.',
		range: [0, 135]
	},
	{
		slug: 'the-mandalorian',
		title: 'The Mandalorian – Staffel 1',
		short: 'The Mandalorian',
		kind: 'serie',
		released: '2019-11-12',
		sagaId: 'neu',
		strandId: 'mandoverse',
		required: true,
		unit: 'Folge',
		range: [1, 8]
	},
	{
		slug: 'episode-ix',
		title: 'Episode IX – Der Aufstieg Skywalkers',
		short: 'Episode IX',
		kind: 'film',
		released: '2019-12-18',
		sagaId: 'neu',
		strandId: 'skywalker',
		required: true,
		unit: 'Min.',
		range: [0, 142]
	},
	{
		slug: 'andor',
		title: 'Andor',
		short: 'Andor',
		kind: 'serie',
		released: '2022-09-21',
		sagaId: 'neu',
		strandId: 'rebellion',
		required: false,
		unit: 'Folge',
		range: [1, 12]
	},
	{
		slug: 'ahsoka',
		title: 'Ahsoka',
		short: 'Ahsoka',
		kind: 'serie',
		released: '2023-08-22',
		sagaId: 'neu',
		strandId: 'mandoverse',
		required: false,
		unit: 'Folge',
		range: [1, 8]
	},
	{
		slug: 'mandalorian-und-grogu',
		title: 'The Mandalorian & Grogu',
		short: 'Mandalorian & Grogu',
		kind: 'film',
		released: '2026-05-22',
		sagaId: 'neu',
		strandId: 'mandoverse',
		required: true,
		unit: 'Min.',
		range: [0, 130],
		nowPlaying: true
	}
];

const arcs: Arc[] = [
	{ id: 'iv-held', workSlug: 'episode-iv', name: 'Heldenreise', tone: 'arc-1' },
	{ id: 'iv-rebellion', workSlug: 'episode-iv', name: 'Rebellion', tone: 'arc-2' },
	{ id: 'iv-imperium', workSlug: 'episode-iv', name: 'Imperium', tone: 'arc-3' },
	{ id: 'm-kind', workSlug: 'the-mandalorian', name: 'Das Kind', tone: 'arc-1' },
	{ id: 'm-gilde', workSlug: 'the-mandalorian', name: 'Die Gilde', tone: 'arc-2' },
	{ id: 'm-gideon', workSlug: 'the-mandalorian', name: 'Moff Gideon', tone: 'arc-3' }
];

const character = (workSlug: string, id: string, name: string, initials: string): Character => ({
	id,
	workSlug,
	name,
	initials
});

const characters: Character[] = [
	character('episode-iv', 'luke', 'Luke Skywalker', 'LS'),
	character('episode-iv', 'leia', 'Leia Organa', 'LO'),
	character('episode-iv', 'han', 'Han Solo', 'HS'),
	character('episode-iv', 'vader', 'Darth Vader', 'DV'),
	character('episode-iv', 'obi-wan', 'Obi-Wan Kenobi', 'OK'),
	character('episode-iv', 'r2-d2', 'R2-D2', 'R2'),
	character('episode-iv', 'c-3po', 'C-3PO', '3PO'),
	character('episode-iv', 'tarkin', 'Grand Moff Tarkin', 'GT'),
	character('episode-iv', 'chewbacca', 'Chewbacca', 'CH'),
	character('the-mandalorian', 'din', 'Din Djarin', 'DD'),
	character('the-mandalorian', 'grogu', 'Grogu', 'GR'),
	character('the-mandalorian', 'greef', 'Greef Karga', 'GK'),
	character('the-mandalorian', 'cara', 'Cara Dune', 'CD'),
	character('the-mandalorian', 'gideon', 'Moff Gideon', 'MG'),
	character('the-mandalorian', 'ig-11', 'IG-11', 'IG'),
	character('the-mandalorian', 'kuiil', 'Kuiil', 'KU')
];

type Entry = [characterId: string, arc: string, at: number, text: string];

const points = (workSlug: string, prefix: string, entries: Entry[]): PlotPoint[] =>
	entries.map(([characterId, arc, at, text], i) => ({
		id: `${workSlug}-${i}`,
		workSlug,
		characterId,
		arcId: `${prefix}-${arc}`,
		at,
		text
	}));

const plotPoints: PlotPoint[] = [
	...points('episode-iv', 'iv', [
		['luke', 'held', 18, 'Findet Leias Hilferuf im Speicher von R2-D2.'],
		['luke', 'held', 35, 'Verliert sein Zuhause und schließt sich Obi-Wan an.'],
		['luke', 'rebellion', 48, 'Sucht mit Obi-Wan in Mos Eisley einen Piloten.'],
		['luke', 'imperium', 75, 'Befreit Leia aus dem Zellenblock des Todessterns.'],
		['luke', 'rebellion', 112, 'Fliegt den entscheidenden Angriff auf den Todesstern.'],
		['leia', 'rebellion', 2, 'Versteckt die gestohlenen Pläne in R2-D2.'],
		['leia', 'imperium', 40, 'Hält im Verhör stand – trotz Drohung gegen Alderaan.'],
		['leia', 'held', 78, 'Übernimmt bei der eigenen Rettung das Kommando.'],
		['leia', 'rebellion', 118, 'Ehrt die Helden nach der Schlacht von Yavin.'],
		['han', 'rebellion', 50, 'Nimmt den Flug nach Alderaan gegen hohen Lohn an.'],
		['han', 'imperium', 55, 'Entkommt mit dem Falken der imperialen Blockade.'],
		['han', 'held', 108, 'Kehrt im letzten Moment zur Schlacht zurück.'],
		['vader', 'imperium', 4, 'Entert das Rebellenschiff und sucht die Pläne.'],
		['vader', 'held', 88, 'Trifft seinen alten Meister wieder.'],
		['vader', 'imperium', 110, 'Verfolgt die Angreifer im Graben persönlich.'],
		['obi-wan', 'held', 30, 'Erzählt Luke von dessen Vater und dem Lichtschwert.'],
		['obi-wan', 'rebellion', 60, 'Schaltet den Traktorstrahl des Todessterns ab.'],
		['obi-wan', 'held', 88, 'Stellt sich Vader im Duell.'],
		['r2-d2', 'rebellion', 8, 'Flieht mit den Plänen auf den Wüstenplaneten.'],
		['r2-d2', 'held', 22, 'Macht sich allein auf die Suche nach Obi-Wan.'],
		['r2-d2', 'rebellion', 105, 'Fliegt als Astromech hinter Luke in die Schlacht.'],
		['c-3po', 'rebellion', 10, 'Landet mit R2-D2 in einer Rettungskapsel auf Tatooine.'],
		['c-3po', 'imperium', 80, 'Hält im Kontrollraum die Stellung.'],
		['tarkin', 'imperium', 38, 'Demonstriert die Macht der Station an Alderaan.'],
		['tarkin', 'imperium', 114, 'Lehnt die Evakuierung der Station ab.'],
		['chewbacca', 'rebellion', 50, 'Fliegt mit Han den Millennium Falken.'],
		['chewbacca', 'imperium', 70, 'Spielt den Gefangenen, um in den Zellenblock zu kommen.']
	]),
	...points('the-mandalorian', 'm', [
		['din', 'gilde', 1, 'Nimmt einen ungewöhnlichen Auftrag des Klienten an.'],
		['din', 'kind', 1, 'Findet sein Ziel – und es ist ein Kind.'],
		['din', 'gilde', 3, 'Liefert ab, bereut es und holt das Kind zurück.'],
		['din', 'kind', 4, 'Sucht auf Sorgan ein Versteck für das Kind.'],
		['din', 'gideon', 7, 'Kehrt nach Nevarro zurück, um den Klienten zu stellen.'],
		['din', 'kind', 8, 'Nimmt den Auftrag an, das Kind zu seinesgleichen zu bringen.'],
		['grogu', 'kind', 1, 'Wird im Lager der Nikto entdeckt.'],
		['grogu', 'kind', 2, 'Hebt mit der Macht einen Mudhorn an.'],
		['grogu', 'gideon', 7, 'Wird von Sturmtruppen entführt.'],
		['greef', 'gilde', 1, 'Vermittelt Din den Auftrag.'],
		['greef', 'gilde', 3, 'Führt die Gilde gegen Din an.'],
		['greef', 'gideon', 7, 'Bietet Din einen Deal an – mit Hintergedanken.'],
		['cara', 'kind', 4, 'Trifft Din auf Sorgan im Zweikampf.'],
		['cara', 'gideon', 7, 'Schließt sich dem Plan für Nevarro an.'],
		['gideon', 'gideon', 7, 'Umstellt die Cantina auf Nevarro.'],
		['gideon', 'gideon', 8, 'Taucht mit dem Dunkelschwert auf.'],
		['ig-11', 'gilde', 1, 'Wetteifert mit Din um dasselbe Ziel.'],
		['ig-11', 'kind', 8, 'Beschützt das Kind – umprogrammiert.'],
		['kuiil', 'kind', 1, 'Hilft Din, das Lager zu erreichen.'],
		['kuiil', 'kind', 2, 'Repariert das zerlegte Schiff.'],
		['kuiil', 'kind', 7, 'Bringt das Kind in Sicherheit.']
	])
];

export const starWars: Universe = {
	name: 'Star Wars',
	sagas: [
		{ id: 'original', name: 'Original-Trilogie', tone: 'arc-1' },
		{ id: 'prequel', name: 'Prequel-Ära', tone: 'arc-2' },
		{ id: 'neu', name: 'Neue Ära', tone: 'arc-3' }
	],
	strands: [
		{ id: 'skywalker', name: 'Skywalker-Saga', tone: 'arc-1' },
		{ id: 'rebellion', name: 'Rebellion', tone: 'arc-2' },
		{ id: 'mandoverse', name: 'Mandoverse', tone: 'arc-3' }
	],
	works,
	arcs,
	characters,
	plotPoints
};
