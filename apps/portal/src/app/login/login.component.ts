import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '../pipes/translate.pipe';
import { ToastService } from '@kindergarten-warehouse/data-access';

import { AuthService, LoginRequest } from '@kindergarten-warehouse/data-access';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslatePipe],
  templateUrl: './login.component.html',
  styles: [],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  loginForm: FormGroup = this.fb.group({
    email: [
      '',
      [
        Validators.required,
        Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'),
      ],
    ],
    password: ['', [Validators.required]],
    rememberMe: [false],
  });

  isLoading = false;

  get f() {
    return this.loginForm.controls;
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const { email, password } = this.loginForm.value;
      const loginPayload: LoginRequest = {
        email,
        password,
      };

      this.authService
        .login(loginPayload)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe({
          next: (response: any) => {
            this.toastService.show(
              response.message || 'Welcome back!',
              'success'
            );
            const returnUrl =
              this.route.snapshot.queryParams['returnUrl'] || '/';
            this.router.navigate([returnUrl]);
          },
          error: (err: any) => {
            // Error is handled by AuthInterceptor (throws error to here)
            // Show toast from here as requested/planned
            const msg = err.message || 'Login failed';
            this.toastService.show(msg, 'error');
            console.error('Login failed', err);
          },
        });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
