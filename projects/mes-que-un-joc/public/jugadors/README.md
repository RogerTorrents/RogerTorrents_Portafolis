# Fotos de jugadors

Aquesta carpeta és on s'han d'afegir les fotos reals dels jugadors. No cal
tocar cap fitxer de codi: n'hi ha prou de deixar-hi la imatge amb el nom
exacte de l'`id` del jugador (el mateix que a `src/app/data/jugadors.data.ts`).

**Nom del fitxer:** `<id-del-jugador>.jpg` — sempre `.jpg` (si la foto
original és `.png` o `.webp`, cal convertir-la o simplement renombrar-la
amb l'extensió `.jpg`, els navegadors no la validen pel contingut). Es fa
servir només una extensió a propòsit: provar-ne diverses (`.jpg`, `.png`...)
en cadena generaria una petició de xarxa fallida (404) per cada extensió no
trobada i per cada jugador sense foto encara, cosa que embruta la consola
del navegador sense cap benefici real.

**Si no hi ha foto:** l'app mostra automàticament un avatar il·lustrat de
reserva (inicials sobre un degradat blaugrana), així que es pot anar
afegint fotos de mica en mica sense que res quedi trencat.

**Mida recomanada:** quadrada (ex. 300×300px), retallada a la cara/bust,
JPG amb compressió ~80% — pesa poc i es veu nítida a totes les mides
(2rem a les llistes, fins a 6rem a la fitxa de jugador).

## Llista completa d'ids (71 jugadors)

```
cruyff, migueli, julio-alberto, zubizarreta, koeman, laudrup, stoichkov,
guardiola, bakero, begiristain, amor, ferrer, eusebio, salinas, romario,
luis-enrique, figo, rivaldo, kluivert, carles-busquets, sergi-barjuan,
abelardo, nadal, ronaldo-nazario, puyol, xavi, valdes, ronaldinho, etoo,
deco, marquez, iniesta, henry, messi, pique, busquets, alves, belletti,
van-bronckhorst, abidal, ibrahimovic, pedro-rodriguez, adriano, mascherano,
umtiti, villa, fabregas, alexis, alba, neymar, suarez, rakitic, ter-stegen,
sergi-roberto, dembele, vidal, griezmann, de-jong, ansu-fati, pedri, gavi,
araujo, lewandowski, raphinha, balde, kounde, cubarsi, yamal, fermin,
inigo-martinez, dani-olmo
```

## Per què fitxers locals i no un enllaç de Google Drive

Es va valorar explícitament penjar les fotos a Drive i enllaçar-les, però
els fitxers locals guanyen clarament en rendiment i fiabilitat:

- **Drive no és un CDN.** Els enllaços "compartits" de Drive no estan
  pensats per servir imatges en calent (*hotlinking*) — sovint passen per
  una pàgina intermèdia d'avís de virus en fitxers grans, apliquen límits
  de peticions per IP i no envien capçaleres de *cache* pensades per a web.
- **Salt de xarxa extra.** Un fitxer local es serveix des del mateix origen
  que la resta de l'app (mateix domini, sense handshake TLS ni DNS extra),
  així que carrega abans i es pot precarregar/cachejar amb la resta del
  bundle.
- **Fiabilitat.** Si algun dia canvien els permisos d'una carpeta de Drive
  o es mou un fitxer, l'enllaç trenca silenciosament. Un fitxer dins del
  propi projecte és permanent i versionat amb la resta del codi.
