import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '../pipes/translate.pipe';
import { ToastService } from '@kindergarten-warehouse/data-access';

import { AuthService } from '@kindergarten-warehouse/data-access';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslatePipe],
  templateUrl: './login.component.html',
  styles: [],
})
export class LoginComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  username = '';
  password = '';
  isLoading = false;

  onSubmit() {
    if (this.username) {
      this.isLoading = true;
      this.authService
        .login(this.username)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe({
          next: () => {
            this.toastService.show('Welcome back!', 'success');
            // Navigate to returnUrl or home
            const returnUrl =
              this.route.snapshot.queryParams['returnUrl'] || '/';
            this.router.navigate([returnUrl]);
          },
          error: () => {
            // Handled by interceptor theoretically, but good to reset state
          },
        });
    }
  }
}
