# Context: Som-hi

## Descripció

App de plans d'entrenament esportiu (córrer, bici, gym, pilates, piscina —
i una modalitat oberta "altre") per preparar una cursa o un objectiu. Flux:

1. **Entrada**: registre/login. **El compte és literalment el mateix que
   GeoExplorer** (mateixa taula `usuaris`) — no hi ha mode convidat, no hi ha
   sistema d'auth propi.
2. **Els teus plans**: llista dels plans de l'usuari, cadascun amb barra de
   progrés i dies restants. Crear-ne un de nou obre dues vies: triar entre
   les **10 plantilles predefinides** (contingut expert real, generat amb
   periodització — sobrecàrrega progressiva, descàrrega cada 4a setmana,
   tapering) o crear-ne un **des de zero** (nom + durada en setmanes).
3. **Detall d'un pla**: calendari setmana-a-setmana de tota la durada, "avui"
   ressaltat, dia actual/dies restants calculats sempre en **hora local del
   navegador** (mai al servidor — veure "Detalls tècnics importants").
4. **Dins d'un dia**: llista d'entrenaments assignats (marcar fet/no fet,
   editar, treure), "+ Afegir entrenament" (triar-ne un d'existent del pla o
   crear-ne un de nou), i "Repetir cada setmana…" per assignar un entrenament
   a un dia de la setmana fix fins al final del pla.
5. **Editor d'entrenament**: un formulari per modalitat (6 formes de `dades`
   diferents, mirall exacte dels DTOs del backend).

## Port de Desenvolupament

`http://localhost:4207`

## Execució

Cal tenir aixecats **tres processos** en paral·lel (a més del Shell):

```bash
# 1. geoexplorer-api (auth — repo separat, NO dins d'aquest monorepo)
cd c:/portafolis/back/geo-explorer/geoexplorer-api
docker compose up -d postgres mongo
npm run start:dev          # http://localhost:3000

# 2. som-hi-api (plans/entrenaments/assignacions — repo separat)
cd c:/portafolis/back/som-hi/som-hi-api
docker compose up -d postgres
npm run start:dev          # http://localhost:3001

# 3. Frontend, des de l'arrel del monorepo Angular
npm run start:som-hi       # http://localhost:4207
```

La primera vegada, a `som-hi-api`: `npm install`, `npm run prisma:migrate`,
`npm run seed:plans-predefinits` (detall complet al seu propi `README.md`).

## Arquitectura implementada

Sense router — navegació 100% amb Signals, mateix patró que GeoExplorer:
`SessioService.pantalla` (`'entrada'|'login'|'registre'|'app'`) i, dins de
`'app'`, `NavegacioService.vista` (`'llista-plans'|'crear-pla'|'detall-pla'`).

### Serveis (`services/`)
- **`sessio.service.ts`** — port gairebé literal del de GeoExplorer, però
  crida `environment.authApiUrl` (geoexplorer-api) per
  `/auth/registre|login|refresh|logout`. `localStorage` amb clau pròpia
  (`som_hi_sessio`, diferent de `geoexplorer_sessio` — sessió activa a
  totes dues apps alhora sense trepitjar-se). **Sense mode convidat.**
