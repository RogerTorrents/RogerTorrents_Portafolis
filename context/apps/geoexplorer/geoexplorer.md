# Context: GeoExplorer

## Descripció

Web app interactiva de mapes i muntanya. Permet explorar punts d'interès (POIs)
de senderisme — **de moment només punts concrets: pics, refugis, llacs i
pàrquings** (les rutes/itineraris es van treure deliberadament, vegeu
"Detalls tècnics importants" — no hi ha cap `TipusPoi` de ruta ni al frontend
ni al backend) — sobre un mapa Leaflet, amb filtres dinàmics combinables,
selector de zones/regions i un panell de detall complet per a cada punt.

Té tres modes d'accés amb UX diferenciada:

- **Convidat** — el mapa oficial/curat és tot el que hi ha, amb el panell de
  filtres complet (categoria, altitud, dificultat).
- **Usuari autenticat** — el **mapa personal és el protagonista**: la sidebar
  mostra primer "📍 El meu mapa" (categories pròpies + llistat de llocs de
  cadascuna). El contingut oficial hi és disponible però **amagat per
  defecte**, darrere un únic interruptor ("Mostra els punts oficials del
  mapa"); en activar-lo apareix la secció **"🗺️ Punts oficials"** amb
  exactament els mateixos filtres que en mode convidat (categoria, altitud,
  dificultat) i el llistat de resultats — les dues seccions duen icona i
  títol propis, i un separador (`border-top`), perquè quedin clarament
  diferenciades una de l'altra dins la mateixa sidebar.

El selector de **regió/zona NOMÉS reenquadra el mapa** (`flyTo`) — mai filtra
quins punts es veuen. Filtrar per regió barrejava "on estic mirant" amb "què
vull veure", cosa confusa (canviar de zona feia aparèixer i desaparèixer
punts). Els punts visibles depenen únicament dels filtres/interruptors, no
d'on està centrat el mapa.

Micro-aplicació del portafolis de Roger Torrents, muntada dins el `window-wrapper`
del Shell via iframe (`http://localhost:4205`).

## Port de Desenvolupament

`http://localhost:4205`

## Execució

Cal el **backend real** (`geoexplorer-api`, repo separat a
`c:/portafolis/back/geo-explorer/geoexplorer-api`) aixecat i escoltant a
`http://localhost:3000` — el frontend ja no té cap simulació local, totes les
crides van contra l'API de veritat.

```bash
# 1. Backend (des de c:/portafolis/back/geo-explorer/geoexplorer-api)
docker compose up -d postgres mongo
npm run prisma:migrate     # només cal la primera vegada / si hi ha migracions noves
npm run seed:pois          # idempotent
npm run start:dev          # API a http://localhost:3000, Swagger a /docs

# 2. Frontend (des de l'arrel del monorepo Angular)
npm run start:geoexplorer  # http://localhost:4205
```

Vegeu `CONTEXT.md` i `README.md` del repo del backend per a més detall.

## Arquitectura implementada

- **Sense router** — una sola app, estat gestionat 100% amb Signals (mateix
  patró que `joc-impostor`). La navegació entre pantalles es fa amb
  `SessioService.pantalla`: `'entrada' | 'login' | 'registre' | 'app'`.
- **`SessioService`** (`services/sessio.service.ts`) — sessió i navegació
  d'accés, contra l'API real (`POST /auth/registre`, `/auth/login`,
  `/auth/refresh`, `/auth/logout`). Exposa `usuari`, `pantalla`, `esConvidat`,
  `esAutenticat`, `carregant` i els mètodes `entrarComConvidat`,
  `iniciarSessio`, `registrar`, `tancarSessio` (asíncrons per dins —
  fan la crida HTTP i actualitzen els signals al `next`/`error`, però els
  formularis de login/registre els criden de forma "fire and forget" des
  d'un `(submit)`, sense esperar cap valor de retorn). Els tokens (access +
  refresh) es guarden en memòria del servei + localStorage (per sobreviure a
  un refresc de pàgina); mai el `password`.
