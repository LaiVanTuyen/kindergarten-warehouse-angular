import { DestroyRef, Injectable, inject } from '@angular/core';
import { Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog';
import { ComponentType } from '@angular/cdk/portal';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../components/confirm-dialog/confirm-dialog.component';
import {
  RejectReasonDialogComponent,
  RejectReasonDialogData,
} from '../components/reject-reason-dialog/reject-reason-dialog.component';

const BACKDROP_CLASS = 'bg-kindy-ink/40 backdrop-blur-sm';
const DEFAULT_TITLE_ID = 'dialog-title';

/**
 * Thin facade around CDK Dialog that applies consistent config (backdrop,
 * role, aria-labelledby) so feature components open modals with one-liners.
 *
 * Every method accepts an optional `DestroyRef`. When provided, the returned
 * observable is automatically piped with `takeUntilDestroyed` so that if the
 * caller's component unmounts while the dialog is still open, the subscription
 * is torn down cleanly. Callers should nearly always pass `this.destroyRef`.
 *
 *   this.dialogs.confirm({...}, this.destroyRef).subscribe(ok => ...);
 */
@Injectable({ providedIn: 'root' })
export class DialogService {
  private cdk = inject(Dialog);

  confirm(
    data: ConfirmDialogData,
    destroyRef?: DestroyRef
  ): Observable<boolean> {
    const src$ = this.cdk
      .open<boolean, ConfirmDialogData, ConfirmDialogComponent>(
        ConfirmDialogComponent,
        {
          data,
          role: 'alertdialog',
          ariaLabelledBy: DEFAULT_TITLE_ID,
          ariaDescribedBy: 'dialog-subtitle',
          hasBackdrop: true,
          backdropClass: BACKDROP_CLASS,
        }
      )
      .closed.pipe(map((v) => !!v));
    return destroyRef ? src$.pipe(takeUntilDestroyed(destroyRef)) : src$;
  }

  rejectReason(
    data: RejectReasonDialogData,
    destroyRef?: DestroyRef
  ): Observable<string | undefined> {
    const src$ = this.cdk.open<
      string | undefined,
      RejectReasonDialogData,
      RejectReasonDialogComponent
    >(RejectReasonDialogComponent, {
      data,
      role: 'dialog',
      ariaLabelledBy: DEFAULT_TITLE_ID,
      hasBackdrop: true,
      backdropClass: BACKDROP_CLASS,
    }).closed;
    return destroyRef ? src$.pipe(takeUntilDestroyed(destroyRef)) : src$;
  }

  openForm<R, D = unknown, C = unknown>(
    component: ComponentType<C>,
    data?: D,
    destroyRef?: DestroyRef,
    options: Partial<DialogConfig<any, any, any>> = {}
  ): Observable<R | undefined> {
    const src$ = this.cdk.open<R, D, C>(component, {
      data,
      role: 'dialog',
      ariaLabelledBy: DEFAULT_TITLE_ID,
      hasBackdrop: true,
      backdropClass: BACKDROP_CLASS,
      ...options,
    }).closed;
    return destroyRef ? src$.pipe(takeUntilDestroyed(destroyRef)) : src$;
  }
}