- **`auth.interceptor.ts`** — afegeix `Authorization: Bearer` a peticions
  que comencin per `environment.authApiUrl` **o** `environment.apiUrl`
  (comparteixen `JWT_ACCESS_SECRET`); el refresc de token sempre passa per
  `authApiUrl` (l'únic emissor).
- **`plans.service.ts`** — signals `plans` (llista amb progrés) i
  `planObert`; `crear`/`actualitzar`/`eliminar` contra `POST/PATCH/DELETE
  /plans`.
- **`plans-predefinits.service.ts`** — les 10 plantilles, cachejades un cop
  carregades (`GET /plans-predefinits`).
- **`entrenaments.service.ts`** / **`assignacions.service.ts`** — CRUD del
  pla actualment obert; `assignacions.crearMassiu` crida `POST
  /plans/:id/assignacions/massiu`.
- **`traduccio.service.ts`** — i18n local CA/ES/EN (diccionaris propis,
  independents del `TranslationService` del Shell), però **l'idioma actiu
  el controla el selector de la barra de tasques del Shell** via
  `postMessage` (escoltat al constructor del servei) — no hi ha selector
  d'idioma propi dins de l'app (retirat de `capcalera` en una sessió
  posterior). Veure `context/os-shell/windows-system.md` §4 pel mecanisme
  complet, compartit amb `sobre-mi`/`geoexplorer`/`mes-que-un-joc`.
- **`confirmacio.service.ts`** — port verbatim del de GeoExplorer
  (`demanar(missatge): Promise<boolean>`); mai `confirm()` natiu.
- **`navegacio.service.ts`** — navegació dins la zona autenticada.
- **`data.util.ts`** — TOTES les dates de la UI ('YYYY-MM-DD') es
  manipulen amb hora LOCAL (`parsejarDataLocal`/`afegirDiesISO`/
  `diesEntre`/`avuiISO`), mai amb `new Date(isoString)` sol. Inclou
  `normalitzarDataISO()` — **necessari** perquè Prisma serialitza els
  camps `@db.Date` com a timestamp ISO complet
  (`"2026-08-24T00:00:00.000Z"`), no com a `"YYYY-MM-DD"`; cada servei que
  rep un `Pla`/`Assignacio` de l'API el normalitza abans de desar-lo als
  signals (si no, les comparacions `data === avui` fallen en silenci i el
  calendari queda buit — bug real trobat i corregit, veure secció següent).

### Components (`components/`)
- `pantalla-entrada/`, `formulari-login/`, `formulari-registre/` +
  `formulari-entrada.css` — port gairebé literal de GeoExplorer.
- `capcalera/` — marca (torna a la llista), selector d'idioma, menú
  d'usuari.
- `llista-plans/` + `pla-card/` — graella amb `barra-progres` (reutilitzable,
  fa servir `app-barra-progres` també a `capcalera-pla`).
- `crear-pla/` — host amb 4 passos (`opcions`/`galeria`/`des-de-zero`/
  `confirmar`); `galeria-plans-predefinits/`, `formulari-pla-des-de-zero/`,
  `formulari-confirmar-pla/` en són fills amb `output()`.
- `detall-pla/` — **orquestrador central**: `capcalera-pla/` +
  `calendari-pla/` sempre visibles, més **un sol panell lateral actiu cada
  cop** (`detall-dia/` → `selector-entrenament-existent/` →
  `editor-entrenament/`/`assignar-massiu/`), gestionat amb una única
  discriminated union `Panell` (signal `panell`). Tancar qualsevol panell
  que no sigui el de dia hi torna; tancar el de dia torna al calendari. Un
  `effect()` recarrega `plansService.carregarPla(id)` cada cop que
  `assignacionsService.assignacions()` canvia — cap acció necessita saber
  explícitament "ara cal refrescar el progrés".
- `editor-entrenament/` — **decisió de disseny**: NO són 6 subcomponents
  separats (com es va plantejar inicialment), sinó un sol component amb un
  `@switch(modalitat())` intern i un signal per camp — evita el glue code
  d'inputs/outputs per a 6 formes que de totes maneres comparteixen el
  mateix flux de guardar/cancel·lar/eliminar. `dades` es construeix amb un
  `switch` que mira el tipus (`DadesEntrenament`, unió discriminada mirall
  exacte del backend).

## Disseny visual

Direcció **"quadern d'entrenament"**: full de llibreta ratllada d'atleta
(paper clar, no fosc — deliberadament diferent de GeoExplorer i Més que un
joc, totes dues fosques) amb un vermell de marge de llibre de comptes com a
senyal de signatura: **una barra vertical vermella al marge esquerre de
cada "entrada"** (targeta de pla, dia del calendari, entrenament, panell) —
la mateixa idea que un llibre de comptes: registres consistents al llarg
del temps, coherent amb el tema de "constància" de l'app. Skill
`frontend-design` aplicada explícitament per NO caure en cap dels 3 patrons
genèrics d'IA (es va descartar el parell "cream+serif+terracotta" per
tipografia grotesca condensada en lloc de serif, i un vermell de pista
d'atletisme en lloc de terracota apagada).

- **Tokens** (`src/styles.css`, prefix `--sh-`): `--sh-paper` (#e9ebe1,
  fons), `--sh-card` (#fbfaf3, targetes), `--sh-ink` (#1f2420, text),
  `--sh-clay` (#ff3131, accent primari — CTA, marge vermell; color del
  logotip real, canviat des del terracota original #c1441e — veure secció
  "Restyle de color i logotip"), `--sh-teal` (#0f5c56, accent secundari —
  enllaços), `--sh-line` (#d6d2c0, vores).
- **Tipografia**: Archivo Black (títols grans/xifres), Archivo (títols de
  targeta), Work Sans (cos/formularis), Space Mono (dades numèriques: km,
  minuts, percentatges, "Setmana N").
- **Modalitats**: paleta de "materials d'equipament" (`--sh-mod-correr`
  clay, `--sh-mod-bici` mostassa, `--sh-mod-gym` acer, `--sh-mod-pilates`
  malva, `--sh-mod-piscina` teal, `--sh-mod-altre` sorra) — deliberadament
  NO un arc de Sant Martí categòric; cada xip/entrada té una barra
  esquerra de 3px amb aquest color via la custom property compartida
  `--sh-mod-color` (classes `.sh-mod-*` a `styles.css`).
  - **Barra de progrés** amb marques cada 25% (no un gradient llis) i
    valor en `Space Mono`.
  - **Signatura de la pantalla d'entrada**: una fila de 7 caselles
    tipus "setmana de log" (4 fetes, avui marcat amb vora discontínua, 3
    buides) — mateix llenguatge visual que les caselles de fet/no-fet del
    dia.
  - **Icona de l'escriptori** (`public/som-hi/logo.svg`, arrel del monorepo
    — **no** dins de `projects/som-hi/public/`, aquell és per als assets
    propis de la build de l'app): quadrat de paper amb vora d'ink, marge
    vermell i un check gruixut — llegible a 32px sobre qualsevol fons
    d'escriptori (vora d'ink dona contrast independent del wallpaper).

### Panells laterals compartits
`.sh-panell-fons`/`.sh-panell`/`.sh-panell-capcalera`/`.sh-panell-titol`/
`.sh-panell-tancar` són classes **globals** (`styles.css`), no d'un
component — reutilitzades per `detall-dia`, `selector-entrenament-existent`,
`editor-entrenament` i `assignar-massiu`. Igual amb `.sh-camp`/
`.sh-formulari-boto`/`.sh-formulari-error` (formularis) i `.sh-mod-*`
(color de modalitat): promoguts a global perquè es feien servir literalment
a totes les pantalles amb formularis — si només haguessin estat a 2 llocs
s'haurien deixat com a CSS de component, com fa la resta del monorepo.

## Backend

**Dos backends separats, NO dins d'aquest monorepo**, tots dos repos Git
independents:

1. **`geoexplorer-api`** (`c:/portafolis/back/geo-explorer/geoexplorer-api`)
   — **font única d'autenticació**. Únic canvi fet per Som-hi: `4207`
   afegit a `CORS_ORIGINS` (`.env`, `.env.example`,
   `src/config/configuration.ts`). Cap canvi d'esquema.
2. **`som-hi-api`** (`c:/portafolis/back/som-hi/som-hi-api`, nou) — NestJS +
   Prisma + PostgreSQL (sense Mongo). **Sense taula d'usuaris ni endpoints
   d'auth propis** — verifica els access tokens de `geoexplorer-api` amb un
   `JwtStrategy` propi que comparteix el mateix `JWT_ACCESS_SECRET`
   (configurat igual als dos `.env`, operacional, no de codi). Detall
   complet de model de dades, endpoints i decisions al seu propi
   `README.md`/`CONTEXT.md`.

## Detalls tècnics importants

- **Bug real trobat i corregit — dates de Prisma**: `@db.Date` a Prisma es
  serialitza com a timestamp ISO complet sobre JSON
  (`"2026-08-24T00:00:00.000Z"`), no `"YYYY-MM-DD"`. El calendari quedava
  completament buit (cap entrenament es mostrava als dies) perquè les
  claus de mapa `data → assignacions` es comparaven amb strings de formats
  diferents. Fix: `normalitzarDataISO()` a `data.util.ts`, aplicat a cada
  resposta HTTP que conté `Pla.dataInici`/`Assignacio.data` dins de
  `plans.service.ts`/`assignacions.service.ts` (mai al backend — allà les
  dates ja són correctes interanment, el problema és només de
  serialització JSON cap al frontend).
- **Bug real trobat i corregit — forma de resposta inconsistent al
  backend**: `POST /plans` i `PATCH /plans/:id` retornaven un `Pla` pla
  (sense `percentatgeCompletat`/`totalAssignacions`/
  `assignacionsCompletades`), mentre que `GET /plans`/`GET /plans/:id`
  retornen `PlaAmbProgres`. Efecte visible: targeta "NaN%" a la llista de
  plans just després de crear-ne un (fins al següent full reload). Fix:
  `PlansService.crear`/`actualitzar` (backend) ara passen sempre pel
  mateix `amblProgres()` abans de retornar — **tots** els endpoints de
  `/plans` retornen la mateixa forma `PlaAmbProgres`, sense excepcions.
- **Dia actual/dies restants sempre calculats al FRONTEND** (mai demanats
  al backend) — necessiten l'hora local de qui mira la pantalla, no la del
  servidor. Vegeu `capcalera-pla.ts`/`pla-card.ts`.
- Verificat de cap a cap amb Playwright contra les dues APIs reals (no
  mocks): registre des de Som-hi → login amb el mateix compte des de zero
  (confirma "mateix compte" de veritat) → crear pla des d'una plantilla
  predefinida → calendari amb els 24 entrenaments de "De 0 a 5 km" ja
  col·locats als dies correctes → marcar-ne un fet (barra de progrés
  actualitzada a l'instant) → crear un entrenament nou (Bici) des del
  panell de dia → tancar sessió i tornar a entrar → canvi d'idioma CA/ES/
  EN → obertura de la finestra des de l'escriptori del Shell amb l'iframe
  carregant correctament. 0 errors de consola a cada pas.

## Millores post-llançament (mateix dia)

Quatre peticions de l'usuari un cop provada l'app real:

- **Bug real trobat i corregit — alineació del calendari**: `calendari-pla.ts`
  construïa cada setmana com "7 dies consecutius des de `dataInici`"
  assumint que la columna 0 sempre era dilluns. Si el pla començava en
  qualsevol altre dia (p. ex. dijous), les dates reals (correctes al
  backend) es dibuixaven desplaçades sota columnes equivocades — "cada
  dilluns" apareixia visualment sota "Divendres" si el pla començava en
  dijous (desplaçament = dies entre l'inici real i el dilluns anterior).
  Fix: la graella ara es construeix alineada al calendari real (retrocedir
  fins al dilluns que conté `dataInici`, avançar fins al diumenge que conté
  la data de fi), amb `indexDiaSetmana()` nou a `data.util.ts` i cel·les
  `null` (buides, no clicables) per als dies fora del rang del pla dins la
  primera/última setmana parcial.
- **Ordre dels entrenaments invertit**: `GET /plans/:plaId/entrenaments`
  (backend) ara ordena `creatEl: 'desc'` (abans `'asc'`) i
  `EntrenamentsService.crear` (frontend) fa `[nou, ...llista]` en lloc
  d'`[...llista, nou]` — els més recents sempre a dalt, tant en la
  càrrega inicial com just després de crear-ne un.
- **Graella del calendari: `1fr` sol NO garanteix columnes iguals.** Un
  `grid-template-columns: repeat(7, 1fr)` encara respecta l'amplada mínima
  intrínseca del contingut de cada cel·la (`min-width: auto` per defecte
  als fills de grid) — un xip amb un títol llarg podia eixamplar la seva
  columna més que les buides. Fix: `repeat(7, minmax(0, 1fr))` +
  `min-width: 0` explícit a `.sh-calendari-dia`/`.sh-calendari-dia-entrenaments`,
  deixant que `text-overflow: ellipsis` (ja hi era) faci la resta. Lliçó
  reutilitzable per a qualsevol graella futura d'aquest monorepo amb
  contingut de mida variable dins de columnes que han de quedar iguals.
- **Marges reduïts**: `.sh-detall-pla` de `max-width: 1000px` + `padding:
  32px 24px` a `max-width: 1400px` + `padding: 28px 12px`.
- **Detall complet dins del panell de dia**: nou component reutilitzable
  `detall-entrenament-dades/` (rep `dades: DadesEntrenament`, mostra un
  resum llegible per modalitat — taula d'exercicis amb sèries/repeticions/
  kg per a GYM) — muntat tant a `detall-dia` com a
  `selector-entrenament-existent` (que abans només mostrava
  títol+modalitat).
- **Bug pre-existent trobat de pas**: el botó "Repetir cada setmana" del
  selector feia servir una classe (`sh-detall-dia-item-boto`) que mai va
  existir en aquest component (només al CSS *scoped* de `detall-dia`) —
  sortia sense estil des del primer dia. Ara fa servir la classe global
  `sh-link-petit`.
- **Selector visual d'exercicis de gym**: nou component
  `editor-entrenament/exercici-gym-fila/` — dropdown de part del cos
  (`data/exercicis-gym.data.ts`, catàleg CAMES/GLUTIS/PIT/ESQUENA/
  ESPATLLES/BRACOS/ABDOMINALS/ALTRE) → graella d'exercicis amb foto per al
  grup triat → clic per seleccionar (es col·lapsa a un resum amb foto +
  "Canviar"); "Altre" mostra un camp de text lliure sense fotos. Camp nou
  **`pesQuilos`** (opcional) a `ExerciciGym` (frontend) i `ExerciciGymDto`
  (backend, `@IsOptional() @IsNumber() @IsPositive()`). El grup muscular
  és **només estat de UI, mai persistit** — `ExerciciGym` continua guardant
  només `nom`; en tornar a obrir un exercici ja creat,
  `trobarExerciciPerNom()` el retroba dins de tot el catàleg per
  re-suggerir grup i foto. Fotos esperades a
  `projects/som-hi/public/exercicis/<nom>.jpg` (llista exacta a
  `LLEGEIX-ME.txt` dins la mateixa carpeta) — **encara no hi ha fotos
  reals**, `(error)` a `<img>` mostra un marcador de posició (🏋) en lloc
  d'una icona trencada; és normal veure 404 a la consola per a cada
  exercici mentre no s'afegeixin.

## Fotos d'exercicis + pantalla de detall visual (mateix dia, sessió posterior)

L'usuari va afegir les 42 fotos reals a `public/exercicis/` (esperaven-se
noms nets com `sentadilla.jpg`; en desar-les des del navegador molts van
quedar amb extensió duplicada, p. ex. `sentadilla.jpg.jpg`, i una com a
`.jpg.png` — es van renombrar totes en bloc perquè coincidissin exactament
amb `exercicis-gym.data.ts`). El catàleg es va ampliar de 31 a 42
exercicis (6-8 per grup en lloc de 4-6).

- **`detall-entrenament-dades`** (usat a `detall-dia` i al selector) ara
  mostra miniatures (30px) per cada exercici de gym en lloc d'una taula de
  text, resolent la foto amb `trobarExerciciPerNom(ex.nom)`.
- **Nou component `veure-entrenament`** — pantalla de detall gran i
  centrada (no un panell lateral de 440px com la resta), oberta en clicar
  qualsevol entrenament dins de `detall-dia` (nou output
  `veureEntrenament`). Mostra "stat tiles" grosses per Córrer/Bici/Piscina/
  Altre, targetes amb foto grossa (110px) per cada exercici de GYM, una
  targeta de "Veure vídeo" per Pilates, i un botó "Marcar com a fet"
  directament a la pantalla. Rep només `assignacioId` (no l'objecte
  sencer) i el busca reactivament a `AssignacionsService.assignacions()`
  perquè el checkbox es mantingui sincronitzat en temps real. Nou tipus de
  `Panell` (`'veure'`) a `detall-pla.ts`; tancar-la torna al dia, "Editar"
  obre l'editor amb `entrenamentId`.

### Bug real trobat i corregit: condició de carrera a `exercici-gym-fila`

**Símptoma:** amb NOMÉS un exercici de gym tot anava bé, però amb DOS
exercicis en el mateix entrenament, el backend rebutjava la petició amb
`"dades.exercicis.0.nom must be longer than or equal to 1 characters"` —
**per als dos**, malgrat que la UI mostrava clarament els noms triats
(Sentadilla, Press de banca) i els números correctes just abans de
guardar.

**Causa arrel:** `emetreCanvi()` construïa cada canvi fent
`{ ...this.exercici(), ...canvi }` — és a dir, llegia l'`input()` (el
valor que el pare havia confirmat per última vegada) com a base del merge.
Triar un exercici (`nom`) i tot seguit escriure a "Sèries" són DOS
esdeveniments seguits: el primer emet cap amunt, el pare actualitza el seu
array, i **només quan aquell valor nou torna cap avall per l'input**
`teNomTriat()` reflecteix el nom triat. Si el segon esdeveniment (sèries)
arriba abans que aquesta volta d'anada i tornada s'hagi completat,
`emetreCanvi()` torna a llegir l'`exercici()` VELL (amb `nom: ''`) i el
torna a emetre — esborrant silenciosament el nom que s'acabava de triar.
Amb un playwright ràpid (clic + escriure sense pausa) es reproduïa sempre;
un humà normalment té prou marge entre accions perquè no es noti, però és
un bug real de disseny, no un artefacte del test.

**Fix:** `estatLocal = linkedSignal<ExerciciGym>(() => this.exercici())` —
sembrat una vegada des de l'input, però **mutat i llegit sempre
localment** a partir d'aquell moment (`emetreCanvi` fa
`estatLocal.set({...estatLocal(), ...canvi})` I EMET el mateix objecte).
Cap canvi depèn mai de cap volta d'anada i tornada al pare.

**Lliçó general reutilitzable per a qualsevol component d'aquest monorepo
que rep un objecte per `input()` i n'emet versions modificades cap amunt
amb canvis parcials seguits ràpidament (`(canvi)="actualitzar($event)"`,
patró "controlled component" sense Reactive Forms):** si el component
construeix cada emissió fent un merge sobre `input()` en lloc de sobre el
seu propi últim valor conegut, dues emissions seguides sense esperar la
volta de confirmació del pare poden espatllar-se l'una a l'altra. Fer
servir `linkedSignal` (sembrat de l'input, mutat localment) sempre que un
component "posseeixi" l'edició d'un valor compost mentre està muntat.

## Tres bugs reals més (mateix dia, tercera ronda de feedback)

1. **Fotos retallades a quadrat.** Totes les imatges reals són 4:3, però
   `.sh-gym-foto`/`.sh-veure-gym-foto`/`.sh-dades-gym-foto` forçaven
   `aspect-ratio: 1` + `object-fit: cover` — retallaven les etiquetes de
   dalt/baix de cada diagrama. Fix: `aspect-ratio: 4/3` +
   `object-fit: contain` a totes tres (editor, pantalla de detall, llista
   compacta del dia).
2. **Bug real d'Angular — `<select [value]>` no selecciona l'opció
   correcta si el valor s'estableix abans que les `<option>` existeixin al
   DOM.** A `editor-entrenament` (modalitat i zona) i
   `exercici-gym-fila` (part del cos), el valor s'establia a `ngOnInit`
   (abans del primer render), i el `<select>` sempre acabava mostrant la
   PRIMERA opció de la llista — que per casualitat coincidia amb el
   default d'un entrenament NOU ('CORRER'/'SUAU', primers de la llista),
   així que només es notava en EDITAR un entrenament que no fos de
   córrer: sempre apareixia "Córrer" seleccionat encara que
   `modalitat()` internament ja tingués el valor correcte. **Fix
   general per a qualsevol `<select>` d'aquest monorepo amb opcions
   generades dinàmicament i un valor inicial que ve de fora (no sempre la
   primera opció)**: afegir `[selected]="opcio === valorActual()"` a CADA
   `<option>`, no confiar només en el `[value]` del `<select>` pare.
   Aplicat també a `assignar-massiu` per prevenció encara que allà mai es
   reprodueix (el default hi coincideix sempre amb la primera opció).
3. **Bug real — editar un entrenament no actualitzava el que es veia.**
   El backend guardava bé (verificat amb la resposta HTTP real, 200 amb
   les dades noves), però `detall-dia`/`veure-entrenament`/les etiquetes
   del calendari mostraven contingut vell. Causa: `AssignacioAmbEntrenament`
   porta una **còpia encastada** de l'entrenament (ve així de
   `GET .../assignacions`), independent del signal
   `EntrenamentsService.entrenaments()` — actualitzar aquest últim no
   toca gens les còpies ja encastades a `AssignacionsService.assignacions()`.
   Fix: `EditorEntrenament.guardar()` (camí d'edició) i `.eliminar()` ara
   criden `assignacionsService.carregarDePla(plaId)` després d'un èxit,
   no només `entrenamentsService`. **Lliçó general**: qualsevol vista
   d'aquesta app que llegeixi `assignacio.entrenament` (una còpia
   encastada) en lloc de `entrenamentsService.entrenaments()` (la font
   viva) es queda desactualitzada si només es refresca l'altre signal —
   sempre que es creï/editi/elimini un `Entrenament`, cal refrescar
   `AssignacionsService` també si hi ha assignacions visibles que en
   depenen.

Verificat empíricament (no només amb captures — llegint el body real de
cada resposta HTTP amb Playwright): crear un entrenament BICI, obrir
"Editar" i confirmar que el desplegable ja mostra "Bici" (no "Córrer"),
canviar el títol i els km, guardar, i confirmar que el dia mostra el
títol nou immediatament sense haver de recarregar la pàgina.

## Lightbox de fotos d'exercici (mateix dia, quarta ronda de feedback)

A `veure-entrenament`, clicar la foto d'un exercici de GYM l'amplia en un
overlay centrat (`imatgeAmpliada` signal amb la ruta de la imatge o `null`).
Es tanca clicant fora, amb el botó `×`, o `Escape` (`@HostListener`). La
imatge original queda embolicada en un `<button>` (no un `<div>` amb
`(click)`, per accessibilitat de teclat real) amb un hover que mostra una
lupa via `::after`. z-index 950/951, per sobre del `.sh-panell` global (901)
perquè el lightbox es pugui obrir des de dins del panell "veure entrenament".

## Restyle de color i logotip (mateix dia, cinquena ronda de feedback)

L'usuari va proporcionar un logotip real nou (tres xebrons/galons vermells
apuntant avall, com una insígnia de progressió) i va demanar canviar el
color primari del terracota original (#c1441e) a **#ff3131** (el vermell
exacte del logotip), més una "reestructuració visual perquè no sembli tan
IA, sigui original i tingui relació amb el context".

