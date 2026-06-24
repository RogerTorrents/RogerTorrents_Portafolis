import { Component } from '@angular/core';

@Component({
  selector: 'app-calendar-overlay',
  standalone: true,
  templateUrl: './calendar-overlay.html',
  styleUrls: ['./calendar-overlay.css']
})
export class CalendarOverlay {
  today = new Date().toLocaleDateString();
}
