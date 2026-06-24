# Normes de Codi i Bones Pràctiques d'Angular 19+

## 1. Components Standalone (Obligatori)
- Tots els components nous s'han de generar com a `standalone: true` (comportament per defecte d'Angular 19+).
- Qualsevol directiva, component extern o pipe utilitzat a la plantilla HTML s'ha de declarar explícitament a l'array `imports: []` del decorador `@Component`.

## 2. Control de Flux Modern (Built-in Control Flow)
- **PROHIBIT** l'ús de directives antigues com `*ngIf`, `*ngFor` o `*ngSwitch` (ja que requereixen importar el `CommonModule`).
- S'ha de fer servir **sempre** la sintaxi moderna nativa d'Angular:
```html
  @if (condicio) {
    <!-- contingut -->
  } @else {
    <!-- alternatiu -->
  }

  @for (item of llista; track item.id) {
    <!-- bucle -->
  }