- **`ContingutPersonalService`** (`services/contingut-personal.service.ts`) —
  mapa personal de l'usuari autenticat, contra `GET/POST /categories`,
  `GET/POST /llocs`, `DELETE /categories/:id`, `DELETE /llocs/:id`. Es
  recarrega automàticament (via `effect()`) quan canvia `sessio.usuari()` —
  ja no hi ha persistència local pròpia, l'API és l'única font de veritat.
- **`auth.interceptor.ts`** — interceptor HTTP funcional que afegeix
  `Authorization: Bearer <accessToken>` a totes les crides cap a
  `environment.apiUrl`, i si una crida privada torna 401 (access token
  caducat), crida `sessio.refrescarToken()` un cop i reintenta la petició
  original amb el token nou.
- **`environments/environment.ts`** (dev) / **`environment.prod.ts`** — únic
  punt on viu `apiUrl`; és el primer patró d'`environments` d'Angular CLI
  dins d'aquest monorepo (cap altra app de `projects/` en tenia fins ara).
- **`GeoExplorerService`** — el contingut oficial/curat ja no ve d'un fitxer
  estàtic (`data/pois.data.ts`, **eliminat**): es carrega una vegada de
  `GET /pois` al constructor del servei, amb un signal `carregantPois` que
  `llista-resultats` mostra com a missatge de càrrega.
- **`TraduccioService`** — i18n ca/es/en, ara amb claus per a
  entrada/login/registre/categories personals. **L'idioma NO té selector
  propi dins de l'app** (retirat de `capcalera` en una sessió posterior) —
  ve del Shell via `postMessage`, escoltat al constructor del servei. Veure
  `context/os-shell/windows-system.md` §4 pel mecanisme complet.
