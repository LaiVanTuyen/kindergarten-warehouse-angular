import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslatePipe } from '../pipes/translate.pipe';

import { AuthService } from '@kindergarten-warehouse/data-access';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslatePipe],
  templateUrl: './login.component.html',
  styles: [],
})
export class LoginComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  username = '';
  password = '';

  onSubmit() {
    if (this.username) {
      this.authService.login(this.username).subscribe(() => {
        this.router.navigate(['/']);
      });
    }
  }
}
