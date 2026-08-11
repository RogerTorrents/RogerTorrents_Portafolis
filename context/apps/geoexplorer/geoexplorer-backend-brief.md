# Encàrrec: crear el backend de GeoExplorer des de zero

Aquest document és **autocontingut**: conté tot el context necessari perquè una
IA sense accés a aquest repositori pugui dissenyar i implementar el backend
de GeoExplorer des de zero. No cal accedir a cap altre fitxer — tota la
informació rellevant del frontend ja existent hi és inclosa.

---

## 1. Què és GeoExplorer

Aplicació web de mapes de muntanya (Angular 22, ja construïda i funcionant).
Permet explorar punts d'interès (POIs) de senderisme — pics, refugis, rutes,
llacs i pàrquings — sobre un mapa Leaflet, amb filtres combinables i un
selector de regions (Catalunya / Pirineus / Sant Pere de Ribes-Garraf /
Montseny).

Té **tres modes d'accés**:

1. **Convidat** — veu el mapa amb els punts "oficials"/curats (predeterminats,
   iguals per a tothom).
2. **Usuari registrat, no autenticat encara** — pantalla de login/registre.
3. **Usuari autenticat** — a més del mapa oficial, té el seu **mapa personal**:
   pot crear categories pròpies (lliures, ex. "Llocs on he viatjat") i afegir-hi
   llocs fent clic al mapa.

## 2. Estat actual (què ja existeix, què falta)

El **frontend ja està implementat i funciona**, però **no hi ha cap backend
real**. Tot el que hauria de ser una API viu ara mateix com:

- Un **array estàtic en TypeScript** (`pois.data.ts`, inclòs sencer a la
  secció 6) que fa de "base de dades" de contingut oficial.
- **Dos serveis Angular que simulen backend amb `localStorage`** del
  navegador (`SessioService` i `ContingutPersonalService`, codi complet a la
  secció 5) — sense contrasenyes xifrades, sense tokens reals, purament per
  poder demostrar el flux complet (registre → login → mapa personal) sense
  dependre encara d'un servidor.

**La feina d'aquest encàrrec és construir el backend real que substitueixi
aquests dos punts**, exposant una API que el frontend Angular pugui consumir
amb `HttpClient`, sense haver de canviar la forma de les dades que ja fa
servir (els noms de camp en català s'han de respectar tal com estan definits
a la secció 6, per no haver de tocar el frontend més del necessari).

## 3. Decisió d'arquitectura: dues bases de dades

Es vol **persistència polièdrica** — cada tipus de dada a la base de dades
que li escau:

| Dada | Motor | Per què |
|---|---|---|
| `usuaris` (credencials, email, hash de contrasenya), sessions/refresh tokens | **SQL (PostgreSQL)** | Integritat referencial i transaccions ACID crítiques per a comptes i seguretat; esquema estable i conegut. |
| `pois` (contingut curat/oficial, migració de `pois.data.ts`) | **MongoDB** | Esquema variable segons `tipus` (és una unió discriminada, vegeu secció 6.1); cerques geoespacials natives (`2dsphere`). |
| `categories_personals`, `llocs_personals` (mapa de cada usuari) | **MongoDB** | Esquema lliure per definició — l'usuari inventa categories arbitràries; volum variable per usuari; geoespacial. |

`categories_personals` i `llocs_personals` referencien `usuariId`, que és
l'`id` (uuid) de l'usuari a PostgreSQL. **No és una foreign key real** (bases
de dades diferents) — la integritat s'ha de garantir a nivell d'aplicació
(l'API sempre valida que el recurs pertany a l'usuari del token JWT abans de
llegir/escriure).

## 4. Stack recomanat (es pot discutir, però és el punt de partida)

- **Node.js + NestJS** (TypeScript — consistent amb la resta de l'stack;
  estructura modular amb `Guard`s per autenticació, DTOs validats). Alternativa
  més lleugera acceptable: Express + Zod.
- **Prisma** com a ORM per a la part SQL (migracions versionades).
- **Mongoose** per a la part MongoDB (schemas + índexs geoespacials).
- **Autenticació:** `bcrypt` per al hash de contrasenyes (mai en clar, ni
  emmagatzemades ni als logs), JWT (access token de vida curta + refresh
  token) per a les sessions.
