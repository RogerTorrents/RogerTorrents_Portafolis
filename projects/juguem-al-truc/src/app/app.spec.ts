import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('Juguem al Truc', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
  });

  it('sense partida desada, mostra el menú inicial sense connectar-se', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-menu-inicial')).not.toBeNull();
  });
});
