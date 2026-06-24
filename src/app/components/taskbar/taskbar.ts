
import { Component, computed, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { WindowManagerService } from '../../services/window-manager.service';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-taskbar',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './taskbar.html',
  styleUrls: ['./taskbar.css']
})
export class Taskbar implements OnInit {
  // Simulació d'ajustos del sistema; més endavant es pot exposar via servei
  settings = signal({ wifiEnabled: true, isMute: false });

  // rellotge
  time = signal(new Date());

  // llista de finestres visibles i ordenades per z
  openWindows = computed(() => {
    const f = this.wm.finestres();
    return Object.values(f)
      .filter(w => w.visible || w.state === 'minimized')
      .sort((a, b) => a.z - b.z);
  });

  constructor(private readonly wm: WindowManagerService, private readonly ts: TranslationService) {}

  ngOnInit(): void {
    setInterval(() => this.time.set(new Date()), 1000);
  }

  // Toggle d'una finestra: si està activa la minimitza, si no l'obre/restaura i la porta al davant
  toggleWindow(id: string) {
    const w = this.wm.getWindowSignal(id)();
    if (!w) return;
    if (w.visible && w.active) {
      this.wm.minimizeWindow(id);
    } else {
      this.wm.openWindow(id);
    }
  }

  showStart() {
    console.log('Start menu');
  }
}
