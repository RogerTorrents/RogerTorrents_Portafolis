# Context: Joc Impostor

## Visió General

Micro-aplicació de joc de taula per al portafolis de Roger Torrents. Implementa el joc "L'Impostor": un jugador (o més) rep una paraula diferent als altres i ha d'amagar-ho mentre la resta intenta descobrir-lo.

- **Frontend Angular:** Port `4204` — aquest repositori
- **Backend Node.js:** `http://localhost:3000` (Express + Groq SDK) — repositori extern, ja configurat i actiu

## Execució

```bash
npm run start:joc-impostor
```

---

## Regles de Desenvolupament Angular

- Llegir `context/os-shell/angular-rules.md` per normes Angular 22+
- Llegir `context/os-shell/global-styles.md` per variables CSS de l'OS
- Tot el codi, comentaris i logs en **Català**
- Prohibit `any`; tipat fort obligatori
- Usar Signals per a l'estat reactiu
- Components standalone; control flow modern (`@if` / `@for`)
- Prohibit hardcoding de text als HTML — usar `TranslationService`

---

## 1. Contracte d'API (POST `/api/paraules`)

El backend sempre retorna un bloc de **15 paraules** per evitar múltiples peticions durant la fase de "passar paraula". Hi ha tres modes de joc que determinen la petició i la resposta:

---

### CAS A — Categoria Manual

L'usuari escriu la categoria que vol i tria idioma i dificultat.

**Petició:**
```json
{
  "categoria": "Famosos catalans",
  "dificultat": 7,
  "idioma": "català"
}
```
- `dificultat`: enter de l'1 al 10
- `idioma`: string (`"català"`, `"castellà"`, `"anglès"`)

**Resposta:**
```json
{
  "categoria": "Famosos catalans",
  "pista": "Personalitats de l'àmbit social i cultural de Catalunya",
  "paraules": [
    "Andreu Buenafuente",
    "Sílvia Abril",
    "Salvador Dalí",
    "Montserrat Caballé",
    "Joan Manuel Serrat",
    "Carles Puyol",
    "Rosalia",
    "Jordi Evole",
    "Cesc Fàbregas",
    "Gemma Nierga",
    "Marc Márquez",
    "Kilian Jornet",
    "Mercè Rodoreda",
    "Pau Gasol",
    "Josep Guardiola"
  ]
}
```
- `paraules`: array de 15 strings (les paraules de joc)
- `pista`: descripció genèrica de la categoria (es mostrarà a la pantalla de debat)

---

### CAS B — Mode Lliure (IA Aleatòria)

L'usuari comença sense triar categoria. La IA genera 15 parelles independents (paraula + pista) sense relació temàtica entre elles.

**Petició:**
```json
{
  "dificultat": 4,
  "idioma": "català"
}
```
- No s'envia el camp `categoria`

**Resposta:**
```json
{
  "mode": "aleatori",
  "llistat": [
    { "paraula": "Telescopi",  "pista": "Instruments d'òptica o ciència" },
    { "paraula": "Formatge",   "pista": "Coses que es guarden a la nevera" },
    { "paraula": "Ximpanzé",   "pista": "Mamífers del regne animal" },
    { "paraula": "Pianista",   "pista": "Professions relacionades amb l'art" },
    { "paraula": "Teclat",     "pista": "Components d'ordinador" }
  ]
}
```
- `llistat`: array de 15 objectes `{ paraula: string; pista: string }`
- Cada element és independent temàticament dels altres

**Mecànica especial del Cas B:**
- L'impostor, en lloc de veure "IMPOSTOR", veu la **pista** (`pista`) de la paraula activa. Això li dona un avantatge parcial per intentar endevinar o dissimular, fent el joc viable.
- L'usuari pot activar/desactivar la opció de mostrar pista per al mode lliure des de la configuració.

---

### CAS C — Mode Ribes (Base de Dades Local)

Cap petició HTTP. El frontend llegeix directament:
```
src/assets/data/ribes.json
```

**Format del fitxer:**
```json
{
  "categoria": "Sant Pere de Ribes",
  "pista": "Cultura, entitats, llocs i folklore de Sant Pere de Ribes",
  "paraules": [
    "Puigmoltó",
    "Sota-ribes",
    "Les Parellades",
    "La Plana Novella",
    "El Garraf"
  ]
}
```
- Estructura idèntica a la resposta del Cas A

---

## 2. Models de Dades (TypeScript)

