import { Component, Input } from '@angular/core';

export interface AppEscriptori {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
}

@Component({
  selector: 'app-icon',
  standalone: true,
  templateUrl: './app-icon.html',
  styleUrls: ['./app-icon.css']
})
export class AppIcon {
  @Input({ required: true }) app!: AppEscriptori;
}
