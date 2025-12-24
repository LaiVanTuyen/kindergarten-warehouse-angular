import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  toasts$ = new BehaviorSubject<Toast[]>([]);

  show(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: Toast = { id, message, type };

    this.toasts$.next([...this.toasts$.value, toast]);

    setTimeout(() => {
      this.remove(id);
    }, 3000);
  }

  remove(id: string) {
    this.toasts$.next(this.toasts$.value.filter((t) => t.id !== id));
  }
}