```typescript
// Els tres modes de joc
type ModusJoc = 'manual' | 'lliure' | 'ribes';

// Idiomes disponibles
type Idioma = 'català' | 'castellà' | 'anglès';

// Una paraula amb pista opcional (Cas B)
interface ParaulaAmbPista {
  paraula: string;
  pista: string;
}

// Resultat normalitzat d'API (el servei l'unifica internament)
interface LotParaules {
  categoria: string;
  pista: string;
  paraules: string[];          // Cas A i C
  llistat?: ParaulaAmbPista[]; // Cas B
}

// Configuració de la partida
interface ConfiguracioPartida {
  jugadors: string[];           // noms, mínim 2 (default 3 buits)
  nombreImpostors: number;      // validat: < meitat de jugadors
  modus: ModusJoc;
  // Opcions per Cas A i B:
  dificultat?: number;          // 1-10
  idioma?: Idioma;
  // Opcions per Cas A:
  categoria?: string;
  // Opcions per Cas B:
  mostrarPista?: boolean;       // si l'impostor veu la pista
  // Opcions globals:
  permetCanviarParaula?: boolean; // si es mostra el botó de "passar paraula"
}

// Rol assignat a un jugador
type Rol = 'jugador' | 'impostor';

// Jugador amb el seu rol per a la partida actual
interface JugadorPartida {
  nom: string;
  rol: Rol;
  paraula: string;  // la paraula real, "IMPOSTOR", o la pista si Cas B + impostor
  haVist: boolean;  // true un cop ha tancat el seu popup de revelació
}

// Estat global de la partida activa
interface EstatPartida {
  jugadors: JugadorPartida[];
  indexParaulaActual: number;   // índex dins de paraules[] o llistat[]
  lotParaules: LotParaules;
  canviParaulaDisponible: boolean;
  primerJugadorNormalHaVist: boolean;
}
```

---

## 3. Regles de Negoci

### 3.1 Jugadors i Impostors

- La partida s'inicia amb **3 jugadors buits** per defecte.
- Es poden afegir/eliminar jugadors fins a un **màxim de 20**.
- **Tots els jugadors han de tenir nom** per poder iniciar.
- **Validació d'impostors:** `nombreImpostors < Math.floor(nombreJugadors / 2)`
  - Exemples: 3 jugadors → màxim 1 impostor; 6 jugadors → màxim 2; 7 jugadors → màxim 3.

### 3.2 Assignació de Rols i Paraules

1. Es recupera el lot de 15 paraules de l'API (o del JSON local per al Cas C).
2. Es selecciona `paraules[indexParaulaActual]` com a paraula activa.
3. Es barregen aleatòriament els jugadors.
4. Els `nombreImpostors` primers reben rol `'impostor'`:
   - **Cas A i C:** la seva `paraula` = `"IMPOSTOR"`
   - **Cas B amb pista activada:** la seva `paraula` = `pista` de la paraula activa
   - **Cas B amb pista desactivada:** la seva `paraula` = `"IMPOSTOR"`
5. La resta reben rol `'jugador'` i `paraula` = la paraula real.

### 3.3 Lògica de "Canviar Paraula"

Condició prèvia: l'opció `permetCanviarParaula` ha d'estar activada a la configuració.

- El botó "No m'agrada, passar a la següent" **només és visible** al primer jugador no-impostor que revela el seu rol.
- Si aquest jugador prem el botó:
  - `indexParaulaActual++`
  - Es reassignen paraules amb la nova paraula activa.
  - El flux de revelació torna al primer jugador.
- El botó es **desactiva i desapareix permanentment** quan es compleix qualsevol d'aquestes condicions:
  - Un **segon** jugador (qualsevol) tanca el seu popup de revelació.
  - El **primer jugador en revelar és un impostor** (veu "IMPOSTOR" o la pista).

### 3.4 Revelació de Rols ("Tap i Revela")

- Els jugadors **no van per ordre estricte**: cada jugador revela quan fa clic al seu nom a la llista.
- La pantalla mostra el nom del jugador actiu en gran i un botó "Prem i mantén per veure el teu rol".
- Un cop el jugador tanca el seu popup, es marca `haVist = true`.
- **No es pot tornar a obrir** un popup tancat (evita trampes).
- La pantalla passa a la següent fase quan **tots** els jugadors han tancat el seu popup (`haVist === true`).

### 3.5 Selecció del Jugador Inicial (Anti-Impostor)

Un cop tots han vist el seu rol, es tria aleatòriament qui comença la ronda de descripcions:

- Els jugadors amb rol `'jugador'` tenen **pes 2**.
- Els jugadors amb rol `'impostor'` tenen **pes 1**.
- Es fa una selecció ponderada (els impostors tenen un **50% menys de probabilitat**).

```typescript
// Exemple d'implementació de selecció ponderada
function triarJugadorInicial(jugadors: JugadorPartida[]): JugadorPartida {
  const pesTotal = jugadors.reduce((acc, j) => acc + (j.rol === 'impostor' ? 1 : 2), 0);
  let aleatori = Math.random() * pesTotal;
  for (const j of jugadors) {
    aleatori -= j.rol === 'impostor' ? 1 : 2;
    if (aleatori <= 0) return j;
  }
  return jugadors[jugadors.length - 1];
}
```

---

## 4. Flux de Pantalles

L'app té **4 pantalles** gestionades internament pel `JocService` (sense navegació per rutes).

### Pantalla 1 — Configuració de la Partida

