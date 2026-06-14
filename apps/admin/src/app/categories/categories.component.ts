import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  CategoriesStore,
  Category,
  CategoryService,
  Topic,
  TopicService,
  ToastService,
  AuthService,
} from '@kindergarten-warehouse/data-access';
import { PageHeaderComponent } from '../shared/components/page-header/page-header.component';
import { StatusPillComponent } from '../shared/components/status-pill/status-pill.component';
import { SearchInputComponent } from '../shared/components/search-input/search-input.component';
import { EmptyStateComponent } from '../shared/components/empty-state/empty-state.component';
import { IconButtonComponent } from '../shared/components/icon-button/icon-button.component';
import { DialogService } from '../shared/services/dialog.service';
import { handleHttpError } from '../shared/utils/rx-operators';
import {
  CategoryFormDialogComponent,
  CategoryFormDialogData,
  CategoryFormDialogResult,
} from './components/category-form-dialog.component';
import {
  TopicFormDialogComponent,
  TopicFormDialogData,
  TopicFormDialogResult,
} from './components/topic-form-dialog.component';

type ViewMode = 'active' | 'trash';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    PageHeaderComponent,
    StatusPillComponent,
    SearchInputComponent,
    EmptyStateComponent,
    IconButtonComponent,
  ],
  templateUrl: './categories.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesComponent {
  private categoryService = inject(CategoryService);
  private categoriesStore = inject(CategoriesStore);
  private topicService = inject(TopicService);
  private toast = inject(ToastService);
  private dialogs = inject(DialogService);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);

  readonly view = signal<ViewMode>('active');
  readonly search = signal<string>('');
  readonly isLoadingCategories = signal<boolean>(true);
  readonly isLoadingTopics = signal<boolean>(false);
  readonly categories = signal<Category[]>([]);
  readonly topics = signal<Topic[]>([]);
  readonly selectedCategoryId = signal<string | null>(null);

  isIconUrl(icon: string | null | undefined): boolean {
    if (!icon) return false;
    return icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('/');
  }

  formatIconUrl(icon: string | null | undefined): string {
    return this.authService.formatAssetUrl(icon);
  }

  readonly selectedCategory = computed(
    () => this.categories().find((c) => c.id === this.selectedCategoryId()) ?? null
  );

  constructor() {
    effect(() => {
      this.view();
      this.search();
      this.loadCategories();
    });

    effect(() => {
      const catId = this.selectedCategoryId();
      if (catId) this.loadTopics(catId);
      else this.topics.set([]);
    });
  }

  loadCategories() {
    this.isLoadingCategories.set(true);
    this.categoryService
      .getCategories(1, 100, this.search() || undefined, this.view() === 'trash')
      .pipe(
        handleHttpError(this.toast, 'Không tải được phân loại.'),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.categories.set(res.data);
        this.isLoadingCategories.set(false);
        const current = this.selectedCategoryId();
        if (!current || !res.data.some((c) => c.id === current)) {
          this.selectedCategoryId.set(res.data[0]?.id ?? null);
        }
      });
  }

  loadTopics(categoryId: string) {
    this.isLoadingTopics.set(true);
    this.topicService
      .getTopics(categoryId, 1, 200, undefined, this.view() === 'trash')
      .pipe(
        handleHttpError(this.toast, 'Không tải được chủ đề.'),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.topics.set(res.data);
        this.isLoadingTopics.set(false);
      });
  }

  setView(v: ViewMode) {
    this.view.set(v);
  }
  setSearch(v: string) {
    this.search.set(v);
  }
  selectCategory(id: string) {
    this.selectedCategoryId.set(id);
  }

  // --- Category CRUD ------------------------------------------------------

  openCategoryForm(category: Category | null) {
    const data: CategoryFormDialogData = { category };
    this.dialogs
      .openForm<CategoryFormDialogResult, CategoryFormDialogData>(
        CategoryFormDialogComponent,
        data,
        this.destroyRef
      )
      .subscribe((result) => {
        if (!result) return;
        // BE /categories expects multipart/form-data (supports icon upload),
        // so send FormData rather than a JSON body (JSON → 500 on the server).
        const fd = new FormData();
        fd.append('name', result.name);
        fd.append('slug', result.slug);
        fd.append('description', result.description ?? '');
        fd.append('icon', result.icon ?? '');
        fd.append('visibility', result.visibility);
        fd.append('platform', result.platform);
        const req$ = category
          ? this.categoryService.updateCategory(category.id, fd)
          : this.categoryService.createCategory(fd);
        req$
          .pipe(
            handleHttpError(
              this.toast,
              category
                ? 'Không cập nhật được phân loại.'
                : 'Không tạo được phân loại.'
            )
          )
          .subscribe(() => {
            this.toast.show(
              category ? 'Đã cập nhật phân loại.' : 'Đã tạo phân loại mới.',
              'success'
            );
            this.categoriesStore.invalidate();
            this.loadCategories();
          });
      });
  }

  confirmDeleteCategory(category: Category) {
    const isTrash = this.view() === 'trash';
    this.dialogs
      .confirm(
        isTrash
          ? {
              title: 'Xoá vĩnh viễn phân loại',
              message: `Xoá vĩnh viễn "${category.name}" và tất cả chủ đề bên trong? Không thể hoàn tác.`,
              confirmText: 'Xoá vĩnh viễn',
              cancelText: 'Huỷ',
              tone: 'danger',
            }
          : {
              title: 'Chuyển vào thùng rác',
              message: `Chuyển "${category.name}" vào thùng rác? Bạn có thể khôi phục sau.`,
              confirmText: 'Chuyển vào thùng rác',
              cancelText: 'Huỷ',
              tone: 'danger',
            },
        this.destroyRef
      )
      .subscribe((ok) => {
        if (!ok) return;
        this.categoryService
          .deleteCategory(category.id, isTrash)
          .pipe(
            handleHttpError(this.toast, 'Không xoá được phân loại.')
          )
          .subscribe(() => {
            this.toast.show(
              isTrash ? 'Đã xoá vĩnh viễn.' : 'Đã chuyển vào thùng rác.',
              'success'
            );
            this.categoriesStore.invalidate();
            this.loadCategories();
          });
      });
  }

  restoreCategory(category: Category) {
    this.categoryService
      .restoreCategory(category.id)
      .pipe(
        handleHttpError(this.toast, 'Không khôi phục được.')
      )
      .subscribe(() => {
        this.toast.show('Đã khôi phục phân loại.', 'success');
        this.categoriesStore.invalidate();
        this.loadCategories();
      });
  }

  // --- Topic CRUD ---------------------------------------------------------

  openTopicForm(topic: Topic | null) {
    const cat = this.selectedCategory();
    if (!cat) return;
    const data: TopicFormDialogData = {
      topic,
      categoryId: cat.id,
      categoryName: cat.name,
    };
    this.dialogs
      .openForm<TopicFormDialogResult, TopicFormDialogData>(
        TopicFormDialogComponent,
        data,
        this.destroyRef
      )
      .subscribe((result) => {
        if (!result) return;
        const req$ = topic
          ? this.topicService.updateTopic(topic.id, result)
          : this.topicService.createTopic(result);
        req$
          .pipe(
            handleHttpError(
              this.toast,
              topic ? 'Không cập nhật được chủ đề.' : 'Không tạo được chủ đề.'
            )
          )
          .subscribe(() => {
            this.toast.show(
              topic ? 'Đã cập nhật chủ đề.' : 'Đã tạo chủ đề mới.',
              'success'
            );
            this.loadTopics(cat.id);
          });
      });
  }

  confirmDeleteTopic(topic: Topic) {
    const cat = this.selectedCategory();
    if (!cat) return;
    const isTrash = this.view() === 'trash';
    this.dialogs
      .confirm(
        isTrash
          ? {
              title: 'Xoá vĩnh viễn chủ đề',
              message: `Xoá vĩnh viễn "${topic.name}"? Không thể hoàn tác.`,
              confirmText: 'Xoá vĩnh viễn',
              cancelText: 'Huỷ',
              tone: 'danger',
            }
          : {
              title: 'Chuyển vào thùng rác',
              message: `Chuyển "${topic.name}" vào thùng rác?`,
              confirmText: 'Chuyển vào thùng rác',
              cancelText: 'Huỷ',
              tone: 'danger',
            },
        this.destroyRef
      )
      .subscribe((ok) => {
        if (!ok) return;
        this.topicService
          .deleteTopic(topic.id, isTrash)
          .pipe(
            handleHttpError(this.toast, 'Không xoá được chủ đề.')
          )
          .subscribe(() => {
            this.toast.show(
              isTrash ? 'Đã xoá vĩnh viễn.' : 'Đã chuyển vào thùng rác.',
              'success'
            );
            this.loadTopics(cat.id);
          });
      });
  }

  restoreTopic(topic: Topic) {
    const cat = this.selectedCategory();
    if (!cat) return;
    this.topicService
      .restoreTopic(topic.id)
      .pipe(
        handleHttpError(this.toast, 'Không khôi phục được.')
      )
      .subscribe(() => {
        this.toast.show('Đã khôi phục chủ đề.', 'success');
        this.loadTopics(cat.id);
      });
  }
}
