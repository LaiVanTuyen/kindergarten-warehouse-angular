import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './empty-state.component.html',
  styles: [],
})
export class EmptyStateComponent {
  @Input() title = '';
  @Input() message = '';
  @Input() imageSrc = '';
  @Input() actionLabel = '';

  @Output() action = new EventEmitter<void>();
}
