# Estils Globals del Sistema Operatiu (Windows Theme)

## 1. Variables CSS Recomanades (A definir a styles.css de l'arrel)
- `--os-taskbar-bg`: Color de fons de la barra de tasques (Ex: gris clàssic `#c0c0c0` o modern translúcid).
- `--os-window-bg`: Color de fons de les finestres flotants (`#ffffff`).
- `--os-desktop-bg`: Color o fons de pantalla de l'escriptori.
- `--os-font-family`: Tipografia estil sistema operatiu (Ex: `Segoe UI`, `Tahoma`, o un estil Pixelat si és retro).

## 2. Gestió de Capes (Z-Index Layers)
Per evitar que les finestres es barregin incorrectament, s'ha de seguir estretament aquest esquema de `z-index`:
- `z-index: 10` -> Fons de l'escriptori i icones.
- `z-index: 100` a `500` -> Finestres flotants obertes. La finestra activa (amb focus) rebrà dinàmicament el `z-index` més alt a través del `WindowManagerService`.
- `z-index: 1000` -> Barra de tasques inferior (Taskbar). Sempre per sobre de les finestres maximitzades.
- `z-index: 2000` -> Pantalla de bloqueig (Lock Screen) al principi de tot.

## 3. Disseny dels Microserveis
- Cada aplicació dins de `projects/` pot tenir els seus propis fitxers `.css/.scss` independents per definir el seu contingut (per exemple, la app `sobre-mi` pot simular una terminal de comandes en blanc i negre, mentre que `contactar` simula un formulari clàssic).
- Les finestres genèriques (`window-wrapper`) només posen el "marc" de Windows (vora, ombra i botons de tancar/minimitzar); el contingut de dins és exclusiu de cada microservei.