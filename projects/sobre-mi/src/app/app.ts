import {
  Component,
  signal,
  computed,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { TraduccionService } from './services/traduccions.service';
import type { Idioma } from './services/traduccions.service';

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

interface TarjetaPersonal {
  readonly titolKey: string;
  readonly textKey: string;
  readonly emoji: string;
  readonly color: 'cyan' | 'orange' | 'purple' | 'green';
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
    { id: 'sec-exp',  num: '01', labelKey: 'experiencia_titol' },
    { id: 'sec-form', num: '02', labelKey: 'formacio_titol'    },
    { id: 'sec-hab',  num: '03', labelKey: 'habilitats_titol'  },
    { id: 'sec-per',  num: '04', labelKey: 'personal_titol'    },
    { id: 'sec-cont', num: '05', labelKey: 'contacte_titol'    },
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
    { nomKey: 'cat_frontend', color: 'cyan', items: ['Angular', 'TypeScript', 'HTML / CSS', 'React', 'Figma'] },
    { nomKey: 'cat_backend', color: 'orange', items: ['Java', 'Spring Boot', 'Python', 'SQL', 'MongoDB', 'Postman'] },
    { nomKey: 'cat_devops', color: 'purple', items: ['Cloud Azure', 'Git / GitHub', 'VS Code', 'IntelliJ'] },
    { nomKey: 'cat_altres', color: 'green', items: ['Agents d\'IA', 'Prompt Engineering', 'Scrum', 'Draw.io'] },
  ];

  protected readonly educacio: readonly EducacioItem[] = [
    { id: 'edu1', titolKey: 'edu1_titol', instKey: 'edu1_inst', datesKey: 'edu1_dates', enCurs: true,  imgSrc: 'assets/educaci%C3%B3/uoc.png',           color: 'cyan'   },
    { id: 'edu2', titolKey: 'edu2_titol', instKey: 'edu2_inst', datesKey: 'edu2_dates', enCurs: false, imgSrc: 'assets/educaci%C3%B3/merce.png',          color: 'purple' },
    { id: 'edu3', titolKey: 'edu3_titol', instKey: 'edu3_inst', datesKey: 'edu3_dates', enCurs: false, imgSrc: 'assets/educaci%C3%B3/montgros.png.png',   color: 'green'  },
  ];

  protected readonly targetesPesonals: readonly TarjetaPersonal[] = [
    { titolKey: 'muntanya_titol', textKey: 'muntanya_text', emoji: '⛰', color: 'green' },
    { titolKey: 'futbol_titol', textKey: 'futbol_text', emoji: '⚽', color: 'orange' },
    { titolKey: 'ribes_titol', textKey: 'ribes_text', emoji: '🏔', color: 'cyan' },
    { titolKey: 'esplai_titol', textKey: 'esplai_text', emoji: '🏕', color: 'purple' },
  ];

  protected readonly idiomesDisponibles: readonly Idioma[] = ['ca', 'es', 'en'];

  constructor(protected readonly ts: TraduccionService) {}

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

  protected setIdioma(idioma: Idioma): void {
    this.ts.setIdioma(idioma);
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
