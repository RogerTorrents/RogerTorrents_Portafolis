import { Component, signal, HostListener, OnInit, OnDestroy, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../environments/environment';
import { LockScreen } from './components/lock-screen/lock-screen';
import { Desktop } from './components/desktop/desktop';
import { Taskbar } from './components/taskbar/taskbar';
import { WindowWrapper } from './components/window-wrapper/window-wrapper';
import { FonsDepantalla } from './components/fons-depantalla/fons-depantalla';
import { VoronoiFons } from './components/voronoi-fons/voronoi-fons';
import { Linkedin } from './components/linkedin/linkedin';
import { Legal } from './components/legal/legal';
import { TranslationService } from './services/translation.service';
import { WindowManagerService } from './services/window-manager.service';

@Component({
  selector: 'app-root',
  imports: [LockScreen, Desktop, Taskbar, WindowWrapper, FonsDepantalla, VoronoiFons, Linkedin, Legal],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly lock = signal(true);

  /** Alçada disponible per a una finestra que ha d'ocupar tota la vertical
   *  sense maximitzar-se (deixa l'espai de la taskbar). */
  protected readonly alturaFinestraCompleta = window.innerHeight - 40;

  /** URL de cada micro-app per entorn (localhost en dev, dominis HTTPS en prod).
   *  Venen de config pròpia, no de l'usuari, per això es poden marcar com a segures. */
  protected readonly urlsApps: Readonly<Record<string, SafeResourceUrl>> = (() => {
    const sanejador = inject(DomSanitizer);
    return Object.fromEntries(
      Object.entries(environment.appsUrls).map(([id, url]) => [id, sanejador.bypassSecurityTrustResourceUrl(url)]),
    );
  })();

  /** Orígens de les micro-apps: només elles poden demanar al Shell que obri una finestra. */
  private readonly originsApps = new Set(Object.values(environment.appsUrls).map(url => new URL(url).origin));

  constructor(readonly ts: TranslationService, readonly wm: WindowManagerService) {}

  ngOnInit(): void {
    window.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('message', this.onMissatgeApp);
    // Safari (iOS) fa zoom amb el gest de pinça encara que el viewport ho prohibeixi.
    window.addEventListener('gesturestart', this.onGesture, { passive: false });
    window.addEventListener('gesturechange', this.onGesture, { passive: false });
  }

  ngOnDestroy(): void {
    window.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('message', this.onMissatgeApp);
    window.removeEventListener('gesturestart', this.onGesture);
    window.removeEventListener('gesturechange', this.onGesture);
  }

  /** Una micro-app (p. ex. el formulari de registre) demana obrir la finestra
   *  de privacitat: `{ origen: 'os-app', tipus: 'obrir-legal' }`. Es valida
   *  l'origen perquè cap web externa pugui manipular el Shell. */
  private readonly onMissatgeApp = (ev: MessageEvent): void => {
    if (!this.originsApps.has(ev.origin) || this.lock()) return;
    const dades = ev.data as { origen?: unknown; tipus?: unknown } | null;
    if (dades?.origen === 'os-app' && dades.tipus === 'obrir-legal') {
      this.wm.openWindow('legal', this.ts.t('app_legal'), '⚖️');
    }
  };

  protected unlock(): void {
    this.lock.set(false);
  }

  protected bloquejar(): void {
    this.lock.set(true);
  }

  /** Cada iframe arrenca amb l'idioma per defecte: se li envia el del Shell en carregar-se. */
  protected onIframeCarregada(ev: Event): void {
    this.ts.enviarIdiomaA(ev.target as HTMLIFrameElement);
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(ev: KeyboardEvent): void {
    if ((ev.ctrlKey || ev.metaKey) && (ev.key === '+' || ev.key === '-' || ev.key === '=' || ev.key === '0')) {
      ev.preventDefault();
    }
  }

  /** El zoom del navegador (Ctrl + roda o tecles) es desactiva: cada finestra té el seu. */
  private onWheel = (ev: WheelEvent): void => {
    if (ev.ctrlKey) ev.preventDefault();
  };

  private onGesture = (ev: Event): void => {
    ev.preventDefault();
  };
}
