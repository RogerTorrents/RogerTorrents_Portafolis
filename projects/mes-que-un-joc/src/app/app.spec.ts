import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('Més que un joc', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
  });

  it('arrenca directament al menú principal', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelector('app-menu-principal')).not.toBeNull();
    expect(html.querySelector('h1')?.textContent).toContain('Més que un joc');
  });
});
