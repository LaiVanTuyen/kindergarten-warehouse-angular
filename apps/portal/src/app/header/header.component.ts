import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  AuthService,
  FavoritesService,
  Lang,
  TranslationService,
} from '@kindergarten-warehouse/data-access';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit {
  // Services ---------------------------------------------------------------
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly favorites = inject(FavoritesService);
  private readonly eRef = inject(ElementRef<HTMLElement>);
  readonly translationService = inject(TranslationService);

  // Reactive user state ----------------------------------------------------
  readonly currentUser = this.authService.currentUser;
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly isTeacher = this.authService.isTeacher;
  readonly favoriteCount = this.favorites.count;

  readonly userName = computed(() => this.currentUser()?.fullName ?? '');
  readonly userAvatar = computed(() =>
    this.authService.formatAssetUrl(this.currentUser()?.avatarUrl)
  );
  readonly userInitials = computed<string>(() => {
    const name = this.currentUser()?.fullName?.trim();
    if (!name) return 'ME';
    const [first = '', second = ''] = name.split(/\s+/);
    return (second ? first[0] + second[0] : first.slice(0, 2)).toUpperCase();
  });

  // UI state (local) -------------------------------------------------------
  readonly isMobileMenuOpen = signal(false);
  readonly isUserMenuOpen = signal(false);
  readonly searchQuery = signal('');

  // Debounced search -------------------------------------------------------
  private readonly searchInput$ = new Subject<string>();

  ngOnInit(): void {
    this.searchInput$
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntilDestroyed()
      )
      .subscribe((term) => this.runSearch(term));
  }

  // Search -----------------------------------------------------------------
  onSearchInput(term: string): void {
    this.searchQuery.set(term);
    this.searchInput$.next(term);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.searchInput$.next('');
  }

  private runSearch(term: string): void {
    this.router.navigate(['/resources'], {
      queryParams: { search: term || null },
      queryParamsHandling: 'merge',
    });
  }

  // Menus ------------------------------------------------------------------
  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen.update((v) => !v);
  }

  closeUserMenu(): void {
    this.isUserMenuOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: Event): void {
    if (!this.eRef.nativeElement.contains(event.target as Node)) {
      this.closeUserMenu();
      this.closeMobileMenu();
    }
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    this.closeUserMenu();
    this.closeMobileMenu();
  }

  // Language / auth --------------------------------------------------------
  setLang(lang: Lang): void {
    this.translationService.setLanguage(lang);
  }

  logout(): void {
    this.closeUserMenu();
    this.authService.logout('Hẹn gặp lại bạn! 👋');
  }
}
