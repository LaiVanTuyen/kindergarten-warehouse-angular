import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

interface SkeletonCell {
  type: string;
  width?: string;
}

@Component({
  selector: 'app-skeleton-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="animate-pulse flex flex-col gap-3">
      <!-- Header Skeleton (Optional, just a line) -->
      <div class="h-8 bg-surface-2 rounded-lg w-full mb-2 opacity-50"></div>

      <div
        *ngFor="let row of displayRows"
        class="flex items-center gap-6 p-4 border-b border-slate-50"
      >
        <ng-container *ngFor="let cell of row">
          <!-- CHECKBOX -->
          <div
            *ngIf="cell.type === 'checkbox'"
            class="w-5 h-5 bg-slate-200 rounded-md shrink-0"
          ></div>

          <!-- TEXT (Default) -->
          <div
            *ngIf="cell.type === 'text'"
            class="h-4 bg-slate-200 rounded-full"
            [style.width]="cell.width"
          ></div>

          <!-- TEXT SM -->
          <div
            *ngIf="cell.type === 'text-sm'"
            class="h-3 bg-surface-2 rounded-full"
            [style.width]="cell.width"
          ></div>

          <!-- AVATAR (Circle) -->
          <div
            *ngIf="cell.type === 'avatar'"
            class="w-10 h-10 bg-slate-200 rounded-full shrink-0"
          ></div>

          <!-- BADGE (Pill) -->
          <div
            *ngIf="cell.type === 'badge'"
            class="h-6 w-20 bg-surface-2 rounded-full shrink-0"
          ></div>

          <!-- ACTIONS -->
          <div *ngIf="cell.type === 'actions'" class="flex gap-2 ml-auto">
            <div class="w-8 h-8 bg-surface-2 rounded-lg"></div>
            <div class="w-8 h-8 bg-surface-2 rounded-lg"></div>
          </div>

          <!-- COMPOSITE: USER (Avatar + Lines) -->
          <div
            *ngIf="cell.type === 'user'"
            class="flex items-center gap-3 w-full max-w-[200px]"
          >
            <div class="w-9 h-9 bg-slate-200 rounded-full shrink-0"></div>
            <div class="flex flex-col gap-2 flex-1">
              <div class="h-3.5 bg-slate-200 rounded-full w-3/4"></div>
              <div class="h-2.5 bg-surface-2 rounded-full w-1/2"></div>
            </div>
          </div>

          <!-- COMPOSITE: RESOURCE (Thumbnail + Lines) -->
          <div
            *ngIf="cell.type === 'resource'"
            class="flex items-center gap-4 w-full max-w-[250px]"
          >
            <div class="w-12 h-12 bg-slate-200 rounded-xl shrink-0"></div>
            <div class="flex flex-col gap-2 flex-1">
              <div class="h-4 bg-slate-200 rounded-full w-4/5"></div>
              <div class="h-3 bg-surface-2 rounded-full w-1/2"></div>
            </div>
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [],
})
export class SkeletonTableComponent implements OnChanges {
  @Input() rows = 5;
  @Input() cols = 5;
  @Input() template: string[] = [];

  displayRows: SkeletonCell[][] = [];

  ngOnChanges(changes: SimpleChanges): void {
    this.generateSkeleton();
  }

  private generateSkeleton() {
    const colTypes =
      this.template.length > 0 ? this.template : Array(this.cols).fill('text');

    this.displayRows = Array.from({ length: this.rows }).map(() => {
      return colTypes.map((type) => ({
        type,
        width: this.getRandomWidth(type),
      }));
    });
  }

  private getRandomWidth(type: string): string | undefined {
    if (type === 'text') return `${Math.floor(Math.random() * 40 + 40)}%`; // 40-80%
    if (type === 'text-sm') return `${Math.floor(Math.random() * 30 + 30)}%`; // 30-60%
    return undefined;
  }
}
