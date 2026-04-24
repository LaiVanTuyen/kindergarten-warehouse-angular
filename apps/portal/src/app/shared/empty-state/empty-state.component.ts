import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';

/**
 * Generic empty-state block used across the portal. Two ways to render the
 * illustration:
 *   - Pass `icon="ph ph-heart-break"` (Phosphor icon class) — preferred, fast.
 *   - Pass `imageSrc` (URL or asset path) — kept for backward compatibility.
 *
 * The CTA can either emit an event (`(action)`) or link to a route
 * (`actionRoute`). Never both — if both are supplied `actionRoute` wins.
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './empty-state.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  @Input() title = '';
  @Input() message = '';
  /** Phosphor icon class, e.g. `ph ph-heart-break` or `ph-fill ph-paw-print`. */
  @Input() icon = '';
  /** Legacy: image URL. If both icon and imageSrc are set, icon wins. */
  @Input() imageSrc = '';
  @Input() actionLabel = '';
  @Input() actionIcon = '';
  /** Route to navigate to when the CTA is clicked. If absent, emits `(action)`. */
  @Input() actionRoute: string | (string | number)[] | null = null;
  /** Visual tone of the illustration background. */
  @Input() tone: 'pink' | 'amber' | 'sky' | 'neutral' = 'pink';
  /** Compact variant: smaller icon + tighter spacing (use inside a card). */
  @Input() compact = false;

  @Output() action = new EventEmitter<void>();
}
