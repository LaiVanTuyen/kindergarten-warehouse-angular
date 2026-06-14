import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ThemeService } from '@kindergarten-warehouse/data-access';
import { ToastComponent } from './shared/toast/toast.component';

@Component({
  standalone: true,
  imports: [RouterModule, ToastComponent],
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent {
  title = 'admin';
  // Instantiate ThemeService so the saved light/dark preference is applied.
  private readonly theme = inject(ThemeService);
}