- **Validació:** DTOs (`class-validator` / `class-transformer` o `zod`) a
  totes les entrades públiques de l'API.
- **CORS:** restringit als orígens del frontend — en desenvolupament
  `http://localhost:4200` (Shell del portafolis, que incrusta GeoExplorer en
  un iframe) i `http://localhost:4205` (GeoExplorer standalone); en producció,
  els dominis reals corresponents.

## 5. Contracte que ha de complir l'API (substitueix aquests dos serveis)

Aquest és el codi **real i actual** dels dos serveis Angular que simulen el
backend. La nova API ha de permetre reescriure'ls perquué facin crides HTTP
en lloc de tocar `localStorage`, mantenint la mateixa superfície pública
(mateixos noms de mètode, mateixos signals exposats) perquè la resta de
components de l'app no s'hagin de tocar.

### 5.1 `SessioService` (a substituir per crides a `/auth/*`)

```typescript
import { Injectable, computed, signal } from '@angular/core';
import type { Usuari } from '../models/usuari.model';

export type PantallaSessio = 'entrada' | 'login' | 'registre' | 'app';

/**
 * Gestió de sessió i navegació entre pantalles d'accés (entrada / login /
 * registre / app).
 *
 * ⚠️ SIMULACIÓ 100% LOCAL (localStorage) — sense contrasenyes reals ni
 * xifrat. S'ha de substituir per crides HTTP a una API real amb hash de
 * contrasenyes (bcrypt) i tokens (JWT).
 */
@Injectable({ providedIn: 'root' })
export class SessioService {
  readonly pantalla = signal<PantallaSessio>('entrada');
  readonly usuari = signal<Usuari | null>(/* carregat de localStorage */ null);
  readonly errorSessio = signal<string | null>(null);

  readonly esConvidat = computed(() => this.pantalla() === 'app' && this.usuari() === null);
  readonly esAutenticat = computed(() => this.usuari() !== null);

  anarA(pantalla: PantallaSessio): void { /* ... */ }

  entrarComConvidat(): void {
    this.usuari.set(null);
    this.pantalla.set('app');
  }

  // Retorna `true` si l'operació té èxit; si falla, deixa un missatge a `errorSessio`.
  registrar(nom: string, email: string, contrasenya: string): boolean { /* ... */ }
  iniciarSessio(email: string, contrasenya: string): boolean { /* ... */ }

  tancarSessio(): void { /* ... */ }
}
```

**Usuari** (`models/usuari.model.ts`):

```typescript
export interface Usuari {
  readonly id: string;
  readonly nom: string;
  readonly email: string;
}
```

En la versió amb backend real, `registrar` i `iniciarSessio` hauran de passar
a ser **asíncrons** (`Promise<boolean>` o basats en signals amb estat de
càrrega), ja que faran una crida HTTP. Cal decidir si es manté la firma
booleana amb un `effect`/`resource` o s'exposa un `Observable`/`Promise`
directament — es deixa a criteri de qui implementi el backend + la
integració, però la resta de components (formularis de login/registre) ja
criden `sessio.iniciarSessio(...)` / `sessio.registrar(...)` de forma
"fire and forget" des d'un `(submit)` d'HTML, així que la interfície pública
ha de seguir sent còmoda de cridar des d'un formulari.

### 5.2 `ContingutPersonalService` (a substituir per crides a `/categories` i `/llocs`)

