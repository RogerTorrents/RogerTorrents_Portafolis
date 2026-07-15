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
- **Paleta:** Fons molt fosc (#08080f), cyan (#22d3ee), taronja (#f97316), violeta (#a855f7), verd (#4ade80)
- **Tipografies:** `Space Grotesk` (display/body) + `Space Mono` (monospai per labels, dates, codi)
- **Estil:** Dark theme minimalista, sense similitud amb el tema Windows del Shell

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
- **Traduccions locals:** `TraduccionService` propi (independent del Shell) amb claus CA/ES/EN. Mai hardcoding de text al HTML.
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
- `public/assets/foto-perfil.jpg` → placeholder "RT" si no existeix (onerror handler)
- Les targetes personals usen emojis com a placeholder fins que l'usuari afegeixi fotos reals
