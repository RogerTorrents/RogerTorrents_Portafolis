import { TestBed } from '@angular/core/testing';
import { App } from './app';

// jsdom no implementa `IntersectionObserver` (animacions en entrar a la vista).
beforeAll(() => {
  globalThis.IntersectionObserver ??= class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  } as unknown as typeof IntersectionObserver;
});

describe('Sobre mi', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
  });

  it('mostra les seccions i el mapa "Fora del teclat"', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const html = fixture.nativeElement as HTMLElement;
    for (const id of ['sec-exp', 'sec-form', 'sec-hab', 'sec-per', 'sec-cont']) {
      expect(html.querySelector(`#${id}`)).not.toBeNull();
    }
    expect(html.querySelectorAll('.sm-mapa__item').length).toBe(7);
  });
});
