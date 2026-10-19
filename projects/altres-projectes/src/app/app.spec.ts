import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { PROJECTES } from './data/projectes.data';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('mostra una targeta per projecte', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelector('h1')?.textContent).toContain('Altres projectes');
    expect(html.querySelectorAll('app-targeta-projecte').length).toBe(PROJECTES.length);
  });

  it('obre l\'emprovador amb "Provar-la aquí" i el tanca', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const html = fixture.nativeElement as HTMLElement;

    html.querySelector<HTMLButtonElement>('app-targeta-projecte .boto--linia')?.click();
    await fixture.whenStable();
    expect(html.querySelector('app-emprovador .nom')?.textContent).toContain(PROJECTES[0].nom);

    html.querySelector<HTMLButtonElement>('app-emprovador .tancar')?.click();
    await fixture.whenStable();
    expect(html.querySelector('app-emprovador')).toBeNull();
  });
});
