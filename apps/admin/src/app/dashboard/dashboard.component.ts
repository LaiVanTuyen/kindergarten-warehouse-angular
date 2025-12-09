import { Component, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsOption } from 'echarts';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgxEchartsDirective],
  templateUrl: './dashboard.component.html',
  styles: [],
})
export class DashboardComponent {
  // Signals
  dateFilter = signal('this_year');

  // Stats Signal
  stats = signal({
    totalResources: 215,
    totalViews: 1428,
    totalUsers: 45,
    pendingApprovals: 8,
  });

  // Chart Options Signals
  resourceChartOption = signal<EChartsOption>({});
  viewChartOption = signal<EChartsOption>({});
  userChartOption = signal<EChartsOption>({});

  // Pending Resources Signal
  pendingResources = signal([
    {
      id: 1,
      title: 'Learn Alphabet',
      uploader: 'Jane Doe',
      date: '2023-10-25',
      thumbnail: '🅰️',
      status: 'Pending',
    },
    {
      id: 2,
      title: 'Number Counting',
      uploader: 'John Smith',
      date: '2023-10-24',
      thumbnail: '🔢',
      status: 'Pending',
    },
    {
      id: 3,
      title: 'Colors & Shapes',
      uploader: 'Emily R.',
      date: '2023-10-23',
      thumbnail: '🎨',
      status: 'Pending',
    },
    {
      id: 4,
      title: 'Basic Science',
      uploader: 'Sarah C.',
      date: '2023-10-22',
      thumbnail: '🧬',
      status: 'Pending',
    },
    {
      id: 5,
      title: 'Story Time',
      uploader: 'Sarah L.',
      date: '2023-10-21',
      thumbnail: '📖',
      status: 'Pending',
    },
  ]);

  constructor() {
    // Effect to update chart when filter changes
    effect(() => {
      const filter = this.dateFilter();
      this.updateDashboardData(filter);
    });
  }

  setDateFilter(filter: string) {
    this.dateFilter.set(filter);
  }

  updateDashboardData(filter: string) {
    let xAxisData: string[];
    let resourceData: number[];
    let viewData: number[];
    let userData: number[];

    if (filter === 'last_7_days') {
      // 7-Day Mock Data (Mon - Sun)
      xAxisData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      resourceData = [2, 4, 1, 3, 5, 2, 4];
      viewData = [120, 132, 101, 134, 90, 230, 210];
      userData = [1, 0, 1, 2, 1, 3, 2];

      // Update Stats for Week
      this.stats.update((s) => ({
        totalResources: 21,
        totalViews: 1017,
        totalUsers: 10,
        pendingApprovals: 8,
      }));
    } else {
      // 12-Month Mock Data (Jan - Dec)
      xAxisData = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      resourceData = [10, 12, 18, 25, 30, 42, 45, 50, 55, 62, 68, 75];
      viewData = [
        500, 650, 800, 1200, 1500, 2100, 2400, 2800, 3200, 3800, 4200, 5000,
      ];
      userData = [2, 3, 5, 8, 11, 14, 16, 20, 25, 30, 35, 45];

      // Update Stats for Year
      this.stats.update((s) => ({
        totalResources: 215,
        totalViews: 1428,
        totalUsers: 45,
        pendingApprovals: 8,
      }));
    }

    // Generate Chart Options
    this.resourceChartOption.set(
      this.getChartConfig(
        'Resources',
        xAxisData,
        resourceData,
        '#3B82F6',
        'rgba(59, 130, 246'
      )
    ); // Blue
    this.viewChartOption.set(
      this.getChartConfig(
        'Views',
        xAxisData,
        viewData,
        '#EC4899',
        'rgba(236, 72, 153'
      )
    ); // Pink
    this.userChartOption.set(
      this.getChartConfig(
        'Users',
        xAxisData,
        userData,
        '#22C55E',
        'rgba(34, 197, 94'
      )
    ); // Green
  }

  // Helper to generate consistent ECharts config
  getChartConfig(
    seriesName: string,
    xAxisData: string[],
    seriesData: number[],
    colorHex: string,
    colorRgbaBase: string
  ): EChartsOption {
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#fff',
        textStyle: { color: '#333' },
        axisPointer: {
          type: 'line',
          lineStyle: { type: 'dashed' },
        },
      },
      grid: {
        containLabel: true,
        left: '10px',
        right: '20px',
        bottom: '3%',
        top: '15%',
      },
      xAxis: {
        type: 'category',
        boundaryGap: false, // Standard Line Chart (Points on lines)
        data: xAxisData,
        axisLine: { lineStyle: { color: '#eee' } },
        axisLabel: { color: '#94a3b8', fontSize: 10 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
        axisLabel: { color: '#94a3b8', fontSize: 10 },
      },
      series: [
        {
          name: seriesName,
          type: 'line',
          data: seriesData,
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
                { offset: 0, color: `${colorRgbaBase}, 0.2)` },
                { offset: 1, color: `${colorRgbaBase}, 0.0)` },
              ],
            },
          },
        },
      ],
    };
  }

  approveResource(id: number) {
    this.pendingResources.update((list) => list.filter((r) => r.id !== id));
    this.stats.update((s) => ({
      ...s,
      pendingApprovals: s.pendingApprovals - 1,
    }));
  }

  rejectResource(id: number) {
    this.pendingResources.update((list) => list.filter((r) => r.id !== id));
    this.stats.update((s) => ({
      ...s,
      pendingApprovals: s.pendingApprovals - 1,
    }));
  }
}
