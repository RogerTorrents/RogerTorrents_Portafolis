# Roger Torrents — Portafolis

Portafolis interactiu en forma d'escriptori dins del navegador: pantalla de
bloqueig, escriptori amb icones, barra de tasques i finestres que es poden
moure, redimensionar, minimitzar i encaixar a mitja pantalla. Cada aplicació
s'obre en una finestra pròpia.

**En línia:** [rogertorrents.com](https://rogertorrents.com)

## Aplicacions

| App | Què és | Port local |
|---|---|---|
| Shell (`src/`) | L'escriptori: finestres, barra de tasques, idioma, fons de pantalla | 4200 |
| Sobre mi | Experiència, formació, habilitats i un mapa il·lustrat d'aficions | 4201 |
| L'Impostor | Joc de festa amb paraules generades per IA (Groq) | 4204 |
| GeoExplorer | Mapa de muntanya (Leaflet) amb mapa personal i comptes d'usuari | 4205 |
| Més que un joc | Quatre minijocs sobre la història del FC Barcelona | 4206 |
| Som-hi | Plans d'entrenament, amb el mateix compte que GeoExplorer | 4207 |
| Juguem al Truc | El joc de cartes, multijugador en temps real (Socket.IO) i amb bots | 4208 |
| Altres projectes | Webs fetes a mida, amb vista prèvia | 4209 |

Cada app és un projecte Angular independent del monorepo (`projects/`) i es
publica al seu subdomini. El Shell les incrusta en iframes i els envia
l'idioma amb `postMessage`.

## Tecnologia

- **Angular 22**: components standalone, signals i control de flux modern (`@if`, `@for`)
- **TypeScript** en mode estricte
- **Leaflet** i **leaflet.markercluster** (GeoExplorer), **socket.io-client** (Truc)
- **Vitest** per als tests unitaris
- Tipografies servides des del mateix domini amb Fontsource
- Interfície en català, castellà i anglès

Les API són en repositoris a part (NestJS, PostgreSQL/Prisma, MongoDB i Express).

## Desenvolupament

Cal Node.js 22 o superior.

```bash
npm install
npm run start:all      # totes les apps, cadascuna al seu port
npm start              # només el Shell
npm run start:geoexplorer
```

```bash
npx ng build <app>              # build de producció a dist/<app>
npx ng test <app> --watch=false # tests
```

## Desplegament i seguretat

Cada app es publica a Cloudflare Pages. El fitxer `public/_headers` de cada
projecte hi defineix les capçaleres de seguretat:

- **Content-Security-Policy** feta a mida de cada app (només els dominis que usa)
- **frame-ancestors**: les apps només es poden incrustar dins del Shell
- **HSTS**

Les sessions de GeoExplorer i Som-hi usen un access token de curta durada i un
refresh token en una cookie `HttpOnly` que el JavaScript de la pàgina no pot llegir.
