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
        plugins: {
          legend: { 
            position: (['bar', 'line'].includes(chartType) ? 'top' : 'right') as any,
            labels: {
              boxWidth: 12,
              padding: 16,
              font: {
                size: 12
              },
              usePointStyle: true
            }
          },
          title: { 
            display: true, 
            text: 'Revenue by Category',
            font: {
              size: 16,
              weight: 'bold',
              family: 'Inter, sans-serif'
            },
            color: '#111827',
            padding: {
              bottom: 16
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
            top: 5,
            bottom: 5,
            left: 5,
            right: (['bar', 'line'].includes(chartType) ? 5 : 15)
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
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-500 text-center">No category data available</p>
        <p className="text-gray-400 text-sm mt-1 text-center">Add invoices with categories to see breakdown</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative p-2">
      {/* Chart Type Selector */}
      <div className="flex justify-end mb-3">
        <select
          value={chartType}
          onChange={(e) => setChartType(e.target.value as ChartType)}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
        >
          {chartTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.icon} {option.label}
            </option>
          ))}
        </select>
      </div>
      
      <div className="w-full h-full flex items-center justify-center" style={{ minHeight: '240px' }}>
        <canvas 
          ref={canvasRef} 
          className="max-w-full max-h-full"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}