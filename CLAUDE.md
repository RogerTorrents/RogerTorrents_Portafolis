# RogerTorrents Portafolis - Windows OS Theme (Monorepo)

## Core Architecture
- **Framework:** Angular 19+ (Workspace)
- **Primary Language:** Catalan (Variables, comments, and code naming conventions must be in Catalan).
- **Internationalization (i18n):** Multi-language UI support (Catalan, Spanish, English). All hardcoded text must use the translation service.

## Project Structure & Context Mapping
Quan treballis en aquest projecte, has de llegir obligatòriament els fitxers de context específics guardats a la carpeta `.context/` segons la zona que estiguis tocant:

### 1. El Sistema General (Shell / OS)
- **Codi:** `src/` (Pantalla de bloqueig, Escriptori, Taskbar, Gestor de finestres).
- **Context de lògica:** `.context/os-shell/windows-system.md` (Comportament d'escriptori i mòbil).
- **Context d'estils generals:** `.context/os-shell/global-styles.md` (Colors de Windows, fons, gestió de `z-index` actius).

### 2. Microserveis / Aplicacions Internes
Cada aplicació viu a `projects/` i té el seu propi disseny visual i lògica independent:

- **Sobre Mi:**
  - Codi: `projects/sobre-mi/`
  - Context: `.context/apps/sobre-mi/sobre-mi.md` i `sobre-mi-styles.md`
- **Contactar:**
  - Codi: `projects/contactar/`
  - Context: `.context/apps/contactar/contactar.md` i `contactar-styles.md`
- **Habilitats:**
  - Codi: `projects/habilitats/`
  - Context: `.context/apps/habilitats/habilitats.md` i `habilitats-styles.md`

## Development Rules
- **IMPORTANT:** Abans de modificar el codi d'una carpeta, obre i llegeix els fitxers `.md` de la seva carpeta de context corresponent per mantenir la coherència visual i funcional.
- **NORMES D'ANGULAR:** Segueix estrictament les instruccions de sintaxi moderna descrites a `.context/os-shell/angular-rules.md` (ús de `@if`, `@for` i configuració de components Standalone).
- Use semantic HTML and CSS variables for OS styling.