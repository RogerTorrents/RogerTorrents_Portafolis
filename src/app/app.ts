import { Component, signal, HostListener, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LockScreen } from './components/lock-screen/lock-screen';
import { Desktop } from './components/desktop/desktop';
import { Taskbar } from './components/taskbar/taskbar';
import { WindowWrapper } from './components/window-wrapper/window-wrapper';
import { FonsDepantalla } from './components/fons-depantalla/fons-depantalla';
import { VoronoiFons } from './components/voronoi-fons/voronoi-fons';
import { TranslationService } from './services/translation.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LockScreen, Desktop, Taskbar, WindowWrapper, FonsDepantalla, VoronoiFons],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('RogerTorrents-portafolis');
  protected readonly lock = signal(true);

  constructor(readonly ts: TranslationService) {}

  ngOnInit(): void {
    window.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('gesturestart', this.onGesture, { passive: false } as any);
    window.addEventListener('gesturechange', this.onGesture, { passive: false } as any);
  }

  ngOnDestroy(): void {
    window.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('gesturestart', this.onGesture);
    window.removeEventListener('gesturechange', this.onGesture);
  }

  protected unlock(): void {
    this.lock.set(false);
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(ev: KeyboardEvent): void {
    if ((ev.ctrlKey || ev.metaKey) && (ev.key === '+' || ev.key === '-' || ev.key === '=' || ev.key === '0')) {
      ev.preventDefault();
    }
  }

  private onWheel = (ev: WheelEvent): void => {
    if (ev.ctrlKey) ev.preventDefault();
  };

  private onGesture = (ev: Event): void => {
    ev.preventDefault();
  };
}
