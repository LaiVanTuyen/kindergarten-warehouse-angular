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
      // Randomize data to make graphs distinct
      resourceData = [5, 8, 3, 12, 6, 9, 7];
      viewData = [150, 230, 220, 180, 260, 310, 290];
      userData = [2, 1, 4, 3, 5, 4, 6];

      // Update Stats for Week
      this.stats.update(() => ({
        totalResources: 50,
        totalViews: 1640,
        totalUsers: 25,
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
      // Distinct patterns for each chart
      resourceData = [15, 20, 25, 18, 22, 30, 35, 28, 40, 45, 50, 55]; // Steady growth with dips
      viewData = [
        800, 1200, 1100, 1600, 2200, 2000, 3500, 3100, 4000, 4500, 5200, 5800,
      ]; // Volatile growth
      userData = [5, 8, 12, 15, 18, 22, 28, 32, 38, 45, 50, 60]; // Linear growth

      // Update Stats for Year
      this.stats.update(() => ({
        totalResources: 215,
        totalViews: 35000,
        totalUsers: 325,
        pendingApprovals: 8,
      }));
    }

    // Mock System Health Updates (Simulate live data)
    this.updateSystemHealth();

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

  // System Health Signals
  systemHealth = signal({
    cpuUsage: 45,
    ramUsage: 62,
    serverUptime: '24 days',
    dbStatus: 'CONNECTED',
    serverStatus: 'ONLINE',
  });

  updateSystemHealth() {
    // Simulate slight variations
    const cpu = Math.floor(Math.random() * (60 - 30 + 1)) + 30; // 30-60%
    const ram = Math.floor(Math.random() * (80 - 50 + 1)) + 50; // 50-80%

    this.systemHealth.update((s) => ({
      ...s,
      cpuUsage: cpu,
      ramUsage: ram,
    }));
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
