import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-component',
  standalone: true,
  templateUrl: './app-component.html',
  styleUrls: ['./app-component.css']
})
export class AppComponent {
  @Input() appInfo: any;
}
