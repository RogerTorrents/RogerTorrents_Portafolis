import { registerLocaleData } from '@angular/common';
import localeCa from '@angular/common/locales/ca';
import { TestBed } from '@angular/core/testing';
import { App } from './app';

registerLocaleData(localeCa);

// jsdom no implementa `matchMedia`, que fan servir els serveis de dispositiu.
beforeAll(() => {
  window.matchMedia ??= (query: string) =>
    ({ matches: false, media: query, addEventListener: () => undefined, removeEventListener: () => undefined }) as unknown as MediaQueryList;
});

describe('Shell', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
  });

  it('arrenca a la pantalla de bloqueig', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelector('app-lock-screen')).not.toBeNull();
    expect(html.querySelector('app-desktop')).toBeNull();
  });
});
