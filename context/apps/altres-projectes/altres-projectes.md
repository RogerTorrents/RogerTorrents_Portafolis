# Context: Altres projectes

## Descripció
Micro-aplicació del portafolis de Roger Torrents que recull **webs fetes a mida
per a gent i projectes propers**, fora del mateix portafolis. És una col·lecció
pensada per créixer: cada web nova és una entrada de dades, no codi nou.

Projectes actuals:
1. **Espais inclusius** (`https://espais-inclusius.web.app/`): web del treball de
   recerca de la Jordina Torrents Gabaldà (germana), 2n batxillerat, institut
   Montgròs. Pregunta: es pot millorar la inclusió de les persones amb TEA?
   Angular 20 amb SSR, a Firebase Hosting.
2. **Delta-Konkurs** (`https://lustrous-crisp-522663.netlify.app/`): marcador per
   a les dinàmiques de l'Esplai GER (estada de 7 dies a Casa Amadeo, Poblenou del
   Delta, 2026). JS + Tailwind + Chart.js + Firebase Realtime DB, PWA a Netlify.
   **És la versió pública sense participants per protegir la privacitat dels
   infants** — per això la classificació surt buida. L'app ho avisa amb el camp
   `nota`. Mai afegir captures amb noms d'infants.

## Port de Desenvolupament
`http://localhost:4209`

## Execució
```bash
npm run start:altres-projectes
```

## Arquitectura
Sense backend ni router. Una sola pàgina: capçalera + una `TargetaProjecte` per
web. "Provar-la aquí" obre `Emprovador`, una finestra superposada (signal
`provant` a `App`) amb la web real en un `iframe` (Escriptori / Mòbil 390px).
Esc o "Tancar" la tanquen.

```
src/app/
├── models/projecte.model.ts      Projecte, ColorsProjecte, TextTraduit, Idioma
├── data/projectes.data.ts        PROJECTES (l'única font de dades)
├── services/traduccio.service.ts textos UI CA/ES/EN + listener postMessage del Shell
└── components/ targeta-projecte · emprovador
public/projectes/<id>/            inici.jpg (1280×800) + mobil.jpg (390×844 @2x)
```

## Com afegir una web nova
1. Comprovar que es pot incrustar (si no, `emprovable: false`):
   `curl -sI <url> | grep -iE "x-frame|frame-ancestors"` — sense resultat = OK.
2. Fer les dues captures amb Playwright (JPEG qualitat ~78) i desar-les a
   `public/projectes/<id>/`.
3. Afegir l'entrada al final de `PROJECTES`: `perA` (frase sencera "Per a …"),
   `resum` (UNA frase), `destacats` (exactament 3, molt curts), `nota` opcional,
   `stack` (2-3 noms) i `colors` presos de la paleta de la mateixa web.

## Disseny
L'usuari va rebutjar una primera versió temàtica (taller de sastre, cinta
mètrica amb números, paper quadriculat, vista de detall llarga) per massa
recarregada. Ara: **simple, visible i resumit**.
- Fons llis neutre `#eceef1`; cada targeta porta **els colors de la seva pròpia
  web** (fons, text, accent) — és el que la fa distintiva.
- Tipografia: Unbounded (títols) + Instrument Sans (cos).
- Captura d'escriptori + captura de mòbil superposada; botons grans en píndola.
- Poc text: una frase i tres punts per projecte. Tema clar únicament.

## Regles de Desenvolupament
- Llegir `context/os-shell/angular-rules.md` per normes Angular 22+
- Llegir `context/os-shell/global-styles.md` per variables CSS de l'OS
- Tot el codi, comentaris i logs en **Català**
- Prohibit `any`; tipat fort obligatori
- Usar Signals per a l'estat reactiu
- Components standalone; control flow modern (`@if` / `@for`)
- Prohibit hardcoding de text als HTML — usar `TraduccioService` (`t()` per a la
  UI, `tx()` per als textos de dades). Noms propis de projectes i stack no es tradueixen.
- Idioma sincronitzat amb el Shell via `postMessage` (cap selector propi).
- `img` global té `height: auto`: sense això els atributs `width`/`height`
  guanyen a l'`aspect-ratio` i les captures surten estirades.
