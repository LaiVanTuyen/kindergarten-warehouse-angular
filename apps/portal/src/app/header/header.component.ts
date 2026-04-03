import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  ElementRef,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormsModule } from '@angular/forms'; // Import FormsModule if using ngModel, or just use input event

import {
  TranslationService,
  Lang,
  AuthService,
} from '@kindergarten-warehouse/data-access';
import { TranslatePipe } from '../pipes/translate.pipe';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './header.component.html',
  styles: [],
})
export class HeaderComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  translationService = inject(TranslationService);

  isMobileMenuOpen = false;
  searchQuery = '';
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  // Favorites (mock for now, or read from localStorage if implemented)
  hasFavorites = false;

  ngOnInit() {
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((term) => {
        this.performSearch(term);
      });

    // Check favorites on init (simple check)
    this.checkFavorites();

    // Check Auth Status
    this.authService.isLoggedIn$.subscribe((status) => {
      this.isLoggedIn = status;
    });

    this.authService.currentUser$.subscribe((user) => {
      if (user && user.fullName) {
        // Extract initials
        const names = user.fullName.split(' ');
        if (names.length >= 2) {
          this.userInitials = (names[0][0] + names[1][0]).toUpperCase();
        } else {
          this.userInitials = names[0].substring(0, 2).toUpperCase();
        }
        this.userName = user.fullName;
        this.userAvatar = user.avatarUrl || '';
        this.userRole = user.roles?.[0] || user.role || 'User'; // Fallback logic
      } else {
        this.userInitials = 'ME';
        this.userName = '';
      }
    });
    // Initial check (optional, as BehaviorSubject emits initial value)
  }

  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
  }

  onSearchInput(term: string) {
    this.searchQuery = term;
    this.searchSubject.next(term);
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchSubject.next('');
  }

  performSearch(term: string) {
    this.router.navigate(['/resources'], {
      queryParams: { search: term || null },
      queryParamsHandling: 'merge',
    });
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  setLang(lang: Lang) {
    this.translationService.setLanguage(lang);
  }

  // Auth State
  isLoggedIn = false;
  userInitials = '';
  userAvatar = '';
  userName = '';
  userRole = '';
  isUserMenuOpen = false;
  private authService = inject(AuthService);
  private eRef = inject(ElementRef);

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.closeUserMenu();
      this.closeMobileMenu(); // Also close mobile menu if clicking outside
    }
  }

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  closeUserMenu() {
    this.isUserMenuOpen = false;
  }

  checkFavorites() {
    // TODO: Implement actual check against LocalStorage
    const favorites = localStorage.getItem('favorites');
    this.hasFavorites = favorites ? JSON.parse(favorites).length > 0 : false;
  }

  logout() {
    this.authService.logout('Hẹn gặp lại bạn! 👋');
    this.router.navigate(['/login']);
  }
}
