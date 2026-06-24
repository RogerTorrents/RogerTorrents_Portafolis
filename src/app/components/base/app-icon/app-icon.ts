import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-icon',
  standalone: true,
  templateUrl: './app-icon.html',
  styleUrls: ['./app-icon.css']
})
export class AppIcon {
  @Input() app: any;
}
