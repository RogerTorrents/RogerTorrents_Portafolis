# Sistema de Finestres i Barra de Tasques (Responsive OS)
- Simula el comportament d'un ordinador Windows, amb les seves aplicacions, finestres i funcionalitats

## 1. Pantalla de Bloqueig (Lock Screen)
- Estat inicial de la web a tots els dispositius.
- Mostra l'hora en gran, la data i petita descripció, fons de pantalla dinàmic i selector d'idioma (CA, ES, EN).
- **Escriptori:** S'elimina en prémer qualsevol tecla o fer clic.
- **Mòbil:** S'elimina lliscant cap amunt (swipe up) o fent un toc a la pantalla.

## 2. Comportament Dual del Sistema (Desktop vs. Mòbil)
El sistema ha de detectar la mida de la pantalla (mitjançant CSS Media Queries i breakpoints d'Angular) per alternar entre dues interfícies completament diferents:

### A) Interfície d'Escriptori (Estil Windows)
- **Escriptori:** Els accessos directes (icones) es distribueixen en quadrícula a l'esquerra de la pantalla. Doble clic per obrir-los.
- **Finestres Flotants:** Les aplicacions s'obren en finestres independents flotants de mida variable.
- **Gestió de Finestres (WindowManager):** Cada finestra de l'escriptori ha de permetre:
  - Arrossegar (`drag and drop`) i canviar la mida (`resize`).
  - Botons de control: Minimitzar (amagar a la barra), Maximitzar (pantalla completa d'escriptori) i Tancar (destruir estat).
  - Control de focus dinàmic: la finestra on l'usuari fa clic passa automàticament a tenir el `z-index` més alt per quedar al capdavant.

### B) Interfície Mòbil (Estil Android / iOS)
- **Pantalla d'Inici (Home Screen):** Les icones es distribueixen en una quadrícula neta que ocupa la pantalla, adaptada al dit (més grans i espaiades). Un sol toc (click) obre l'aplicació.
- **Comportament d'Aplicacions:** No existeixen les finestres flotants ni el drag-and-drop. Quan s'obre una aplicació de `projects/`, s'obre automàticament a **pantalla completa** (100% width, 100% height) per sobre de l'escriptori.
- **Gestió de Finestres en Mòbil:** 
  - El botó "Tancar" (X) tenca l'aplicació.

## 3. Barra de Tasques i Controls Inferiors

### A) En Escriptori (Taskbar Clàssica)
- Fixada a baix de tot (`bottom: 0`, `width: 100%`).
- **Esquerra:** Botó d'Inici amb la possibilitat de tancar o fer la pantalla completa.
- **Centre:** Icones de les aplicacions obertes. Si l'aplicació està en primer pla, la icona es mostra ressaltada. Fent clic a la icona es minimitza o es restaura la finestra.
- **Dreta:** Selector d'idioma (CA, ES, EN), modificació del volum i la data (DD/MM/AAAA) i l'hora en temps real (HH:MM) que s'actualitza cada minut.

### B) En Mòbil (Dock / Barra de Navegació Mòbil)
- Fixada a baix de tot, dissenyada per a un accés ràpid amb el polze.
- No mostra la data i hora (aquesta es mou a la barra superior d'estat del mòbil, si es desitja, o s'amaga).
- Mostra una barra d'aplicacions actives en format reduït (estil Dock de mòbil) o una fletxa/botó de "Tornar a l'inici" (Home Button) per minimitzar ràpidament el microservei que estigui obert a pantalla completa i tornar a veure les icones de l'escriptori.

## 3b. URL dels iframes: sempre via `environment`, mai `localhost` hardcoded

Cada `<iframe>` d'`app.html` fa `[src]="urlsApps['APP_ID']"`. Les URL viuen a
`src/environments/environment.ts` (localhost:420X, dev) i
`environment.prod.ts` (dominis HTTPS, substituït via `fileReplacements` a
`angular.json`). En afegir una app amb iframe, cal afegir la seva entrada a
`appsUrls` dels **dos** fitxers. En producció han de ser HTTPS: un Shell per
HTTPS no pot carregar iframes HTTP (mixed content).

## 4. Idioma de les micro-apps: controlat pel Shell, mai per un selector propi

Cap micro-app dins d'un iframe (`projects/*`) ha de tenir el seu propi
selector d'idioma visible. Totes segueixen l'idioma triat al selector de la
barra de tasques del Shell (`TranslationService.setLang()`), transmès via
`postMessage` — Shell i apps són orígens diferents (`4200` vs `420X`), no hi
ha cap altra via de comunicació entre ells (no hi ha proxy de dev-server ni
cookies compartides).

**Mecanisme (implementat a `src/app/services/translation.service.ts` i
`src/app/app.html`/`app.ts`):**
- `TranslationService.setLang(l)` crida `difondreIdioma()`, que envia
  `{ origen: 'os-shell', tipus: 'idioma', valor: l }` a **tots** els
  `<iframe>` actualment al DOM (via `enviarIdiomaA()`, calculant l'origen
  destí amb `new URL(iframe.src).origin` — mai `'*'`).
- Cada `<iframe>` d'`app.html` amb una app que té i18n propi porta
  `(load)="onIframeCarregada($event)"`, que envia l'idioma actual a AQUEST
  iframe just acabat de carregar. **Necessari** perquè `WindowManagerService.
  closeWindow()` desmunta l'iframe del DOM del tot (no només l'amaga, a
  diferència de minimitzar) — cada vegada que es torna a obrir una app,
  l'iframe es recarrega de zero i el seu `TraduccioService` local arrenca
  amb el seu idioma per defecte ('ca') fins que li arriba aquest missatge.
- Cada app amb i18n propi (`sobre-mi`, `geoexplorer`, `mes-que-un-joc`,
  `som-hi`) escolta `window.addEventListener('message', ...)` al
  constructor del seu servei de traduccions local i crida el seu propi
  mètode d'establir idioma (`establirIdioma`/`setIdioma` segons l'app) quan
  rep un missatge amb `origen === 'os-shell'` i `tipus === 'idioma'`. Si
  l'app s'obre sola (fora de l'iframe, en desenvolupament directe a
  `localhost:420X`), mai rep el missatge i es queda amb el default 'ca' —
  comportament esperat, no cal cap fallback addicional.