- **Model de dades:**
  - `models/poi.model.ts` — unió discriminada `PicPoi | RefugiPoi | RutaPoi |
    LlacPoi | ParkingPoi` (contingut curat/oficial, igual que abans).
  - `models/usuari.model.ts`, `models/categoria-personal.model.ts`,
    `models/lloc-personal.model.ts` — contingut propi de cada usuari. Model
    deliberadament **més senzill i lliure** que `Poi` (categories arbitràries
    definides per l'usuari, no una taxonomia fixa), perquè l'usuari pugui
    crear coses com "Llocs on he viatjat".
- **Components nous:**
  - `pantalla-entrada/` — landing amb les 3 opcions d'accés (convidat / login
    / registre). Fons amb corbes de nivell (CSS) + una traça animada tipus
    GPX (SVG `stroke-dashoffset`) com a element de signatura visual.
  - `formulari-login/`, `formulari-registre/` — formularis d'accés, comparteixen
    `components/formulari-entrada.css`.
  - `panell-categories-personals/` — dins la sidebar, només visible si
    `sessio.esAutenticat()`: llista de categories amb toggle de visibilitat,
    "+ Afegir lloc" (activa mode col·locació) i formulari de nova categoria
    (nom + selector de color + selector d'icona).
  - `formulari-lloc-personal/` — overlay flotant sobre el mapa: primer mostra
    la instrucció "Fes clic al mapa..." i, un cop l'usuari clica, el formulari
    (nom + descripció) per desar el lloc.
- **`Capcalera`** ampliada amb menú d'usuari (avatar + nom + "Tancar sessió")
  quan autenticat, o insígnia "Mode convidat" + CTA "Crear un compte" quan
  convidat.
- **`Mapa`** ampliat:
  - Renderitza els llocs personals visibles (`contingut.llocsVisibles()`) en
    un `L.layerGroup` separat dels clústers del contingut oficial, amb icona
    rodona en el color/icona de la seva categoria (`creaIconaLlocPersonal`).
  - Escolta l'event `click` del mapa: si `contingut.enModeColocacio()` és
    cert, captura les coordenades (`contingut.registrarClicMapa(...)`) en lloc
    del comportament normal.
  - Aplica la classe `geo-cursor-colocacio` (cursor `crosshair`) mentre dura
    el mode col·locació.
  - Escolta `contingut.llocEnfocat()`: en clicar un lloc al llistat de la
    sidebar (`ContingutPersonalService.enfocarLloc(lloc)`), fa `flyTo` a les
    seves coordenades (zoom mínim 14) i obre el seu tooltip.
- **`GeoExplorerService.mostrarPoisOficials`** (signal) — controla la
  visibilitat del contingut oficial. Es reinicialitza sol via `effect()` cada
  cop que canvia `sessio.esAutenticat()` (`false` en entrar autenticat,
  `true` en mode convidat), i l'usuari el pot alternar manualment
  (`alternarMostrarPoisOficials()`) sense que això afecti el valor per
  defecte de la propera sessió.
- **`PanellFiltres`** (2026-08-10, reestructurat): per a autenticats mostra
  sempre l'interruptor "Mostra els punts oficials del mapa"; el **contingut
  de filtres** (categoria, altitud, dificultat — idèntic en tots dos modes,
  sense variants "compacta"/"completa") es mostra quan
  `mostrarContingutFiltres()` és cert, és a dir sempre per a convidats, i
  només amb l'interruptor activat per a autenticats. El títol de la secció
  canvia segons el mode (`filtres_titol` = "Filtres" / `punts_oficials_titol`
  = "🗺️ Punts oficials") perquè es diferenciï clarament de "📍 El meu mapa".
  Secció "Altitud" només es mostra si hi ha una categoria activa que en té
  (`mostrarFiltreAltitud()`). **No hi ha filtre de "pàrquing gratuït"** — es
  va treure (2026-08-10); `parking` continua sent una categoria vàlida però
  sense sub-filtre.
- **`PanellCategoriesPersonals`** mostra ara, sota cada categoria, el
  llistat dels seus llocs (`llocsDe(categoriaId)`); cada lloc és clicable
  (centra el mapa) i té un botó d'eliminar independent del de la categoria.
- La sidebar sencera (`.geo-lateral`) ara fa scroll com una sola unitat
  (`overflow-y: auto` al contenidor, no ja als seus fills individuals) —
  necessari perquè amb "El meu mapa" com a primer bloc de mida variable, dues
  regions de scroll independents (una per als filtres, una pel llistat)
  deixaven de tenir sentit.
- **Sidebar redimensionable** — `.geo-resizer` (franja de 5px a la dreta de
  `.geo-lateral`) es pot arrossegar (`pointerdown/move/up` a `App`) per
  canviar l'amplada entre 260 i 560px; es guarda a `localStorage`
  (`geoexplorer_amplaria_lateral`). Implementat amb una **custom property CSS**
  (`--amplaria-lateral`, no `[style.width]` directe) perquè el `width: 100%`
  del mode mòbil (bottom sheet) el pugui seguir sobreescrivint per cascada —
  un binding directe a `style.width` guanyaria sempre a qualsevol regla CSS
  externa, també en mòbil, i trencaria el bottom sheet.
- **Cerca per coordenades** — botó 📍 a `Capcalera` obre un popover (latitud +
  longitud); `GeoExplorerService.cercarCoordenades(coords)` només actualitza
  `coordenadesCercades`, i `Mapa` hi reacciona amb `flyTo` + un marcador
  pulsant (`creaIconaCercada`, animació CSS `geo-cercat-pols`). Funciona
  igual en mode convidat i autenticat.
- **`ConfirmacioService`** — diàleg de confirmació Sí/No genèric
  (`demanar(missatge): Promise<boolean>`), muntat un sol cop a `App` via
  `ConfirmacioDialeg`. Substitueix el `confirm()` natiu (no encaixava amb
  l'estètica) per a `eliminarCategoria`/`eliminarLloc` — sempre que es vulgui
  afegir una altra acció destructiva en aquesta app, reutilitzar aquest
  servei, no cridar `confirm()`.
- **`DetallLlocPersonal`** — panell de detall d'un lloc propi (nom,
  categoria, descripció, coordenades, "Com arribar-hi", eliminar — amb
  confirmació), mateix patró visual que `DetallPoi` per als convidats
  (CSS duplicat deliberadament entre els dos components — es va descartar
  extreure'l a un fitxer compartit per no arriscar una regressió al
  `DetallPoi` ja verificat). Consumeix `ContingutPersonalService.llocSeleccionat`.
  S'obre clicant un marcador personal al mapa (sense `flyTo`, ja és a la
  vista) o un ítem del llistat a la sidebar (`enfocarLloc` — amb `flyTo`).
  `Mapa` garanteix mútua exclusió: seleccionar un POI oficial buida
  `llocSeleccionat` i viceversa, perquè mai s'obrin els dos panells alhora.