**Contingut:**
- Formulari dinàmic: llista d'inputs de text per als noms dels jugadors + botons d'afegir/eliminar jugador.
- Selector numèric d'impostors (amb validació visual en temps real).
- Selector de modalitat (3 opcions exclusives):
  - **Lliure:** slider dificultat (1-10), selector d'idioma, toggle "mostrar pista a l'impostor".
  - **Categoria Manual:** input de text per a la categoria, slider dificultat (1-10), selector d'idioma.
  - **Ribes:** sense camps addicionals.
- Toggle global: "Permetre canviar paraula".
- Botó **"Començar Joc"**: desactivat si falten noms, si hi ha noms duplicats, o si la validació d'impostors falla.

**Acció en prémer "Començar Joc":**
- Cas A/B: fa la petició `POST /api/paraules`.
- Cas C: llegeix `src/assets/data/ribes.json`.
- En rebre les dades: assigna rols, passa a Pantalla 2.

---

### Pantalla 2 — Repartiment de Rols

**Contingut:**
- Indicador: "Jugador X de Y han vist el seu rol" (X = `haVist === true`).
- Llista de tots els jugadors; cada nom és clicable.
- En clicar un nom (si `haVist === false`): mostra un popup/overlay a pantalla completa amb:
  - Nom del jugador en gran.
  - Botó "Prem i mantén per veure el teu rol" (hold) o clic directe per revelar.
  - Un cop revelat: mostra la paraula (o "IMPOSTOR" / pista) amb el format visual adequat.
  - Botó condicional "No m'agrada aquesta paraula" (visible sols si es compleixen les condicions de §3.3).
  - Botó "He entès el meu rol, tancar" → marca `haVist = true`, tanca l'overlay.
- En clicar un nom amb `haVist === true`: no fa res (rol ja vist, no es pot reobrir).

**Transició:** quan tots els jugadors tenen `haVist === true` → passa automàticament a Pantalla 3.

---

### Pantalla 3 — El Debat

**Contingut:**
- **Categoria** de la partida en gran al centre (el que saben tots).
- Nom del **jugador triat** per la lògica de probabilitat per iniciar (§3.5).
- Llistat de tots els jugadors actius (sense revelar rols).
- Botó destacat: **"Revelar Impostor i Paraula"** → passa a Pantalla 4.

---

### Pantalla 4 — Revelació Final

**Contingut:**
- Paraula secreta de la partida.
- Categoria i pista completa.
- Llista dels jugadors **Impostors** (format gràfic destacat, color vermell).
- Llista de la resta de jugadors **"Seguidors de la Paraula"**.
- Botó: **"Tornar a Jugar"** → torna a Pantalla 1 **mantenint la llista de noms** (estalvia haver de tornar a escriure-la).

---

## 5. Arquitectura Angular

### JocService (servei centralitzat)

```typescript
// Responsabilitats del JocService:
// - Emmagatzemar la configuració de la partida
// - Fer les crides HTTP al backend
// - Mantenir l'estat de la partida activa (jugadors, rols, índex de paraula)
// - Exposar signals per a cada peça d'estat
// - Gestionar les transicions entre pantalles
```

**Signals a exposar:**
```typescript
pantalla = signal<1 | 2 | 3 | 4>(1);
configuracio = signal<ConfiguracioPartida | null>(null);
estatPartida = signal<EstatPartida | null>(null);
carregant = signal<boolean>(false);
errorApi = signal<string | null>(null);
```

### Components per pantalla

```
joc-impostor/
  src/app/
    app.ts                         ← component arrel, llegeix pantalla()
    app.html
    components/
      configuracio/
        configuracio.ts
        configuracio.html
      repartiment/
        repartiment.ts
        repartiment.html
        popup-rol/
          popup-rol.ts
          popup-rol.html
      debat/
        debat.ts
        debat.html
      revelacio/
        revelacio.ts
        revelacio.html
    services/
      joc.service.ts
```

---

## 6. Directrius d'Estil Visual

- **Tema:** "Party Game" nocturn — interfície fosca, ambient de joc de taula.
- **Paleta:**
  - Fons: negre profund / porpra fosc (`#0f0a1e`, `#1a0f3c`)
  - Textos: blanc i gris clar
  - Accent principal: porpra/violeta (`#7c3aed`, `#a855f7`)
  - Impostor: vermell cridaner (`#dc2626`, `#ef4444`)
- **CSS:** Tailwind CSS per a tota la maquetació.
- **Responsive:** Mobile-first obligatori. El joc s'usa principalment en mòbil (es passa el telèfon entre jugadors).
- **Tipografia:** fonts grans i llegibles en la pantalla de revelació de rols (el jugador ha de veure el seu rol ràpidament sense fregar la pantalla innecessàriament).
- Les paraules dels **impostors** (text "IMPOSTOR" o la pista) s'han de mostrar en **vermell** amb un estil visualment diferent de les paraules normals.
