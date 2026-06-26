import { Component } from '@angular/core';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-linkedin',
  standalone: true,
  templateUrl: './linkedin.html',
  styleUrl: './linkedin.css',
})
export class Linkedin {
  readonly urlPerfil = 'https://www.linkedin.com/in/roger-torrents-gabalda-855b05267/';

  constructor(readonly ts: TranslationService) {}

  obrirPerfil(): void {
    window.open(this.urlPerfil, '_blank', 'noopener,noreferrer');
  }
}