### Detalls tècnics importants

- `L.markerClusterGroup()` **s'ha d'afegir al mapa després** d'una capa base
  (`L.tileLayer`) i amb `maxZoom` explícit a `L.map(...)`, si no Leaflet
  llença `Error: Map has no maxZoom specified` i els tiles queden en negre
  sense error visible a la UI. Vegeu `components/mapa/mapa.ts`.
- Angular **no estreny tipus amb `@if (fn(x); as y)`** quan `fn` és un *type
  predicate* — `y` queda com `boolean`. Cal `@if (fn(x)) { ... x.campEspecífic
  ... }` i deixar que Angular estrenyi la variable original dins del bloc.
- **Bug real trobat al backend** (no al frontend) durant la integració:
  `LlocPersonalDocument.descripcio` tenia `{ type: String, required: true,
  default: '' }` a Mongoose. El validador `required` per defecte de Mongoose
  per a `String` tracta una cadena buida com "absent" — així que desar un
  lloc **sense** descripció (camp opcional a la UI) sempre tornava `500`. Fix
  al repo del backend: treure `required: true`, deixar només `default: ''`.
  Si es torna a tocar aquest schema, no reafegir `required` a camps que
  puguin arribar buits des del frontend.
- **Rutes retirades (2026-08-10).** `TipusPoi` ja NO inclou `'ruta'` — es va
  eliminar per complet: `RutaPoi`/`TipusRuta`/`esRuta` del frontend,
  `RutaPoiDocument`/`RutaPoiSchema` i el seu discriminador Mongoose del
  backend, les 5 entrades `ruta-*` del dataset de seed, i la secció "Tipus de
  ruta / Desnivell màxim / Distància màxima" de `PanellFiltres`. També es va
  treure el filtre "Serveis del refugi" (checkboxes) — però **no** el camp
  `serveis` del model `RefugiPoi` ni la seva visualització informativa al
  `DetallPoi` (`serveis_titol` i les claus `serv_*` es mantenen: ara només
  s'usen per mostrar els serveis d'UN refugi concret, no per filtrar-los).
  Si mai es reintrodueixen les rutes, cal desfer els canvis a totes
  aquestes capes — no és una simple ocultació via CSS.
- **Filtre de pàrquing gratuït retirat (2026-08-10).** `nomesParkingGratuit`
  fora de `FiltresEstat`, `alternarNomesParkingGratuit` fora de
  `GeoExplorerService`. `ParkingPoi.gratuit` es manté al model i encara es
  mostra al `DetallPoi` d'un pàrquing concret (mateix criteri que amb
  `serveis` del refugi: es pot treure un *filtre* sense tocar la *dada*).
- **`.geo-usuari-menu` (menú "Tancar sessió") a z-index 1500** (2026-08-10).
  Amb un panell de detall obert (`.geo-detall`, `position:fixed`, z-index
  900-950, viu com a *sibling* de `.geo-principal` a `app.html` — el fix
  anterior que conté l'apilament intern de Leaflet dins `.geo-principal` NO
  l'afecta), el menú d'usuari quedava tapat i "Tancar sessió" no es podia
  clicar. Qualsevol element de capçalera que hagi d'estar "sempre per
  damunt" necessita un z-index superior a tots els `position:fixed` de
  l'app, no n'hi ha prou amb contenir el mapa.
- **Login des de mode convidat.** La insígnia de convidat de `Capcalera` ara
  té dos botons: "Iniciar sessió" (`.geo-link-login`, discret) i "Crear un
  compte" (`.geo-link-registre`, pill destacat) — abans només hi havia
  l'opció de registre.

## Disseny visual (redisseny 2026-08-10)

L'aplicació va tenir un primer disseny fosc genèric (fons gairebé negre + un
sol accent verd/taronja brillant — un dels tres patrons "d'IA genèrica" que
descriu `frontend-design`). Es va refer sencer amb una direcció pròpia
**"cartografia de muntanya / topogràfica"**, basada en artefactes reals del
senderisme català: fites de pintura GR/PR, tintes hipsomètriques dels mapes
topogràfics, corbes de nivell, segells d'estació.

