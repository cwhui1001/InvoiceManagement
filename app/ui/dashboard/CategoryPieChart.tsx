'use client';

import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface CategoryPieChartProps {
  categoryTotals: { Category: string; TotalAmount: number }[];
}

export default function CategoryPieChart({ categoryTotals }: CategoryPieChartProps) {
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

    chartRef.current = new Chart(canvasRef.current, {
      type: 'pie',
      data: {
        labels: categoryTotals.map(item => item.Category),
        datasets: [{
          data: categoryTotals.map(item => item.TotalAmount),
          backgroundColor: [
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
          ],
          borderColor: 'rgba(255, 255, 255, 0.8)',
          borderWidth: 1,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            position: 'right',
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
              label: (context) => {
                const label = context.label || '';
                const value = context.raw || 0;
                const percentage = context.dataset.data
                  ? (Number(value) / context.dataset.data.reduce((a, b) => Number(a) + Number(b), 0) * 100).toFixed(1)
                  : '0';
                return `${label}: ${formatter.format(Number(value))} (${percentage}%)`;
              }
            }
          }
        },
        cutout: '60%'
      }
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [categoryTotals]);

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
  <div className="w-full h-full relative min-h-[240px] sm:min-h-[280px] md:min-h-[300px]">
  <canvas ref={canvasRef} className="w-full h-full" />
</div>

);

}