- **`joc-impostor` és l'excepció deliberada**: el seu selector "Idioma"
  (català/castellà/anglès) NO és un idioma d'interfície — és un paràmetre
  de joc (en quin idioma genera l'IA la paraula/categoria secreta). La
  seva interfície és Català hardcoded sense cap `TraduccioService`, així
  que no participa en aquest mecanisme.

**En crear una nova app amb i18n propi** (`/crearApp` no en genera per
defecte — només si es construeix manualment després): copiar aquest patró
sencer (constructor amb listener + treure qualsevol selector visible propi)
en lloc de repetir el disseny antic "cada app amb el seu propi selector,
independent del Shell" que tenien totes fins ara.
## 5. Dispositius tàctils (mòbil / tauleta)

Detecció: `DispositiuService.tactil()` (`src/app/services/dispositiu.service.ts`),
basat en `(pointer: coarse)` — el punter PRINCIPAL. Un portàtil tàctil amb
ratolí, o una tauleta amb trackpad, es comporta com a escriptori. A CSS
s'usa `@media (pointer: coarse)` o la classe `.tactil` de la taskbar.
A escriptori res d'això canvia el comportament.

- **Totes les apps s'obren maximitzades** (`window-wrapper` `ngOnInit`),
  tinguin o no `initialMaximized`.
- **Cap finestra pot sortir de la pantalla**: `WindowManagerService.
  ajustarAPantalla()` retalla i desplaça qualsevol rectangle (moure,
  redimensionar, desmaximitzar, `restoreBounds`) perquè quedi sencer sobre
  la taskbar. En girar el dispositiu o canviar la barra del navegador,
  `clampFinestres()` (escoltant `resize` i `visualViewport`) les torna a
  encabir.
- Sense snap lateral (mitja pantalla de mòbil < amplada mínima); el snap
  a maximitzar (dalt) es manté.
- `touch-action: none` al header, nanses i escriptori, i tots els drags
  escolten també `pointercancel`.
- **Taskbar**: mai desborda. Si els noms no hi caben → `.nomes-logos`
  (logos de 40 px fixos). Si ni així → la zona d'apps fa scroll horitzontal
  amb `scroll-snap`, i la seva amplada visible és múltiple exacte de 40 px
  perquè mai es vegi mitja icona. En mòbil estret s'amaguen el cercador i
  la data (queda l'hora). Sense previsualitzacions al "hover".
- Minimitzar recorda si la finestra estava maximitzada
  (`estatAbansMinimitzar`) i restaurar-la la torna igual (també a
  escriptori).

### Fons de pantalla en tàctil (2026-10-19)

- **Finestra "Fons de pantalla"** (`fons-depantalla`): amb `.tactil` al
  host (de `DispositiuService`), la previsualització ocupa tot l'espai
  sobrant i copia la proporció de la pantalla (`--proporcio-pantalla`,
  vertical en un mòbil), perquè sigui fidel al fons real. Controls i
  botons a mida de dit; en horitzontal, 2 columnes (text/controls/botons |
  previsualització). A escriptori el canvas segueix sent 320×200 fix.
- **Nitidesa**: en tàctil, tant el fons (`voronoi-fons`) com la
  previsualització es dibuixen a la densitat real de la pantalla (màx. 2×,
  `ctx.setTransform`), treballant en coordenades lògiques en px CSS.
  Abans, a 1×, un mòbil de densitat 3 els veia borrosos.
- `voronoi-fons` en tàctil fa servir `inset: 0` en lloc de `100vw/100vh`:
  en mòbil `100vh` inclou la barra del navegador i el canvas (dibuixat a
  `innerHeight`) quedava estirat.
