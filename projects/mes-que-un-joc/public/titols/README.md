# Imatges dels títols

Igual que a `public/jugadors/`, aquí es deixen les imatges (petites,
estil escut/insígnia del títol) que es mostren al costat de cada títol al
joc "Endevina els títols". Si no hi ha imatge, es mostra una icona de
trofeu de reserva — l'app no es trenca mentre no hi hagi cap fitxer.

**Nom del fitxer:** `<id-del-titol>.png` — sempre `.png` (millor que `.jpg`
per a escuts/insígnies amb fons transparent).

**Mida recomanada:** quadrada, ~64×64px, fons transparent.

## Els 6 ids exactes

```
lliga.png
copa.png
supercopa_espanya.png
champions.png
supercopa_europa.png
mundial_clubs.png
```

Corresponen a: Lliga, Copa del Rei, Supercopa d'Espanya, Champions League,
Supercopa d'Europa i Mundial de Clubs (`src/app/models/titol.model.ts`).
