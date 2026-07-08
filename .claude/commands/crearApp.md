Crea una nova micro-aplicació Angular al monorepo seguint l'arquitectura existent del projecte.

**Nom de l'aplicació:** $ARGUMENTS

Llegeix primer `CLAUDE.md`, `package.json`, `src/app/app.html`, `src/app/components/desktop/desktop.ts` i `src/app/services/translation.service.ts` per entendre l'estat actual del projecte abans de fer cap canvi.

---

## Pas 1: Calcular el port i preparar els noms

Llegeix `package.json` i busca tots els scripts `start:*` que continguin `--port`. El port més alt actual és el punt de partida; assigna **PORT = màxim + 1**.

A partir de `$ARGUMENTS`, deriva:
- **APP_ID**: kebab-case en minúscules (espais → guions, caràcters especials eliminats). Exemples: "Nova App" → `nova-app`, "Projectes" → `projectes`.
- **NOM_DISPLAY**: El nom original tal com l'ha escrit l'usuari.
- **CLAU_TRAD**: `app_` + APP_ID amb guions → underscores. Exemple: `app_nova_app`.
- **CLAU_PLACEHOLDER**: `placeholder_` + APP_ID amb guions → underscores. Exemple: `placeholder_nova_app`.

---

## Pas 2: Generar el projecte Angular

Executa a la terminal des de l'arrel del workspace:

```bash
ng generate application APP_ID --routing --style=css
```

Espera que el comando acabi completament abans de continuar.

---

## Pas 3: Actualitzar `package.json`

1. Afegeix el nou script individual: `"start:APP_ID": "ng serve APP_ID --port PORT"`
2. Modifica el script `"start:all"` per incloure `"ng serve APP_ID --port PORT"` al `concurrently`, seguint el format i ordre dels scripts existents.

---

## Pas 4: Actualitzar `src/app/components/desktop/desktop.ts`

Afegeix la nova entrada al **final** de l'array `appDefs` (just abans del `]`). Escull un emoji adequat al nom de l'aplicació:

```typescript
{ id: 'APP_ID', nameKey: 'CLAU_TRAD', icon: 'EMOJI_ADEQUAT', showInDesktop: true },
```

El signal `posicionsIcones` s'actualitza automàticament via `reduce` sobre `appDefs`; no cal modificar-lo.

---

## Pas 5: Actualitzar `src/app/app.html`

Afegeix un nou `<app-window-wrapper>` just **abans** de `<router-outlet />`:

```html
<app-window-wrapper id="APP_ID" [title]="ts.t('CLAU_TRAD')">
  <div class="app-placeholder">
    <p>{{ ts.t('CLAU_PLACEHOLDER') }}</p>
  </div>
</app-window-wrapper>
```

---

## Pas 6: Actualitzar `src/app/services/translation.service.ts`

Afegeix les claus als tres idiomes dins del diccionari `dict`. Per a cada idioma (`ca`, `es`, `en`), insereix les noves entrades seguint el patró existent:

**Català (`ca`):**
```
CLAU_TRAD: 'NOM_DISPLAY',
CLAU_PLACEHOLDER: 'Aquí anirà tot el contingut de NOM_DISPLAY.',
```

**Castellà (`es`):**
```
CLAU_TRAD: 'NOM_DISPLAY_ES',
CLAU_PLACEHOLDER: 'Aquí irá todo el contenido de NOM_DISPLAY.',
```

**Anglès (`en`):**
```
CLAU_TRAD: 'NOM_DISPLAY_EN',
CLAU_PLACEHOLDER: 'Here will go all the NOM_DISPLAY content.',
```

---

## Pas 7: Crear el fitxer de context

Crea `context/apps/APP_ID/APP_ID.md` amb el contingut:

```markdown
# Context: NOM_DISPLAY

## Descripció
Micro-aplicació del portafolis de Roger Torrents. [Afegir descripció detallada quan es defineixi el contingut.]

## Port de Desenvolupament
`http://localhost:PORT`

## Execució
\`\`\`bash
npm run start:APP_ID
\`\`\`

## Regles de Desenvolupament
- Llegir `context/os-shell/angular-rules.md` per normes Angular 22+
- Llegir `context/os-shell/global-styles.md` per variables CSS de l'OS
- Tot el codi, comentaris i logs en **Català**
- Prohibit `any`; tipat fort obligatori
- Usar Signals per a l'estat reactiu
- Components standalone; control flow modern (`@if` / `@for`)
- Prohibit hardcoding de text als HTML — usar `TranslationService`
```

---

## Pas 8: Actualitzar `CLAUDE.md`

Fes tres modificacions:

**1.** Al diagrama d'arquitectura, afegeix la nova línia al bloc dels microserveis:
```
  └── APP_ID ──────> Port PORT
```

**2.** A la secció "Scripts d'Execució", afegeix a la llista de `start:all`:
```
  - `APP_ID` -> `http://localhost:PORT`
```

**3.** A la secció "Mapa de Contextos Obligatoris", afegeix:
```
- **NOM_DISPLAY:** Llegir `context/apps/APP_ID/APP_ID.md`
```

---

## Resum final

Mostra un resum amb:
- **App ID:** APP_ID
- **Port:** PORT
- **Fitxers generats pel CLI:** `projects/APP_ID/` (via `ng generate`)
- **Fitxers modificats:** `package.json`, `desktop.ts`, `app.html`, `translation.service.ts`, `CLAUDE.md`
- **Fitxers creats manualment:** `context/apps/APP_ID/APP_ID.md`
- **Arrencar la nova app:** `npm run start:APP_ID`
- **Arrencar tot el monorepo:** `npm run start:all`
