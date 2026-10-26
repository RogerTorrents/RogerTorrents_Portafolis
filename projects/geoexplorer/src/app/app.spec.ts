import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { App } from './app';

// jsdom no implementa `matchMedia` ni la Web Animations API.
beforeAll(() => {
  Element.prototype.animate ??= () => ({ finished: Promise.resolve(), cancel: () => undefined }) as unknown as Animation;
  window.matchMedia ??= (query: string) =>
    ({ matches: false, media: query, addEventListener: () => undefined, removeEventListener: () => undefined }) as unknown as MediaQueryList;
});

describe('GeoExplorer', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it("sense sessió desada, arrenca a la pantalla d'entrada", async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-pantalla-entrada')).not.toBeNull();
  });
});
