'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, LineChart, Line, Area, AreaChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface CategoryTotal {
  Category: string;
  TotalAmount: number;
}

interface User {
  id: string;
  username: string;
  full_name: string;
  display_name: string;
}

interface UserCategoryPieChartProps {
  users: User[];
}

type ChartType = 'pie' | 'bar' | 'line' | 'area';

const chartTypeOptions = [
  { value: 'pie', label: 'Pie Chart', icon: '🥧' },
  { value: 'bar', label: 'Bar Chart', icon: '📊' },
  { value: 'line', label: 'Line Chart', icon: '📈' },
  { value: 'area', label: 'Area Chart', icon: '🏔️' },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1'];

export default function UserCategoryPieChart({ users }: UserCategoryPieChartProps) {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [chartType, setChartType] = useState<ChartType>('pie');
  const [categoryData, setCategoryData] = useState<CategoryTotal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (users.length > 0 && !selectedUser) {
      setSelectedUser(users[0].username);
    }
  }, [users, selectedUser]);

  useEffect(() => {
    if (selectedUser) {
      fetchUserCategoryData(selectedUser);
    }
  }, [selectedUser]);

  const fetchUserCategoryData = async (username: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${username}/categories`);
      if (response.ok) {
        const data = await response.json();
        setCategoryData(data);
      } else {
        console.error('Failed to fetch user category data');
        setCategoryData([{ Category: 'No Data', TotalAmount: 0 }]);
      }
    } catch (error) {
      console.error('Error fetching user category data:', error);
      setCategoryData([{ Category: 'No Data', TotalAmount: 0 }]);
    } finally {
      setLoading(false);
    }
  };

  const formatTooltipValue = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{data.payload.Category}</p>
          <p className="text-blue-600">
            Amount: {formatTooltipValue(data.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap gap-4 justify-center mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderChart = () => {
    switch (chartType) {
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ Category, percent }) =>
                percent !== undefined && percent > 0.05 ? `${Category} ${(percent * 100).toFixed(0)}%` : ''
              }
              outerRadius={120}
              fill="#8884d8"
              dataKey="TotalAmount"
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        );
      
      case 'bar':
        return (
          <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis 
              dataKey="Category" 
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
            />
            <YAxis tickFormatter={(value) => formatTooltipValue(value)} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="TotalAmount" fill="#8884d8">
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        );
      
      case 'line':
        return (
          <LineChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis 
              dataKey="Category" 
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
            />
            <YAxis tickFormatter={(value) => formatTooltipValue(value)} />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="TotalAmount" 
              stroke="#8884d8" 
              strokeWidth={3}
              dot={{ fill: '#8884d8', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        );
      
      case 'area':
        return (
          <AreaChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis 
              dataKey="Category" 
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
            />
            <YAxis tickFormatter={(value) => formatTooltipValue(value)} />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="TotalAmount" 
              stroke="#8884d8" 
              fill="#8884d8" 
              fillOpacity={0.3}
            />
          </AreaChart>
        );
      
      
      
      default:
        return <></>;
    }
  };

  return (
    <div className="h-full">
      {/* Header with dropdown and chart type selector */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            User Invoice Categories
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
          
          {/* User Selector */}
          <div className="min-w-[200px]">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Select a user...</option>
              {users.map((user) => (
                <option key={user.id} value={user.username}>
                  {user.display_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Chart content */}
      <div className="h-[450px]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        ) : !selectedUser ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Please select a user to view their categories</p>
          </div>
        ) : categoryData.length === 0 || (categoryData.length === 1 && categoryData[0].Category === 'No Data') ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-gray-500">No category data found for {selectedUser}</p>
              <p className="text-sm text-gray-400 mt-1">This user hasn't uploaded any invoices yet</p>
            </div>
          </div>
        ) : (
          <div className="relative h-full">
            <ResponsiveContainer width="100%" height="85%">
              {renderChart()}
            </ResponsiveContainer>
            
            {/* Summary info inside chart container */}
            {selectedUser && categoryData.length > 0 && categoryData[0].Category !== 'No Data' && (
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 mx-4">
                <div className="text-sm text-gray-600 text-center">
                  <strong>{selectedUser}</strong> has uploaded invoices across{' '}
                  <strong>{categoryData.length}</strong> categories with a total value of{' '}
                  <strong>
                    {formatTooltipValue(
                      categoryData.reduce((sum, item) => sum + item.TotalAmount, 0)
                    )}
                  </strong>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
