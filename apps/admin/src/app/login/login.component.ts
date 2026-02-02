import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, ToastService } from '@kindergarten-warehouse/data-access';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
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
  });

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.authService.login(this.loginForm.value).subscribe({
      next: (response: any) => {
        const user = response.user;
        if (user && user.role !== 'ADMIN') {
          this.toastService.show(
            'Access Denied: Admin privileges required.',
            'error'
          );
          this.authService.logout(undefined, false); // Clear local session without API call
          return;
        }

        this.toastService.show(response.message || 'Welcome back!', 'success');
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        // Error is handled by AuthInterceptor (throws error to here)
        const msg = err.message || 'Login failed';
        this.toastService.show(msg, 'error');
        console.error('Login failed', err);
      },
    });
  }
}
