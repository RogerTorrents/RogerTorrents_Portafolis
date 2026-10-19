import {
  Component,
  signal,
  computed,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  HostListener,
  ChangeDetectionStrategy,
} from '@angular/core';
import { TraduccionService } from './services/traduccions.service';

interface HabilitatCategoria {
  readonly nomKey: string;
  readonly color: 'cyan' | 'orange' | 'purple' | 'green';
  readonly items: readonly string[];
}

interface EducacioItem {
  readonly id: string;
  readonly titolKey: string;
  readonly instKey: string;
  readonly datesKey: string;
  readonly enCurs: boolean;
  readonly imgSrc: string;
  readonly color: 'cyan' | 'orange' | 'purple' | 'green';
}

interface ElementMapa {
  readonly id: string;
  readonly titolKey: string;
  readonly textKey: string;
  readonly fotoCaptionKey: string;
  readonly imgSrc: string;
  readonly fotoSrc: string;
  readonly color: 'cyan' | 'orange' | 'purple' | 'green';
  /** Posició i mida en % respecte el mapa, mesurades sobre "com ha de quedar.png". */
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements AfterViewInit, OnDestroy {
  @ViewChild('contenidor') private readonly contenidor!: ElementRef<HTMLElement>;
  @ViewChild('hero') private readonly hero!: ElementRef<HTMLElement>;

  private readonly scrollPos = signal(0);
  private observer!: IntersectionObserver;
  private navObserver!: IntersectionObserver;
  private autoScrolled = false;

  protected readonly seccioActiva = signal<string>('');

  protected readonly opacityNav = computed(() => {
    const scroll = this.scrollPos();
    const h = window.innerHeight || 600;
    return Math.min(1, Math.max(0, (scroll - h * 2) / (h * 0.4)));
  });

  protected readonly navSections: readonly { readonly id: string; readonly num: string; readonly labelKey: string }[] = [
    { id: 'sec-exp', num: '01', labelKey: 'experiencia_titol' },
    { id: 'sec-form', num: '02', labelKey: 'formacio_titol' },
    { id: 'sec-hab', num: '03', labelKey: 'habilitats_titol' },
    { id: 'sec-per', num: '04', labelKey: 'personal_titol' },
    { id: 'sec-cont', num: '05', labelKey: 'contacte_titol' },
  ];

  protected readonly translateIntro = computed(() => {
    const scroll = this.scrollPos();
    const h = window.innerHeight || 600;
    const progress = Math.min(1, Math.max(0, scroll / (h * 2)));
    return `translateX(-${progress * 115}%)`;
  });

  protected readonly opacitySubtitol = computed(() => {
    const progress = Math.min(1, this.scrollPos() / ((window.innerHeight || 600) * 0.6));
    return Math.max(0, 1 - progress * 2);
  });

  protected readonly mostrarScrollHint = computed(() => this.scrollPos() < 60);

  protected readonly job1BulletKeys: readonly string[] = [
    'job1_b0', 'job1_b1', 'job1_b2', 'job1_b3', 'job1_b4', 'job1_b5',
  ];

  protected readonly habilitats: readonly HabilitatCategoria[] = [
    {
      nomKey: 'cat_frontend',
      color: 'cyan',
      items: ['Angular', 'TypeScript', 'React', 'HTML / CSS', 'Figma']
    },
    {
      nomKey: 'cat_backend',
      color: 'orange',
      items: ['Java', 'Spring Boot', 'Python', 'SQL', 'MongoDB', 'Postman']
    },
    {
      nomKey: 'cat_devops',
      color: 'purple',
      items: ['Cloud Azure', 'Git / GitHub', 'Scrum', 'Draw.io', 'VS Code', 'IntelliJ']
    },
    {
      nomKey: 'cat_ia_genai',
      color: 'green',
      items: [
        'Agents d\'IA',
        'Model Context Protocol (MCP)',
        'Claude Code',
        'Microsoft Copilot',
        'Prompt Engineering'
      ]
    }
  ];

  protected readonly educacio: readonly EducacioItem[] = [
    { id: 'edu1', titolKey: 'edu1_titol', instKey: 'edu1_inst', datesKey: 'edu1_dates', enCurs: true, imgSrc: 'assets/educaci%C3%B3/uoc.png', color: 'cyan' },
    { id: 'edu2', titolKey: 'edu2_titol', instKey: 'edu2_inst', datesKey: 'edu2_dates', enCurs: false, imgSrc: 'assets/educaci%C3%B3/merce.png', color: 'purple' },
    { id: 'edu3', titolKey: 'edu3_titol', instKey: 'edu3_inst', datesKey: 'edu3_dates', enCurs: false, imgSrc: 'assets/educaci%C3%B3/montgros.png.png', color: 'green' },
  ];

  private static readonly CAMI_MAPA = 'assets/fora%20del%20teclat/recortades/';
  private static readonly CAMI_FOTOS = 'assets/fora%20del%20teclat/fotos/';

  protected readonly elementsMapa: readonly ElementMapa[] = [
    {
      id: 'montanya', titolKey: 'montanya_titol', textKey: 'montanya_text', fotoCaptionKey: 'montanya_foto',
      imgSrc: App.CAMI_MAPA + 'montanya.png', fotoSrc: App.CAMI_FOTOS + 'montanya.jpg', color: 'green',
      left: 13.54, top: 19.00, width: 48.8, height: 26.1,
    },
    {
      id: 'ribes', titolKey: 'ribes_titol', textKey: 'ribes_text', fotoCaptionKey: 'ribes_foto',
      imgSrc: App.CAMI_MAPA + 'castell.png', fotoSrc: App.CAMI_FOTOS + 'ribes.jpg', color: 'orange',
      left: 63.2, top: 24.06, width: 24.8, height: 15.1,
    },
    {
      id: 'futbol', titolKey: 'futbol_titol', textKey: 'futbol_text', fotoCaptionKey: 'futbol_foto',
      imgSrc: App.CAMI_MAPA + 'futbol.png', fotoSrc: App.CAMI_FOTOS + 'futbol.jpg', color: 'purple',
      left: 37.07, top: 63.54, width: 29, height: 17.1,
    },
    {
      id: 'avio', titolKey: 'avio_titol', textKey: 'avio_text', fotoCaptionKey: 'avio_foto',
      imgSrc: App.CAMI_MAPA + 'avio.png', fotoSrc: App.CAMI_FOTOS + 'viatjar.jpg', color: 'cyan',
      left: 61.07, top: 0.86, width: 21.99, height: 11.07,
    },
    {
      id: 'bici', titolKey: 'bici_titol', textKey: 'bici_text', fotoCaptionKey: 'bici_foto',
      imgSrc: App.CAMI_MAPA + 'bici.png', fotoSrc: App.CAMI_FOTOS + 'bici.jpg', color: 'cyan',
      left: 5.27, top: 42.84, width: 8.54, height: 7.81,
    },
    {
      id: 'menjar', titolKey: 'menjar_titol', textKey: 'menjar_text', fotoCaptionKey: 'menjar_foto',
      imgSrc: App.CAMI_MAPA + 'menjar.png', fotoSrc: App.CAMI_FOTOS + 'menjar.jpg', color: 'green',
      left: 14.20, top: 70.91, width: 8, height: 9.3,
    },
    {
      id: 'esplai', titolKey: 'esplai_titol', textKey: 'esplai_text', fotoCaptionKey: 'esplai_foto',
      imgSrc: App.CAMI_MAPA + 'esplai.png', fotoSrc: App.CAMI_FOTOS + 'esplai.jpg', color: 'purple',
      left: 77.50, top: 63.50, width: 12.5, height: 10.1,
    },
  ];

  protected readonly elementSeleccionat = signal<ElementMapa | null>(null);

  constructor(protected readonly ts: TraduccionService) { }

  @HostListener('document:keydown.escape')
  protected tancarPopup(): void {
    this.elementSeleccionat.set(null);
  }

  protected seleccionarElement(element: ElementMapa): void {
    this.elementSeleccionat.set(
      this.elementSeleccionat()?.id === element.id ? null : element,
    );
  }

  ngAfterViewInit(): void {
    this.initScrollReveal();
    this.initNavObserver();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.navObserver?.disconnect();
  }

  protected onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const top = el.scrollTop;
    this.scrollPos.set(top);

    const h = window.innerHeight || 600;
    if (!this.autoScrolled && top > h * 1.5) {
      this.autoScrolled = true;
      const heroTop = top + this.hero.nativeElement.getBoundingClientRect().top
        - el.getBoundingClientRect().top;
      el.scrollTo({ top: heroTop, behavior: 'smooth' });
    }
    if (top < h * 0.4) this.autoScrolled = false;

    if (el.scrollHeight - top - el.clientHeight < 80) {
      this.seccioActiva.set('sec-cont');
    }
  }

  protected scrollToSection(id: string): void {
    const contenidor = this.contenidor.nativeElement;
    const target = contenidor.querySelector(`#${id}`) as HTMLElement | null;
    if (!target) return;
    const top = contenidor.scrollTop
      + target.getBoundingClientRect().top
      - contenidor.getBoundingClientRect().top;
    contenidor.scrollTo({ top, behavior: 'smooth' });
  }

  private initNavObserver(): void {
    this.navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) this.seccioActiva.set(entry.target.id);
        });
      },
      {
        root: this.contenidor.nativeElement,
        rootMargin: '-25% 0px -65% 0px',
        threshold: 0,
      },
    );
    this.navSections.forEach(({ id }) => {
      const el = this.contenidor.nativeElement.querySelector(`#${id}`);
      if (el) this.navObserver.observe(el);
    });
  }

  private initScrollReveal(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add('revealed');
            this.observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    );

    this.contenidor.nativeElement
      .querySelectorAll('.reveal')
      .forEach(el => this.observer.observe(el));
  }
}
