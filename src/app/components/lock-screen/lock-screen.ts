import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-lock-screen',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './lock-screen.html',
  styleUrls: ['./lock-screen.css']
})
export class LockScreen implements OnInit {
  @Output() unlock = new EventEmitter<void>();
  time = new Date();

  constructor(public ts: TranslationService) {}

  ngOnInit(): void {
    setInterval(() => (this.time = new Date()), 1000);
  }

  onUnlock(): void {
    this.unlock.emit();
  }
}
