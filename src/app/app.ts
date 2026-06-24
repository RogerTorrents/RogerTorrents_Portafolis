import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LockScreen } from './components/lock-screen/lock-screen';
import { Desktop } from './components/desktop/desktop';
import { Taskbar } from './components/taskbar/taskbar';
import { WindowWrapper } from './components/window-wrapper/window-wrapper';
import { TranslationService } from './services/translation.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LockScreen, Desktop, Taskbar, WindowWrapper],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('RogerTorrents-portafolis');
  protected readonly lock = signal(true);

  constructor(private readonly ts: TranslationService) {}

  protected unlock(): void {
    this.lock.set(false);
  }
}
