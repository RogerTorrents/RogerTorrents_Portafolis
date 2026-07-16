# Context: Joc Impostor

## Descripció
Micro-aplicació del portafolis de Roger Torrents. [Afegir descripció detallada quan es defineixi el contingut.]

## Port de Desenvolupament
`http://localhost:4204`

## Execució
```bash
npm run start:joc-impostor
```

## Regles de Desenvolupament
- Llegir `context/os-shell/angular-rules.md` per normes Angular 22+
- Llegir `context/os-shell/global-styles.md` per variables CSS de l'OS
- Tot el codi, comentaris i logs en **Català**
- Prohibit `any`; tipat fort obligatori
- Usar Signals per a l'estat reactiu
- Components standalone; control flow modern (`@if` / `@for`)
- Prohibit hardcoding de text als HTML — usar `TranslationService`
