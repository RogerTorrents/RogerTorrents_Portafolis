import { Component } from '@angular/core';

@Component({
  selector: 'app-loading',
  standalone: true,
  template: `<div class="loading">Loading…</div>`,
  styles: ['.loading{color:var(--color-white);padding:1rem}']
})
export class Loading {}