- **Tokens** (`src/styles.css`, `:root`): `--geo-bg:#101823`,
  `--geo-panell:#1e2c3f`, `--geo-vora:#33465c`, `--geo-accent:#e8622f`
  (taronja "fita GR"), més `--geo-taronja/--geo-vermell/--geo-blau/--geo-lila/
  --geo-verd/--geo-teal` per a categories. Tipografia: **Big Shoulders
  Display** (títols, condensada/impactant), **IBM Plex Sans** (cos), **IBM
  Plex Mono** (dades/etiquetes — cotes, coordenades). Radi de vora unificat
  a `--geo-radi:6px` (formes gairebé rectangulars, no pills arrodonits).
- **Llenguatge de forma:** filtres com "waymark tabs" (`.geo-chip`) —
  rectangles amb `border-left:3px solid` que canvia de color en actiu, no
  pills arrodonits. Ídem als items de llista i botons d'opció
  (`.geo-item-poi`, `.geo-opcio`) amb franja lateral en lloc de vora completa.
- **Element de signatura:** a `PantallaEntrada`, una traça SVG estil GPX es
  dibuixa sola en carregar la pantalla (gradient verd→ambre→taronja seguint
  l'analogia hipsomètrica d'altitud) i acaba amb una "fita" (quadrat girat
  45°) que apareix al final. Envoltada de corbes de nivell el·líptiques
  (no cercles concèntrics perfectes) amb cotes ("2.400", "1.100") — evita el
  clixé de blobs/gradients decoratius sense lligam amb el tema.
- **Icones:** tot emoji (🏔️🔍📍🔎) substituït per SVG inline pròpies
  (`.geo-marca-cim`/`.geo-marca-corba` per al logotip, `.geo-icona-pin`
  reutilitzada a diversos components, `.geo-cerca-icona`, `.geo-icona-filtre`).
- **Swatch hipsomètric** (`.geo-hipsometrica` a `PanellFiltres`): barra de
  gradient verd→ambre→taronja→beix damunt el rang d'altitud, decorativa,
  reforça la metàfora cartogràfica sense afegir soroll funcional.

### Bug d'Angular trobat: `@keyframes` amb ViewEncapsulation emulada

**Símptoma:** una animació CSS declarada amb `@keyframes nom-meu` +
`animation: nom-meu ...` als estils d'un component no s'executa mai —
`element.getAnimations()` torna `[]`, `getComputedStyle` mostra tots els
`animation-*` correctes, i **no hi ha cap error a consola**.

**Causa arrel:** l'encapsulació emulada d'Angular (`ViewEncapsulation.Emulated`,
la per defecte) reanomena la *definició* `@keyframes` amb un sufix
`_ngcontent-xxx` intern, però **no reescriu la referència** dins la propietat
`animation`/`animation-name` d'altres regles del mateix component que
l'invoquen pel nom original. L'animació queda declarada apuntant a un
`@keyframes` que ja no existeix amb aquell nom.

**Fix aplicat:** substituir `@keyframes`/`animation` per la **Web Animations
API** (`element.animate([...], {...})`) des del component TypeScript
(`ngAfterViewInit` + `@ViewChild`) — vegeu `pantalla-entrada.ts`. WAAPI fa
servir objectes JS, no noms de `@keyframes` CSS, així que no pateix aquest
problema. **Si en el futur cal una animació CSS amb `@keyframes` amagada dins
un component amb encapsulació emulada, provar-la sempre amb
`element.getAnimations()` en un test/consola abans de donar-la per bona** —
els símptomes (computed style correcte, zero errors) enganyen fàcilment.

## Ajustos post-redisseny: missatgeria, marcadors i rendiment (2026-08-10, mateix dia)

