import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styles: [],
})
export class DashboardComponent {
  // Mock data for the chart
  chartData = [
    { label: 'Math', value: 65, color: 'bg-blue-500' },
    { label: 'Science', value: 45, color: 'bg-green-500' },
    { label: 'Art', value: 80, color: 'bg-pink-500' },
    { label: 'Music', value: 30, color: 'bg-purple-500' },
    { label: 'English', value: 55, color: 'bg-yellow-500' },
    { label: 'PE', value: 70, color: 'bg-red-500' },
  ];

  // Mock data for the line chart (Views Growth)
  lineChartData = [
    { month: 'Jan', value: 1200 },
    { month: 'Feb', value: 1900 },
    { month: 'Mar', value: 1500 },
    { month: 'Apr', value: 2200 },
    { month: 'May', value: 2800 },
    { month: 'Jun', value: 3500 },
  ];

  getMaxValue(): number {
    return Math.max(...this.chartData.map((d) => d.value));
  }

  getLineChartPath(): string {
    const maxVal = Math.max(...this.lineChartData.map(d => d.value));
    const points = this.lineChartData.map((d, i) => {
      const x = (i / (this.lineChartData.length - 1)) * 100;
      const y = 100 - (d.value / maxVal) * 100;
      return `${x},${y}`;
    });
    return points.join(' ');
  }

  // Sparkline Data
  viewsSparkline = [10, 15, 12, 20, 25, 22, 30];
  resourcesSparkline = [5, 8, 6, 12, 10, 15, 18];
  usersSparkline = [2, 4, 3, 6, 8, 10, 12];

  // Weekly Growth Data (for detailed charts)
  weeklyViews = [
    { week: 'W1', value: 1200 },
    { week: 'W2', value: 1350 },
    { week: 'W3', value: 1250 },
    { week: 'W4', value: 1480 },
    { week: 'W5', value: 1600 },
    { week: 'W6', value: 1550 },
    { week: 'W7', value: 1800 }
  ];

  weeklyResources = [
    { week: 'W1', value: 300 },
    { week: 'W2', value: 305 },
    { week: 'W3', value: 310 },
    { week: 'W4', value: 312 },
    { week: 'W5', value: 318 },
    { week: 'W6', value: 322 },
    { week: 'W7', value: 328 }
  ];

  weeklyUsers = [
    { week: 'W1', value: 800 },
    { week: 'W2', value: 850 },
    { week: 'W3', value: 920 },
    { week: 'W4', value: 980 },
    { week: 'W5', value: 1050 },
    { week: 'W6', value: 1120 },
    { week: 'W7', value: 1205 }
  ];

  getSparklinePath(data: number[]): string {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    return data.map((val, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((val - min) / range) * 100;
      return `${x},${y}`;
    }).join(' ');
  }

  getWeeklyChartPath(data: { week: string, value: number }[]): string {
    const values = data.map(d => d.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;

    return values.map((val, i) => {
      const x = (i / (values.length - 1)) * 100;
      // Add some padding to avoid hitting the absolute edges
      const y = 90 - ((val - min) / range) * 80; 
      return `${x},${y}`;
    }).join(' ');
  }

  // User Activity Data (New vs Active)
  userActivityData = [
    { day: 'Mon', new: 12, active: 45 },
    { day: 'Tue', new: 18, active: 52 },
    { day: 'Wed', new: 15, active: 48 },
    { day: 'Thu', new: 25, active: 60 },
    { day: 'Fri', new: 30, active: 75 },
    { day: 'Sat', new: 20, active: 65 },
    { day: 'Sun', new: 10, active: 40 },
  ];

  getMaxActivityValue(): number {
    return Math.max(...this.userActivityData.map(d => Math.max(d.new, d.active)));
  }
}
