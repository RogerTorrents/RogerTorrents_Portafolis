# Sistema de Finestres i Barra de Tasques (Responsive OS)

## 1. Pantalla de Bloqueig (Lock Screen)
- Estat inicial de la web a tots els dispositius.
- Mostra l'hora en gran, fons de pantalla dinàmic i selector d'idioma (CA, ES, EN).
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
- **Esquerra:** Botó d'Inici (Menú Windows amb drets d'autor/crèdits del portafolis).
- **Centre:** Icones de les aplicacions obertes. Si l'aplicació està en primer pla, la icona es mostra ressaltada. Fent clic a la icona es minimitza o es restaura la finestra.
- **Dreta:** Àrea de notificació amb la data (DD/MM/AAAA) i l'hora en temps real (HH:MM) que s'actualitza cada minut.

### B) En Mòbil (Dock / Barra de Navegació Mòbil)
- Fixada a baix de tot, dissenyada per a un accés ràpid amb el polze.
- No mostra la data i hora (aquesta es mou a la barra superior d'estat del mòbil, si es desitja, o s'amaga).
- Mostra una barra d'aplicacions actives en format reduït (estil Dock de mòbil) o una fletxa/botó de "Tornar a l'inici" (Home Button) per minimitzar ràpidament el microservei que estigui obert a pantalla completa i tornar a veure les icones de l'escriptori.