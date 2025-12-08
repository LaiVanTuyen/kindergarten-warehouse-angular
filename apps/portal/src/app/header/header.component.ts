import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { TranslationService, Lang } from '@kindergarten-warehouse/data-access';
import { TranslatePipe } from '../pipes/translate.pipe';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './header.component.html',
  styles: [],
})
export class HeaderComponent {
  private router = inject(Router);
  translationService = inject(TranslationService);

  onSearch(term: string) {
    this.router.navigate(['/resources'], {
      queryParams: { search: term || null },
      queryParamsHandling: 'merge',
    });
  }

  setLang(lang: Lang) {
    this.translationService.setLanguage(lang);
  }
}