```typescript
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { SessioService } from './sessio.service';
import type { CategoriaPersonal } from '../models/categoria-personal.model';
import type { LlocPersonal } from '../models/lloc-personal.model';
import type { Coordenades } from '../models/poi.model';

/**
 * Mapa personal de l'usuari autenticat: categories pròpies i llocs propis
 * dins d'aquestes categories.
 *
 * ⚠️ Persistència local (localStorage, clau per `usuariId`) — s'ha de
 * substituir per una API REST sobre MongoDB.
 */
@Injectable({ providedIn: 'root' })
export class ContingutPersonalService {
  private readonly sessio = inject(SessioService);

  readonly categories = signal<CategoriaPersonal[]>([]);
  readonly llocs = signal<LlocPersonal[]>([]);
  readonly categoriesVisibles = signal<ReadonlySet<string>>(new Set());

  // Flux de "mode col·locació": l'usuari prem "+ Afegir lloc" d'una categoria,
  // després fa clic al mapa, i finalment omple nom+descripció.
  readonly categoriaEnColocacio = signal<string | null>(null);
  readonly coordenadesPendents = signal<Coordenades | null>(null);
  readonly enModeColocacio = computed(() => this.categoriaEnColocacio() !== null);

  readonly llocsVisibles = computed(() => {
    const visibles = this.categoriesVisibles();
    return this.llocs().filter(lloc => visibles.has(lloc.categoriaId));
  });

  constructor() {
    // Es recarrega automàticament quan canvia l'usuari (login/logout).
    effect(() => {
      const usuari = this.sessio.usuari();
      this.carregar(usuari?.id ?? null);
    });
  }

  crearCategoria(nom: string, color: string, icona: string): void { /* ... */ }
  eliminarCategoria(categoriaId: string): void { /* ... */ } // ha d'esborrar en cascada els llocs de la categoria
  alternarVisibilitatCategoria(categoriaId: string): void { /* ... (només estat local UI, no cal API) */ }

  iniciarColocacio(categoriaId: string): void { /* ... */ }
  cancelarColocacio(): void { /* ... */ }
  registrarClicMapa(coordenades: Coordenades): void { /* ... */ }
  crearLloc(nom: string, descripcio: string): void { /* ... */ }
  eliminarLloc(llocId: string): void { /* ... */ }

  private carregar(usuariId: string | null): void { /* GET /categories + GET /llocs */ }
  private desar(usuariId: string): void { /* substituir per POST/DELETE puntuals, no per un "desar-tot" */ }
}
```

## 6. Model de dades exacte (no inventar camps nous sense necessitat)

### 6.1 Contingut oficial/curat — `Poi`

Unió discriminada per `tipus`. **Aquesta ES la forma que ha de tenir cada
document a la col·lecció MongoDB `pois`** (adaptant `id` → `_id` si es vol,
però es recomana mantenir un camp `id` de tipus string per no trencar el
frontend, que ja fa servir `poi.id` com a string arreu):

```typescript
export type TipusPoi = 'pic' | 'refugi' | 'ruta' | 'llac' | 'parking';
export type Dificultat = 'facil' | 'mitjana' | 'dificil' | 'tecnica';
export type TipusRuta = 'circular' | 'anada-tornada';
export type Capacitat = 'baixa' | 'mitjana' | 'alta';
export type Servei = 'aigua' | 'menjar' | 'llits' | 'wc' | 'dutxa' | 'electricitat';
export type IdRegio = 'catalunya' | 'pirineus' | 'sant-pere-de-ribes' | 'montseny';

/** Coordenades [latitud, longitud] (format Leaflet — OJO: NO és [lng, lat] com GeoJSON). */
export type Coordenades = readonly [number, number];

interface PoiBase {
  readonly id: string;
  readonly nom: string;
  readonly regio: IdRegio;
  readonly coordenades: Coordenades;
  readonly descripcio: string;
  readonly imatges: readonly string[];
}

export interface PicPoi extends PoiBase {
  readonly tipus: 'pic';
  readonly altitud: number;
  readonly dificultat: Dificultat;
}

export interface RefugiPoi extends PoiBase {
  readonly tipus: 'refugi';
  readonly altitud: number;
  readonly guardat: boolean;
  readonly obert: boolean;
  readonly serveis: readonly Servei[];
  readonly telefon?: string;
}

export interface RutaPoi extends PoiBase {
  readonly tipus: 'ruta';
  readonly tipusRuta: TipusRuta;
  readonly dificultat: Dificultat;
  readonly desnivell: number;
  readonly distanciaKm: number;
  readonly gpxUrl: string | null;
}

export interface LlacPoi extends PoiBase {
  readonly tipus: 'llac';
  readonly altitud: number;
}

export interface ParkingPoi extends PoiBase {
  readonly tipus: 'parking';
  readonly gratuit: boolean;
  readonly capacitat: Capacitat;
}

export type Poi = PicPoi | RefugiPoi | RutaPoi | LlacPoi | ParkingPoi;
```

> **Nota important sobre coordenades:** al frontend, `Coordenades` és
> `[latitud, longitud]` (conveni Leaflet). GeoJSON fa servir
> `[longitud, latitud]`. Si es guarda com a `GeoJSON Point` a MongoDB per
> aprofitar l'índex `2dsphere`, **cal invertir l'ordre** en guardar/llegir, i
> la capa de l'API ha de tornar-ho a exposar com `[lat, lng]` cap al
> frontend perquè no calgui tocar el codi Angular existent.