Feedback de l'usuari sobre el redisseny: li agrada l'estètica, però (1) la
*informació* estava massa centrada en "cartografia de muntanya" quan l'app
també serveix per crear llistes/categories de llocs personals a qualsevol
part del món; (2) no li agradava el marcador dels punts oficials en forma de
**rombe** (quadrat girat 45°); (3) el mapa "a vegades costa de carregar".

**Why:** El disseny visual és correcte però calia (a) comunicar millor
l'abast real de l'app (no és només un mapa de muntanya curat, també és una
eina general de llistes de llocs), (b) una forma de marcador més reconeixible
universalment, i (c) resoldre un problema de rendiment real, no només
percebut.

**How to apply:**
- **Missatgeria ampliada, no canvi d'estètica.** No es va tocar la identitat
  visual topogràfica (l'usuari l'havia validat) — només el *contingut*. Es
  va iterar en dos passos (vegeu també la secció següent, que en desfà part):
  1. Primer pas: `entrada_eyebrow`/`entrada_subtitol`/`subtitol_app`
     (capçalera) es van reescriure per esmentar explícitament totes dues
     coses (punts de muntanya curats + llistes pròpies arreu del món), i es
     va afegir una franja de dos "pilars" a `pantalla-entrada`
     (`.geo-entrada-pilars`) entre el subtítol i els botons d'accés.
  2. **Segon pas, després de veure el resultat (vegeu "Simplificació
     posterior" més avall): l'usuari va demanar treure la franja de
     pilars** — massa èmfasi visual per al missatge. Estat final: eyebrow i
     subtítol genèrics sense esmentar "muntanya" en absolut
     (`entrada_eyebrow: 'Les teves localitzacions'`,
     `entrada_subtitol: 'Crea els teus propis mapes amb categories i
     llistes.'`, `subtitol_app: 'Llistes pròpies'`), sense franja de pilars.
     El contingut de muntanya (103+ pics carregats) queda implícit —
     l'usuari el descobreix en entrar, no cal vendre'l a la landing.
  - `categories_personals_buida` (l'estat buit d'"El meu mapa") **sí que es
    manté** amb exemples explícits no relacionats amb muntanya ("Restaurants
    preferits", "Viatges pendents") — aquest punt no es va revertir. Si es
    torna a tocar el copy d'aquesta app, **no reintroduir la franja de
    pilars** sense que l'usuari ho torni a demanar explícitament — ja es va
    provar i es va descartar.
- **Marcador oficial: de rombe a fita (pin) real.** `.geo-marcador-icona`
  (abans un `<div>` quadrat amb `transform: rotate(-45deg)` + `border-radius`
  asimètric per simular un pin) ara és un `<svg>` amb un path de teardrop de
  veritat (`creaIconaPoi` a `mapa-icones.util.ts`) — es llegeix com "un lloc
  al mapa" a primer cop d'ull. **Icones cache per tipus** (`Map<TipusPoi,
  L.DivIcon>` a nivell de mòdul): es crea una sola instància per tipus (pic/
  refugi/llac/parking) i es reutilitza a tots els marcadors d'aquell tipus,
  en lloc de construir-ne una de nova (nou objecte + nou string HTML) per
  cada marcador a cada redibuixat.
- **Rendiment del mapa — causa real identificada:** cap input (cerca de
  text, sliders d'altitud) tenia debounce. Cada tecla o cada píxel arrossegat
  al slider disparava `actualitzarCerca`/`actualitzarRangAltitud` →
  `poisFiltrats` (computed) es recalculava → l'`effect()` de `Mapa` cridava
  `dibuixarMarcadors` sencer: `clearLayers()` + reconstrucció de 100-153
  `L.marker` + `addLayer` un per un (cada `addLayer` recalcula l'arbre de
  clústers pel seu compte). Amb el dataset real (153 POIs), arrossegar el
  slider disparava aquest cicle sencer desenes de cops per segon — d'aquí la
  sensació de "el mapa costa de carregar".
  - **Fix 1 — debounce a la vora (component), no al servei:** `capcalera.ts`
    (`onCercaInput`) i `panell-filtres.ts` (`onAltitudMinInput`/
    `onAltitudMaxInput`) ara debouncen la crida al servei (250ms cerca,
    120ms altitud) amb `setTimeout`/`clearTimeout` simple — **no** cal RxJS
    per a això en aquest patró basat en Signals. Per als sliders d'altitud
    calia una parella de signals locals `altitudMinMostrat`/
    `altitudMaxMostrat` (sincronitzats amb `geo.filtres()` via un `effect()`
    al constructor) perquè el número i la posició del slider responguin a
    cada frame mentre s'arrossega, encara que el redibuixat del mapa vagi
    per darrere. **Patró a seguir per a qualsevol input futur que dispari
    una operació cara** (redibuixar el mapa, cridar l'API): mai lligar
    l'`(input)` directament al signal "pesant"; sempre un signal local
    "mostrat" per a feedback immediat + un `setTimeout` debounced cap al
    signal real.
  - **Fix 2 — `addLayers` en lloc de N × `addLayer`:** `Mapa.dibuixarMarcadors`
    ara construeix l'array sencer de `L.marker` i el passa d'un cop a
    `grupClusters.addLayers(marcadors)` (API en plural de
    `leaflet.markercluster`, recalcula els clústers un sol cop pel lot
    sencer) en lloc de cridar `addLayer` marcador a marcador dins un bucle.
  - **Fix 3 — `chunkedLoading: true`** a les opcions de `L.markerClusterGroup`
    (`chunkInterval: 50`, `chunkDelay: 20`): encara que s'afegeixi un lot
    gran d'un cop, Leaflet.markercluster el processa en trossos via
    `requestAnimationFrame` en lloc de bloquejar el fil principal sencer.
  - Verificat amb Playwright: comptador de resultats es manté fix mentre es
    tecleja ràpid a la cerca (153 sense canviar durant l'escriptura) i just
    baixa a l'1 esperat ~400ms després de parar (confirma que el debounce
    funciona i que no hi ha redibuixats intermedis). 0 errors de consola en
    tot el flux (entrada amb la franja de pilars —retirada poc després,
    vegeu secció següent—, mapa amb pins, registre, estat buit ampliat,
    slider).

## Simplificació posterior: fora la franja de pilars (2026-08-10, mateix dia)

Un cop vista la franja de dos "pilars" descrita a la secció anterior,
l'usuari va demanar treure-la de `pantalla-entrada` — massa pes visual per
al missatge que calia transmetre.

**How to apply:**
- Eliminats de `pantalla-entrada.html`: el bloc `<div class="geo-entrada-pilars">`
  sencer (les dues targetes amb icona+títol+descripció).
- Eliminades de `pantalla-entrada.css`: totes les regles `.geo-entrada-pilars*`
  (ja no queda CSS mort — es van esborrar, no comentar).
- Eliminades de `traduccio.service.ts` (ca/es/en): `entrada_pilar_oficial_titol`,
  `entrada_pilar_oficial_desc`, `entrada_pilar_personal_titol`,
  `entrada_pilar_personal_desc` — claus òrfenes sense cap referència al
  template, es van esborrar en lloc de deixar-les mortes al diccionari.
- **L'usuari mateix va editar `traduccio.service.ts` a l'IDE en paral·lel**
  per simplificar encara més `entrada_eyebrow`/`entrada_subtitol`/
  `subtitol_app` (vegeu valors finals a la secció anterior) — no calia
  ampliar-los explícitament un cop retirada la franja de pilars, la landing
  ja no necessita "vendre" les dues funcionalitats amb tant de detall.
- Si en el futur es vol tornar a comunicar visualment la dualitat "punts
  oficials + llistes pròpies" a la landing, valorar una solució més subtil
  que una franja de targetes (p. ex. una sola línia de text, o cap element
  dedicat) — la franja de pilars ja es va provar i el resultat no va
  agradar per ser massa protagonista.
- Verificat amb build net + Playwright (0 errors de consola) que l'entrada
  es renderitza correctament sense la franja.

## Icona de l'escriptori del Shell (2026-08-10, mateix dia)

L'usuari va demanar que la icona de GeoExplorer a l'escriptori de l'OS Shell
(`src/app/components/desktop/desktop.ts`) fos la mateixa marca que la del
logotip de la capçalera de l'app (les dues muntanyes taronges + les dues
línies de corba), en lloc de l'emoji 🏔️ que hi havia.

**How to apply:** `AppIcon` (`src/app/components/base/app-icon/app-icon.html`)
ja suporta dues formes per a `app.icon`: un emoji literal, o una ruta que
conté `/` — en aquest cas es renderitza com a `<img [src]="app.icon">`. Aquest
mateix camp `icon` es reutilitza tal qual a la barra de tasques
(`taskbar.html`) i al selector de finestres (`window-wrapper.html`), així que
UN sol canvi a `desktop.ts` ja actualitza tots tres llocs. Es va crear
`public/geoexplorer/logo.svg` (SVG autònom amb els colors del path
"hardcoded" — un `<img src="...svg">` no té accés a les custom properties CSS
de l'app GeoExplorer, així que calia repetir els valors de color en lloc de
fer servir `var(--geo-accent)`) i canviar
`icon: '🏔️'` → `icon: 'geoexplorer/logo.svg'` a `desktop.ts` (mateix patró
que `icon: 'linkedin/logo.png'`, ja existent per a l'app de LinkedIn). Els
fitxers a `public/` es serveixen des de l'arrel (`/geoexplorer/logo.svg`).
**Detall a no oblidar:** els colors de les línies de corba (`#8fa2b8` a poca
opacitat) eren pensats per al fons fosc de l'app GeoExplorer; en una icona
petita (32px) sobre un fons d'escriptori arbitrari (pot ser clar), a la
pràctica gairebé no es veien — es van enfosquir a `#33465c` amb més opacitat
i més gruix de traç (1.6→2.2) perquè es llegeixin bé a mida petita
independentment del fons de pantalla triat.

## Backend

API real a `c:/portafolis/back/geo-explorer/geoexplorer-api` (repo Node/NestJS
separat, no forma part d'aquest monorepo Angular). El frontend hi parla
íntegrament per HTTP — no queda cap simulació local. Detall complet
(arquitectura, esquema de dades, decisions, com posar-ho en marxa) al
`CONTEXT.md` d'aquell repo. Encàrrec original que va originar el backend:
[`geoexplorer-backend-brief.md`](./geoexplorer-backend-brief.md) (conservat
com a referència històrica del contracte de dades exigit).

## Regles de Desenvolupament

- Llegir `context/os-shell/angular-rules.md` per normes Angular 22+
- Llegir `context/os-shell/global-styles.md` per variables CSS de l'OS
- Tot el codi, comentaris i logs en **Català**
- Prohibit `any`; tipat fort obligatori (unions discriminades + type guards)
- Usar Signals per a l'estat reactiu
- Components standalone; control flow modern (`@if` / `@for`)
- Prohibit hardcoding de text als HTML — usar `TraduccioService`

---

## Altres pròxims passos (fora d'abast d'aquesta versió)

1. **Rutes/itineraris.** Es van retirar deliberadament (vegeu "Detalls
   tècnics importants") — "de moment només punts concrets". Si es
   reintrodueixen: un `TipusPoi` de ruta (o, més ben fet, un tipus propi
   `RutaPoi`/`RutaPersonal` amb traça `GeoJSON LineString`, no un simple punt
   amb `desnivell`/`distanciaKm`), amb suport per pujar/parsejar `.gpx` reals
   i dibuixar la traça + perfil d'elevació al mapa.
2. **Imatges reals** — `imatges` és buit a tot arreu; cal un servei
   d'emmagatzematge (S3/R2) i pujada des del formulari de nou lloc.
3. **Estat obert/tancat de refugis en temps real** via font externa (FEEC, etc.).
4. **Cerca accessible en mòbil** (actualment amagada sota `900px`).
5. **Tests** — cap spec encara; mínim cobrir `GeoExplorerService` (filtratge),
   `ContingutPersonalService` i els *type guards* de `poi.model.ts`.
6. **MapLibre GL JS** si en el futur cal 3D/relleu/vectorial — migrar només
   `components/mapa/`, l'estat als serveis no hauria de canviar.
