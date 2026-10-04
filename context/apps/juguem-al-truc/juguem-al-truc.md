# Context: Juguem al Truc

## Descripció

Joc de cartes tradicional de Sant Pere de Ribes (Truc), multijugador en
temps real per a 4 jugadors (2 parelles): un crea una partida i rep un codi,
els altres 3 s'hi uneixen des dels seus propis dispositius. **Primera
funcionalitat realtime del monorepo** — cap altra app ni backend fa servir
WebSockets; tot es va construir des de zero seguint el patró NestJS ja
establert per `geoexplorer-api`/`som-hi-api`, però sense base de dades (les
sales són efímeres, en memòria del procés).

Flux: `menu` → `crear`/`unir` (formulari + selector de 4 personatges,
`No Cadira/*.png`) → `sala-espera` (taula amb 4 cadires, ompliment en viu,
codi per convidar) → (host inicia) → `transicio` (scroll-driven real,
"efecte Apple" amb 16 fotogrames: paret → terra zenital) → `joc` (taula de
joc completa: mà pròpia, truc/retruc, mà dels 11, senyals, marcador) →
`acabada`. ~~El 2026-10-01 es va eliminar sencera la pantalla intermèdia
original (`intro-animacio`, crossfade CSS de 4 fons + botó "Comença!")~~
— **2026-10-02: reintroduïda com a pantalla `transicio` amb un mecanisme
diferent** (fotografia real en lloc de crossfade, sense cap botó, vegeu
secció "Transició 'efecte Apple'" més avall).

## Modes de partida (`ModeSala`): `normal` | `solo` | `parelles`

El mode es tria a `crear-partida` (3 targetes, per defecte `normal`, mai a
`unir-partida` — el mode ja el fixa qui crea la sala) i es guarda a
`Sala.mode`/`EstatSalaPublic.mode`. Els seients que no ocupa cap humà
s'omplen amb **bots** en el moment de crear la sala
(`SalesService.seientsPerBots`/`crearJugadorBot`), reutilitzant el mateix
flux de `sala-espera` que el mode `normal` — cap pantalla nova.

- **`normal`** (original): 4 humans, cap bot. `seientsPerBots` retorna `[]`.
- **`solo`**: 1 humà + 3 bots. S'omplen a l'instant els 3 seients que no és
  el del creador — la sala ja surt "plena" (`potIniciar()` ja és `true`) i
  el creador pot clicar "Iniciar partida" sense esperar ningú.
- **`parelles`**: 2 humans de la **mateixa parella** (Pere+Paula o
  Marina+Andreu, mai barrejats) contra 2 bots de la parella rival. Només
  s'omplen amb bot els 2 seients de l'equip *contrari* al personatge triat
  pel creador (`seientsDeLEquip(altreEquip(equipDeSeient(seientHost)))`) —
  el seient de la parella pròpia queda `null` i s'uneix **exactament igual
  que al mode `normal`**: codi + `unir_sala` des d'un altre dispositiu. Això
  fa que `potIniciar()` (que exigeix els 4 seients no-`null`) continuï
  bloquejant l'inici fins que arribi el segon humà, sense cap lògica nova.
- `SalesService.unir()` rebutja explícitament unir-se a una sala `solo`
  (`ErrorJoc('sala_mode_solo', …)`) encara que, per construcció, totes les
  cadires ja hi estiguin sempre — dona un missatge més clar que el genèric
  "personatge ja triat" repetit 4 cops.

