import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { catchError, filter, finalize, switchMap } from 'rxjs/operators';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import {
  AuthService,
  DashboardPeriod,
  DashboardService,
  DashboardStats,
  PendingResource,
  TopicDistribution,
  TopResource,
  TopTeacher,
  ToastService,
  TrendSeries,
  ActivityItem,
  handleHttpError,
} from '@kindergarten-warehouse/data-access';

import { DashboardCardComponent } from '../shared/components/dashboard-card/dashboard-card.component';
import {
  StatCardComponent,
  StatCardTone,
} from '../shared/components/stat-card/stat-card.component';
import { DateFilterComponent } from '../shared/components/date-filter/date-filter.component';
import { PendingPreviewComponent } from './components/pending-preview.component';
import {
  TopListComponent,
  TopListItem,
} from './components/top-list.component';
import { RecentActivityComponent } from './components/recent-activity.component';
import { QuickActionsComponent } from './components/quick-actions.component';

interface StatCardConfig {
  label: string;
  value: number;
  iconPath: string;
  tone: StatCardTone;
  trend: number | null;
  subLabel?: string;
  linkTo?: string | null;
  linkQueryParams?: Record<string, unknown> | null;
}

interface TrendChartConfig {
  title: string;
  option: EChartsOption;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    NgxEchartsDirective,
    DashboardCardComponent,
    StatCardComponent,
    DateFilterComponent,
    PendingPreviewComponent,
    TopListComponent,
    RecentActivityComponent,
    QuickActionsComponent,
  ],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private dashService = inject(DashboardService);
  private toast = inject(ToastService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  // --- Filter state -------------------------------------------------------
  readonly period = signal<DashboardPeriod>('this_year');
  readonly startDate = signal<string>('');
  readonly endDate = signal<string>('');
  readonly filterParams = computed(() => {
    const period = this.period();
    const range =
      period === 'custom'
        ? {
            startDate: this.startDate(),
            endDate: this.endDate(),
          }
        : {
            startDate: '',
            endDate: '',
          };

    return { period, range };
  });

  // --- Data signals -------------------------------------------------------
  readonly stats = signal<DashboardStats | null>(null);
  readonly trend = signal<TrendSeries | null>(null);
  readonly pending = signal<PendingResource[]>([]);
  readonly topResources = signal<TopResource[]>([]);
  readonly topTeachers = signal<TopTeacher[]>([]);
  readonly topicDistribution = signal<TopicDistribution[]>([]);
  readonly activity = signal<ActivityItem[]>([]);

  // --- Loading flags ------------------------------------------------------
  readonly isLoadingStats = signal(true);
  readonly isLoadingTrend = signal(true);
  readonly isLoadingPending = signal(true);

  // --- Current user (for welcome greeting) --------------------------------
  readonly userName = computed(
    () => this.authService.currentUserValue?.fullName?.split(' ').pop() || 'bạn'
  );

  // --- Stat cards config --------------------------------------------------
  readonly statCards = computed<StatCardConfig[]>(() => {
    const s = this.stats();
    if (!s) return [];
    return [
      {
        label: 'Tổng tài nguyên',
        value: s.totalResources,
        iconPath:
          'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
        tone: 'sky',
        trend: s.trendPct.resources,
        linkTo: '/resources',
      },
      {
        label: 'Tổng lượt xem',
        value: s.totalViews,
        iconPath:
          'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
        tone: 'coral',
        trend: s.trendPct.views,
        linkTo: null,
      },
      {
        label: 'Tổng người dùng',
        value: s.totalUsers,
        iconPath:
          'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
        tone: 'mint',
        trend: s.trendPct.users,
        linkTo: '/users',
      },
      {
        label: 'Chờ phê duyệt',
        value: s.pendingApprovals,
        iconPath: 'M12 8v4l3 3M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0',
        tone: 'lavender',
        trend: null,
        subLabel: 'Cần xử lý',
        linkTo: '/resources',
        linkQueryParams: { status: 'PENDING' },
      },
    ];
  });

  // --- Trend charts -------------------------------------------------------
  readonly trendCharts = computed<TrendChartConfig[]>(() => {
    const t = this.trend();
    if (!t) return [];
    return [
      {
        title: 'Tài nguyên mới',
        option: buildLineChart(t.xAxis, t.resources, '#FB7185', '251, 113, 133'),
      },
      {
        title: 'Lượt xem',
        option: buildLineChart(t.xAxis, t.views, '#60A5FA', '96, 165, 250'),
      },
      {
        title: 'Người dùng mới',
        option: buildLineChart(t.xAxis, t.users, '#34D399', '52, 211, 153'),
      },
    ];
  });

  // --- Top lists as TopListItem -------------------------------------------
  readonly topResourceItems = computed<TopListItem[]>(() =>
    this.topResources().map((r) => ({
      id: r.id,
      label: r.title,
      sublabel: r.topic,
      imageUrl: r.thumbnailUrl || undefined,
      fallbackInitial: initial(r.title),
      metric: r.views,
    }))
  );

  readonly topTeacherItems = computed<TopListItem[]>(() =>
    this.topTeachers().map((t) => ({
      id: t.id,
      label: t.fullName,
      imageUrl: t.avatarUrl
        ? this.authService.formatAvatarUrl(t.avatarUrl)
        : undefined,
      fallbackInitial: initials(t.fullName),
      metric: t.uploadCount,
    }))
  );

  // --- Pie chart ----------------------------------------------------------
  readonly topicPieOption = computed<EChartsOption>(() => {
    const data = this.topicDistribution();
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: {
        orient: 'vertical',
        right: '0',
        top: 'middle',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { fontSize: 11, color: '#6B6684' },
      },
      series: [
        {
          name: 'Chủ đề',
          type: 'pie',
          radius: ['48%', '72%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          labelLine: { show: false },
          data: data.map((d) => ({
            value: d.count,
            name: d.topic,
            itemStyle: { color: d.color },
          })),
        },
      ],
    };
  });

  constructor() {
    toObservable(this.filterParams)
      .pipe(
        filter(
          ({ period, range }) =>
            period !== 'custom' || !!(range.startDate && range.endDate)
        ),
        switchMap(({ period, range }) => {
          this.isLoadingStats.set(true);
          this.isLoadingTrend.set(true);
          this.isLoadingPending.set(true);

          return forkJoin({
            stats: this.dashService.getStats(period, range).pipe(
              catchError(() => {
                this.toast.show('Không tải được số liệu tổng quan.', 'error');
                return of(null);
              }),
              finalize(() => this.isLoadingStats.set(false))
            ),
            trend: this.dashService.getTrend(period, range).pipe(
              catchError(() => {
                this.toast.show('Không tải được biểu đồ xu hướng.', 'error');
                return of(null);
              }),
              finalize(() => this.isLoadingTrend.set(false))
            ),
            pending: this.dashService.getPending(5).pipe(
              catchError(() => {
                this.toast.show('Không tải được tài nguyên chờ duyệt.', 'error');
                return of([] as PendingResource[]);
              }),
              finalize(() => this.isLoadingPending.set(false))
            ),
            topResources: this.dashService.getTopResources(period, 5).pipe(
              catchError(() => {
                this.toast.show('Không tải được top tài nguyên.', 'error');
                return of([] as TopResource[]);
              })
            ),
            topTeachers: this.dashService.getTopTeachers(period, 5).pipe(
              catchError(() => {
                this.toast.show('Không tải được top giáo viên.', 'error');
                return of([] as TopTeacher[]);
              })
            ),
            topicDistribution: this.dashService
              .getTopicDistribution(period)
              .pipe(
                catchError(() => {
                  this.toast.show('Không tải được phân bố chủ đề.', 'error');
                  return of([] as TopicDistribution[]);
                })
              ),
            activity: this.dashService.getRecentActivity(8).pipe(
              catchError(() => {
                this.toast.show('Không tải được hoạt động gần đây.', 'error');
                return of([] as ActivityItem[]);
              })
            ),
          });
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(
        ({
          stats,
          trend,
          pending,
          topResources,
          topTeachers,
          topicDistribution,
          activity,
        }) => {
          if (stats) this.stats.set(stats);
          if (trend) this.trend.set(trend);
          this.pending.set(pending);
          this.topResources.set(topResources);
          this.topTeachers.set(topTeachers);
          this.topicDistribution.set(topicDistribution);
          this.activity.set(activity);
        }
      );
  }

  // --- Public event handlers ---------------------------------------------

  onPeriodChange(p: DashboardPeriod) {
    this.period.set(p);
  }

  onStartDateChange(value: string) {
    this.startDate.set(value);
  }

  onEndDateChange(value: string) {
    this.endDate.set(value);
  }

  onApprove(item: PendingResource) {
    this.dashService
      .approveResource(item.id)
      .pipe(
        handleHttpError(this.toast, 'Không thể phê duyệt. Vui lòng thử lại.'),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.pending.update((list) => list.filter((p) => p.id !== item.id));
        this.stats.update((s) =>
          s
            ? { ...s, pendingApprovals: Math.max(0, s.pendingApprovals - 1) }
            : s
        );
        this.toast.show(`Đã phê duyệt "${item.title}".`, 'success');
      });
  }

  onReject({ item, reason }: { item: PendingResource; reason: string }) {
    this.dashService
      .rejectResource(item.id, reason)
      .pipe(
        handleHttpError(this.toast, 'Không thể từ chối. Vui lòng thử lại.'),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.pending.update((list) => list.filter((p) => p.id !== item.id));
        this.stats.update((s) =>
          s
            ? { ...s, pendingApprovals: Math.max(0, s.pendingApprovals - 1) }
            : s
        );
        this.toast.show(`Đã từ chối "${item.title}".`, 'info');
      });
  }

}

// ---------- Helpers ---------------------------------------------------------

function buildLineChart(
  xAxis: string[],
  data: number[],
  colorHex: string,
  colorRgb: string
): EChartsOption {
  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#fff',
      borderColor: '#e5e7eb',
      textStyle: { color: '#1F1A37', fontSize: 12 },
      axisPointer: { type: 'line', lineStyle: { type: 'dashed' } },
    },
    grid: { containLabel: true, left: 8, right: 16, bottom: 8, top: 16 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxis,
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6B6684', fontSize: 10 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: '#f3f4f6' } },
      axisLabel: { color: '#6B6684', fontSize: 10 },
    },
    series: [
      {
        type: 'line',
        data,
        smooth: true,
        showSymbol: true,
        symbolSize: 6,
        itemStyle: { color: colorHex, borderColor: '#fff', borderWidth: 2 },
        lineStyle: { width: 3, color: colorHex },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `rgba(${colorRgb}, 0.25)` },
              { offset: 1, color: `rgba(${colorRgb}, 0)` },
            ],
          },
        },
      },
    ],
  };
}

function initial(text: string): string {
  const t = text.trim();
  return t ? t.charAt(0).toUpperCase() : '?';
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}
