'use client';

import { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface CategoryPieChartProps {
  categoryTotals: { Category: string; TotalAmount: number }[];
}

type ChartType = 'pie' | 'doughnut' | 'bar' | 'line' | 'polarArea';

const chartTypeOptions = [
  { value: 'pie', label: 'Pie Chart', icon: '🥧' },
  { value: 'doughnut', label: 'Doughnut', icon: '🍩' },
  { value: 'bar', label: 'Bar Chart', icon: '📊' },
  { value: 'line', label: 'Line Chart', icon: '📈' },
  { value: 'polarArea', label: 'Polar Area', icon: '🎯' },
];

export default function CategoryPieChart({ categoryTotals }: CategoryPieChartProps) {
  const [chartType, setChartType] = useState<ChartType>('pie');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    if (!categoryTotals || categoryTotals.length === 0) {
      return;
    }

    // Format currency for tooltips
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    });

    const colors = [
      'rgba(99, 102, 241, 0.7)',  // indigo
      'rgba(59, 130, 246, 0.7)',  // blue
      'rgba(16, 185, 129, 0.7)',  // emerald
      'rgba(245, 158, 11, 0.7)', // amber
      'rgba(244, 63, 94, 0.7)',   // rose
      'rgba(139, 92, 246, 0.7)',  // violet
      'rgba(20, 184, 166, 0.7)',  // teal
      'rgba(249, 115, 22, 0.7)',  // orange
      'rgba(236, 72, 153, 0.7)',  // pink
      'rgba(6, 182, 212, 0.7)'   // cyan
    ];

    const borderColors = colors.map(color => color.replace('0.7', '1'));

    const baseConfig = {
      type: chartType as any,
      data: {
        labels: categoryTotals.map(item => item.Category),
        datasets: [{
          label: 'Amount',
          data: categoryTotals.map(item => item.TotalAmount),
          backgroundColor: chartType === 'line' ? 'rgba(99, 102, 241, 0.1)' : colors,
          borderColor: chartType === 'line' ? 'rgba(99, 102, 241, 1)' : borderColors,
          borderWidth: chartType === 'line' ? 2 : 1,
          ...(chartType === 'line' && {
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgba(99, 102, 241, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
          }),
          ...((['pie', 'doughnut', 'polarArea'].includes(chartType)) && {
            hoverOffset: 8
          })
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 1,
        resizeDelay: 0,
        plugins: {
          legend: { 
            position: 'bottom' as any,
            labels: {
              boxWidth: 12,
              padding: 12,
              font: {
                size: 11
              },
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const label = context.label || '';
                const value = context.raw || 0;
                if (['pie', 'doughnut', 'polarArea'].includes(chartType)) {
                  const percentage = context.dataset.data
                    ? (Number(value) / context.dataset.data.reduce((a: any, b: any) => Number(a) + Number(b), 0) * 100).toFixed(1)
                    : '0';
                  return `${label}: ${formatter.format(Number(value))} (${percentage}%)`;
                } else {
                  return `${label}: ${formatter.format(Number(value))}`;
                }
              }
            }
          }
        },
        ...(chartType === 'doughnut' && {
          cutout: '60%'
        }),
        ...((['bar', 'line'].includes(chartType)) && {
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value: any) {
                  return formatter.format(Number(value));
                }
              }
            }
          }
        }),
        layout: {
          padding: {
            top: 10,
            bottom: 20,
            left: 10,
            right: 10
          }
        },
        animation: {
          resize: {
            duration: 300
          }
        }
      }
    };

    chartRef.current = new Chart(canvasRef.current, baseConfig);

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [categoryTotals, chartType]);

  if (!categoryTotals || categoryTotals.length === 0) {
    return (
      <div className="h-full">
        {/* Header with chart type selector */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Revenue by Category
            </h3>
            <p className="text-sm text-gray-600">
              View uploaded invoice categories by user
            </p>
          </div>
          <div className="flex gap-3">
            {/* Chart Type Selector */}
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as ChartType)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {chartTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chart content */}
        <div className="h-[350px]">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-gray-500">No category data available</p>
              <p className="text-sm text-gray-400 mt-1">Add invoices with categories to see breakdown</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Header with chart type selector */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Revenue by Category
          </h3>
          <p className="text-sm text-gray-600">
            View uploaded invoice categories by user
          </p>
        </div>
        <div className="flex gap-3">
          {/* Chart Type Selector */}
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as ChartType)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            {chartTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart content */}
      <div className="h-[350px]">
        <div className="relative h-full">
          <div className="h-[calc(100%-50px)]">
            <canvas 
              ref={canvasRef} 
              className="w-full h-full"
            />
            {categoryTotals && categoryTotals.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600 text-center">
                  Total invoices across{' '}
                  <strong>{categoryTotals.length}</strong> categories with a total value of{' '}
                  <strong>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(categoryTotals.reduce((sum, item) => sum + item.TotalAmount, 0))}
                </strong>
              </div>
            </div>
          )}
            
            
          </div>
          
          {/* Summary info at bottom */}
          
        </div>
      </div>
    </div>
  );
}