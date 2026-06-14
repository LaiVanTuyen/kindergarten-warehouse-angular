import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FileRejection {
  file: File;
  reason: 'size' | 'type';
  message: string;
}

/**
 * Drag-and-drop file selector used by the teacher upload flow. Emits either
 * a single File (default) or a File[] when `multiple`.
 *
 * Validates:
 *  - MIME/extension allowlist via `accept` (e.g. '.pdf,.docx,video/*').
 *  - Max size in MB via `maxSizeMb`.
 *
 * Visual language matches the kindergarten theme: rounded 2xl, pastel pink
 * on drag-over, dashed border, illustrated placeholder.
 */
@Component({
  selector: 'app-file-drop-zone',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label
      class="group relative flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 py-10 text-center cursor-pointer transition"
      [class.border-pink-400]="dragging()"
      [class.bg-pink-50]="dragging()"
      [class.border-slate-300]="!dragging()"
      [class.bg-slate-50]="!dragging()"
      [class.hover:border-pink-300]="!dragging()"
      [class.hover:bg-pink-50/50]="!dragging()"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
    >
      <input
        type="file"
        class="sr-only"
        [accept]="accept || null"
        [multiple]="multiple"
        (change)="onInputChange($event)"
      />

      <div
        class="flex size-14 items-center justify-center rounded-2xl bg-surface shadow-sm text-primary"
        aria-hidden="true"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="size-7" fill="none"
          viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M12 16.5V9.75m0 0 3 3m-3-3-3 3m9.75-5.25V16.5A2.25 2.25 0 0 1 16.5 18.75h-9A2.25 2.25 0 0 1 5.25 16.5V6.75m13.5 0H5.25m13.5 0a2.25 2.25 0 0 0-2.25-2.25h-9a2.25 2.25 0 0 0-2.25 2.25" />
        </svg>
      </div>

      <div class="text-sm">
        <p class="font-semibold text-slate-800">
          {{ dragging() ? 'Thả tệp vào đây' : title }}
        </p>
        <p class="mt-0.5 text-slate-500">{{ hint }}</p>
      </div>

      <p
        *ngIf="selectedLabel(); let label"
        class="text-xs font-medium text-emerald-600 bg-emerald-50 rounded-full px-3 py-1"
      >
        ✓ {{ label }}
      </p>

      <p
        *ngIf="errorMsg()"
        class="text-xs font-medium text-rose-600"
        role="alert"
      >
        {{ errorMsg() }}
      </p>
    </label>
  `,
})
export class FileDropZoneComponent {
  /** Accept attribute — e.g. '.pdf,.docx,video/*'. */
  @Input() accept = '';
  /** Max size in MB. 0 disables the check. */
  @Input() maxSizeMb = 100;
  @Input() multiple = false;
  @Input() title = 'Kéo & thả tệp vào đây';
  @Input() hint = 'hoặc bấm để chọn từ máy';

  @Output() filesChange = new EventEmitter<File[]>();
  @Output() fileChange = new EventEmitter<File | null>();
  @Output() rejected = new EventEmitter<FileRejection[]>();

  protected readonly dragging = signal(false);
  protected readonly errorMsg = signal('');
  private readonly selected = signal<File[]>([]);

  @HostBinding('class.block') readonly hostBlock = true;

  protected selectedLabel = (): string | null => {
    const files = this.selected();
    if (files.length === 0) return null;
    if (files.length === 1) return files[0].name;
    return `${files.length} tệp đã chọn`;
  };

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const files = event.dataTransfer?.files;
    if (files) this.handleFiles(files);
  }

  protected onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) this.handleFiles(input.files);
    // Reset so picking the same file twice in a row still fires a change.
    input.value = '';
  }

  private handleFiles(fileList: FileList): void {
    const incoming = Array.from(fileList);
    const accepted: File[] = [];
    const rejected: FileRejection[] = [];

    for (const file of incoming) {
      const rejection = this.validate(file);
      if (rejection) rejected.push(rejection);
      else accepted.push(file);
    }

    if (rejected.length) {
      this.errorMsg.set(rejected[0].message);
      this.rejected.emit(rejected);
    } else {
      this.errorMsg.set('');
    }

    if (accepted.length === 0) return;

    const next = this.multiple ? accepted : [accepted[0]];
    this.selected.set(next);
    this.filesChange.emit(next);
    this.fileChange.emit(next[0] ?? null);
  }

  private validate(file: File): FileRejection | null {
    if (this.maxSizeMb > 0 && file.size > this.maxSizeMb * 1024 * 1024) {
      return {
        file,
        reason: 'size',
        message: `Tệp "${file.name}" vượt quá ${this.maxSizeMb}MB.`,
      };
    }
    if (this.accept && !this.matchesAccept(file)) {
      return {
        file,
        reason: 'type',
        message: `Định dạng tệp "${file.name}" không được hỗ trợ.`,
      };
    }
    return null;
  }

  private matchesAccept(file: File): boolean {
    const tokens = this.accept
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    if (!tokens.length) return true;
    const name = file.name.toLowerCase();
    const type = (file.type || '').toLowerCase();
    return tokens.some((token) => {
      if (token.startsWith('.')) return name.endsWith(token);
      if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1));
      return type === token;
    });
  }

  reset(): void {
    this.selected.set([]);
    this.errorMsg.set('');
  }
}
