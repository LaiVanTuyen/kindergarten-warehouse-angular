import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-skeleton.component.html',
  styles: [],
})
export class LoadingSkeletonComponent {
  @Input() type: 'card' | 'list' | 'text' = 'card';
  @Input() count = 1;

  counter(i: number) {
    return new Array(i);
  }
}
