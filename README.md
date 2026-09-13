# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
bun x sv@0.17.0 create --template minimal --types ts --add prettier eslint vitest="usages:unit,component" playwright tailwindcss="plugins:typography,forms" sveltekit-adapter="adapter:cloudflare+cfTarget:workers" drizzle="database:d1" better-auth="demo:password" paraglide="languageTags:en, de+demo:no" ai-tools="ide:claude-code+delivery:plugin" --install bun continuo
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Daten aus D1

Sagas, Werke, Handlungsstränge, Figuren und Plot Points liegen in der D1-Datenbank
`continuo-db`. Schema, Migrationen und Seed gehören zu **diesem** Repo – das frühere
continuo-data ist abgelöst und wird nicht mehr gebraucht.

Die Seite ist vollständig vorgerendert (`prerender = true` im Root-Layout). Die
`+page.server.ts`-Loads laufen also **beim Build in Node**, nicht im Worker – dort gibt es
kein D1-Binding. Der Zugriff geht deshalb über die D1-REST-API:

- `src/lib/server/db/schema.ts` – Drizzle-Schema, Quelle der Migrationen
- `src/lib/server/db/seed.sql` – die Inhalte selbst
- `src/lib/server/db/d1-http.ts` – Client für die REST-Endpunkte `/raw` und `/query`
- `src/lib/server/db/index.ts` – `getDb()`, Drizzle über `drizzle-orm/sqlite-proxy`
- `src/lib/server/universe-repo.ts` – baut aus den Tabellen das `Universe`-Objekt, mit dem
  `$lib/universe/derive` und alle Komponenten arbeiten

Der deployte Worker liefert nur noch statische Assets aus; D1 wird zur Laufzeit nicht
angefragt. Neue Daten landen erst mit dem nächsten Build auf der Seite.

Verwendung in einem Load (Beispiel:
`src/routes/[universum]/+layout.server.ts`):

```ts
import { loadUniverse } from '$lib/server/universe-repo';

export const load = async ({ params }) => {
	const universe = await loadUniverse(params.universum);
	if (!universe) error(404, 'Universum nicht gefunden');
	return { slug: params.universum, universe };
};
```

### Warum serverseitig geladen wird

Die Universums-Daten dürfen nur in `+page.server.ts` / `+layout.server.ts` gelesen werden,
nicht in universellen Loads oder Komponenten – sonst landet der Query-Code im Browser-
Bundle. Aus demselben Grund gibt es **keinen Param-Matcher** mehr für `[universum]`:
Matcher (`src/params/…`) laufen auch im Browser und dürfen nicht asynchron sein, können die
Datenbank also nicht fragen. Unbekannte Slugs fallen stattdessen im Layout-Load durch
(`error(404, …)`), wie es die SvelteKit-Doku für datenabhängige Parameter vorsieht.

### Einrichtung

`.env` aus `.env.example` befüllen – `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_DATABASE_ID`
und ein API-Token mit `D1: Edit`. Ohne diese Werte bricht jeder Load ab, der `getDb()`
benutzt; Builds ohne D1-Zugriff laufen weiterhin durch (die Instanz wird lazy erzeugt).

### Schema ändern

```bash
# src/lib/server/db/schema.ts anpassen, dann:
bun run db:generate        # neue Migration unter drizzle/
bun run db:migrate:local
bun run db:migrate:remote
```

### Inhalte ändern

`src/lib/server/db/seed.sql` ist die Datenquelle für die Universen. Danach:

```bash
bun run db:seed:local      # bzw. db:seed:remote
```

Der Seed löscht die Tabellen vorher und ist damit wiederholbar. Wer stattdessen direkt in
der Datenbank arbeitet (Drizzle Studio), sollte den Seed danach aus der Datenbank neu
erzeugen – sonst überschreibt der nächste Seed-Lauf die Änderungen.

Die Fremdschlüssel decken die Referenzen ab (Werk → Saga, Arc/Figur → Werk, Plot Point →
Figur _und_ Arc desselben Werks). Was ein Schema nicht prüfen kann – ob `plotPoint.at` im
`range` des Werks liegt – testet `src/lib/server/universe-repo.spec.ts`.

### Drizzle Studio

```bash
bun run db:studio          # Remote-D1 über HTTP
bun run db:studio:local    # lokale miniflare-SQLite
```

`db:studio:local` sucht die SQLite-Datei unter `.wrangler/state/v3/d1/…`; überschreibbar
mit `D1_LOCAL_PATH`. Vorher einmal `bun run db:migrate:local && bun run db:seed:local`.

### Lokale Entwicklung

```bash
# einmalig: lokale Datenbank anlegen und füllen
bun run db:migrate:local && bun run db:seed:local

bun run dev:local     # vite dev auf der lokalen D1
bun run build:local   # Build auf der lokalen D1
```

Beide Skripte setzen nur `D1_LOCAL=true`. Ohne die Variable (`bun run dev` /
`bun run build`) geht alles an die echte D1 – der Deploy-Build bleibt unberührt.
Die Tests lesen dieselbe lokale Datenbank: `D1_LOCAL=true bun run test:unit`. Ohne sie
überspringen sich die datenabhängigen Tests, statt zu scheitern.

Gelesen wird dabei genau die SQLite-Datei, die wrangler unter `.wrangler/state/v3/d1`
verwaltet – dieselbe, die auch `wrangler d1 execute --local` und `bun run db:studio:local`
benutzen. Angebunden wird sie über denselben Treiber wie die Remote-D1
(`drizzle-orm/sqlite-proxy`), nur mit einem anderen Callback: der Query-Code ist in Dev,
lokalem Build und Deploy-Build identisch. `node:sqlite` wird nur dynamisch importiert und
landet nicht im Worker-Bundle; läuft vite unter Bun statt Node, fällt `local.ts` automatisch
auf `bun:sqlite` zurück.

#### Warum kein Binding

Das `d1_databases`-Binding in `wrangler.jsonc` steht dort nur, damit
`wrangler d1 migrations apply` und `wrangler d1 execute` aus diesem Repo laufen. Der Worker
benutzt es nicht – ein echtes Binding wäre hier auch strukturell nicht zu haben:

- `vite dev` läuft in Node, nicht in workerd.
- Der Prerenderer von SvelteKit reicht kein `platform` durch – auch `@cloudflare/vite-plugin`
  hilft nicht, dessen Bindings existieren nur innerhalb von workerd. Für eine Seite, deren
  Daten beim Build eingebacken werden, ist das der entscheidende Punkt.
- Miniflare als Bibliothek (die Engine hinter `wrangler dev`) funktioniert technisch und
  liest denselben State, startet aber workerd als Kindprozess. SvelteKit beendet den
  Prerender-Prozess ohne `exit`-Event; die workerd-Prozesse bleiben als Waisen (PPID 1)
  zurück. Deshalb der direkte Zugriff auf die Datei.

Alternative ohne lokalen State: eine zweite D1-Datenbank im Cloudflare-Account anlegen und
in `.env` eine andere `CLOUDFLARE_DATABASE_ID` setzen. Braucht Netz, verhält sich dafür in
jedem Detail wie Produktion.