- **Motiu de forma**: el xebró del logotip (`clip-path: polygon(0 0, 0 40%,
  50% 100%, 100% 40%, 100% 0, 50% 58%)` i variants) es va convertir en el
  **motiu recurrent** de tota l'app, no només al logo — reforça el tema de
  "constància, un pas més": accent `::after` a `.sh-formulari-boto`/
  `.sh-entrada-boto--primari` (fletxa d'avançar dins del botó principal),
  marcador `::before` a `.sh-calendari-dia-avui-etiqueta` ("AVUI" amb un
  xebró apuntant avall, "ets aquí"), i la barra de progrés
  (`barra-progres.css`) redissenyada amb una **textura SVG de xebrons
  repetits** en lloc d'un bloc de color llis, més una punta de fletxa
  `::after` a la vora de l'ompliment.
- **Logotip**: `public/som-hi/logo.png`/`logo1.png` (arrel del monorepo, per
  la icona de l'escriptori del Shell — ja referenciada a `desktop.ts`) **i**
  còpies idèntiques a `projects/som-hi/public/` (perquè la UI pròpia de
  l'app, servida des del seu propi origen port 4207, també hi pugui
  accedir — són dues carpetes `public/` completament separades, veure
  arquitectura de dos orígens al `CLAUDE.md` arrel). Mostrat gran com a peça
  central de `pantalla-entrada` (128px, amb `drop-shadow` vermell suau) i
  petit al costat del wordmark a `capcalera`. `index.html` actualitzat per
  fer servir `logo1.png` com a favicon.
- **Tokens** actualitzats a `styles.css`: `--sh-clay: #ff3131`,
  `--sh-clay-fosc: #d92626` (hover), `--sh-clay-suau: rgba(255,49,49,0.12)`
  (fons d'error), `--sh-mod-correr: #ff3131` (la modalitat "córrer" ara
  comparteix el vermell de signatura, coherent amb ser la disciplina que dona
  nom a l'app "Som-hi").
- Verificat amb Playwright de cap a cap (registre → llista buida → crear pla
  des de zero → calendari amb "avui" i barra de progrés amb contingut real)
  amb 0 errors de consola, més una captura a part de la icona nova a
  l'escriptori del Shell (llegible contra el wallpaper de mostra).

### Fals positiu de Playwright amb `clip-path` + botons d'ample complet

**Símptoma:** després d'afegir el xebró `::after` a `.sh-formulari-boto`
(botó `display:flex` d'ample complet, xebró com a últim fill amb
`clip-path`), `page.click('button:has-text("Continuar")')` va començar a
fallar sistemàticament amb `<app-crear-pla>...intercepts pointer events`,
tant en aquest botó com en un altre botó germà (`"Crear el pla"`) al mateix
component, després de reintentar-ho desenes de vegades fins a time-out.

**Investigació:** `document.elementFromPoint()` cridat manualment en
diversos punts del botó (inclòs el centre exacte) confirmava que el botó
—no cap altre element— era realment el que rebia el clic: cap intercepció
real. `page.click(..., { force: true })` funcionava a la primera i l'app
avançava correctament de pantalla. Afegir `pointer-events: none` a totes les
pseudo-elements `::after`/`::before` amb `clip-path` (per si Playwright
calculava malament la hit-box d'una forma no rectangular) **no va canviar
res** — el mateix error, exactament al mateix lloc, després de reconstruir.

**Conclusió:** fals positiu de l'heurística d'"actionability" pròpia de
Playwright en aquest entorn concret (no reproduïble com a bug real d'usuari
— `force: true` ho demostra), de causa exacta no identificada (no és el
`clip-path` en si, ja que `pointer-events: none` no ho va arreglar). **Regla
pràctica per a aquest monorepo**: si `page.click()` falla repetidament amb
"intercepts pointer events" tot i que `elementFromPoint()` confirma que
l'element és correctament clicable, no perseguir-ho més enllà d'una
verificació ràpida amb `force: true` — si el clic amb `force` funciona i
avança l'app correctament, és un artefacte de l'eina, no del producte;
continuar la resta de la verificació amb `{ force: true }` en lloc de
bloquejar-se.

## Regles de Desenvolupament

- Llegir `context/os-shell/angular-rules.md` per normes Angular 22+
- Llegir `context/os-shell/global-styles.md` per variables CSS de l'OS
- Tot el codi, comentaris i logs en **Català**
- Prohibit `any`; tipat fort obligatori (la unió discriminada
  `DadesEntrenament` és el mecanisme central que ho garanteix per als
  camps variables per modalitat)
- Usar Signals per a l'estat reactiu; sense NgRx ni Reactive Forms
- Components standalone; control flow modern (`@if`/`@for`/`@switch`)
- Prohibit hardcoding de text als HTML — usar `TraduccioService`

## Altres pròxims passos (fora d'abast)

- Notificacions/recordatoris d'entrenaments.
- Sincronització amb dispositius/apps esportives externes (Garmin, Strava).
- Estadístiques agregades entre plans (ritme mitjà, quilometratge anual).
- Compartir un pla amb un altre usuari.
- Desplaçar totes les assignacions d'un pla en canviar `dataInici` un cop
  ja té entrenaments col·locats (avui, canviar la data no mou les
  assignacions existents — són dates absolutes ja "estampades").
