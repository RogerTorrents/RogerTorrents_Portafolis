import { Component, EventEmitter, Output, OnInit, OnDestroy, HostListener, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslationService, Idioma } from '../../services/translation.service';

@Component({
  selector: 'app-lock-screen',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './lock-screen.html',
  styleUrls: ['./lock-screen.css']
})
export class LockScreen implements OnInit, OnDestroy {
  @Output() unlock = new EventEmitter<void>();
  time = new Date();
  private timerId: any;

  idiomes: { codi: Idioma; nom: string }[] = [
    { codi: 'ca', nom: 'CAT' },
    { codi: 'es', nom: 'ESP' },
    { codi: 'en', nom: 'ENG' },
  ];

  readonly dateFmt = computed(() => {
    const fmts: Record<Idioma, string> = {
      ca: "EEEE, d MMMM 'de' yyyy",
      es: "EEEE, d 'de' MMMM 'de' yyyy",
      en: 'EEEE, MMMM d, yyyy',
    };
    return fmts[this.ts.idioma()];
  });

  constructor(public ts: TranslationService) {}

  ngOnInit(): void {
    this.timerId = setInterval(() => (this.time = new Date()), 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.timerId);
  }

  @HostListener('window:keydown')
  onKeydown(): void {
    this.onUnlock();
  }

  onUnlock(): void {
    this.unlock.emit();
  }

  canviarIdioma(codi: Idioma, ev: Event): void {
    ev.stopPropagation();
    this.ts.setLang(codi);
  }
}