### 6.2 Usuari

```typescript
export interface Usuari {
  readonly id: string;
  readonly nom: string;
  readonly email: string;
}
```
(A la base de dades, a més d'aquests camps públics, hi ha `password_hash` —
mai s'ha d'exposar a l'API cap enfora.)

### 6.3 Categoria personal

```typescript
export interface CategoriaPersonal {
  readonly id: string;
  readonly usuariId: string;
  readonly nom: string;
  readonly color: string;   // hex, ex. "#34d399"
  readonly icona: string;   // un caràcter/emoji, ex. "★"
}
```

Colors disponibles al selector del frontend (no cal validar-los estrictament
al backend, però és la llista que ofereix la UI):
`#34d399, #f59e0b, #f87171, #38bdf8, #a78bfa, #fb7185, #facc15`

Icones disponibles al selector: `★ ♥ ✈ ⛺ 📷 🍽 🚩`

### 6.4 Lloc personal

```typescript
export interface LlocPersonal {
  readonly id: string;
  readonly usuariId: string;
  readonly categoriaId: string;
  readonly nom: string;
  readonly coordenades: Coordenades; // [lat, lng]
  readonly descripcio: string;
}
```

### 6.5 Regions predefinides (per referència — NO calen a l'API, són estàtiques al frontend)

```typescript
export const REGIONS = [
  { id: 'catalunya', nomClau: 'regio_catalunya', centre: [41.8204, 1.6976], zoom: 8 },
  { id: 'pirineus', nomClau: 'regio_pirineus', centre: [42.5667, 1.0], zoom: 10 },
  { id: 'sant-pere-de-ribes', nomClau: 'regio_garraf', centre: [41.2612, 1.7712], zoom: 13 },
  { id: 'montseny', nomClau: 'regio_montseny', centre: [41.7658, 2.4356], zoom: 12 },
];
```

### 6.6 Dataset complet de POIs oficials (per fer el seed de MongoDB)

Aquest és el contingut **real i complet** que actualment viu a
`pois.data.ts` al frontend. L'endpoint `GET /pois` ha de retornar dades amb
exactament aquesta forma (26 POIs, 4 regions, els 5 tipus representats):

```typescript
export const POIS: readonly Poi[] = [
  // --- Pirineus ---
  { id: 'pic-pedraforca', tipus: 'pic', nom: 'Pedraforca', regio: 'pirineus', coordenades: [42.2427, 1.7019], altitud: 2506, dificultat: 'dificil', descripcio: 'Una de les muntanyes més emblemàtiques de Catalunya, formada per dos cims (Pollegó Superior i Inferior).', imatges: [] },
  { id: 'pic-puigmal', tipus: 'pic', nom: 'Puigmal', regio: 'pirineus', coordenades: [42.3733, 2.1097], altitud: 2910, dificultat: 'dificil', descripcio: 'Cim més alt de la comarca de la Cerdanya, amb vistes panoràmiques als dos vessants del Pirineu.', imatges: [] },
  { id: 'refugi-lluis-estasen', tipus: 'refugi', nom: 'Refugi Lluís Estasen', regio: 'pirineus', coordenades: [42.2461, 1.7132], altitud: 1640, guardat: true, obert: true, serveis: ['aigua', 'menjar', 'llits', 'wc'], telefon: '+34 938 220 156', descripcio: 'Refugi guardat als peus del Pedraforca, punt de partida habitual per a l\'ascensió.', imatges: [] },
  { id: 'refugi-ulldeter', tipus: 'refugi', nom: 'Refugi d\'Ulldeter', regio: 'pirineus', coordenades: [42.4106, 2.3492], altitud: 2220, guardat: true, obert: true, serveis: ['aigua', 'menjar', 'llits', 'wc', 'electricitat'], telefon: '+34 972 745 067', descripcio: 'Refugi al cor del Ripollès, a la capçalera de la vall del Ter, cantonada amb el GR-11.', imatges: [] },
  { id: 'llac-sant-maurici', tipus: 'llac', nom: 'Estany de Sant Maurici', regio: 'pirineus', coordenades: [42.5754, 0.9535], altitud: 1912, descripcio: 'Estany emblemàtic del Parc Nacional d\'Aigüestortes i Estany de Sant Maurici, amb els Encantats de fons.', imatges: [] },
  { id: 'ruta-cavalls-del-vent', tipus: 'ruta', nom: 'Cavalls del Vent', regio: 'pirineus', coordenades: [42.35, 2.13], tipusRuta: 'circular', dificultat: 'tecnica', desnivell: 1200, distanciaKm: 18, gpxUrl: null, descripcio: 'Etapa d\'alta muntanya del Cavalls del Vent, amb trams exposats i panoràmiques del Ripollès.', imatges: [] },
  { id: 'parking-pla-boavi', tipus: 'parking', nom: 'Pàrquing Pla de Boavi', regio: 'pirineus', coordenades: [42.4023, 2.3541], gratuit: true, capacitat: 'mitjana', descripcio: 'Àrea d\'aparcament d\'accés al refugi d\'Ulldeter i a la Vall de Ter.', imatges: [] },

  // --- Catalunya (general) ---
  { id: 'pic-montserrat-sant-jeroni', tipus: 'pic', nom: 'Sant Jeroni (Montserrat)', regio: 'catalunya', coordenades: [41.5931, 1.8125], altitud: 1236, dificultat: 'mitjana', descripcio: 'Cim més alt del massís de Montserrat, amb un dels miradors més coneguts de Catalunya.', imatges: [] },
  { id: 'refugi-vicenc-barbe', tipus: 'refugi', nom: 'Refugi Vicenç Barbé', regio: 'catalunya', coordenades: [41.5989, 1.8241], altitud: 1005, guardat: false, obert: true, serveis: ['wc'], descripcio: 'Refugi lliure de muntanya dins el massís de Montserrat.', imatges: [] },
  { id: 'ruta-cami-enamorats', tipus: 'ruta', nom: 'Camí dels Enamorats', regio: 'catalunya', coordenades: [41.5936, 1.8112], tipusRuta: 'circular', dificultat: 'facil', desnivell: 250, distanciaKm: 4.5, gpxUrl: null, descripcio: 'Passeig senzill entre agulles de conglomerat, ideal per a totes les edats.', imatges: [] },
  { id: 'parking-monestir-montserrat', tipus: 'parking', nom: 'Pàrquing del Monestir de Montserrat', regio: 'catalunya', coordenades: [41.5936, 1.8112], gratuit: false, capacitat: 'alta', descripcio: 'Pàrquing principal de pagament pròxim al monestir i a l\'estació del cremallera.', imatges: [] },
  { id: 'pic-puigsacalm', tipus: 'pic', nom: 'Puigsacalm', regio: 'catalunya', coordenades: [42.1231, 2.3939], altitud: 1515, dificultat: 'mitjana', descripcio: 'Cim més alt de la Garrotxa, amb vistes sobre la Vall d\'en Bas i el Ripollès.', imatges: [] },

  // --- Sant Pere de Ribes / Garraf ---
  { id: 'parking-can-suria', tipus: 'parking', nom: 'Pàrquing Can Súria', regio: 'sant-pere-de-ribes', coordenades: [41.2612, 1.7712], gratuit: true, capacitat: 'mitjana', descripcio: 'Punt d\'accés habitual al massís del Garraf des de Sant Pere de Ribes.', imatges: [] },
  { id: 'pic-ermita-trinitat', tipus: 'pic', nom: 'Ermita de la Trinitat', regio: 'sant-pere-de-ribes', coordenades: [41.2495, 1.7825], altitud: 337, dificultat: 'facil', descripcio: 'Mirador i ermita sobre Sitges, amb vistes al litoral del Garraf.', imatges: [] },
  { id: 'refugi-muntanyenc-garraf', tipus: 'refugi', nom: 'Refugi Muntanyenc Sant Jordi', regio: 'sant-pere-de-ribes', coordenades: [41.29, 1.75], altitud: 250, guardat: false, obert: true, serveis: ['wc'], descripcio: 'Refugi lliure de petita capacitat al massís del Garraf.', imatges: [] },
  { id: 'ruta-gr92-garraf', tipus: 'ruta', nom: 'GR-92 — Tram del Garraf', regio: 'sant-pere-de-ribes', coordenades: [41.26, 1.78], tipusRuta: 'circular', dificultat: 'mitjana', desnivell: 350, distanciaKm: 12, gpxUrl: null, descripcio: 'Tram costaner del GR-92 pel massís del Garraf, entre pinedes i penya-segats.', imatges: [] },
  { id: 'ruta-vall-bitlles', tipus: 'ruta', nom: 'Vall de Bitlles', regio: 'sant-pere-de-ribes', coordenades: [41.27, 1.79], tipusRuta: 'anada-tornada', dificultat: 'facil', desnivell: 180, distanciaKm: 8, gpxUrl: null, descripcio: 'Itinerari familiar per una de les valls seques més conegudes del Garraf.', imatges: [] },
  { id: 'llac-embassament-foix', tipus: 'llac', nom: 'Embassament de Foix', regio: 'sant-pere-de-ribes', coordenades: [41.278, 1.706], altitud: 100, descripcio: 'Embassament al peu del Garraf, punt d\'observació d\'ocells aquàtics.', imatges: [] },
  { id: 'parking-vallcarca', tipus: 'parking', nom: 'Pàrquing de Vallcarca', regio: 'sant-pere-de-ribes', coordenades: [41.279, 1.771], gratuit: true, capacitat: 'baixa', descripcio: 'Petita àrea d\'aparcament vora l\'antiga fàbrica de ciment de Vallcarca.', imatges: [] },

  // --- Montseny ---
  { id: 'pic-turo-home', tipus: 'pic', nom: 'Turó de l\'Home', regio: 'montseny', coordenades: [41.7733, 2.4356], altitud: 1706, dificultat: 'mitjana', descripcio: 'Cim més alt del massís del Montseny, amb un antic radar militar a la cimera.', imatges: [] },
  { id: 'pic-matagalls', tipus: 'pic', nom: 'Matagalls', regio: 'montseny', coordenades: [41.8064, 2.4394], altitud: 1697, dificultat: 'mitjana', descripcio: 'Segon cim més alt del Montseny, punt de trobada de nombroses rutes senyalitzades.', imatges: [] },
  { id: 'refugi-matagalls', tipus: 'refugi', nom: 'Refugi de Matagalls', regio: 'montseny', coordenades: [41.804, 2.44], altitud: 1600, guardat: true, obert: true, serveis: ['aigua', 'wc'], telefon: '+34 938 473 020', descripcio: 'Refugi guardat molt proper al cim de Matagalls, gestionat pel Centre Excursionista.', imatges: [] },
  { id: 'llac-santa-fe', tipus: 'llac', nom: 'Bassa de Santa Fe', regio: 'montseny', coordenades: [41.7936, 2.4453], altitud: 1130, descripcio: 'Petita bassa dins la fageda de Santa Fe, punt de partida de moltes rutes del Montseny.', imatges: [] },
  { id: 'parking-santa-fe', tipus: 'parking', nom: 'Pàrquing de Santa Fe del Montseny', regio: 'montseny', coordenades: [41.7936, 2.4453], gratuit: true, capacitat: 'mitjana', descripcio: 'Pàrquing principal de la vall de Santa Fe, punt de sortida cap al Turó de l\'Home.', imatges: [] },
  { id: 'ruta-turo-home-santafe', tipus: 'ruta', nom: 'Turó de l\'Home des de Santa Fe', regio: 'montseny', coordenades: [41.7936, 2.4453], tipusRuta: 'circular', dificultat: 'mitjana', desnivell: 600, distanciaKm: 10, gpxUrl: null, descripcio: 'Clàssica pujada al sostre del Montseny des de la vall de Santa Fe, per pistes i corriols.', imatges: [] },
];
```

## 7. Esquema de base de dades proposat

**PostgreSQL — taula `usuaris`**
```
id            uuid PK  (gen_random_uuid())
nom           text      not null
email         text      unique, not null
password_hash text      not null   -- bcrypt, mai contrasenya en clar
creat_el      timestamptz default now()
```
(Opcional: taula `refresh_tokens` si es vol poder revocar sessions
individualment, en lloc de refresh tokens purament stateless.)

**MongoDB — col·lecció `pois`** — un document per cada `Poi` de la secció 6.6,
amb `coordenades` guardat com `GeoJSON Point` (`{ type: 'Point', coordinates:
[lng, lat] }`, recordant l'ordre invertit) + índex `2dsphere`. Camp `tipus`
com a discriminador; la resta de camps depenen del `tipus` tal com defineix
la unió de la secció 6.1.

**MongoDB — col·lecció `categories_personals`**
```
_id         ObjectId
usuariId    string    (uuid de PostgreSQL)
nom         string
color       string
icona       string
```

**MongoDB — col·lecció `llocs_personals`**
```
_id           ObjectId
usuariId      string
categoriaId   ObjectId (ref categories_personals._id)
nom           string
coordenades   GeoJSON Point  (índex 2dsphere)
descripcio    string
```

## 8. Endpoints necessaris

```
POST   /auth/registre     { nom, email, contrasenya } → { usuari, accessToken, refreshToken }
POST   /auth/login        { email, contrasenya }      → { usuari, accessToken, refreshToken }
POST   /auth/refresh      { refreshToken }             → { accessToken }
POST   /auth/logout       (invalida el refresh token)

GET    /pois               públic — llista completa o filtrada per ?regio=...
                            (substitueix per complet el `pois.data.ts` estàtic)

GET    /categories         privat (JWT) — categories de l'usuari autenticat
POST   /categories         privat  { nom, color, icona }
DELETE /categories/:id     privat  (esborra en cascada els llocs de la categoria)

GET    /llocs?categoriaId=... privat
POST   /llocs               privat  { categoriaId, nom, coordenades: [lat, lng], descripcio }
DELETE /llocs/:id           privat
```

Totes les rutes privades han de validar amb un `Guard`/middleware JWT que
`usuariId` del recurs sol·licitat/creat coincideixi amb l'usuari del token —
mai confiar en un `usuariId` enviat pel client al body.

**Codis d'error esperats** pel frontend (perquè `errorSessio` mostri
missatges coherents amb els que ja genera la simulació local):
- Registre amb email ja existent → `409 Conflict`.
- Login amb credencials incorrectes → `401 Unauthorized`.
- Accés a `/categories` o `/llocs` sense token vàlid → `401 Unauthorized`.
- Accés/esborrat d'un recurs d'un altre usuari → `403 Forbidden`.

## 9. Passos d'implementació suggerits

1. Crear un projecte backend nou, independent del monorepo Angular (per
   exemple `geoexplorer-api/`), inicialitzar NestJS.
2. `docker-compose.yml` amb serveis `postgres`, `mongo` i `api`; `.env` amb
   les cadenes de connexió (mai comitejat a git).
3. Esquema Prisma per `usuaris` + `prisma migrate dev`.
4. Schemas Mongoose per `pois`, `categories_personals`, `llocs_personals`
   (índex `2dsphere` a `coordenades`).
5. Mòdul `auth`: registre/login amb `bcrypt`, emissió de JWT, `Guard` per
   protegir rutes privades.
6. Mòdul `pois`: endpoint públic de lectura + script de seed que carrega el
   dataset complet de la secció 6.6 a MongoDB.
7. Mòduls `categories` i `llocs`: CRUD protegit per JWT amb la validació de
   propietat descrita a la secció 8.
8. Proves manuals de tot el flux amb curl/Postman abans d'integrar-ho al
   frontend.
9. CORS restringit als orígens indicats a la secció 4.
10. Documentar l'API (OpenAPI/Swagger amb `@nestjs/swagger` és fàcil d'afegir
    a NestJS i molt recomanable).

## 10. Fora d'abast d'aquest encàrrec (no cal implementar-ho ara)

- Pujada/parsing de fitxers GPX reals (`gpxUrl` de `RutaPoi` és sempre `null`
  actualment).
- Rutes personals amb traça (`GeoJSON LineString`) — de moment els usuaris
  només poden crear punts (`LlocPersonal`), no rutes senceres.
- Emmagatzematge d'imatges (el camp `imatges` és sempre `[]`).
- Estat obert/tancat de refugis en temps real des d'una font externa.

---

**Resum en una frase per a qui rep aquest document:** cal construir una API
REST (NestJS recomanat) amb PostgreSQL per a usuaris/autenticació i MongoDB
per al contingut geoespacial (POIs oficials + categories i llocs personals),
seguint exactament els models de dades i el contracte de mètodes descrits
aquí, perquè pugui substituir les simulacions locals (`localStorage`) que
actualment fan `SessioService` i `ContingutPersonalService` al frontend
Angular sense haver de canviar la resta de l'aplicació.