Un `JugadorSala`/`JugadorPublic` porta ara `esBot: boolean`. Al frontend,
`cadira` (sala d'espera) i `seient-jugador` (taula de joc) mostren una
etiqueta "IA" (`ts.t('etiqueta_bot')`) quan `esBot` és cert; `sala-espera`
també amaga la capça de codi-per-convidar quan `mode === 'solo'` (no hi ha
ningú a qui convidar) i mostra el nom del mode sota el títol.

### IA dels bots (`src/joc/joc.bot.ts`, backend)

Heurística "de jugador experimentat", **no** cerca exhaustiva ni coneix les
cartes alienes — `decidirAccioBot(vista: VistaJugador, rng = Math.random)`
rep exactament la mateixa `VistaJugador` restringida que un client humà
(reutilitza `JocService.vistaPerJugador`), així que **respecta el mateix
anti-trampes** documentat més avall (mai veu la mà d'un altre seient, ni
tan sols la del seu propi company de bot).

- **Jugar carta**: si obre la ronda i és la primera de la mà, juga la carta
  de força *mitjana* (ni la millor ni la pitjor — un jugador experimentat no
  es gasta la millor d'entrada); si obre una ronda posterior, juga la
  millor. Si respon dins la ronda: si el seu equip ja hi guanya, juga la
  pitjor (no cal gastar-hi res de bo); si el rival hi guanya, juga la carta
  *mínima* que el superi, o sacrifica la pitjor si no en té cap prou forta.
- **Cantar Truc**: només amb mà clarament forta (`forcaCarta` del 2/3, o un
  12/1 amb bon suport) i encara amb un marge d'atzar (`rng`) perquè no sigui
  100% previsible — mai una funció determinista d'"sempre que pugui".
- **Respondre Truc / decidir la mà dels 11**: llindars de probabilitat
  segons la força de la mà pròpia i el valor en joc (2 o 3); la mà dels 11
  reutilitza literalment el mateix llindar que acceptar un truc a valor 2
  (mateixa exigència: aposta fixa a 2, sense veure cap carta jugada).
- El `rng` és injectable (per defecte `Math.random`) precisament perquè
  `joc.bot.spec.ts` pugui forçar deterministament cada branca (rng=0 força
  totes les decisions "positives"; rng=0.99 les força totes "negatives").

### Orquestració dels torns de bot (`SalesGateway`, backend)

`JocService.properaAccioPendent(codiSala): AccioPendent | null` llegeix
l'`EstatPartida` i retorna **qui** ha d'actuar a continuació: `{tipus:'jugar',
seient}` (torn concret) o `{tipus:'truc'|'ma11', equip}` (decisió d'EQUIP,
no de seient — `respondreTruc`/`decidirMa11` ja accepten qualsevol seient
d'aquell equip). El gateway (`assegurarTornBot`, cridat al final de
`finalitzarAccio` — el helper compartit per accions humanes i de bot, i
també just després d'`iniciar_partida`) decideix si aquella acció pendent
recau sobre un bot:

- Per `jugar`: bot si `sala.jugadors[seient].esBot`.
- Per `truc`/`ma11`: bot **només si TOTS DOS seients de l'equip són bots**
  — mai decideix en nom d'un company humà, ni tan sols quan el jugador que
  truca la funció també és, ell mateix, un bot. Aquesta regla és el que fa
  que al mode `solo` (on l'equip propi del jugador humà pot tenir un
  company bot) el bot mai "robi" la decisió d'acceptar/rebutjar un Truc que
  li correspon triar a l'humà.

Si toca a un bot, es programa `executarTornBot` amb `setTimeout` (700–1900ms
d'atzar — dona sensació de "pensar-s'ho", no de resposta instantània) que
crida `decidirAccioBot` amb la vista real del bot i aplica l'acció via
`JocService`, i en acabar torna a cridar `finalitzarAccio` — **s'encadena
sol**: si després segueix sent torn d'un altre bot (mode `solo` amb 3 bots
seguits, o un bot que respon un truc i tot seguit li toca jugar), es
programa automàticament el següent, sense cap bucle explícit al gateway.

**Verificat** (sense Playwright per aquesta part — scripts Node amb
`socket.io-client` contra el `truc-api` real en marxa, no simulació):
mode `solo` (1 humà + 3 bots) avança soles diverses mans senceres (cartes,
rondes, trucs cantats/resposts pels bots) sense cap `error_sala`; mode
`parelles` (2 sockets humans reals, mateixa parella, contra 2 bots) omple
la sala només amb els bots rivals en crear, bloqueja l'inici fins que
s'uneix el segon humà amb el codi, i juga diverses mans amb 58 cartes
jugades sense errors inesperats — l'únic `error_sala` observat
(`sense_truc_pendent`) és la condició de carrera **esperada i inofensiva**
de 2 humans del mateix equip responent al mateix Truc gairebé a l'hora (el
servidor rebutja el segon de manera segura, l'estat mai es corromp, i el
frontend ni tan sols mostra aquest error — `darrerError` ja existia sense
consumidor abans d'aquesta funcionalitat). Regressió confirmada: crear
sala sense el camp `mode` es comporta exactament com abans (mode `normal`,
cap bot); unir-se a una sala `solo` es rebutja amb `sala_mode_solo`.

## Ajustos posteriors: abandonar partida, ritme dels bots, retard visual, marcador (sessió 2026-09-29, en paral·lel amb una altra sessió de Claude Code)

Aquesta tanda de 4 peticions es va implementar **en paral·lel per dues
sessions de Claude Code diferents sobre el mateix directori** (backend per
una, frontend per l'altra, coordinades per missatge — `ListAgents`/
`SendMessage`). Si mai es reobre aquest tema, comprovar primer si hi ha una
altra sessió activa abans de tocar `truc-api`.

- **Abandonar partida**: nou event `abandonar_partida` (sense payload, amb
  ack `{ok:true} | {ok:false,codi,missatge}`) — backend. Si la partida ja
  anava (`estat==='jugant'`), el seient de qui abandona es converteix en
  bot perquè la resta pugui continuar (broadcast `jugador_ha_abandonat
  {seient, substituitPerBot}`); si encara s'esperava, el seient queda
  `null` (i es reassigna l'amfitrió si calia). Si desprès no queda cap
  humà, la sala s'esborra silenciosament. Frontend: botó a `sala-espera` i
  `taula-joc` (i reforçat a `partida-acabada`, que abans només feia
  `sessio.eliminar()+reload`); tots criden
  `TrucSocketService.abandonarPartida()` abans de
  `SessioJugadorService.abandonar()` (mètode nou: `eliminar()+
  window.location.reload()`, mateix patró que ja feia servir
  `partida-acabada`). **Verificat en viu**: el mateix socket pot crear una
  sala nova immediatament després d'abandonar (sense reconnectar-se cap
  fantasma a l'antiga).
- **Bots truquen menys**: llindars de `volCantarTruc` (`joc.bot.ts`)
  retallats i, sobretot, pujar per sobre de 2 (arriscar-se al topall de 3)
  ara exigeix una mà pràcticament perfecta i encara amb baixa probabilitat
  — abans no diferenciava entre la primera crida i una repujada.
- **Retard visual de l'última carta de la ronda — disseny híbrid
  backend+frontend, no domina cap dels dos tots sols**: el backend retarda
  ~1.8s **només** el `estat_joc` posterior a un `ronda_resolta` (els events
  `carta_jugada`/`ronda_resolta` segueixen sortint a l'instant, com sempre;
  `assegurarTornBot` també queda dins d'aquest retard, evitant que el
  següent bot jugui abans que s'acabi de veure la ronda). Però **un retard
  del backend tot sol no n'hi ha prou**: com que el motor ja buida
  `cartesRondaActual` dins la mateixa transició que resol la ronda, l'estat
  amb les 4 cartes juntes **mai s'ha difós** — calia que el frontend deixés
  de llegir `vista().cartesRondaActual` directament i pintés cada carta a
  l'instant des de l'esdeveniment `carta_jugada` (signal
  `cartesTaula` a `taula-joc.ts`), sincronitzant-la cap avall només quan
  arriba la següent `estat_joc` (ja retardada pel backend). **Cap
  temporitzador propi al frontend** — si es dupliqués el retard (backend +
  frontend), la pausa es faria massa llarga. Mesurat en viu: 1815ms entre
  `ronda_resolta` i l'`estat_joc` net.
- **Marcador amb 3 rodones per ronda**: `Marcador` rep ara
  `historialRondes: readonly ResultatRonda[]` i calcula `EstatRonda`
  (`'guanyada'|'empat'|'perduda'|'pendent'`) comparant cada resultat contra
  `elMeuEquip()` — verd/groc/vermell/buit, sempre des del punt de vista de
  qui mira la pantalla (no hi ha una fila per equip, és una de sola).

**Bug de tooling après (no de l'app)**: editar `taula-joc.html` (afegint el
binding `[historialRondes]`) abans d'acabar `marcador.ts` (afegint
l'`input` corresponent) va deixar el `ng serve` d'aquest monorepo (Vite/
esbuild) encallat en l'error de compilació intermedi — **no es va
recuperar sol** ni tan sols després de corregir tots els fitxers pocs
segons després. Calia matar els 9 processos orfes de `concurrently`
(`netstat`+`taskkill`, els ports 4200-4208 seguien ocupats fins i tot
després d'aturar la tasca de fons) i re-llançar `npm run start:all`.
**Lliçó reutilitzable**: si un canvi entre dos fitxers relacionats (input
nou + binding que el fa servir) es fa en dos passos separats, i el dev
server queda "silenciós" (el log deixa de créixer) després d'un error de
compilació, no donar per fet que s'recuperarà sol en corregir-ho — cal
verificar explícitament (p.ex. `curl` al bundle servit buscant una cadena
del canvi nou) i reiniciar si cal.

## Port de Desenvolupament

`http://localhost:4208`

## Execució

Cal tenir aixecats **dos processos** en paral·lel (a més del Shell):

```bash
# 1. truc-api (repo separat, NO dins d'aquest monorepo Angular)
cd c:/portafolis/back/truc/truc-api
npm run start:dev          # http://localhost:3002

# 2. Frontend, des de l'arrel del monorepo Angular
npm run start:juguem-al-truc   # http://localhost:4208
```

Sense base de dades ni Docker — `npm install` n'hi ha prou la primera
vegada. Backend: `npm run build` / `npm run lint` / `npm test` (tests Jest
del motor de joc a `src/joc/joc.engine.spec.ts`).

## Regles del joc (resum — el manual complet el va donar l'usuari en un sol missatge)

- Baralla espanyola de **48 cartes** (4 colls × valors 1-12, **inclou 8 i 9**
  — aquesta variant NO és la baralla habitual de 40 sense figures mitjanes).
  Força (alta→baixa): `3>2>1>12>11>10>9>8>7>6>5>4`. Colls sense jerarquia
  entre ells.
- Mà = fins a 3 rondes. Guanya 2 rondes o, en cas d'empat, s'aplica la regla
  "la primera ronda és decisiva" (vegeu pseudocodi a `joc.engine.ts`,
  `avaluarMa()` — inclou el fallback defensiu d'"empat total" si les 3
  rondes queden sense guanyador clar, estadísticament gairebé impossible).
  Si una ronda s'empata, la ronda **següent la torna a obrir la mateixa
  persona** que havia obert la ronda empatada (no el seient següent) —
  vegeu "22a passada" més avall per al bug real que hi havia en això.
- Truc: 1→2→3 punts, escalable només per l'equip que NO ha fet l'última
  pujada, rebutjar dona el valor previ (no el proposat).
- Mà dels 11: quan un sol equip és exactament a 11, decideix si vol jugar
  (aposta fixa a 2) abans de veure cap carta jugada. **Si rebutja (o
  accepta i perd) i es queda igual a 11, la mà SEGÜENT li torna a oferir
  la MATEIXA decisió — a cada mà, sense límit — fins que accepti o fins
  que l'altre equip també arribi a 11** (en aquest cas no hi ha cap
  decisió especial, Truc normal, guanyar la mà arribant a 12 guanya la
  partida). **Mentre un equip és a 11 i no ha acceptat, NI mentre la mà
  dels 11 ja acceptada s'està jugant, cap de les dues parelles pot
  cantar Truc** — l'aposta hi queda fixa a 2, no és un punt de partida
  per escalar més; vegeu "23a passada" i "25a passada" més avall.
- Senyals (opcionals, purament visuals): tinc un 1/2/3 i "no porto res" —
  no toquen l'estat del joc, només broadcast d'una pose.

## Personatge → equip → seient (decisió de disseny central)

**Fixat, no depèn de l'ordre d'unió**: Pere=seient 0 (equip A), Marina=1
(equip B), Paula=2 (equip A), Andreu=3 (equip B). Seients `i`/`i+2` són
parella (seuen oposats); adjacents són rivals. Triar personatge determina
directament seient i equip — no calia cap algorisme d'assignació dinàmica.
Vegeu `comu/models/personatge.model.ts` (backend) i
`models/personatge.model.ts` (frontend), idèntics.

### Seients egocèntrics (frontend)

Cada jugador es veu sempre a si mateix a baix de la pantalla,
independentment del seu seient absolut. `services/seients.util.ts`
(`posicioRelativa(seientAbsolut, elMeuSeient)`) calcula `baix/dalt/esquerra/
dreta` a partir del desplaçament mòdul 4 — `dalt` sempre és la parella
(seient+2). Reutilitzat a `sala-espera` (component `cadira`) i `taula-joc`
(component `seient-jugador`). **Important, après verificant amb Playwright**:
posicionar aquests 4 llocs amb CSS Grid `template-areas` amb columnes/files
`auto` és fràgil (el `width:%` d'un fill dins d'una pista `auto` no té base
fiable) — es va haver de canviar a `position:absolute` amb `top/left/right/
bottom` + `translate` dins d'un contenidor quadrat `position:relative`. No
tornar a Grid per aquest patró.

## Assets (`public/truc/`)

**Convenció de noms MIXTA i deliberadament NO normalitzada** — a diferència
de la resta del monorepo, aquesta carpeta NO segueix minúscules/kebab-case
arreu. Dues famílies conviuen:

- `cadira/`, `botons/`: noms en minúscules (`pere.png`, `truco.png`) —
  l'import original.
- `no-cadira/`, `normal/`, `truco/`, `res/`, `un-1/`, `un-2/`, `un-3/`,
  `baralla-espanyola/`: noms **capitalitzats** (`Pere.png`, `Marina2.png`,
  `oros_03.png`), afegits/re-exportats directament per l'usuari a la
  carpeta en una sessió posterior (2026-10-01).

**Bug real trobat i corregit**: el codi original donava per fet minúscules
arreu i construïa les rutes concatenant `personatge` (valor intern del
model, sempre minúscula: `'pere'`) directament — `'/truc/no-cadira/' +
personatge + '.png'`. En un filesystem Windows normal això hauria
funcionat per la insensibilitat a majúscules del propi SO, però **el
dev-server de Vite que fa servir `ng serve` a Angular 22 serveix els
assets de `public/` de manera sensible a majúscules fins i tot en
Windows** (`curl .../no-cadira/pere.png` → 404; `.../Pere.png` → 200,
verificat en viu) — les imatges sortien trencades a `selector-personatge`,
`cadira` (sala d'espera) i `intro-animacio`. Fix: `nomFitxerPersonatge()`
a `models/personatge.model.ts` (frontend) capitalitza la primera lletra;
tots els llocs que construeixen una ruta d'imatge a partir d'un
`Personatge` hi passen ara per aquesta única funció — **lliçó
reutilitzable**: mai donar per fet que un filesystem case-insensitive fa
innòcua una inconsistència de majúscules/minúscules; el servidor de
desenvolupament (o un futur desplegament a Linux) pot no ser-ho.

- `elements/fons-1.jpg` → `fons-4.jpg`: una mateixa seqüència de càmera
  (vista a l'alçada dels ulls → zenital pura), usada per l'scroll de
  `intro-animacio`.
- `elements/taula.jpg`: feltre verd zenital, la taula de joc.
- `cadira/*.png` (minúscules): **els 4 fitxers són byte-idèntics** (mateix
  MD5) — és UNA cadira buida reutilitzada, no 4 cadires diferents. Usar-ne
  qualsevol (`intro-animacio` i `cadira` sempre usen `cadira/pere.png`
  literalment, no cal passar-hi `nomFitxerPersonatge`).
- `no-cadira/<Personatge>.png`: personatge dret, sense cadira — selectors
  de personatge (`crear-partida`, `unir-partida` via `selector-personatge`)
  i sala d'espera (`cadira`).
- **`normal/`, `truco/`, `res/`, `un-1/`, `un-2/`, `un-3/`
  `<Personatge><N>.png` (N = 0..3)**: el personatge ja assegut, una imatge
  diferent per cada combinació de pose **i** nombre de cartes que li
  queden a la mà (16 fitxers per carpeta = 4 personatges × 4 variants de
  recompte). `seient-jugador.ts` (`rutaImatge`, computed) construeix la
  ruta combinant `pose()` + `nomFitxerPersonatge(j.personatge)` +
  `cartesRestants() ?? 3` (el `3` per defecte cobreix l'instant abans que
  arribi el primer `estat_joc` de la mà, igual que `intro-animacio`
  — que sempre mostra la variant `3`, ja que a l'intro tothom acaba de
  rebre la mà sencera). `taula-joc.html` passa ara el recompte real
  **a totes les posicions, també `baix` (un mateix)** — abans es forçava a
  `null` només per amagar la bombolla numèrica dels altres seients (que
  `seient-jugador.html` ja amagava sola amb `@if (!ets() && ...)`), però
  calia el valor real per triar la imatge correcta del propi gegant
  també. `taula-joc.ts` decideix quina pose mostrar temporalment
  (`posePerSeient`, es reverteix sola a `normal` als 2200ms) reaccionant a
  `darrerEsdeveniment()` (`truc_cantat`) i `darrerSenyal()`.
  **Fitxer corregit**: `un-3/Paula.png` (sense dígit, únic cas no
  sistemàtic dels 96) renombrat a `un-3/Paula3.png` per seguir el mateix
  patró que la resta — més senzill i entenedor que afegir un cas especial
  al codi per a una sola combinació.
- `botons/tiro.png` (tirar carta), `truco.png` (cantar truc), `un-1/2/3.png`
  + `res.png` (els 4 senyals) — botons reals de `barra-accions`.
- **`baralla-espanyola/<coll>_<valor 2 dígits>.png`** (48 fitxers: 4 colls
  × `01`-`12`): cartes il·lustrades completes (fons, vora, pal·la, número a
  les cantonades) afegides per substituir l'SVG propi original. El
  component `carta` ja no dibuixa res — `rutaImatgeCarta()` a
  `models/carta.model.ts` construeix la ruta directament des de
  `Carta.coll`/`Carta.valor` (coincideixen exactament amb el nom de
  fitxer, cap mapeig addicional); `carta.html` és només un `<img>`.
  `carta.css` simplificat (ja no calen `.ct-valor`/`.ct-icona`, la imatge
  ja porta tot el disseny) amb `aspect-ratio: 400/620` (mida real dels
  PNG). Reutilitzat sense cap canvi addicional a `ma-jugador` (mà pròpia) i
  `taula-joc` (cartes jugades al centre, `[petita]="true"`) — l'API pública
  del component (`carta`/`seleccionada`/`petita`) no va canviar.
- Material solt a `C:\portafolis\fotos\truc\` (fora de `truc\truc\`, no
  copiat): `Gemini_Generated_Image_*`, `ullet.jpg`, etc. — no utilitzat,
  disponible per si cal ampliar.

**Verificat visualment** amb Playwright real (binari ja present a
`~/AppData/Local/ms-playwright/`, sense afegir-lo com a dependència del
projecte — invocat amb `NODE_PATH` apuntant al paquet resolt per `npx`):
flux complet crear sala `solo` → sala d'espera (avatars `no-cadira`
visibles) → intro (scroll real programàtic) → taula de joc amb mans
repartides i bots jugant — 0 errors de consola, 0 peticions amb estat
≥400, cartes de la baralla i gegants (nom+pose+recompte) carregant la
imatge esperada en cada cas (confirmat llegint el DOM real, no només la
captura: `Pere3.png` per a un mateix amb 3 cartes, `Andreu3.png` amb pose
`truco` en cantar Truc, etc.).

## Backend: `truc-api` (`c:/portafolis/back/truc/truc-api`)

NestJS 11, sense Prisma/BD (estat en memòria, `Map` per codi de sala).

```
src/
  comu/
    models/carta.model.ts       — Coll, Carta, forcaCarta(), generarBaralla()
    models/personatge.model.ts  — Personatge, Equip, seient fix per personatge
    errors/error-joc.ts         — ErrorJoc (codi+missatge), únic tipus d'error de domini
  joc/
    joc.engine.ts   — MOTOR PUR (sense DI, sense estat): repartirNovaMa,
                       jugarCarta, cantarTruc, respondreTruc, decidirMa11,
                       vistaPerJugador + helpers privats (resoldreRonda,
                       avaluarMa, finalitzarMa)
    joc.engine.spec.ts — tests Jest del motor (empats, escalada de truc,
                       mà dels 11, rotació de distribuïdor, anti-trampes)
    joc.service.ts  — Map<codiSala, EstatPartida>; orquestra "si l'acció
                       deixa la mà buida i la partida no s'ha acabat,
                       reparteix la següent automàticament"; també exposa
                       `properaAccioPendent()` (qui ha d'actuar a
                       continuació — usat per decidir si li toca a un bot)
    joc.bot.ts      — IA heurística dels bots: `decidirAccioBot(vista, rng)`
    joc.bot.spec.ts — tests Jest de la IA (totes les branques, rng fixat)
  sales/
    sala.model.ts, sales.service.ts — Map<codi, Sala>: crear/unir/
                       reconnectar/seients/host (codi de 5 caràcters,
                       alfabet sense 0/O/1/I/L); `sales.service.ts` també
                       omple els seients de bot en crear (`ModeSala`)
    sales.gateway.ts — únic WebSocketGateway, tots els events; també
                       orquestra els torns de bot (`assegurarTornBot`)
    dto/*.dto.ts     — class-validator, un DTO per event amb payload
```

**Decisió important**: `EstatPartida.ultimDistribuidor` viu al nivell de
partida (no dins `EstatMa`, que es posa a `null` en acabar la mà) —
necessari perquè `repartirNovaMa()` sàpiga per on rotar el distribuïdor
sense que el `service` l'hagi de passar per fora.

**Anti-trampes**: `estat_joc` mai es fa amb un broadcast únic — el gateway
itera els jugadors de la sala i crida `vistaPerJugador(codi, seient)` un
cop per socket, així cadascú només rep la seva pròpia mà (`VistaJugador.
maPropia`), la resta són només comptadors (`cartesRestants`). Verificat amb
un test dedicat (`vistaPerJugador (anti-trampes)` a l'spec).

**Validació de seient real, no de client**: totes les accions de joc
(`jugarCarta`, `cantarTruc`, `respondreTruc`, `decidirMa11`) reben el
`seient` derivat del `jugadorToken` al gateway (mai confiat del payload del
client) i el motor torna a validar torn/equip internament — el servidor no
es refia que el client només enviï accions vàlides.

### Contracte d'esdeveniments Socket.IO

Client → servidor (amb ack): `consultar_sala`, `crear_sala` (payload amb
`mode?: 'normal'|'solo'|'parelles'`, opcional i per defecte `'normal'` —
`unir_sala` **no** porta `mode`, el fixa qui crea la sala), `unir_sala`,
`reconnectar` (tots retornen `{ok:true,...} | {ok:false,codi,missatge}`).
Sense ack (fire-and-forget, resposta via broadcast): `iniciar_partida`,
`jugar_carta`, `cantar_truc`, `respondre_truc`, `decidir_ma11`, `fer_senyal`.

Servidor → clients: `estat_sala` (broadcast, res secret), `partida_iniciada`
(senyal buit, porta directament a `joc` — ~~abans disparava
`intro-animacio`~~, eliminada 2026-10-01), `estat_joc` (**per jugador**),
`carta_jugada`/`ronda_resolta`/`ma_resolta`/`truc_cantat`/`truc_resolt`/
`ma11_pendent`/`ma11_resolta`/`ma_repartida`/`partida_acabada` (broadcast,
un nom d'event per cada `tipus` d'`EsdevenimentJoc`), `senyal_fet`,
`jugador_desconnectat`, `error_sala` (només al client que ha fet l'acció
invàlida).

## Frontend (`projects/juguem-al-truc/`)

Sense Router (patró de tot el monorepo): `NavegacioService.pantalla`
(`'menu'|'crear'|'unir'|'sala-espera'|'joc'|'acabada'` — ~~abans incloïa
`'intro'`~~, eliminada 2026-10-01), canviat per
`App` (efectes reactius a `senyalIniciPartida`/`guanyadorPartida`) o pels
mateixos components en accions d'usuari.

- **`services/truc-socket.service.ts`** — únic punt de contacte amb
  `socket.io-client`; exposa tot l'estat rebut com a signals
  (`estatSala`, `estatJoc`, `elMeuSeient`, `darrerEsdeveniment`,
  `darrerSenyal`, `senyalIniciPartida` comptador...). `elMeuSeient`
  s'actualitza tant des de l'ack de `crear_sala`/`unir_sala`/`reconnectar`
  **com** des de `estat_joc` — **bug real trobat i corregit**: si només es
  fixa des de `estat_joc` (que no arriba fins que la partida comença), la
  sala d'espera sencera es veu buida (cap seient, ni el propi) perquè
  `elMeuSeient` és `null` tota l'estona prèvia.
- **`services/sessio-jugador.service.ts`** — `jugadorToken` a
  **`sessionStorage`, no `localStorage`** (una sola sessió activa, no per
  sala); `App` l'intenta servir-se al arrencar (`reconnectar`) abans de
  mostrar el menú. **Bug real trobat i corregit**: amb `localStorage`
  (compartit entre TOTES les pestanyes del mateix origen), quan 2 humans
  jugaven des de 2 pestanyes del mateix navegador (mode `normal` o
  `parelles` — molt habitual en proves, i fins i tot en ús real si 2 amics
  comparteixen dispositiu), la segona pestanya que es desava sobreescrivia
  la clau compartida; si la primera pestanya mai es refrescava tot anava
  bé, però en refrescar-la `intentarReconnectar()` hi recuperava el token
  de l'ALTRA persona i la suplantava — totes dues pestanyes acabaven sent
  el mateix jugador, i quan era el torn de l'altre, cap interfície ho
  detectava (símptoma reportat: "quan li toca tirar a la segona persona,
  sembla que li toca a l'altra i cap dels dos pot tirar"). `sessionStorage`
  és per pestanya, no per origen — resol el problema per construcció, a
  costa de ja no sobreviure a tancar i reobrir la pestanya (abans sí, amb
  `localStorage`) — compromís acceptat: aïllar identitat entre pestanyes
  simultànies és més important que sobreviure a tancar-la del tot.
- **`environments/environment.ts`** — `apiUrl` (patró ja establert per
  GeoExplorer), `fileReplacements` a `angular.json` per producció.
- Components de `taula-joc/`: `seient-jugador` (pose), `ma-jugador`
  (selecció+confirmació amb el botó `tiro`), `carta` (imatges de
  `baralla-espanyola/`, vegeu secció "Assets"),
  `marcador`, `barra-accions` (tiro/truco/4 senyals), `overlay-truc`,
  `overlay-ma11`.
- **`components/compartit/selector-personatge/`** — reutilitzat a
  `crear-partida` i `unir-partida`; `unir-partida` el nodreix amb l'event
  `consultar_sala` (debounce 350ms en escriure el codi) perquè es vegin els
  personatges ja triats abans de confirmar.
- **`crear-partida`** — 3 targetes de mode (`normal`/`solo`/`parelles`,
  signal `mode`, per defecte `normal`) abans del formulari; `unir-partida`
  **no** té selector de mode (el mode ja el fixa la sala existent). `cadira`
  (sala d'espera) i `seient-jugador` (taula de joc) mostren una etiqueta
  "IA" quan `jugador.esBot` és cert — dada que ja arriba per
  `EstatSalaPublic`/`JugadorPublic`, no calia cap event nou.

### Redisseny visual de "Com es juga" + fons fix que mai es mou (sessió 2026-10-04, 26a passada)

Petició: la pantalla de regles (15a passada, llista plana de seccions
text) calia fer-la "més visual, estètica i entenedora", i el seu fons
calia que fos com el de `menu-inicial`/`sala-espera` — **mateixa mida,
que mai es mogui; si es mou que sigui només "la finestra"**.

**Bug de fons corregit** (causa real): `.cj-pantalla` tenia
`min-height:100vh` (no `height`) i cap `overflow:hidden` — com el
contingut de regles és llarg, l'element creixia per sobre del
viewport i el `background` (`cover`, calculat sobre l'alçada TOTAL,
no la del viewport) s'estirava/desplaçava en fer scroll de pàgina.
`menu-inicial`/`sala-espera` no pateixen això perquè el seu contingut
sempre cap en un sol viewport. Fix: `.cj-pantalla` passa a
`height:100vh` (fix, mai creix) + `overflow:hidden`, idèntic patró de
fons+vel que `menu-inicial` (`url(...) center/cover` + `.cj-vel` amb
gradient radial per sobre). Tot el contingut es mou a una nova
`.cj-finestra` (panell de pergamí, `max-height:min(88vh,780px);
overflow-y:auto`, scrollbar prima daurada pròpia) — **és l'ÚNICA cosa
que es mou ara**, exactament com l'usuari ho va demanar literalment.
Verificat amb Playwright llegint `scrollHeight`/`clientHeight` de
`.cj-pantalla` (idèntics, mai fa scroll) vs `.cj-finestra` (sí en fa).

**Redisseny visual, derivat de contingut real del motor (`joc.engine.ts`),
mai d'icones genèriques**:
- **Objectiu / Per guanyar la partida**: un "segell" circular (llautó +
  numeral Cinzel, mateix llenguatge que `.tr-medallo` però estàtic) amb
  el **"12"** — es repeteix als dos extrems de la pàgina (obre i tanca)
  a posta, perquè sigui l'element de signatura: tota la pàgina gira al
  voltant d'aquest número.
- **La mà dels 11**: el mateix segell, més petit, amb **"11"** — ressò
  visual directe del "12", reforça que és "gairebé el número que
  importa".
- **Equips i seients**: diagrama real de 4 punts "en creu" (dalt/baix
  mateix equip connectats per una línia, esquerra/dreta l'altre equip)
  — la MATEIXA geometria que la taula de joc real (`seients.util.ts`),
  perquè l'explicació es reconegui a cop d'ull quan s'arribi a la taula
  de veritat, en lloc d'un diagrama abstracte inventat.
- **Com es juga una mà**: 3 passos numerats ①②③ amb fletxes — **aquí SÍ
  calia numerar** (a diferència de l'advertència habitual de la skill
  `frontend-design` contra 01/02/03 decoratius): les 3 rondes són
  literalment una seqüència real on l'ordre importa.
- **Qui guanya la mà** (la regla més densa de tota la pantalla): en
  lloc d'un sol paràgraf llarg, una mini-taula amb els **5 únics casos
  possibles** (derivats literalment d'`avaluarMa()`, cap cas inventat),
  cada un com a 3 "punts" (guanyada/empat/decisiva/no cal) + una frase
  curta — amb llegenda. És la millora d'entenedoria més gran de tota la
  passada: una regla que calia llegir 2-3 cops es capta ara d'una
  ullada.
- **El Truc / Els senyals**: les imatges REALS dels botons del joc
  (`/truc/botons/truco.png`, `un-1/2/3.png`, `res.png`), retallades amb
  el MATEIX patró ja establert a `barra-accions.css` (`width:118%;
  left:-9%; top:-43%` dins d'un cercle `overflow:hidden` — el PNG té
  molt marge transparent al voltant del cercle il·lustrat) — mai icones
  genèriques noves.

**Traduccions**: 9 claus noves (`cj_equip_a/b`, `cj_ronda`, 5×
`cj_cas_*`, 4× `cj_dot_*`) × 3 idiomes = 27 entrades noves, verificat
amb un script que compta claus `cj_*` per bloc de idioma i confirma
paritat exacta (31 claus als 3 blocs, cap orfe). `cj_guanyar_ma_text`
escurçat (el detall ara viu a la taula de casos, no al paràgraf).

**Verificació**: `tsc --noEmit` net, `ng build juguem-al-truc` en verd
(només un avís no bloquejant de pressupost CSS del component, 6.95kB
sobre un límit d'avís de 4kB / error a 8kB — esperable per una pantalla
molt més il·lustrada, no cal retallar-la per això). Captures Playwright
a 1280×900 i 390×844 (mòbil): 0 errors de consola, 0 scroll horitzontal,
totes les seccions llegibles i ben retallades als dos amples.

### Correcció de la regla real: la mà dels 11 s'ha de tornar a oferir CADA mà, no un sol cop (sessió 2026-10-04, 25a passada)

Petició, després que l'usuari respongués "encara ho veig malament" a la
24a passada i se li van demanar detalls concrets: "quan vas a 11 i li
dius que no vols anar, li suma un punt a l'altre (això està bé), però
després va directament a partida [normal], hauria de tornar a
preguntar fins que la parella que te 11 punts digui que sí, que juga,
o l'altra parella arribi també a 11. Quan jugues a 11 segueixes podent
trucar, cap de les dues parelles hauria de poder."

**La 21a passada havia diagnosticat malament el problema original.**
El comportament "es torna a preguntar cada mà mentre un equip es
quedi a 11" no era el bug — **era la regla correcta**, i la 21a
passada el va eliminar per error introduint `ma11Resolt` (un flag "ja
preguntat, mai més"). Això significa que, des de la 21a passada fins
ara, un equip que rebutjava (o acceptava i perdia) la mà dels 11 passava
a jugar la mà SEGÜENT amb Truc normal — exactament el contrari del que
calia, i la causa real de "quan jugues a 11 segueixes podent trucar".

**Fix: revertir `ma11Resolt` completament.**
- `joc.model.ts`: eliminat el camp `ma11Resolt` de `EstatPartida` (i el
  seu comentari, que descrivia la regla incorrecta).
- `joc.engine.ts`: `estatInicial()` ja no l'inicialitza;
  `repartirNovaMa()` torna a la condició simple `puntuacions.X === 11`
  (sense `&& !ma11Resolt.X`) per activar `ma11Pendent`; `decidirMa11()`
  ja no construeix cap `partidaAmbResolt` intermedi, fa servir `partida`
  directament als dos camins (acceptar/rebutjar).
- El fix de la 23a passada (`esMaDels11`, que bloqueja Truc mentre la
  mà dels 11 és activa) es manté intacte i ara cobreix AMBDÓS casos amb
  normalitat: `ma11Pendent` ja bloquejava Truc mentre la decisió està
  pendent (a CADA mà en què es torna a oferir, no només la primera), i
  `esMaDels11` segueix bloquejant-lo un cop acceptada. Amb `ma11Resolt`
  fora de l'equació, totes les mans en què un equip és a 11 i encara no
  ha dit que sí queden cobertes automàticament — no calia cap canvi
  addicional per a la segona part de la petició ("cap de les dues
  parelles hauria de poder trucar").

**Tests actualitzats** (`joc.engine.spec.ts`, `joc.service.spec.ts`):
eliminades totes les referències a `ma11Resolt` dels fixtures; el test
que afirmava "només es pregunta un cop" s'ha reescrit per confirmar
exactament el contrari (es torna a preguntar a cada mà fins acceptar);
nou test que confirma que, si rebutjar repetidament fa que l'ALTRE
equip també arribi a 11, la mà següent ja no ofereix cap decisió
especial (cobert per la lògica `equipA11 !== equipB11` ja existent, no
tocada). **47/47 tests passen.**

**Verificació end-to-end** contra el motor ja compilat
(`dist/joc/joc.engine.js`): equip A a 11 rebutja 3 cops seguits —
confirmat que CADA mà següent torna a oferir `ma11Pendent: 'A'` i
`esMaDels11: true`, i que `cantarTruc` llença `ma11_pendent` cada
vegada, exactament com l'usuari esperava.

**Lliçó, la més cara d'aquesta sèrie de passades**: la 21a passada va
assumir que "es torna a preguntar cada mà" era necessàriament un bug
pel simple fet de ser repetitiu, sense confirmar primer amb l'usuari
quina era la regla real pretesa — i els tests nous que vaig escriure
en aquell moment (i la 24a passada, que els va reverificar amb encara
més rigor) només confirmaven la coherència INTERNA del codi, mai la
correcció de la REGLA en si. Verificar que un sistema fa exactament el
que els seus propis tests diuen que ha de fer no serveix de res si la
premissa dels tests ja és la incorrecta. **Quan un informe d'usuari
descriu un comportament com "bloquejat per sempre" i la causa arrel és
"es repeteix indefinidament", no assumir automàticament que la
repetició és el defecte** — confirmar primer, amb l'usuari o amb les
regles originals del manual, si la repetició és el comportament previst
i el problema real és un altre (aquí: Truc no bloquejat correctament
durant les repeticions, que és el que la 23a passada SÍ va arreglar bé).

Backend reiniciat (mateix procediment de les passades anteriors).

### Verificació completa de la mà dels 11 amb tests d'integració de `JocService` (sessió 2026-10-02, 24a passada)

Petició: l'usuari va reexplicar TOTA la regla de la mà dels 11 des de
zero ("segueix estant malament... analitza i refes") just després de la
23a passada, demanant una revisió completa en lloc d'un pedaç puntual.

**Mètode**: en lloc de confiar en els tests unitaris purs ja existents
de `joc.engine.ts` (que no exerciten `JocService.continuarSiCal`, la
capa real que fa el repartiment automàtic de la mà següent — l'ÚNICA
part de l'stack no coberta pels tests d'`joc.engine.spec.ts`), es va
instanciar `JocService` directament (`new JocService()`, sense DI —
no té cap dependència al constructor) i manipular el seu `Map` privat
intern (`(servei as unknown as {...}).partides.set(...)`) per injectar
estats exactes sense dependre de l'atzar del repartiment. Això permet
verificar l'ORQUESTRACIÓ real (la mateixa capa que crida el gateway en
producció) sense xarxa ni simulació de partides senceres.

**Les 4 regles que l'usuari va re-explicar, cadascuna verificada amb un
test dedicat**:
1. Equip a 11 accepta i guanya la mà (2-0) → guanya la PARTIDA.
2. Equip a 11 accepta i l'altre equip guanya la mà → l'altre equip suma
   2 punts, la partida continua, i la mà SEGÜENT (repartida
   automàticament per `continuarSiCal`) ja no torna a preguntar i
   permet Truc normal.
3. Equip a 11 rebutja → l'altre equip suma 1, mà nova amb Truc normal.
4. 11 a 11 → cap equip té `ma11Pendent`, Truc funciona amb normalitat
   des del principi, i guanyar la mà (arribant a 12) guanya la partida.

**Resultat**: les 4 ja funcionaven correctament — els fixes de la 21a
(`ma11Resolt`) i la 23a (`esMaDels11`) ja cobrien tots els casos. **La
primera versió del test de verificació SÍ que va fallar** (7 falles),
però per un error del propi test, no del motor: només es jugava 1
carta per seient (1 ronda), i `avaluarMa` exigeix com a mínim 2 rondes
jugades abans de poder decidir una mà (`historial.length < 2 → acabada:
false` sempre) — guanyar només la ronda 1 MAI decideix la mà tot sol,
cal com a mínim un 2-0 o una 3a ronda de desempat. **Lliçó reutilitzable,
important per a qualsevol test futur d'aquest motor**: una mà de Truc
necessita SEMPRE com a mínim 2 rondes jugades per concloure (encara que
la ronda 1 tingui un guanyador clar i contundent) — donar només 1 carta
per seient a un fixture de test i esperar que la mà s'acabi after és un
error de test, no un símptoma de bug al motor.

**Tests nous persistits** (no esborrats, a diferència de scripts de
verificació anteriors): `src/joc/joc.service.spec.ts`, nou fitxer amb
els 4 escenaris anteriors. **45/45 tests passen** (41 previs + 4 nous).
Cap canvi de codi de producció calia aquesta passada — només cobertura
de test nova i confirmació explícita. Si l'usuari encara veu el
problema després d'això, la causa més probable és que la partida que
tenia oberta al navegador es va quedar òrfena quan es va reiniciar el
backend per carregar el fix de la 23a (l'estat és només en memòria,
`Map<codi,EstatPartida>`, sense persistència — un reinici esborra
TOTES les partides en curs) — cal una partida completament nova per
retestar.

### Bug real: durant la mà dels 11 ja acceptada, encara es podia cantar Truc (sessió 2026-10-02, 23a passada)

Petició: "Si alguna parella de 11 punts, no s'ha de poder trucar durant la
partida [la mà]. Fes aquesta modificació i bloqueja-ho per tal que no
pugui passar."

**Causa real**: `cantarTruc` només bloquejava mentre `ma11Pendent` era
viu (decisió encara no presa) amb l'error `ma11_pendent`. Un cop
`decidirMa11(..., true)` fixava `aposta.valor = 2` i posava
`ma11Pendent = null`, aquell guard deixava de disparar-se — i l'únic
altre guard de `cantarTruc` (`aposta.valor >= 3`) no bloquejava res,
perquè 2 és menor que 3. Resultat: durant TOTA la resta de la mà dels
11 (un cop acceptada), qualsevol dels dos equips podia cantar Truc amb
normalitat, tractant el valor 2 com un punt de partida per escalar a 3
— contradient el disseny original ("vull jugar" fixa l'aposta a 2
**directament**, no és un truc normal que comença a 2).

**Fix**: nou camp `esMaDels11: boolean` a `EstatMa` (`joc.model.ts`),
cert des que `repartirNovaMa` detecta un equip a 11 i persisteix a
TRUE durant tota la mà (abans i després de decidir — a diferència de
`ma11Pendent`, que SÍ torna a `null` en decidir). `cantarTruc` ara
llença un error nou i específic (`ma11_activa`) quan `ma.esMaDels11` és
cert, abans de comprovar qui té el torn — bloqueja els DOS equips, no
només el que ha decidit. Exposat també a `VistaJugador.esMaDels11`
(afegit a `vistaPerJugador`) perquè el frontend el pugui amagar/
desactivar del tot, no només rebre l'error del servidor.

**Altres llocs que calia actualitzar, trobats per grep abans de donar
la tasca per feta**:
- `joc.bot.ts` (`potCantarTruc`): la IA dels bots tenia EXACTAMENT el
  mateix buit (`aposta.valor >= 3` com a únic guard) — sense aquest fix,
  un bot hauria intentat cantar Truc durant la mà dels 11 i el servidor
  l'hauria rebutjat silenciosament (cap efecte visible, però una crida
  innecessària i una prova que la IA "no sap" la regla nova). Afegit
  `if (vista.esMaDels11) return false;` al principi de la funció.
- Frontend (`taula-joc.ts`, `potTrucar`): afegit `|| v.esMaDels11` al
  `return false` anticipat, i el nou camp a la interfície
  `VistaJugador` del frontend (`models/joc.model.ts`, duplicada del
  backend com sempre en aquesta app).
- `joc.engine.spec.ts` (`partidaAmbMa`): fixture de test que construeix
  `EstatMa` a mà, calia afegir `esMaDels11: false` (mateix patró que la
  21a passada amb `ma11Resolt` — `ts-jest` no fa type-check estricte
  dels fixtures).

**Verificació**:
- Test nou: accepta la mà dels 11, confirma `esMaDels11: true`, i que
  `cantarTruc` llença `ErrorJoc` amb codi `ma11_activa` des del seient
  de torn. **41/41 tests passen** (40 previs + 1 nou).
- `npx tsc --noEmit` net al frontend (cap error de tipus pel camp nou a
  `VistaJugador`).
- Confirmat contra el motor compilat (`dist/joc/joc.engine.js`): abans
  de decidir, `cantarTruc` llença `ma11_pendent`; després d'acceptar,
  llença `ma11_activa` tant per a l'equip que ha acceptat com per a
  l'altre equip (cap dels dos pot trucar).
- Backend reiniciat (mateix procediment de les passades 21a/22a).

### Bug real: en empatar una ronda, la ronda següent l'obria el seient equivocat (sessió 2026-10-02, 22a passada)

Petició: "En cas de que s'empati la primera ronda, la segona ronda l'ha de
comensar la mateixa persona que ha començat la primera, el mateix passaria
si s'empata la segona."

**Causa real** (`jugarCarta` a `joc.engine.ts`, bifurcació quan la ronda
acabada és un empat i encara cal jugar-ne una altra): el `torn` de la
ronda següent es calculava com `(primerSeientRonda + 1) % 4` — el seient
**següent** al que havia obert la ronda empatada, no el mateix. Això
també estava documentat (erròniament) al comentari del helper de test
`jugarRondaCompleta`: "o el seient següent si va quedar en empat". Bug
real de regles, trobat per petició directa de l'usuari, no per repro —
no calia cap investigació prèvia, el manual original ja ho especificava
així i el motor no ho implementava correctament.

**Fix**: `seguentTorn = primerSeientRonda` (sense `+1`) quan
`guanyadorRonda === 'empat'`. Un sol canvi d'una línia; la resta de la
lògica (qui obre quan HI HA guanyador clar, `seientGuanyador`) ja era
correcta i no es toca.

**Verificació**:
- 2 tests existents (`joc.engine.spec.ts`) que ja cobrien un empat a la
  ronda 1 no necessitaven canviar les seves assercions de puntuació —
  `resoldreRonda` és una funció pura de les 4 cartes jugades, independent
  de l'ordre en què es juguen, així que el resultat final de la mà no
  depenia de qui obria. Només calia afegir una asserció nova
  (`partida.maActual?.torn === 0`, és a dir el mateix seient que havia
  obert) per confirmar explícitament el comportament correcte — abans no
  es comprovava enlloc quin seient obria després d'un empat.
- Afegit un test nou que cobreix explícitament el segon cas que l'usuari
  va esmentar ("el mateix passaria si s'empata la segona"): empat a la
  ronda 1 I a la ronda 2 (mateixes dues cartes empatant cada vegada,
  seient 0 vs. seient 1), confirmant que `torn` es manté a 0 després
  de CADA empat consecutiu, abans que la ronda 3 (decisiva, guanyada per
  seient 3 amb un 1) tanqui la mà. **40/40 tests passen** (39 previs +
  1 nou).
- Confirmat també contra el motor ja compilat (`dist/joc/joc.engine.js`,
  mateix patró de `require()` directe de la 21a passada) amb un empat
  creuat real (`oros-3` vs `copes-3`): `torn` després de l'empat és `0`,
  el mateix seient que havia obert.
- Backend reiniciat (`node dist/main`, mateix procediment que la 21a
  passada: `netstat` per trobar el PID a port 3002, `Stop-Process -Force`,
  relloançar) perquè el build nou es carregui en viu.

### Bug real: un equip encallat exactament a 11 es quedava bloquejat per sempre sense poder tornar a cantar Truc (sessió 2026-10-02, 21a passada) — ⚠️ DIAGNOSI INCORRECTA, REVERTIDA a la 25a passada

**Aquesta secció descriu un fix que es va REVERTIR del tot a la 25a
passada** (2026-10-04) perquè la diagnosi original era errònia: el
`ma11Resolt` d'aquí sota NO EXISTEIX al codi actual. La regla real
(confirmada explícitament per l'usuari) és que la mà dels 11 S'HA de
tornar a oferir a CADA mà mentre un equip es quedi exactament a 11 —
exactament el comportament que aquesta passada (equivocadament) va
tractar com un bug. Es manté aquesta secció sencera com a registre
històric de l'error, no com a referència vàlida — vegeu la secció "25a
passada" més avall per a la regla i la implementació correctes.

Petició original: "Si un dels dos equips te 11 punts, accepta i es juga la partida,
despres no es pot tornar a trucar, queda bloquejat el boto i ja no es pot
trucar, ja que ja es a 2 punts si l'equip que va perdent guanya."

**Mecanisme exacte (confirmat amb un script Node que fa `require()` directe
del motor compilat `dist/joc/joc.engine.js` i construeix `EstatPartida`/
`EstatMa` a mà — molt més ràpid que simular una partida sencera via
sockets/Playwright per arribar a 11 punts exactes):** `repartirNovaMa`
activava `ma11Pendent` amb la condició `partida.puntuacions.A === 11`
(sense cap memòria de si l'equip ja havia decidit abans). Un equip que
accepta la mà dels 11 (valor 2) i la **perd**, o que la **rebutja**
directament, es queda exactament a 11 punts (no se li suma res, o
l'adversari suma però ell no es mou de 11). A la mà següent,
`repartirNovaMa` tornava a avaluar `puntuacions.A === 11` → **encara cert**
→ tornava a oferir `ma11Pendent: 'A'` **a cada mà següent, indefinidament**,
fins que l'equip guanyés aquella mà concreta (saltant a 13, fi de partida)
o l'adversari arribés a 12 abans. Mentre `ma11Pendent` és actiu,
`jugarCarta`/`cantarTruc` llencen `ErrorJoc('ma11_pendent', ...)` —
correctament, però com l'usuari mai sap que se li torna a preguntar la
mateixa decisió a cada mà (`overlay-ma11` reapareix igual que la primera
vegada), ho viu com "el botó de Truc s'ha quedat bloquejat per sempre".
Confirmat: NO és un bug de UI ni de xarxa — és un bug de disseny de les
regles ("la mà dels 11" havia de ser una decisió **d'un sol cop** per
equip, no una porta que es torna a obrir cada vegada que la puntuació
coincideix amb 11).

**Fix** (`c:/portafolis/back/truc/truc-api/src/joc/joc.model.ts` +
`joc.engine.ts`): nou camp `ma11Resolt: Readonly<Record<Equip, boolean>>`
a `EstatPartida` (inicialitzat a `{ A: false, B: false }` a
`estatInicial()`). `repartirNovaMa` ara exigeix
`puntuacions.X === 11 && !ma11Resolt.X` per activar `ma11Pendent`.
`decidirMa11` marca `ma11Resolt[equip] = true` **en el mateix instant que
es pren la decisió** (abans de mirar si `vol` és `true` o `false`), de
manera que els dos camins (acceptar i després perdre la mà, o rebutjar-la
directament) queden coberts per igual — el flag no depèn del resultat de
la mà jugada, només del fet d'haver decidit.

**Altres llocs que construïen `EstatPartida` a mà** (detectats afegint el
camp com a *required* i deixant que `npm test` els marqués en fallar en
temps d'execució — `ts-jest` d'aquest projecte no fa type-check estricte
dels fixtures, així que `npm run build` per si sol NO ho hauria detectat):
`joc.engine.spec.ts` tenia dues funcions factory de fixtures
(`partidaAmbMa`, `partidaAmbPuntuacions`) que calia actualitzar amb
`ma11Resolt: { A: false, B: false }`. Afegit també un test nou de
regressió explícit: accepta/rebutja la mà dels 11 a 11 punts, comprova
`ma11Resolt`, i verifica que la mà **següent** ja no reactiva
`ma11Pendent` i permet `cantarTruc` amb normalitat. **39/39 tests passen**
(38 previs + 1 nou).

**Verificació end-to-end** (script directe contra el motor compilat, els
dos camins possibles del bug real reportat per l'usuari):
1. Equip A a 11, **rebutja** la mà dels 11 → `ma11Resolt.A: true` a
   l'instant; mà següent → `ma11Pendent: null`; `cantarTruc` des del
   seient de torn funciona sense error.
2. Equip A a 11, **accepta** (vull jugar, aposta puja a valor 2) i
   **l'equip B guanya la mà** (A es queda igual a 11, no hi ha manera que
   A sumi punts si perd la pròpia mà dels 11) → `ma11Resolt.A` ja era
   `true` des del moment d'acceptar; mà següent → `ma11Pendent: null`.

Backend reiniciat (`node dist/main`, no corria en mode watch —
`"start"` normal de Nest, procés trobat amb `netstat`/`Get-CimInstance`)
per carregar el build nou a port 3002.

### Decisió de la mà dels 11: veure la mà i poder senyalar la parella (sessió 2026-10-02, 19a passada)

Petició: en el moment de decidir si jugar la mà dels 11, qui decideix ha
de poder veure bé les seves cartes i senyalar-les a la parella — abans
`overlay-ma11` (igual que `overlay-truc`) tapava TOTA la pantalla
(`position:fixed;inset:0`), incloent-hi la mà pròpia i els botons de
senyal, exactament com el bug de la 18a passada però ara volgut
corregir des de l'arrel (no només fer-lo "més vistós" com la pulsació
del Truc, sinó fer que la mà i els senyals de debò quedin accessibles).

- **`app-overlay-ma11` mogut de germà de `.tj-pantalla` a fill de
  `.tj-taula-zona`** (`taula-joc.html`), amb `.om-vel` passant de
  `position:fixed` a `position:absolute` (relatiu a `.tj-taula-zona`,
  que ara té `position:relative`). Com que `.tj-taula-zona` és
  exactament "tot menys el panell lateral" en QUALSEVOL disposició
  (escriptori en fila, mòbil en columna — flexbox ja ho calcula sol),
  això garanteix que l'overlay mai tapi `.tj-lateral`, sense haver de
  duplicar lògica de breakpoints.
- **Panell lateral s'eixampla durant la decisió** (`.tj-lateral--ma11`,
  `flex-basis: min(400px, 40vw)` enlloc de `min(300px, 32vw)` — la taula
  cedeix l'espai sola via `flex:1`) i **les cartes de la mà creixen**
  (`--ct-mida` variable CSS, llegida per `carta.css`, sobreescrita a
  `118px` per `.mj-ma--ampliada` — travessa l'encapsulació de vistes
  d'Angular sense `::ng-deep`, cap hack calia).
- **Els 4 senyals "respiren"** (`.ba-senyals--destacat .ba-boto {
  animation: tr-pols ... }`, mateix keyframe global ja usat pel Truc)
  perquè convidin a fer-los servir en aquest moment concret.
  `potDecidirMa11()` (ja existia) alimenta els 3 inputs nous
  (`ampliada`, `destacarSenyals`, i la posició de l'overlay) — cap lògica
  nova de decisió, només exposar-la a 3 llocs més.
- **Bug d'infraestructura greu trobat MIG VERIFICANT, no relacionat amb
  el codi d'aquesta passada**: el `ng serve` (Vite) portava bastant
  estona vivint en aquesta sessió llarga i **havia deixat de recarregar
  canvis de CSS** — un test de Playwright confirmava que el clic al
  senyal seguia bloquejat pel `.om-vel` MALGRAT el fitxer CSS en disc ja
  tenir `position:absolute` correctament. Confirmat llegint directament
  el bundle servit (`curl .../main.js | grep om-vel` encara mostrava
  `position: fixed`) — reiniciar el procés (`ng serve juguem-al-truc`)
  ho va resoldre a l'instant. **Lliçó reutilitzable, important**: si una
  verificació amb Playwright CONTRADIU un canvi de CSS que es confirma
  correcte llegint el fitxer en disc, sospitar del dev server abans que
  del propi codi — comprovar-ho llegint el bundle JS/CSS realment servit
  (`curl localhost:PORT/main.js | grep <selector>`), no només el fitxer
  font.

**Verificat amb Playwright** (després de reiniciar el servidor): mesura
exacta de caixes (`getBoundingClientRect`) confirma que `.om-vel` ara
ocupa EXACTAMENT la zona de la taula (mateixes coordenades que
`.tj-taula-zona`) i que `.tj-lateral` en queda completament fora;
`elementFromPoint` al centre del botó de senyal resol a la imatge del
botó real, no a l'overlay. En una partida jugada de cap a cap fins a la
mà dels 11 de l'equip propi: `cardWidth:118` (ampliat des de 92),
`lateralWidth:400` (ampliat des de 300), `senyalAnimacio:"tr-pols"` —
els 3 canvis actius alhora, confirmats, 0 errors de consola.

### Retrats dels gegants guanyadors a la partida acabada (sessió 2026-10-02, 20a passada)

Petició: mostrar els 2 gegants de l'equip guanyador (amb un pernil,
`public/truc/guanyador/`) petits i integrats, just a sobre dels noms.

- **L'asset de l'usuari era UNA SOLA imatge amb els 4 personatges junts**
  (`Gemini_Generated_Image_*.jpg`, fons blanc), no 4 fitxers separats com
  el text de la petició semblava donar a entendre — calia analitzar-la
  abans de donar per fet res. Es va **identificar cada personatge
  comparant-lo visualment amb les imatges ja etiquetades existents**
  (`normal/Andreu3.png`, `normal/Marina3.png`...) abans de retallar, en
  lloc de confiar en l'ordre "obvi": l'ordre real a la imatge és
  Pere, Andreu, Paula, Marina (NO l'ordre de seient 0-1-2-3).
- **Retall + eliminació del fons, totalment automatitzat amb Playwright**
  (sense cap eina d'edició d'imatge externa): (1) un script va escanejar
  columnes de píxels no-blancs per trobar els límits de cada personatge
  (dos panells es tocaven lleugerament pel pernil que sobresurt — es va
  ajustar el tall uns 20px després de veure-ho a la primera passada);
  (2) un segon script va retallar cada panell a un `<canvas>` i posar
  `alpha=0` als píxels gairebé blancs (amb una zona de transició suau
  25-245 per no deixar vora dura), exportant 4 PNG transparents
  (`Pere.png`, `Marina.png`, `Paula.png`, `Andreu.png`, mateixa
  convenció capitalitzada que la resta de `public/truc/`).
- **`PartidaAcabada.retratsGuanyadors`** (nou computed): combina
  `seientsDeLEquip(equip)` + `sala().jugadors[seient].personatge` +
  `nomFitxerPersonatge()` (ja existents, cap duplicació) per obtenir les
  2 rutes d'imatge de l'equip guanyador, en ordre de seient.
  `partida-acabada.html`/`.css`: una fila `.pa-retrats` just a sobre de
  l'"eyebrow" (GUANYA), amb `filter:drop-shadow` (mateix llenguatge
  visual que els gegants de la taula) i un lleuger marge negatiu perquè
  els 2 retrats es xafin una mica, com una parella asseguda junta.
- **Bug d'infraestructura trobat (NO relacionat amb el codi d'aquesta
  passada)**: el servidor de desenvolupament (`ng serve`) NO va detectar
  la carpeta `public/truc/guanyador/` nova fins a reiniciar-lo — a
  diferència dels canvis de codi font (que recarreguen sols), **Vite
  necessita un reinici per descobrir fitxers nous afegits a `public/`
  mentre ja estava en marxa** (confirmat: `curl` tornava 404 pel fitxer
  tot i existir al disc, i 200 per a qualsevol altre asset ja conegut).
  **Lliçó reutilitzable**: si un asset nou a `public/` dona 404 malgrat
  existir al disc amb el nom correcte, reiniciar el dev server abans de
  sospitar cap altra cosa.

**Verificat amb Playwright**: partida completa jugada (navegador +
3 sockets) fins que un equip guanya — captura real confirma els 2
retrats correctes (`Marina.png`/`Andreu.png` per a l'equip guanyador
real d'aquella partida, no hardcoded) carregant-se correctament
(`naturalWidth>0`) i renderitzant-se a la mida esperada, 0 errors de
consola.

### "Es queda bloquejat" (2a vegada): NO era un bug tècnic — era el diàleg de Truc/mà-dels-11 passant desapercebut (sessió 2026-10-02, 18a passada)

L'usuari va reportar que el bloqueig "segueix passant" després de la 17a
passada, amb una pista nova: passa quan es clica la mà o un botó de la
dreta "quan no et toca". Aquesta vegada, en lloc de teoritzar sobre el
codi, es va REPRODUIR DIRECTAMENT amb Playwright abans de tocar res.

- **1r intent de repro (sockets instantanis, mode normal, sense bots)**:
  819 clics fora de torn (cartes + senyals) durant una partida sencera —
  **el joc va continuar funcionant perfectament** (76 tirades pròpies
  completades). Cap bloqueig.
- **2n intent (mode `solo`, bots amb retards reals de 0.7-1.9s, més
  representatiu d'un humà esperant)**: el mateix patró de clics —
  **0 tirades pròpies en 150s malgrat 1718 intents**. Bloqueig real
  reproduït! La captura de pantalla en el moment del bloqueig ho va
  revelar a l'instant: hi havia un diàleg "Han cantat Truc a 2" ben
  visible, amb "Vull!"/"No vull" perfectament clicables — **el test
  (i, per extensió, l'usuari) simplement no hi havia clicat**.
- **Confirmació definitiva**: es va repetir el mateix test afegint
  gestió del diàleg de Truc/mà-dels-11 (clicar "Vull!"/"Vull jugar" quan
  apareixen) — **15 de 15 tirades pròpies completades en 101s, amb 292
  clics fora de torn pel mig, 0 errors**. El motor de joc i la
  sincronització d'estat funcionen correctament; no hi havia cap
  condició de cursa nova.

**Diagnòstic real**: `overlay-truc`/`overlay-ma11` són diàlegs a
`position:fixed; inset:0` que tapen TOTA la pantalla (mà pròpia i
botons inclosos) mentre s'espera una decisió — un clic a la carta o a
un senyal en aquest moment no arriba enlloc (l'overlay l'intercepta),
cosa correcta i esperada. Però si l'usuari no se n'adona (per exemple,
mirant només la seva mà, esperant que arribi "el seu torn" en el sentit
tradicional) i segueix clicant-hi repetidament sense efecte visible,
sembla exactament "el joc s'ha quedat penjat" — i **"sortir i tornar a
entrar" funciona** perquè en recarregar la pantalla sencera es torna a
veure el diàleg amb ulls frescos, es clica, i tot flueix.

**Fix (purament de percepció, no de lògica)**: `.ot-targeta`/
`.om-targeta` (la targeta del diàleg, NOMÉS quan `pucRespondre()`/
`pucDecidir()` és cert — a qui només espera no li cal) ara porten
`[class.ot-targeta--urgent]`/`[class.om-targeta--urgent]`, amb
`animation: tr-pols 1.6s ease-in-out infinite` — el mateix `@keyframes`
GLOBAL ja existent (`styles.css`, l'anell pulsant de "el teu torn") que
fa respirar suaument el diàleg perquè sigui difícil no adonar-se'n, fins
i tot mirant de reüll. **Zero codi JS nou, zero lògica tocada** — només
reutilitzar una animació global ja provada.

**Lliçó reutilitzable, la més important d'aquesta passada**: davant d'un
"es bloqueja" intermitent, REPRODUIR-HO EMPÍRICAMENT (amb Playwright,
simulant exactament el patró descrit per l'usuari) ABANS de teoritzar
sobre condicions de cursa al codi — la causa real pot ser completament
diferent del que sembla a primer cop d'ull (aquí: 0% bug tècnic, 100%
discoverability d'un diàleg). Teoritzar primer hauria portat a "arreglar"
una condició de cursa inexistent; el test amb bots reals (no sockets
instantanis) va ser clau per revelar-ho — amb sockets instantanis el
joc avançava tan ràpid que mai hi havia una finestra de temps real on
l'usuari "esperés" prou per generar la confusió.

### Bug real: la carta que tanca la ronda es perdia (i semblava que el torn es bloquejava) (sessió 2026-10-02, 17a passada)

L'usuari va reportar 2 símptomes junts: (1) "a vegades es queda com
bloquejat, indica que ha de tirar una altra persona però en veritat et
toca a tu" i (2) "la última carta de la ronda, en tirar-la, no s'arriba a
veure a la taula, desapareix directament". Anàlisi completa del codi
(`truc-socket.service.ts` + `taula-joc.ts`) sense reproduir-ho primer a
cegues — es va trobar la causa arrel llegint com viatgen els esdeveniments
del servidor al client.

**Causa real (confirmada, no només sospitada)**: `darrerEsdeveniment` és
UN SOL `signal<EsdevenimentJoc|null>` que rep TOTS els tipus d'esdeveniment
(`carta_jugada`, `ronda_resolta`, `ma_resolta`, `ma_repartida`, etc.) —
cadascun simplement el SOBREESCRIU (`.set(esdeveniment)`). El servidor
(`sales.gateway.ts`, `emetreEsdeveniments`) emet `carta_jugada` SEGUIT
IMMEDIATAMENT de `ronda_resolta` (i de vegades també `ma_resolta` +
`ma_repartida` si la mà també s'acaba) en el MATEIX bucle síncron, sense
cap pausa entre ells. Com que un `effect()` d'Angular només reacciona al
valor MÉS RECENT d'un signal quan finalment s'executa (no repassa cada
valor intermedi pel qual ha passat), si el `.set()` de `ronda_resolta`
arriba abans que l'`effect` que escoltava `carta_jugada` arribi a
executar-se, aquell `effect` mai arriba a veure l'esdeveniment
`carta_jugada` — la carta final de la ronda simplement no s'afegeix mai
a `cartesTaula`. **Això explica el símptoma (2) amb certesa matemàtica**
(és justament la carta que SEMPRE va acompanyada d'un segon esdeveniment
gairebé simultani). **També explica el símptoma (1)**: durant els 1.8s
de pausa intencionada després d'una ronda (`RETARD_RONDA_RESOLTA_MS`),
l'anell de torn encara mostra correctament el jugador ANTERIOR (l'estat
nou encara no ha arribat, per disseny) — però combinat amb la carta que
falta, la taula sembla "congelada/trencada" en lloc d'una transició
normal, i l'usuari ho interpreta com si el joc s'hagués quedat penjat
("toca a una altra persona") en lloc d'una pausa curta i normal.

**Fix** (`truc-socket.service.ts` + `taula-joc.ts`, només frontend — el
backend ja emetia tot correctament, el problema era només com el client
ho consumia):
- Nou signal dedicat `TrucSocketService.cartesJugades: signal<readonly
  CartaJugada[]>([])`, que només CREIX (`.update(arr => [...arr, nova])`)
  — un `carta_jugada` rebut TRIGA a ser consumit, però MAI es perd,
  encara que l'`effect` consumidor s'executi menys cops dels que aquest
  signal s'actualitza (a diferència d'un signal "últim valor" com
  `darrerEsdeveniment`). `carta_jugada` surt del bucle genèric que
  alimentava `darrerEsdeveniment` i té el seu propi listener dedicat.
  Es buida en rebre `partida_iniciada` (evita arrossegar cartes d'una
  partida anterior, rellevant ara que "tornar a jugar" reutilitza el
  mateix socket).
- `TaulaJoc`: l'`effect` que alimentava `cartesTaula` ja no llegeix
  `darrerEsdeveniment()` filtrant per tipus — ara llegeix
  `trucSocket.cartesJugades()` sencer i processa només les entrades noves
  des de l'últim cop (`cartesJugadesProcessades`, un comptador local
  d'índex) — garanteix matemàticament que cap carta es perd,
  independentment de quants altres esdeveniments arribin pel mig.
- L'altre consumidor de `darrerEsdeveniment` (`truc_cantat`, per a la
  pose) es manté intacte: `cantarTruc()` al motor NOMÉS emet aquest sol
  esdeveniment, mai acompanyat d'un altre al mateix lot — no pateix
  aquest problema, no calia tocar-lo.

**Verificat amb Playwright real**: partida jugada automàticament (1
navegador + 3 sockets directes) mostrejant el nombre de `.tj-carta-pila`
visibles cada 60ms durant 25 rondes seguides, registrant el màxim assolit
entre cada neteja de taula — **25 de 25 rondes van mostrar exactament 4
cartes abans de netejar-se** (0 regressions), 0 errors de consola.

### "Tornar a jugar" des de la partida acabada (sessió 2026-10-02, 16a passada)

Petició explícita: un botó a la pantalla final que porti tothom de nou a
la sala d'espera (mateixos jugadors, sense re-triar personatge) i deixi
el codi reutilitzable per si algú es vol tornar a unir.

**Backend** (`truc-api`):
- `SalesService.reiniciar(codi)` (nou): torna `sala.estat` a `'esperant'`
  mantenint `jugadors` intactes (ningú torna a triar personatge/nom).
  Idempotent si ja estava `esperant` (dos clics gairebé simultanis no fan
  petar res); només es rebutja si `estat === 'jugant'` (reiniciar una
  partida en curs no té sentit).
- `SalesGateway`: nou esdeveniment `tornar_a_jugar` (sense payload, com
  `iniciar_partida` — identifica qui truca via el seu socket). **Qualsevol
  dels 4 jugadors el pot demanar, no només l'host** (a diferència
  d'`iniciar_partida`): aquí no hi ha res a configurar, un reinici no té
  el mateix risc que decidir quan comença la partida de debò. Crida
  `salesService.reiniciar()` + `jocService.eliminar(codi)` (neteja la
  `EstatPartida` acabada — `JocService.iniciar()` ja en crea una de ben
  nova la propera vegada, sense calia cap mètode de "reset" nou al
  `JocService`) i difon `estat_sala` (actualitzat) + un nou esdeveniment
  broadcast `partida_reiniciada` (buit, mateix patró que
  `partida_iniciada`).
- **Això sol ja fa possible "tornar a unir-se amb el mateix codi"**: l'únic
  que bloquejava `unir_sala` en una sala acabada era
  `sala.estat !== 'esperant'` — cap canvi calia a `unir()`.

**Frontend**:
- `TrucSocketService`: `senyalReiniciarPartida` (signal comptador, mateix
  patró que `senyalIniciPartida`), escolta `partida_reiniciada`, mètode
  `tornarAJugar()`.
- `App` (constructor): nou `effect` — en rebre el senyal, neteja
  `estatJoc` (evita que hi quedi penjat el `guanyadorPartida` de la
  partida vella, que faria disparar l'altre efecte cap a `'acabada'` si
  mai es tornés a re-emetre) i navega a `'sala-espera'`, **per a TOTS 4
  els jugadors** (no només qui ha clicat — el broadcast arriba a
  tothom).
- `PartidaAcabada`: botó nou "Tornar a jugar" (icona ↻) al costat de
  "Tornar al menú" dins un `.pa-botons` flex — crida
  `trucSocket.tornarAJugar()` i prou; la navegació real la fa l'efecte
  d'`App` en rebre el broadcast (mateix patró desacoblat que
  `iniciar_partida`/`sala-espera`).
- Clau de traducció nova `tornar_a_jugar` a les 3 llengües.

**Verificat de cap a cap, 2 vegades**: primer amb 4 sockets directes
(`socket.io-client`, sense navegador, 112s per arribar a 12 punts —
juguen sols sense bots pel mig perquè no calia la part visual), confirmant
`estat_sala`→`esperant` + `partida_reiniciada` als 4, `consultar_sala`
amb el mateix codi retornant la sala jugable, i una `iniciar_partida`
posterior repartint de 0 punts. Després amb Playwright de debò (1
navegador real + 3 sockets, des del menú fins a clicar "Tornar a jugar" a
la UI): **bug de test trobat i corregit pel camí** (el bucle
d'autojoc del navegador clicava la mateixa carta cada tick sense esperar
que Angular actualitzés el DOM — `MaJugador.triar()` ALTERNA la selecció,
així que clicar-la 2 cops la deseleccionava; calia un bucle seqüencial,
no un `setInterval` asíncron sense protecció contra solapaments) i
un segon bug de test (el primer intent no simulava l'scroll de la
pantalla de transició i es quedava encallat indefinidament esperant-hi).
Un cop arreglat el test: partida completa jugada des de la UI real,
"Tornar a jugar" clicat, sala d'espera reapareix amb els 4 jugadors ja
asseguts i el mateix codi — 0 errors de consola.

### Pantalla "Com es juga" (sessió 2026-10-02, 15a passada)

Nova pantalla de regles accessible des del menú inicial (3r medalló, pal
♠ — completa visualment el joc de pals ♦/♣ dels altres dos), component
`components/com-jugar/`. Petició explícita: "mateixa estètica",
"eficiència i professionalitat".

- **Contingut extret del motor real (`joc.engine.ts`), no d'un manual de
  Truc genèric**: aquesta variant té regles pròpies que difereixen del
  Truc/Trumfo habitual (baralla de 48 amb 8 i 9, mà dels 11, escalada de
  Truc 1→2→3, regla "la primera ronda és decisiva" en cas d'empat) — es
  va llegir `avaluarMa()`/`cantarTruc()`/`decidirMa11()` directament
  abans d'escriure cap text, per no explicar unes regles que l'app
  realment no implementa.
- **La jerarquia de cartes es mostra amb imatges REALS** (`app-carta`,
  reutilitzat tal qual de `taula-joc`), no amb text ni icones
  inventades: 12 cartes d'oros (una per valor) en `ORDRE_FORCA`
  (`[3,2,1,12,11,10,9,8,7,6,5,4]`, el mateix array que ja feia servir
  `carta.model.ts`), `[petita]="true"`. Una referència útil de debò, no
  decorativa.
- **Pantalla dins el flux de navegació existent**: `Pantalla` (tipus)
  guanya `'com-jugar'`; NO s'afegeix a `pantallesAmbConnexio` d'`App`
  (igual que `menu`/`crear`/`unir`, no necessita el WebSocket). El botó
  "Tornar" sempre porta a `'menu'` (mateixa convenció que `cp-tornar`/
  `up-tornar` a crear/unir-partida — "tornar" vol dir sempre "al menú"
  en aquesta app, mai "pantalla anterior").
- **Mateix llenguatge visual que `crear-partida`/`unir-partida`**: fons
  `fotograma_01.jpg` + vel verd, targeta `var(--tr-crema)` arrodonida.
  Única diferència deliberada: aquesta pantalla SÍ pot fer scroll (no és
  la taula de joc) — la targeta creix amb el contingut en lloc
  d'encabir-se en una alçada fixa.
- **21 claus de traducció noves** (`cj_*` + `menu_com_jugar`) a les 3
  llengües, reaprofitant sempre que calia text ja existent al joc real
  (p.ex. "Vull!"/"No vull" del Truc ja tenien les seves pròpies claus
  `vull`/`no_vull`, no calia duplicar-les aquí).

**Verificat amb Playwright**: navegació completa menú→com-jugar→tornar,
canvi d'idioma via el mateix `postMessage({origen:'os-shell',
tipus:'idioma', valor})` que fa servir el Shell real (no inventat),
0 errors de consola, 0 peticions trencades. `ng build` net.

### Fix real del retall de les icones dels botons (sessió 2026-10-02, 14a passada)

La 13a passada va deixar els botons "rars, tallats" — l'usuari ho va
reportar immediatament. Causa real, trobada mesurant `getBoundingClientRect()`
de `.ba-boto` vs el seu `<img>` en lloc de re-endevinar els percentatges
a cegues: **`styles.css` (reset global de l'app) ja tenia `img {
max-width: 100% }`**, pensat per a imatges normals de flux — aquesta
regla capava silenciosament el `width:127%` de la 13a passada de nou a
100% (`max-width` sempre guanya a `width` quan `width` el superaria),
mentre `left`/`top` seguien calculats assumint una imatge un 27% més
gran de la que realment es dibuixava — resultat: la imatge quedava
alhora massa petita I desplaçada, deixant gaps amb el fons per un costat
i retallant el cercle per l'altre.

- Fix: `.ba-boto img` afegeix `max-width: none` (desactiva el reset
  global només aquí, on cal que la imatge sigui expressament més gran
  que el seu contenidor).
- **De pas, marge més generós** (demanat explícitament): el retall es
  va recalcular per omplir només ~88% del botó (abans 95%, al pèl —
  `tiro.png`, la icona amb el cercle més ample mesurat, hi tocava el
  límit exacte). Nous valors: `width:118%; left:-9%; top:-43%`
  (abans `127%/-14%/-51%`).

**Verificat amb Playwright**: `getBoundingClientRect()` confirma
`img.width / boto.width ≈ 1.18` (abans ≈ `1.00`, el bug). Captures amb
`deviceScaleFactor:4` (zoom real, no interpolat) de totes 6 icones:
cercle sencer amb l'anell daurat complet i marge net per tots els
costats, cap tall. **Lliçó reutilitzable**: quan un valor CSS calculat
a mà no es comporta com s'esperava, llegir els `getBoundingClientRect()`
reals d'ambdós elements implicats (contenidor i contingut) ABANS de
tornar a endevinar percentatges — un reset global oblidat (`max-width:
100%` en aquest cas) és invisible mirant només el propi bloc de regles
que s'està editant.

### Icones dels botons ampliades, entrada a la partida més ràpida (sessió 2026-10-02, 13a passada)

Dos retocs més:

- **Icones de `botons/*.png` es veien petites dins del cercle**: analitzant-les
  amb un script Playwright (pintar cada PNG a un `<canvas>` i mesurar amb
  `getImageData` la caixa delimitadora dels píxels amb alfa>10, no a ull)
  es va confirmar que el cercle il·lustrat real només ocupa ~75% de
  l'amplada i ~49% de l'alçada del fitxer (1664×2522px, molt marge
  transparent al voltant, igual a les 6 imatges — `tiro`/`truco`/`res`/
  `un-1/2/3`) — amb `img { width:100% }` senzill, el cercle quedava
  petit dins del botó per molt gran que es fes aquest. Fix a
  `barra-accions.css`: `.ba-boto` passa a `aspect-ratio:1` +
  `overflow:hidden` (abans la seva alçada depenia de l'alt natural de la
  imatge); `.ba-boto img` ara és `position:absolute` amb
  `width:127%; left:-14%; top:-51%` — amplia i recentra la imatge perquè
  el CERCLE (no el canvas sencer) ompli el botó. Valors únics per a les 6
  imatges (la petita variació real de marge entre elles, 72-79%
  d'amplada, és imperceptible a aquesta mida). `box-shadow` mogut de
  `img` a `.ba-boto` (ara que la imatge és més gran que el seu
  contenidor, un `box-shadow` sobre `img` quedaria amagat per
  `overflow:hidden`).
- **Entrada a la partida massa lenta**: la suma de 3 retards (0.5s de
  marge de `transicio-partida` + 1s de "només terra" + 1.1s de transició
  CSS de revelació, ~2.6s en total des d'arribar al fotograma 16 fins a
  veure-ho tot) es va escurçar a ~0.25s+0.5s+0.7s. Tocats
  `RETARD_ABANS_DE_LA_PARTIDA_MS` (`transicio-partida.ts`,
  500→250),`RETARD_NOMES_TERRA_MS` (`taula-joc.ts`, 1000→500) i
  `DURADA_REVELACIO_MS` (1100→700, ha de seguir sent ≥ la transició CSS
  més llarga) + les pròpies transicions CSS de `taula-joc.css`
  (difuminat 1.1s→0.65s, taula-zona 0.8s→0.5s, lateral 0.8s+0.15s de
  retard→0.5s+0.1s) — **totes les constants relacionades tocades alhora**,
  no només una, perquè `entradaCompletada` sempre ha de seguir esperant
  com a mínim el que triga la transició CSS visual més llarga.

**Verificat amb Playwright**: temps real cronometrat des que l'scroll
arriba al final fins que `.tj-pantalla` té la classe `tj-revelat`
→ ~770ms (abans, sumant els 3 retards originals, haurien estat ~2.6s).
Captures ampliades (`clip` a la zona dels botons) confirmen les icones
omplint el cercle sencer; el botó "truco" sortia tènue en una captura no
per cap regressió sinó perquè `potTrucar()` era fals en aquell moment
exacte de la partida (`.ba-boto:disabled{opacity:.3}`, comportament
existent) — confirmat seleccionant una carta abans de la segona captura.

### Botons de senyal més compactes, nom de dalt més enganxat al gegant (sessió 2026-10-02, 12a passada)

Dos retocs puntuals de mida/marge, sense tocar lògica ni estructura:

- `barra-accions.css`: `.ba-boto--senyal` de `2.7rem` a `2.1rem` (els 4
  cercles de senyal més petits) i `.ba-senyals` gap de `0.15rem` a
  `0.1rem` — la columna dels 4 botons ocupa notablement menys alçada.
- `seient-jugador.css`: `.sj-lloc--dalt .sj-nom` `margin-bottom` de
  `0.35rem` a `0.1rem` (només el seient de dalt — la parella, des del
  punt de vista egocèntric d'un mateix; `baix`/`esquerra`/`dreta` no
  tocats, no demanat) — el nom queda enganxat al cap del gegant en lloc
  de flotar separat.

**Verificat amb Playwright**: gap real entre el nom i la figura del
gegant de dalt mesurat amb `getBoundingClientRect()` → 2px (abans
~15-20px). `scrollHeight===innerHeight` encara cert a 950/820/740px (el
canvi reduïa espai, no en consumia més, així que l'invariant "sense
scroll" es manté trivialment). 0 errors de consola.

### Flaix de barres de scroll en arribar a la partida (sessió 2026-10-02, 11a passada)

L'usuari va reportar un flaix d'una barra de scroll vertical i una
horitzontal just en acabar els últims fotogrames de la transició, que
desapareixien soles al cap d'un instant. Dues causes diferents, dos fixos:

- **Causa real (horitzontal + part del vertical)**: l'estat INICIAL
  (pre-revelació) de l'entrada escalonada de la 10a passada —
  `.tj-taula-zona { transform: translateY(-48px) }` i
  `.tj-lateral { transform: translateX(56px) }` — desplaça aquests blocs
  fora de la seva caixa de disposició normal. Un `transform` compta per
  calcular l'àrea desplaçable del document encara que no afecti el
  layout; sense cap `overflow:hidden` pel mig, això feia créixer
  `scrollWidth`/`scrollHeight` del document durant la fracció de segon
  abans que `iniciarRevelacio()` tornés els elements al seu lloc. Fix:
  `.tj-pantalla { overflow: hidden }` — mai cap contingut REAL d'aquesta
  pantalla necessita sortir-ne (ja verificat arreu que tot hi cap), només
  calia que el `transform` transitori no es comptés com a àrea
  desplaçable.
- **Causa real (el residu vertical, intencionat però visible de més)**:
  mentre encara s'està a `transicio-partida`, el document fa `300vh`
  d'alçada A POSTA (és el mecanisme mateix de l'"efecte Apple" — sense
  alçada no hi hauria scroll per triar fotograma). Aquí no hi ha cap
  "bug" d'àrea desplaçable, però SÍ que el dibuix de la barra nativa
  (sobretot en mode "overlay" de Windows/Chrome, que l'ensenya breument
  en aturar-se l'scroll i la fa esvair) era visible i cridava l'atenció
  just en aturar-se als últims fotogrames. Fix global a
  `projects/juguem-al-truc/src/styles.css`: `scrollbar-width:none`
  (Firefox) + `-ms-overflow-style:none` + `::-webkit-scrollbar{display:
  none}` (Chrome/Edge/Safari) a `html`/`body` — amaga el DIBUIX de la
  barra arreu de l'app sense desactivar l'scroll real (roda, tàctil i
  teclat continuen funcionant exactament igual; la transició scrub-driven
  no es veu afectada gens). Coherent amb l'esperit de tota la resta de
  l'app ("mai cap pantalla necessita mostrar una barra de scroll").

**Verificat amb Playwright**: mostreig cada ~16ms (174 mostres) travessant
el moment crític (final de la transició → commutació a `joc` → entrada
completa) comparant `scrollWidth`/`clientWidth` i
`scrollHeight`/`clientHeight` — 0 mostres amb desbordament horitzontal
(abans del fix n'hi havia); l'únic desbordament vertical restant és
l'alçada `2700px` intencionada de `transicio-partida` mentre encara hi
és, exactament els ~500ms que dura el retard abans de navegar a `joc`
(`RETARD_ABANS_DE_LA_PARTIDA_MS`), ja invisible gràcies al CSS nou.
Estat final: `scrollWidth===clientWidth` i `scrollHeight===clientHeight`
exactes, 0 errors de consola.

### Entrada escalonada a la taula, abandonar a cantonada, còpia del codi reparada (sessió 2026-10-02, 10a passada)

Tres retocs sobre la 9a passada:

- **Entrada escalonada de `taula-joc` en comptes d'un tall sec** quan
  acaba la transició: `TaulaJoc` afegeix 2 signals, `iniciarRevelacio` i
  `entradaCompletada`, fixats amb 2 `setTimeout` encadenats al
  constructor (`RETARD_NOMES_TERRA_MS=1000` → `DURADA_REVELACIO_MS=1100`,
  aquest segon ha de ser ≥ la transició CSS més llarga). Una única classe
  `.tj-revelat` al `<div class="tj-pantalla">` arrel (binding
  `[class.tj-revelat]="iniciarRevelacio()"`) controla 3 capes per CSS
  `transition` (mai `@keyframes`, igual que sempre en aquest monorepo):
  el difuminat verd (ara un `::before` propi, SEPARAT del fons — abans
  anaven junts en un sol `background` shorthand, calia separar-los perquè
  el fons (fotograma 16) és sempre estàtic però el difuminat ha d'aparèixer
  "a poc a poc" DESPRÉS del segon de només-terra) fa fade-in 1.1s;
  `.tj-taula-zona` (gegants+taula) baixa des de dalt
  (`translateY(-48px)→0`) 0.8s; `.tj-lateral` (mà pròpia+botons+marcador)
  entra des de la dreta (`translateX(56px)→0`) 0.8s amb 0.15s de retard
  perquè no coincideixi exactament amb la taula.
  - **Bug real trobat NO buscat, verificant amb Playwright**: el primer
    intent va descobrir que el diàleg de "Truc" (`overlay-truc`) podia
    aparèixer DURANT el segon de només-terra si un bot cantava Truc molt
    d'hora — trencava completament l'efecte (la captura mostrava el
    diàleg fosc tapant-ho tot en lloc del terra net). Fix:
    `trucPendent()`/`ma11Pendent()` a `taula-joc.html` ara porten
    `&& entradaCompletada()` — l'estat no es perd, el diàleg només s'ajorna
    fins que s'acaba de revelar. **Lliçó reutilitzable**: en afegir una
    seqüència d'entrada "silenciosa", cal repassar TOTS els elements que
    poden aparèixer per iniciativa pròpia del servidor (no només els que
    es construeixen explícitament per a l'entrada) — un overlay modal
    condicionat a l'estat de joc real pot saltar-se l'entrada sense avisar
    si no se'l gateja explícitament.
  - El "moviment de jugador" més evident en repòs (l'anell pulsant de
    `.sj-lloc--torn`) es gateja directament a `taula-joc.html`:
    `[esElTorn]="entradaCompletada() && ...`, en lloc de tocar
    `seient-jugador`.
- **Botó "Abandonar partida" mogut de dins `.tj-lateral` a cantonada
  inferior esquerra de tota la pantalla**: ara és fill directe de
  `.tj-pantalla` (`position:absolute; left:1rem; bottom:0.75rem`), no del
  panell lateral — `.tj-pantalla` necessitava `position:relative` (ja
  l'hi calia per al nou `::before`).
- **Còpia del codi de sala reparada**: `navigator.clipboard.writeText`
  fallava silenciosament (promesa rebutjada, `await` sense `try/catch`
  avortava la funció abans de `copiat.set(true)`) — la causa real és que
  aquesta app es reprodueix normalment DINS un `<iframe>` del Shell (port
  4200) d'un origen diferent, i la Clipboard API requereix delegació de
  permisos explícita (`allow="clipboard-write"`) a l'iframe per
  funcionar-hi; sense ella, el navegador rebutja la crida. Fix de 2
  capes: (1) `src/app/app.html` del Shell (arrel del monorepo) afegeix
  `allow="clipboard-write"` a l'`<iframe>` de `juguem-al-truc` — arregla
  l'arrel del problema; (2) `sala-espera.ts` afegeix
  `copiarAlPortapapers()`, que prova l'API moderna i, si falla, recorre
  al mètode clàssic amb un `<textarea>` ocult + `execCommand('copy')`
  (no depèn de cap política de permisos) — xarxa de seguretat per a
  qualsevol altre context on l'API moderna no estigui disponible.

**Verificat amb Playwright**: captura just en arribar a `joc` (només
terra, `tj-revelat` absent, `.tj-lateral` amb opacitat `0`) → captura a
mig segon de revelació → captura amb entrada completa (`tj-revelat`
present, opacitat `1`, botó abandonar a `left:16px`, a `12px` del fons de
la pantalla) — 0 errors de consola, `scrollHeight===innerHeight` (sense
scroll). Còpia del codi verificada en mode `normal` (el `solo` no mostra
mai el codi, no calia convidar ningú): clic → indicador canvia a
"Copiat!".

### Transició "efecte Apple" amb 16 fotogrames reals, i 6 fons trencats reparats (sessió 2026-10-02, 9a passada)

L'usuari va afegir `public/truc/elements/transicio_16_fotogrames/` (16
`.jpg` reals, `fotograma_01.jpg`..`fotograma_16.jpg`, ~2-4.6MB cadascun):
una mateixa seqüència de càmera fent "tilt" d'una paret vista a l'alçada
dels ulls (fotograma 1) fins al terra vist zenitalment (fotograma 16).
Però en afegir-los, **va esborrar els antics `fons-1.jpg`..`fons-4.jpg`**
— descobert fent `curl` contra el dev-server (`404` a totes 6 pantalles
que els referenciaven: `menu-inicial`, `crear-partida`, `unir-partida`,
`sala-espera`, `taula-joc`, `partida-acabada`). Això convertia la petició
en dues coses alhora: (1) construir la transició nova demanada
explícitament, i (2) reparar 6 fons trencats que ni l'usuari havia
esmentat — **lliçó reutilitzable**: quan es demana incorporar un asset
nou que "substitueix" un de vell, comprovar sempre amb `curl` (no només
mirar el disc) si el canvi ha deixat referències existents trencades, no
donar per fet que l'usuari ja ho sap o que no afecta res més.

- **Fons estàtics reassignats** (tots usaven `fons-N.jpg`, ara 404):
  `menu-inicial`, `crear-partida`, `unir-partida`, `sala-espera` →
  `fotograma_01.jpg` (paret, demanat explícitament per a `sala-espera` i
  `pantalla inicial`; estès també a `crear`/`unir` perquè són la mateixa
  família de pantalles "pre-partida" i també tenien el fons trencat).
  `taula-joc`, `partida-acabada` → `fotograma_16.jpg` (terra zenital,
  demanat explícitament com a "fons de la partida"; estès a
  `partida-acabada` pel mateix 404 i perquè visualment continua la
  mateixa taula).
- **Component nou `transicio-partida/`** (substitueix el buit que havia
  deixat `intro-animacio`, eliminat a la 8a passada — la pantalla
  `'transicio'` torna a `NavegacioService.Pantalla`, ara amb un mecanisme
  diferent): `App` navega a `'transicio'` en rebre `senyalIniciPartida()`
  (abans anava directament a `'joc'`); el propi component navega sol a
  `'joc'` quan l'scroll arriba al final.
  - **Efecte "scrub" real, no una animació de temps**: un contenidor alt
    (`300vh`) amb una capa `position:sticky` a dins mostrant una sola
    `<img>` — la posició d'scroll (0..1) tria DIRECTAMENT quin dels 16
    fotogrames es mostra (`1 + Math.round(progrés × 15)`), mai un
    `setTimeout`/`transition` de durada fixa. És el mateix patró "efecte
    Apple" (AirPods Max, Shot on iPhone): mentre es fa scroll la imatge
    sembla una animació de càmera, però en realitat és un sol `<img>`
    canviant de `src` en sincronia exacta amb `window.scrollY`.
  - **Precàrrega sense bloquejar res**: el fotograma 1 ja viu a la
    memòria cau del navegador (és el fons CSS de `sala-espera`, la
    pantalla anterior — mateixa URL, mateix recurs) — el component només
    precarrega 2..16 (`new Image().src=...`, fora d'Angular) en
    construir-se. Si l'scroll va per davant de la xarxa (fotograma
    objectiu encara no ha arribat), es queda al darrer ja carregat
    (`Set<number>` de fotogrames rebuts) en lloc de mostrar una imatge
    trencada — mai cap flaix ni `src` buit.
  - Pista de text ("Desplaça't cap avall...") que desapareix sola quan
    `progrés > 0.03` — clau de traducció nova `transicio_scroll_pista`
    (reaprofitant el forat que havien deixat `intro_scroll_pista`/
    `intro_continuar` a `traduccio.service.ts` des de la 8a passada).

**Verificat amb Playwright**: flux complet crear `solo` → sala d'espera
(paret de fons) → clic "Iniciar partida" → transició (fotograma 1 en
començar l'scroll) → scroll programàtic fins a la meitat (`fotograma_09`
confirmat llegint `<img src>` real) → scroll fins al final → taula de joc
(`.tj-pantalla` present) — 0 errors de consola, 0 peticions amb estat
≥400 a cap de les 6 pantalles reparades.

### Pantalla `intro` eliminada: de la sala d'espera directament a la partida (sessió 2026-10-01, 8a passada)

L'usuari va demanar eliminar sencera la pantalla intermèdia d'intro (la que
mostrava l'animació d'scroll amb el botó "Comença!") — en acabar la sala
d'espera, ara es va directament a la taula de joc.

- **`App` (`app.ts`)**: l'`effect` que escoltava `senyalIniciPartida()`
  navegava a `'intro'`; ara navega directament a `'joc'`. Era l'ÚNIC punt
  de navegació cap a aquesta pantalla — `sala-espera.ts` només crida
  `trucSocket.iniciarPartida()` (que fa que el servidor emeti
  `partida_iniciada` a tothom), mai navega ell mateix.
- **Component `intro-animacio/` (ts+html+css) esborrat sencer** — cap altre
  lloc del codi el referenciava (confirmat per grep abans d'esborrar).
  `NavegacioService.Pantalla` ja no inclou `'intro'`; `app.html` ja no té
  el `@case ('intro')`; `mostrarAvisDesconnexio` (llista de pantalles amb
  connexió activa) tampoc.
- **2 claus de traducció òrfenes eliminades** (`intro_scroll_pista`,
  `intro_continuar`) a les 3 llengües de `traduccio.service.ts` — es va
  comprovar primer que `personatge_*` (també usat des d'aquest component)
  **no** quedava òrfena, perquè `selector-personatge` també la fa servir.
- **Assets ja no utilitzats per cap component** (es deixen tal qual a
  `public/truc/`, no s'han esborrat — no demanat, i podrien reaprofitar-se):
  `elements/fons-1.jpg`..`fons-4.jpg`, `elements/taula.jpg`. **NO**
  `cadira/pere.png` — aquest encara el fa servir el component `cadira` de
  la sala d'espera (mateixa ruta que abans usava també `intro-animacio`).

**Verificat amb Playwright**: flux complet crear partida `solo` → sala
d'espera → clic "Iniciar partida" → taula de joc apareix **a l'instant**
(mà repartida, torn marcat), 0 aparicions del text "Comença" a la pàgina,
0 errors de consola.

### Franja superior eliminada, abandonar al lateral, senyals més junts (sessió 2026-10-01, 7a passada)

Dos retocs d'ergonomia més, sense tocar lògica:

- **`<header class="tj-capcalera">` eliminat de `taula-joc.html`**: només
  contenia el botó "Abandonar partida" i ocupava una franja pròpia a dalt
  de tot (padding + alçada de línia), espai vertical que ara recupera la
  taula. El botó (`.tj-abandonar`, mateix estil, cap canvi de
  comportament) es mou al final de `<aside class="tj-lateral">`, després
  de `<app-barra-accions>` — discret, al peu del panell on ja viuen
  marcador/mà/botons, en lloc d'una franja pròpia.
- **`.ba-senyals { gap: 0.4rem }` → `0.15rem`** (`barra-accions.css`):
  els 4 botons de senyal (un-1/un-2/un-3/res) queden més junts
  verticalment, sense tocar la seva mida ni el tooltip.

**Verificat amb Playwright** a 1400×950 i 1400×740: 0 errors de consola,
`scrollHeight === innerHeight` a les 2 alçades (cap scroll de pàgina),
botó d'abandonar visible al peu del lateral, senyals visiblement més
compactes.

### Gegants més separats de la taula, mans visibles (sessió 2026-10-01, 6a passada)

A la 5a passada la taula (`.tj-marbre`) s'havia fet petita i els gegants
s'havien apropat molt al centre (`.sj-lloc--*` insets a `4%`) perquè
quedessin "asseguts" amb les cames tapades — però amb tan poc marge la
vora de la taula tallava també les MANS, no només les cames. L'usuari ho
va corregir: "Els gegants han d'estar mes separats de la taula, s'els hi
ha de veure les mans, com avans."

- **Insets de `.sj-lloc--dalt/baix/esquerra/dreta` de `4%` a `-6%`**
  (`seient-jugador.css`): un valor NEGATIU allunya la caixa del gegant
  cap enfora del quadrat de `.tj-taula` (abans `4%` la hi apropava cap al
  centre). Es va provar primer `-11%` (massa: desbordava la pàgina) i
  després es va ajustar per tempteig fins a `-6%`, el valor més gran
  (gegants més separats) que encara cap sense fer scroll a les 3 alçades
  de referència.
- **Bug real trobat en fer-ho i corregit**: separar els gegants fa que
  sobresurtin més per sobre/sota de la caixa de `.tj-taula`
  (`overflow:visible`, cap `overflow:hidden` enlloc), i això SÍ compta
  per calcular `document.documentElement.scrollHeight` encara que
  `.tj-taula` en si no creixi — es va reintroduir scroll de pàgina a les
  3 alçades (950/820/740px) que la 5a passada havia deixat a 0. Fix:
  `taula-joc.css` `.tj-taula { width: min(760px, 94%, 85vh) }` →
  `80vh` → ajustat a `78vh` (verificat per tempteig amb Playwright fins
  que `scrollHeight === innerHeight` a les 3 alçades alhora) — com que la
  taula és quadrada (`aspect-ratio:1/1`), reduir aquest límit encongeix
  també els gegants que en depenen proporcionalment, recuperant el marge
  vertical que la separació els havia menjat.
- **Lliçó reutilitzable**: quan un element `position:absolute` amb
  `overflow:visible` es belluga cap enfora del seu contenidor
  (`inset` negatiu), el nou espai que ocupa SÍ pot forçar scroll de
  pàgina encara que el contenidor "oficial" no hagi canviat de mida —
  cal re-verificar `scrollHeight` cada cop que es toca un `inset`/
  `transform` d'un element que ja vivia a la vora d'un contenidor amb
  poc marge, no només quan es toca explícitament la mida del contenidor.

**Verificat amb Playwright** a 1400×950, 1400×820, 1400×740: 0 errors de
consola, `scrollHeight === innerHeight` a les 3 alçades, mans dels 4
gegants visibles per sobre de la vora de la taula als 3 casos.

### Taula de joc: cartes a la vora de qui les tira, marcador al lateral, tot sense scroll (sessió 2026-10-01, 5a passada)

L'usuari va valorar positivament l'ORDENACIÓ de capes de la 4a passada
(primera jugada al fons) però no la posició (totes al centre) —
"identificar d'on s'ha tirat cada carta". A més, 3 retocs d'ergonomia:

- **Cada carta jugada torna a la vora del seu propi gegant** (com a la
  2a/3a passada), no al centre: `taula-joc.ts` substitueix
  `desplacPila(i)` per `posicioCarta(seient): PosicioTaula` (crida
  `posicioRelativa(seient, elMeuSeient())`, ja existent, reutilitzada tal
  qual) i `taula-joc.html` hi aplica una classe
  (`'tj-carta-pila--' + posicioCarta(jugada.seient)`) enlloc d'un
  `[style.transform]` inline. **L'ordenació de capes per ordre de joc es
  manté intacta sense cap canvi addicional**: com que `cartesTaula()` ja
  és en ordre de joc i el `@for` el respecta, si dues cartes coincideixen
  a la mateixa vora (dues persones del mateix "costat" relatiu en algun
  mode) la més recent ja surt per sobre sense haver-hi pensat expressament
  — és la mateixa garantia DOM-order que la resta de la taula.
- **Marcador traslladat del `<header>` al `<aside class="tj-lateral">`**
  (primer element, abans de "La teva mà"): la franja superior només
  calia per l'enllaç "Abandonar partida" — mantenir-hi el marcador obligava
  a una franja prou alta per a una píndola ampla, espai vertical que ara
  recupera la taula. `Marcador` reescrit de píndola horitzontal a targeta
  vertical compacta (cada equip en una fila `justify-content:space-between`,
  nom a l'esquerra/punts a la dreta) perquè hi càpiga en un lateral de
  ~300px.
- **"Sense scroll mai" verificat de debò, no donat per fet**: es va
  comprovar `document.documentElement.scrollHeight` vs `window.innerHeight`
  amb Playwright a 3 alçades de viewport (950/820/740px, mantenint els
  1400px d'ample) — **bug real trobat i corregit**: a 740px la pàgina
  encara desbordava ~79px perquè `.tj-taula { width: min(760px, 94%) }`
  no tenia en compte l'ALÇADA disponible, només l'amplada — fix:
  `width: min(760px, 94%, 85vh)`, afegint un tercer límit basat en
  `vh` perquè la taula (quadrada, `aspect-ratio:1/1`) mai sigui més alta
  que l'espai vertical real. **Lliçó reutilitzable**: un element quadrat
  dimensionat només per amplada (`%`/`px`) sembla correcte en finestres
  amples-i-altes però desborda en finestres amples-i-BAIXES — cal
  combinar sempre un límit de cada eina (`%` d'amplada + `vh` d'alçada)
  amb `min()`, no confiar que `aspect-ratio` sol ho resol.
- **Tooltip propi als botons** (`.ba-tooltip`, substitueix el `[title]`
  natiu): `barra-accions` refactoritzat perquè els 4 botons de senyal
  (abans 4 blocs de plantilla gairebé idèntics) surtin d'un `@for` sobre
  un array `SENYALS` — calia igualment per afegir-hi el tooltip un sol
  cop. S'obre cap a l'ESQUERRA del botó (`right: calc(100% + 0.6rem)`),
  mai cap a la dreta, perquè el panell lateral viu a la vora dreta de la
  pantalla. **Bug real trobat i corregit**: el tooltip sortia tallat per
  la meitat — la causa NO era el propi tooltip, sinó `.tj-lateral {
  overflow-y: auto }` (afegit a la 4a passada com a "per si de cas", mai
  necessari segons les pròpies mesures de scroll) — Chrome iguala
  `overflow-x` a `auto` quan `overflow-y` no és `visible` encara que no
  se li digui explícitament, i això retallava el tooltip (que surt
  horitzontalment del contenidor). Eliminat `overflow-y:auto` del tot.
  **Lliçó reutilitzable**: `overflow-x`/`overflow-y` no es poden barrejar
  lliurement ("un visible, l'altre auto") esperant que només un eix
  retalli — el navegador puja l'altre eix a `auto` també; si un contenidor
  necessita deixar sortir contingut per un costat (tooltips, menús), no
  li posis `overflow` a cap eix "per si de cas".
- **Marges reduïts**: `.tj-lateral` gap 0.75rem→0.5rem i padding
  1rem→0.6rem; `ma-jugador` padding-top 1rem→0.3rem; `barra-accions` gaps
  retallats a 0.4-0.5rem arreu.

**Verificat amb Playwright** a 1400×950, 1400×820, 1400×740 i 414×860
(mòbil): 0 errors de consola, `scrollHeight === innerHeight` a les 3
alçades d'escriptori (cap scroll de pàgina), cartes identificables per
posició amb l'ordre de capes correcte, tooltip complet i llegible,
marcador amb noms reals ja al lateral.

### Taula de joc: pila de cartes, noms reals, senyals més ràpids (sessió 2026-10-01, 4a passada)

4 retocs puntuals més, de nou sense tocar cap `.ts`/`.html` de `carta` ni
la lògica de joc:

- ~~**Pila de cartes jugades, totes al mateix punt central**~~ —
  **desfasat a la 5a passada** (vegeu secció següent): l'usuari volia
  recuperar que cada carta s'identifiqués per posició (a la vora del
  gegant que l'ha jugada), mantenint només el PRINCIPI de l'ordenació de
  capes per ordre de joc, no la posició central compartida. `taula-joc.ts`
  SÍ continua exposant `cartesTaula` com a `protected` (abans `private`
  — ja existia des de la funcionalitat del "retard de l'última carta", ja
  en ordre de joc real) i `taula-joc.html` SÍ continua iterant-lo
  directament (`@for (jugada of cartesTaula(); track jugada.seient)`) en
  lloc de passar per un `Record<Posicio,Carta>` intermedi — això sí que
  es manté a la 5a passada, només canvia ON es dibuixa cada carta.
- **Durada dels senyals reduïda a 1s** (abans compartia els 2200ms amb el
  "truco"): `mostrarPoseTemporal` ara rep la durada com a paràmetre en
  lloc d'una constant fixa — `DURADA_POSE_TRUCO_MS = 2200` es manté pel
  crit de "truc cantat", `DURADA_POSE_SENYAL_MS = 1000` és nou per als 4
  senyals. Verificat llegint `document.querySelector(...).src` real a
  300ms (encara el senyal) i a 1200ms (ja tornat a `normal`), no només
  mirant el codi.
- **Botons de senyal en columna i més grans**: `barra-accions.css`,
  `.ba-senyals` de `flex-wrap` en fila a `flex-direction:column`
  (hi caben bé verticalment gràcies al panell lateral, ja alt des de la
  3a passada); mida 2.3rem→2.9rem.
- **Marcador (i "Partida acabada") amb els noms reals dels jugadors**, no
  sempre "Pere/Paula" i "Marina/Andreu": nova funció `nomEquip(jugadors,
  equip)` a `services/seients.util.ts` (uneix els `nom` reals dels 2
  seients de l'equip, `' / '`) — calia afegir `seientsDeLEquip()` al
  `models/personatge.model.ts` del FRONTEND (el backend ja la tenia,
  però no estava mai duplicada al costat client). `Marcador` ja no
  injecta `TraduccioService` ni coneix `ts.t('equip_a_curt')` — rep
  `nomEquipA`/`nomEquipB` com a `input.required<string>()`, calculats a
  `taula-joc.ts` (`nomsEquip`, computed) i a `partida-acabada.ts`
  (`nomGuanyador`, computed, reaprofitant la mateixa funció). Claus de
  traducció `equip_a_curt`/`equip_b_curt` (CA/ES/EN) **eliminades** un
  cop confirmat per `grep` que no quedava cap ús — **l'usuari només ho va
  demanar per al marcador, però `partida-acabada` tenia exactament el
  mateix problema (sempre "Pere/Paula" com a guanyador) i es va corregir
  igual, per consistència i perquè deixar-ho a mig fer hauria estat un
  bug evident per a qualsevol que hi parés atenció**.

**Verificat amb Playwright**: captura amb nom real ("TesterReal") al
camp de crear partida → el marcador mostra "TesterReal / Paula" (no
"Pere/Paula"); pila de 2 cartes clarament superposades amb gir i
desplaçament visibles; panell lateral amb els 4 senyals en columna.

### Taula de joc: ajustos finals (sessió 2026-10-01, 3a passada)

Després de veure la 2a passada, l'usuari va demanar 6 retocs puntuals
sobre la mateixa composició (no un altre redisseny). Tots fets a
`seient-jugador.css`/`taula-joc.css`, sense tocar `.ts`/`.html` dels
components de carta ni la lògica de joc:

1. **Taula més petita, per DAVANT dels gegants** (no al darrere): `
   .tj-marbre { inset: 30%; }` (abans 11%) i reordenat el DOM a
   `taula-joc.html` perquè els gegants surtin ABANS que `.tj-marbre` —
   l'ordre del DOM segueix sent l'únic mecanisme d'apilament (cap
   z-index), però ara el sentit és l'invers de la 2a passada.
2. **Les imatges dels gegants ja NO es retallen** — es va treure
   `overflow:hidden` i l'`aspect-ratio` curt de `.sj-figura`; ara usen la
   proporció real sencera (`575/1100`, cos complet incloses les cames).
   Les cames no es veuen perquè la taula (més petita, per davant) les
   tapa visualment — mai perquè la imatge les hagi perdut. `--alt` es
   recalcula amb aquesta proporció real.
3. **Mateixa mida per als 4 seients**: eliminat l'override
   `.sj-lloc--baix { --mida: clamp(130px,...) }` de la 2a passada (aquella
   emfasi de "jo més gran" ja no es vol).
4. **Bombolla de recompte de cartes (`.sj-cartes`) eliminada** del tot
   (HTML + CSS) — l'`input` `cartesRestants` es manté a `seient-jugador.ts`
   perquè segueix fent falta per triar quina imatge mostrar
   (`normal/Pere2.png` és diferent de `Pere3.png`), només se n'ha tret la
   bombolla numèrica visual, redundant amb la pròpia imatge.
5. **Panell lateral i cartes de la mà més grans**: `.tj-lateral` 260px→
   320px, `.ct-carta` (mida per defecte, NO la `--petita` de taula) 76px→
   92px.
6. **Noms sempre fora de la taula**: abans `.sj-nom` era una única regla
   (`top:100%`) igual per als 4 seients — per a `dalt` això el situava al
   límit INFERIOR de la seva caixa, és a dir cap al centre/taula (on
   juguen les cartes). Ara cada posició té la seva pròpia regla situant
   el nom al costat de la caixa OPOSAT al centre (`dalt`→`bottom:100%`,
   `baix`→`top:100%`, `esquerra`→`right:100%`, `dreta`→`left:100%`) —
   literalment "el costat que apunta cap enfora", el mateix costat cap on
   ja apunta el cap de cada gegant girat. **Bug de mòbil trobat i
   corregit en acabar**: a esquerra/dreta, posar el nom "cap enfora"
   (lateral) el treu directament de la pantalla en viewports estrets —
   `@media (max-width:760px)` el torna a sota (`top:100%`, com dalt/baix)
   només per a aquests 2 seients.

**Verificat amb Playwright** (mateix mètode, captures a 1400×950 i
414×860): 0 errors, taula visiblement més petita tapant només les cames,
gegants uniformes, cap bombolla de recompte, panell lateral més gran,
noms llegibles i fora de l'àrea de joc als 2 formats.

### Taula de joc: composició "vista de dalt, tothom mirant al centre" (sessió 2026-10-01, 2 iteracions)

Redisseny visual complet de `taula-joc`, en dues passades. La primera
(gegants asseguts amb un cercle verd senzill) no va acabar de convèncer
l'usuari; la segona reprodueix amb fidelitat una imatge de referència que
l'usuari va deixar a `public/truc/com-ha-de-quedar/Partida.png` (**NOMÉS
per analitzar-la — mai copiada ni referenciada des del codi**, l'usuari
ho va demanar explícitament). Aquesta carpeta és només material de
disseny, no un asset de l'app.

**Mètode d'anàlisi de la referència**: la imatge original (3456×2304) és
massa gran per llegir-ne els detalls d'una ullada — es va obrir amb
Playwright (`page.goto('file://...')` sobre un `.html` mínim amb la
imatge a mida 1:1) i es van retallar 4 regions (`page.screenshot({clip})`)
per inspeccionar cada cantonada de prop. Això va revelar un detall gens
obvi només mirant la miniatura: **cada gegant està girat un angle
diferent segons la seva posició, perquè el cap apunti sempre cap enfora
de la taula i les mans cap al centre** (dalt=0°, dreta=90°, baix=180°,
esquerra=-90°, sentit horari) — el seient de "baix" (un mateix) hi surt
literalment de cap per avall. Sense retallar la imatge de prop, aquest
patró de rotació és fàcil de confondre amb una simple inclinació.

**Implementació** (⚠️ el retall de cames i l'ordre del DOM d'aquesta
secció van quedar DESFASATS a la 3a passada, vegeu secció anterior "Taula
de joc: ajustos finals" — es mantenen aquí només pel raonament de les
rotacions i del `transform`, que segueix sent 100% vigent):

- ~~**Retall de cames**: `.sj-figura { aspect-ratio: 1/1.34;
  overflow:hidden; }`~~ — **desfasat**: a la 3a passada ja no es retalla
  cap imatge; les cames es renderitzen senceres i només queden tapades
  per la taula (més petita i per davant en l'ordre del DOM). Percentatge
  d'aquella època (mans ~45-55% d'alçada, genolls ~68-73%) encara útil
  com a referència de proporcions del retrat.
- **Girar cada gegant l'angle que li toca, DESPRÉS de retallar, no
  abans**: `.sj-figura` ja porta `overflow:hidden`; aplicar-hi
  `transform: rotate(var(--angle))` gira el rectangle JA retallat (mai
  les cames arriben a existir, independentment de l'angle). L'angle es
  declara com a variable CSS per seient (`--angle: 180deg` a
  `.sj-lloc--baix`, etc.) — un sol lloc per consultar/canviar cada valor.
- **Problema real trobat i corregit: un `transform:rotate` NO gira la
  caixa de disposició, només el contingut renderitzat.** Si `.sj-figura`
  es gira 90° dins d'un `.sj-lloc` amb `display:flex; flex-direction:
  column` (el disseny original), el flux del flex reserva l'espai
  PRE-rotació (vertical, estret) mentre el contingut es dibuixa POST-
  rotació (horitzontal, ample) — el nom de sota queda mal col·locat.
  Fix: `.sj-lloc` deixa de ser flex i passa a tenir una mida EXPLÍCITA ja
  en espai post-rotació (`width`/`height` intercanviats als seients
  esquerra/dreta: `width: var(--alt); height: var(--mida);`, on `--alt =
  var(--mida) × 1.34`), amb `.sj-figura` centrada a dins amb
  `position:absolute; top/left:50%; transform: translate(-50%,-50%)
  rotate(...)`. **Lliçó reutilitzable**: `transform` és purament visual
  (no afecta el flux/layout) — si cal que la resta del disseny reaccioni
  a un gir, cal reservar l'espai POST-rotació explícitament, no confiar
  que el motor de layout ho dedueixi sol.
- **Taula**: ja no és un cercle verd — és una llosa de marbre quadrada
  (`.tj-marbre`, aproximada amb `repeating-linear-gradient`s creuats a
  diferents angles sobre un `linear-gradient` clar — cap imatge nova) amb
  un "tovalló" de feltre verd més petit i de **vora dentada** centrat a
  sobre (`.tj-feltre`, `clip-path: polygon(...)` amb 16 dents per costat
  generades amb un script Node d'una línia i enganxades com a valor CSS
  **estàtic** — zero cost en temps d'execució, cap JS al component).
  Totes dues reutilitzen `--tr-feltre`/`--tr-feltre-fosc` ja existents.
- **Apilament (gegants < taula < cartes⁠, ⚠️ ordre de la 3a passada —
  a la 2a era `taula < gegants < cartes`, vegeu secció anterior) només
  per ordre del DOM, sense z-index enlloc**: lliçó de la primera passada
  (el feltre amb z-index alt tapava cares i mans) — la solució definitiva
  no és "ajustar els números de z-index", és treure els 3 grups
  (gegants, marbre+feltre, cartes) a germans DIRECTES de `.tj-taula`
  (abans les cartes vivien niades dins del feltre), en l'ordre que
  toqui al HTML. Un element niat dins d'un pare amb el seu propi
  `z-index` queda ATRAPAT dins del context d'apilament del pare — per
  molt z-index alt que se li posi, mai supera un germà del pare amb
  z-index més alt. **Lliçó reutilitzable**: si dos elements han
  d'apilar-se amb un tercer independentment l'un de l'altre, han de ser
  germans al mateix nivell, no niats — el z-index del pare "tanca" tots
  els fills dins el seu propi nivell.
- **Panell lateral**: igual que la primera passada (`.tj-lateral`,
  `ma-jugador` + `barra-accions`), però l'etiqueta `la_teva_ma` ara és
  molt més gran i en pes (`font-weight:700; font-size:1.4rem`, sense
  versaletes ni espaiat) per pes visual semblant al de la referència.
- **Contrast del nom**: amb la taula ara blanca (marbre) en lloc de verda
  fosca, `text-shadow` sol ja no n'hi havia prou — `.sj-nom` porta ara un
  fons propi (`rgba(16,36,28,0.72)`, píndola arrodonida) perquè es
  llegeixi igual de bé sobre marbre clar que sobre el fons fosc de la
  resta de la pantalla.

**Verificat visualment amb Playwright** (mateix mètode que sessions
anteriors) a 1400×950 i 414×860, en diverses passades d'iteració
(captura → mirar → ajustar CSS → repetir, tal com demana la skill
`frontend-design`): 0 errors de consola, retall de cames net, vora
dentada del feltre nítida, els 4 gegants orientats exactament com la
referència (cap cap enfora, mans cap al centre), panell lateral llegible,
degradació correcta a mòbil.

### Direcció visual

Paleta i tipografia pròpies, derivades dels assets reals (no un default
genèric — skill `frontend-design` aplicada explícitament): vellut/feltre
verd (`--tr-feltre`), llautó envellit (`--tr-daurat`), terracota (rajola/
capa), pergamí (`--tr-crema`). Tipografia **Cinzel** (títols, inscripcional/
regi) + **Lora** (cos, evoca un manual de joc antic) + **Cutive Mono**
(marcador/codis) — cap de les 3 es fa servir a cap altra app del monorepo.

**Element de signatura**: el "medalló" circular daurat (`.tr-medallo` a
`src/styles.css`, global) — mateix llenguatge visual que els botons
il·lustrats reals del joc (`Botons/*.png`, vora daurada + fons fosc),
reutilitzat per a qualsevol acció principal fora de la taula (menú, "Iniciar
partida", "Tornar al menú" — ~~i "Comença!" de l'intro, eliminada
2026-10-01~~) perquè tota l'app compareteixi una sola família de botons en
lloc de pastilles genèriques.

### Animacions

**Regla estricta d'aquest monorepo** (bug real, documentat també a
GeoExplorer): `@keyframes` dins del CSS *scoped* d'un component Angular mai
s'executen amb `ViewEncapsulation` emulada. Aquesta app només en necessita
un (`tr-pols`, l'anell pulsant de "el teu torn" a `seient-jugador`) i viu a
`src/styles.css` (global), mai dins d'un `.css` de component. La resta
d'animacions (carta seleccionada) són `transition` CSS sobre canvi de
classe — **no afectades** per aquell bug (és específic de `@keyframes`, no
de `transition`), així que no calia WAAPI.

~~`intro-animacio`: `400vh` d'scroll real (`window:scroll` +
`position:sticky` al contenidor fix), crossfade de `fons-1..4` calculat com
3 trams d'un terç cadascun (`opacitatCapa()`), revelat de
taula/cadires/personatges via `transition` en tocar el 97% del recorregut,
avança a `joc` sol als 2.2s (o amb el botó "Comença!").~~ — **component
eliminat sencer el 2026-10-01**, vegeu secció "Pantalla `intro` eliminada".

## Verificat amb Playwright (4 `BrowserContext` independents, com 4 dispositius)

Flux complet: crear partida (Pere) → unir-se 3 cops (Marina/Paula/Andreu,
selector amb ocupació en viu) → sala d'espera (rotació egocèntrica correcta
verificada des de dues perspectives diferents) → iniciar → intro (scroll
programàtic, revelat, "Comença!") → taula de joc (mà pròpia visible amb noms
tradicionals de carta, jugar una carta mou el torn i redueix el comptador de
l'altre jugador) → cantar Truc (overlay correcte a qui ha de respondre vs.
"esperant" a qui ha cantat) → acceptar (marcador actualitza el valor de
l'aposta) → senyal (pose canvia al seient correcte). Canvi d'idioma CA/ES/EN
verificat via `postMessage` simulat. 0 errors de consola a cap pantalla.

**Bug de test après (no de l'app)**: si es simulen els 4 "dispositius" amb
el mateix `BrowserContext` de Playwright per estalviar recursos, comparteixen
`localStorage` i el jugador 1 intenta reconnectar automàticament amb el
`jugadorToken` del jugador 0 en carregar — cal sempre un `browser.
newContext()` **separat** per cada jugador simulat, mai reutilitzar-ne un.
