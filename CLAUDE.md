# 💻 SYSTEM CONTEXT: RogerTorrents Portafolis (Monorepo Workspace)

Actua com un **Desenvolupador Senior Expert en Angular**. Totes les arquitectures, refactoritzacions i fitxers nous han de seguir de manera estricta els estàndards de clean code, tipat fort (prohibit l'ús d' `any`), alt rendiment i les regles internes definides en aquest directori de context.

---

## 🏗️ Arquitectura del Projecte (Monorepo Angular)

L'ecosistema està dissenyat com un Sistema Operatiu modular on la Web Core engloba micro-aplicacions independents:

[ Root Workspace ]
├── src/ ─────────────────> Aplicació "Shell" (OS Core - Port 4200)
└── projects/ ────────────> Microserveis / Apps independents
  ├── sobre-mi ───────> Port 4201
  ├── habilitats ─────> Port 4202
  ├── contactar ──────> Port 4203
  └── joc-impostor ──────> Port 4204


### 1. El Sistema General (Shell / OS Core)
- **Ubicació:** `src/`
- **Funció:** És el nucli principal de la web. Renderitza la interfície base com si fos un ordinador operatiu: Pantalla de bloqueig, Escriptori, Menú d'Inici, Taskbar i el gestor dinàmic de finestres. Inclou algunes utilitats molt simples de l'OS.

### 2. Microserveis / Aplicacions Internes
- **Ubicació:** `projects/`
- **Funció:** Són les aplicacions completes que s'executen de manera encapsulada i independent dins del contenidor de finestres (`window-wrapper`) proporcionat pel Shell.

---

## ⚙️ Scripts d'Execució & Stack (package.json)

- **Angular Core:** Versió 22+ (Amb dependències experimentals/futures).
- **Primary Language:** Català ⚠️ (Variables, comentaris de codi, logs i documentació han d'estar estrictament en Català).
- **Internationalization (i18n):** Multiidioma (CA, ES, EN). Estrictament prohibit fer hardcoding de text als HTML; s'ha d'injectar mitjançant el servei de traduccions.

### Ordres CLI:
- `npm run start`: Aixeca únicament l'entorn Shell (Port 4200).
- `npm run start:all`: Execució paral·lela de tot el monorepo mitjançant `concurrently`. Els ports assignats són estàtics i obligatoris:
  - `sobre-mi` -> `http://localhost:4201`
  - `habilitats` -> `http://localhost:4202`
  - `contactar` -> `http://localhost:4203`
  - `joc-impostor` -> `http://localhost:4204`

---

## 🗺️ Mapa de Contextos Obligatoris (.context/)

⚠️ **REGLA D'OR:** Abans de generar, tocar o alterar qualsevol línia de codi d'una ruta específica, has d'obrir i llegir obligatòriament els fitxers `.md` declarats en aquesta matriu per garantir la coherència del sistema:

### 1. Per a tasques de Lògica de l'OS, Taskbar o Finestres:
- 👉 Llegir `.context/os-shell/windows-system.md` *(Regles d'Escriptori vs Mòbil, focus, interaccions de les finestres).*

### 2. Per a disseny, maquetació o layout visual general:
- 👉 Llegir `.context/os-shell/global-styles.md` *(Variables CSS de l'OS, gestió i límits del sistema de capes `z-index`).*

### 3. Per a qualsevol desenvolupament o fitxer d'Angular:
- 👉 Llegir `.context/os-shell/angular-rules.md` *(Ús obligatori de components Standalone, Control Flow modern `@if`/`@for` i reactivitat amb Signals).*

### 4. Per a desenvolupaments dins dels Microserveis (`projects/`):
- **Sobre Mi:** Llegir `.context/apps/sobre-mi/sobre-mi.md` i `sobre-mi-styles.md`
- **Habilitats:** Llegir `.context/apps/habilitats/habilitats.md` i `habilitats-styles.md`
- **Contactar:** Llegir `.context/apps/contactar/contactar.md` i `contactar-styles.md`
- **Joc Impostor:** Llegir `context/apps/joc-impostor/joc-impostor.md`

---

## 🛠️ Comandos Personalitzats Claude Code

### `/crearApp "nom de l'aplicació"`
Crea una nova micro-aplicació Angular completa al monorepo. Executa tots els passos automàticament:
- Calcula el proper port disponible (seguint la seqüència 4201, 4202...)
- Genera l'estructura completa de fitxers a `projects/<id>/`
- Registra el projecte a `angular.json` i `package.json`
- Afegeix la icona a l'escriptori (`desktop.ts`) i la finestra al Shell (`app.html`)
- Afegeix les traduccions CA/ES/EN a `translation.service.ts`
- Crea el fitxer de context a `context/apps/<id>/<id>.md`
- Actualitza aquest `CLAUDE.md`

**Exemple d'ús:** `/crearApp "Projectes"` → crea l'app `projectes` al port 4205.

---

## 🦾 Flux de Treball per a la IA

Quan rebis una petició:
1. **Identifica el focus de la tasca** (És al Shell? És a un microservei? És pur estilitzat?).
2. **Llegeix de forma invisible els fitxers de context mapejats** a la secció anterior.
3. **Aplica el rol de desenvolupador senior** per oferir solucions modulars, optimitzades i completament adaptades a la sintaxi d'Angular 22 i els requisits de disseny de Windows descrits.