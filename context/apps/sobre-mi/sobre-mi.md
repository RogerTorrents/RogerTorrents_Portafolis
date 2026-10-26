# Context: App Sobre Mi (Port 4201)

## Propòsit
Aplicació Angular standalone completa que presenta qui és Roger Torrents Gabalda: experiència professional, formació, habilitats i vida personal. Corre de forma independent al port 4201 dins d'un iframe del Shell.

## Estructura de Fitxers
```
projects/sobre-mi/src/
├── index.html               ← Google Fonts: Space Grotesk + Space Mono
├── styles.css               ← Reset global (html/body: 100% height, overflow hidden)
└── app/
    ├── app.ts               ← Component root amb lògica de scroll i IntersectionObserver
    ├── app.html             ← Template complet amb 7 seccions
    ├── app.css              ← Tots els estils del tema dark original
    └── services/
        └── traduccions.service.ts  ← Servei local CA/ES/EN (no usa el del Shell)
```

## Tema Visual
- **Tema CLAR** (el fosc original es va abandonar — no tornar-hi): fons blanc amb
  graella blava subtil, tokens `--sm-*` a `:host` d'`app.css` (`--sm-navy`,
  `--sm-blue #2563eb`, `--sm-green`, `--sm-orange`, `--sm-purple`).
- **Tipografies:** `Inter` (display/body) + `JetBrains Mono` (labels, dates, números).
- La secció 6 ja no són 4 targetes: és el mapa il·lustrat "Fora del Teclat"
  (`elementsMapa`, 7 elements clicables amb popup de foto + text).

## Versió mòbil tàctil (2026-10-19)
Tot dins `@media (pointer: coarse) and (max-width: 700px)` al final d'`app.css`
— un ordinador no ho veu mai (verificat: 0 píxels diferents a 1400×900 a les 9
pantalles). Els elements nous de la plantilla tenen `display: none` fora
d'aquesta consulta:
- **`.sm-mnav`** — navegació inferior en pastilles (la lateral `.sm-nav` s'amaga
  ≤700px). Apareix amb `opacityNav()` com la lateral; un `effect` a `App`
  centra la pastilla de la secció activa dins la tira.
- **`.sm-exp-bloc__mes`** — "Mostra-ho tot (+3)": a la feina actual només es
  veuen 3 punts (`bulletsVisiblesMobil`); la resta porten
  `.sm-exp-bloc__bullet--extra`, que només s'amaga en mòbil.
- **`.sm-mapa-temes`** — els 7 elements del mapa també com a botons grans amb
  la seva imatge retallada (al mapa petit eren difícils de tocar, la bici feia
  ~30px). El popup passa a full inferior amb la foto primer.
- Formació en files compactes amb logotip, contacte en files-targeta amb icona,
  foto del hero a 150px, capçaleres i espaiats més compactes.
- Claus noves (ca/es/en): `veure_mes`, `veure_menys`, `mapa_pista`.

## Seccions i Contingut
1. **INTRO** — Text "ROGER TORRENTS GABALDA" huge (clamp 3.5–14rem), es mou horitzontalment a l'esquerra amb scroll (translateX de 0% a -115%). Secció de 350vh amb sticky de 100vh.
2. **HERO** — Foto placeholder + descripció + stats (3.5 anys, 2 empreses, 10+ tecnologies) + barres d'idiomes
3. **EXPERIÈNCIA** — Timeline: Inetum Full-Stack (Feb 2024–Jul 2026) i Inetum Pràctiques (Feb 2023–Feb 2024)
4. **FORMACIÓ** — Cards: UOC Multimèdia (en curs), CFGS DAW, Batxillerat
5. **HABILITATS** — Grid de categories: Frontend/Backend/DevOps/Altres amb tags de color
6. **PERSONAL** — 4 targetes: Muntanya & Natura, Futbol, Ribes de Freser, Esplai Ger
7. **CONTACTE** — 4 items: email, telèfon, adreça, web

## Lògica Angular
- **Scroll intro:** `scrollPos` signal + `computed` per `translateX`. El `onScroll()` s'escolta al `#contenidor` div.
- **Scroll reveal:** `IntersectionObserver` que afegeix classe `.revealed` als elements `.reveal` quan entren al viewport.
- **Traduccions locals:** `TraduccionService` propi amb claus CA/ES/EN. Mai hardcoding de text al HTML. **Sense selector d'idioma propi** (el flotant `.sm-lang` de dalt a la dreta es va retirar en una sessió posterior) — l'idioma ve del selector de la barra de tasques del Shell via `postMessage`; veure `context/os-shell/windows-system.md` §4.
- **ChangeDetectionStrategy.OnPush** activat.

## Informació Personal (Roger)
- **Nom:** Roger Torrents Gabalda
- **Email:** rogertorrentsgabalda@gmail.com
- **Telèfon:** 638 94 43 90
- **Adreça:** Pas. Consulat del Mar, 08810 Sant Pere de Ribes, Barcelona
- **Web:** rogertorrentsgabalda.dev
- **Muntanya:** córrer, ciclisme, rutes llargues, pics
- **Futbol:** 10 anys al CD Ribes (defensa), ara pachanga esporàdica
- **Poble:** Ribes de Freser
- **Esplai:** Monitor de l'Esplai Ger (ex-infant, ara monitor de lleure)

## Imatges
- `public/assets/roger-sobre-mi.webp` → placeholder "RT" si no carrega (`(error)` d'Angular
  + signal `fotoHeroError`; res d'`onerror` inline, que la CSP bloquejaria)
- Totes en **WebP i a la mida a què es mostren** (×2 per a retina): fotos del popup a 800px,
  retallades del mapa ≤800px, fons del mapa en dues mides (`fondo_lineas-1100.webp` /
  `fondo_lineas.webp` 2200px) amb `srcset`. Imatges noves: mateix criteri.
- Carpetes sense espais ni accents: `assets/fora-del-teclat/{fotos,recortades}`, `assets/educacio/`
- Imatges del mapa amb `alt` (títol traduït de l'element; el fons, `mapa_alt`). Les dels
  botons `.sm-mapa-temes` tenen `alt=""` a propòsit: el nom ja és el text del botó
- Les targetes personals usen emojis com a placeholder fins que l'usuari afegeixi fotos reals
