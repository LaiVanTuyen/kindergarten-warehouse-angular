import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
} from '@angular/core';
import { PendingResource } from '@kindergarten-warehouse/data-access';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { DialogService } from '../../shared/services/dialog.service';
import { IconButtonComponent } from '../../shared/components/icon-button/icon-button.component';

@Component({
  selector: 'app-pending-preview',
  standalone: true,
  imports: [RelativeTimePipe, IconButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (items().length === 0) {
      <div
        class="flex flex-col items-center justify-center text-center py-8 text-kindy-ink-soft"
      >
        <div
          aria-hidden="true"
          class="w-14 h-14 rounded-2xl bg-kindy-mint-soft text-kindy-mint flex items-center justify-center mb-3"
        >
          <svg
            class="w-7 h-7"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p class="text-sm font-medium text-kindy-ink">
          Không có tài nguyên chờ duyệt
        </p>
        <p class="text-xs mt-1">Mọi tài nguyên đã được xử lý.</p>
      </div>
    } @else {
      <ul class="divide-y divide-gray-100">
        @for (item of items(); track item.id) {
          <li class="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            @if (item.thumbnailUrl) {
              <img
                [src]="item.thumbnailUrl"
                alt=""
                loading="lazy"
                class="w-12 h-12 rounded-xl object-cover flex-shrink-0"
              />
            } @else {
              <div
                aria-hidden="true"
                class="w-12 h-12 rounded-xl bg-kindy-sun-soft text-kindy-sun flex items-center justify-center flex-shrink-0"
              >
                <svg
                  class="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M4 16l4.58-4.58a2 2 0 012.84 0L16 16m-2-2l1.58-1.58a2 2 0 012.84 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            }

            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-kindy-ink truncate">
                {{ item.title }}
              </p>
              <p class="text-xs text-kindy-ink-soft mt-0.5 truncate">
                {{ item.uploader }}
                @if (item.topic) {
                  · <span class="text-kindy-sidebar">{{ item.topic }}</span>
                }
              </p>
              <p class="text-xs text-kindy-ink-soft mt-0.5">
                {{ item.submittedAt | relativeTime }}
              </p>
            </div>

            <div class="flex items-center gap-1 flex-shrink-0">
              <app-icon-button
                icon="checkBold"
                tone="success"
                size="sm"
                [ariaLabel]="'Phê duyệt ' + item.title"
                (click)="confirmApprove(item)"
              />
              <app-icon-button
                icon="close"
                tone="danger"
                size="sm"
                [ariaLabel]="'Từ chối ' + item.title"
                (click)="confirmReject(item)"
              />
            </div>
          </li>
        }
      </ul>
    }
  `,
})
export class PendingPreviewComponent {
  private dialogs = inject(DialogService);
  private destroyRef = inject(DestroyRef);

  readonly items = input.required<PendingResource[]>();
  readonly approve = output<PendingResource>();
  readonly reject = output<{ item: PendingResource; reason: string }>();

  confirmApprove(item: PendingResource) {
    this.dialogs
      .confirm(
        {
          title: 'Phê duyệt tài nguyên',
          message: `Công khai "${item.title}" cho phụ huynh và giáo viên?`,
          confirmText: 'Phê duyệt',
          cancelText: 'Huỷ',
          tone: 'primary',
        },
        this.destroyRef
      )
      .subscribe((ok) => {
        if (ok) this.approve.emit(item);
      });
  }

  confirmReject(item: PendingResource) {
    this.dialogs
      .rejectReason({ resourceTitle: item.title }, this.destroyRef)
      .subscribe((reason) => {
        if (reason) this.reject.emit({ item, reason });
      });
  }
}
