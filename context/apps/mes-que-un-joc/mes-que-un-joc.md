# Context: Més que un joc

## Descripció
Micro-aplicació del portafolis de Roger Torrents: un recull de 4 minijocs de
cultura futbolística sobre el FC Barcelona (minuts jugats, alineacions
històriques, dorsals i títols per temporada). **Sense pantalla de
presentació:** en entrar es veu directament el menú (selecció d'època + les
4 targetes de joc en una sola fila horitzontal) → partida.

## Port de Desenvolupament
`http://localhost:4206`

## Execució
```bash
npm run start:mes-que-un-joc
```

## Regles de Desenvolupament
- Llegir `context/os-shell/angular-rules.md` per normes Angular 22+
- Llegir `context/os-shell/global-styles.md` per variables CSS de l'OS
- Tot el codi, comentaris i logs en **Català**
- Prohibit `any`; tipat fort obligatori
- Usar Signals per a l'estat reactiu
- Components standalone; control flow modern (`@if` / `@for` / `@switch`)
- Prohibit hardcoding de text als HTML — usar `TraduccioService` propi de l'app
  (independent del Shell, mateix patró que `sobre-mi`)

## Origen de les dades

**100% dades locals. Zero crides a cap API externa.** Tota la informació de
jugadors, temporades, dorsals i títols viu directament al codi font de
l'app, als fitxers `src/app/data/jugadors.data.ts` i
`src/app/data/temporades.data.ts`. No hi ha cap `HttpClient`, `fetch` ni
variable d'entorn apuntant a un servei de tercers enlloc de l'app.

**Per què no una API:** es va avaluar fer servir un servei extern (tipus
football-data.org, API-Football, etc.) però cap opció gratuïta oferia alhora
(a) accés perpetu sense caducar ni requerir clau de pagament més endavant,
i (b) el nivell de detall concret que demanen els 4 jocs — minuts totals
d'un jugador *al club* (no per temporada), dorsal exacte que portava un
jugador *una temporada concreta*, o l'onze inicial "representatiu" d'una
temporada. Aquest encreuament de dades tan específic no es troba tal qual
en cap API pública gratuïta, així que muntar-lo a mà com a base de dades
local pròpia garanteix que l'app funcioni per sempre, sense dependre de
quotes, canvis d'API ni connexió a internet.

**Com es va construir el dataset:** curat manualment (per l'IA, en aquesta
sessió) a partir de coneixement general futbolístic sobre la història del
FC Barcelona — no copiat de cap font única ni escrapejat de cap web. Dues
menes de dades amb fiabilitat molt diferent:

- **Fets objectius i verificables** (temporades, títols guanyats cada
  temporada, anys de debut/marxa dels jugadors, dorsals dels jugadors més
  icònics): reflecteixen fets reals coneguts (ex. el treble del 2008-09, el
  sextet del 2009-10/2015-16, els dorsals 10 de Messi o 6 de Xavi). Encara
  així, **no s'han contrastat contra cap font oficial durant la
  implementació** — poden contenir algun error puntual de detall (una data,
  un dorsal d'un jugador secundari, un any exacte de fitxatge).
- **Xifres aproximades per disseny, no fets** — sobretot
  `Jugador.minutsClub` (minuts totals aproximats al primer equip): són
  estimacions il·lustratives fetes a ull per mantenir un ordre de magnitud
  creïble (més partits ≈ més minuts), **no estadístiques oficials**. No s'ha
  d'interpretar aquesta xifra com una dada real consultable enlloc.

**Si en algun moment es vol més precisió o ampliar el dataset:** la manera
correcta és editar directament `jugadors.data.ts` / `temporades.data.ts`
amb dades contrastades (per exemple contra transfermarkt.com o l'arxiu
oficial del club), no afegir-hi una crida a API en calent — trencaria la
garantia de "funciona sempre, sense dependències externes" que va motivar
aquesta decisió.

**Verificació de consistència:** cada cop que s'edita `temporades.data.ts`
manualment (afegir/canviar jugadors d'una alineació), cal comprovar que (1)
tots els `jugadorId` referenciats existeixen a `jugadors.data.ts`, (2) no hi
ha dorsals duplicats dins la mateixa temporada, i (3) l'`anyInici` de la
temporada cau dins del rang `[anyDebut, anyRetirada]` del jugador. No hi ha
cap test automatitzat per això dins del repo (es va fer amb un script Node
puntual fora del projecte); si es torna a tocar aquest fitxer a fons, val
la pena tornar a fer aquesta comprovació abans de donar-ho per bo. Són 100
jugadors i 22 temporades (1991-92 a 2025-26) a data d'aquesta nota.

## Fotos de jugadors

Igual que les dades, **les fotos són fitxers locals, no un enllaç extern**
(es va descartar explícitament allotjar-les a Google Drive: no és un CDN,
no envia capçaleres de *cache* pensades per a web i pot afegir una pàgina
intermèdia d'avís o trencar-se si canvien els permisos — un fitxer local es
serveix des del mateix origen, sense salt de xarxa extra, i és permanent).

- Carpeta: `public/jugadors/<id-del-jugador>.jpg` (sempre `.jpg`, a
  propòsit: provar diverses extensions en cadena generaria 404 innecessaris
  a la consola per cada jugador sense foto). El component `FotoJugador`
  (`components/compartit/foto-jugador/`) mostra la foto si existeix i, si
  no, un avatar il·lustrat de reserva (inicials + degradat blaugrana
  determinista per `id`) — l'app no es trenca mentre no hi hagi cap foto
  real.
- Llista completa dels 71 ids esperats i instruccions de mida/format:
  `public/jugadors/README.md`.
- Es poden anar afegint fotos progressivament, jugador a jugador, sense
  tocar cap fitxer de codi.

## Imatges dels títols

Mateix patró que les fotos de jugadors: `public/titols/<id-del-titol>.png`
(sempre `.png`, per fons transparent), component `IconaTitol`
(`components/compartit/icona-titol/`), fallback a una icona de trofeu si no
hi ha imatge. Els 6 ids exactes i instruccions: `public/titols/README.md`.

## Disseny visual

Direcció: **"àlbum de cromos"** (col·lecció de cromos de futbol), no un tema
genèric. Fons fosc (#140c10, "nit d'àlbum") amb targetes de "cartolina"
(paper cru #f1e4c8), cinta adhesiva blaugrana (`.washi`) i una cantonada
que sembla despegar-se (`.cromo-cantonada`) com a firma visual repetida.
Bungee (titulars) + Karla (cos) + JetBrains Mono (xifres).

**Regla d'or: mai `border-radius`.** Totes les cantonades es tallen amb
`clip-path` (classe `.cromo` = octàgon per a targetes; chamfer de 2
cantonades per a botons/xips). Els avatars de jugador són rectangulars
(finestra de foto), no cercles. Si es toca l'estètica d'aquesta app,
mantenir aquesta direcció — no tornar a cantonades arrodonides ni a
avatars circulars, ja es va identificar explícitament com "genèric IA".

## Arquitectura funcional

- **Dades:** dataset local curat (`data/jugadors.data.ts`, `data/temporades.data.ts`),
  vegeu la secció "Origen de les dades" més amunt per al detall complet.
- **Èpoques:** `sempre` (sense filtre), `2000` (temporades/jugadors des del
  2000) i `2015` (des del 2015). Cada època té el seu propi progrés
  independent a `localStorage` (clau `mqj-progres-v1`), amb un màxim de 20
  estrelles (5 per joc × 4 jocs).
- **Mecànica compartida (`MotorJocService`, amb `providers` a nivell de
  component perquè cada joc tingui la seva pròpia instància):** 5 vides, 10
  rondes per completar el joc. Cada resposta incorrecta resta una vida; en
  arribar a 0 vides el joc s'acaba sense estrelles. En completar les 10
  rondes, les vides restants es converteixen en estrelles (0-5).
- **4 jocs:**
  1. Més o menys minuts — comparar minuts totals al club de dos jugadors.
  2. Endevina la temporada — a partir de l'onze inicial d'una temporada,
     **10 opcions com a màxim** (1 correcta + fins a 9 distractors), sempre
     dins de l'època activa (mai una temporada de fora); si l'època té
     menys de 10 temporades, simplement es mostren menys opcions. Graella
     fixa de 5 columnes (files de 5+5, no auto-fit).
  3. Endevina el dorsal — jugador + temporada → número de dorsal, **10
     opcions** (els altres 10 jugadors de la mateixa alineació aporten els 9
     distractors). **Només temporades des de 1996-97 en endavant:** abans
     d'aquell any el dorsal es repartia per demarcació a cada partit (no hi
     havia número fix per jugador), així que preguntar-lo no tindria una
     resposta única real — vegeu `PRIMER_ANY_AMB_DORSAL_FIX` a
     `joc3-dorsal.ts`.
  4. Endevina els títols — temporada → seleccionar quins títols es van
     guanyar, amb icona (`IconaTitol`) al costat de cada títol.
- **Onze/plantilla agrupats per posició:** als jocs 2 i 4, la llista de
  jugadors es mostra en files separades per posició (porter, defenses,
  migcampistes, davanters), via `utils/posicio.util.ts`
  (`agruparPerPosicio`) — reutilitzat als dos jocs, no duplicat.
