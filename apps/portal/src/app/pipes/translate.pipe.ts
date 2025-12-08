import { Pipe, PipeTransform, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { TranslationService } from '@kindergarten-warehouse/data-access';
import { Subscription } from 'rxjs';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // Impure to trigger updates when language changes
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private translationService = inject(TranslationService);
  private cdr = inject(ChangeDetectorRef);
  private sub: Subscription;
  private lastValue = '';
  private lastKey = '';

  constructor() {
    this.sub = this.translationService.currentLang$.subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  transform(key: string): string {
    return this.translationService.translate(key);
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}
