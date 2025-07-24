import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
import { toast } from '@/hooks/use-toast';
import { API_PATHS } from '@/routes/paths';

interface AnalyticsData {
  totalComplaints: number;
  pendingComplaints: number;
  totalResolved: number;
  aiResolved: number;
  resolvedBySubAdmin: number;
  aiVsHuman: string;
  highPriority: number;
  totalUsers: number;
  totalSubAdmins: number;
  minorComplaints: number;
  majorComplaints: number;
  categories: { name: string; value: number; color: string }[];
  monthlyStats: { monthNum: number; month: string; raised: number; resolved: number }[];
  yearlyStats: { year: number; complaints: number; resolved: number }[];
  avgResolutionTime: number | null;
}

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast({ title: 'Error', description: 'Authentication token missing', variant: 'destructive' });
          return;
        }
        const monthYear = selectedMonth ? selectedMonth.split('-') : [];
        const month = monthYear[0] || '';
        const year = monthYear[1] || selectedYear;
        const res = await fetch(API_PATHS.admindashboard.getFilteredSummary(month, year), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setAnalyticsData(data);
          if (!selectedMonth && data.monthlyStats.length > 0) {
            setSelectedMonth(`${data.monthlyStats[0].month.toLowerCase()}-${year}`);
          }
        } else {
          toast({ title: 'Error', description: data.message || 'Failed to fetch analytics data', variant: 'destructive' });
        }
      } catch (err) {
        toast({ title: 'Error', description: 'Something went wrong while fetching analytics', variant: 'destructive' });
      }
    };
    fetchAnalyticsData();
  }, [selectedMonth, selectedYear]);

  // Generate available months and years
  const availableMonths = analyticsData?.monthlyStats.map(stat => ({
    value: `${stat.month.toLowerCase()}-${selectedYear}`,
    label: `${stat.month} ${selectedYear}`
  })) || [];

  const availableYears = Array.from(
    new Set(analyticsData?.yearlyStats.map(stat => stat.year.toString()) || [])
  ).sort((a, b) => Number(b) - Number(a));

  const monthlyReport = analyticsData
    ? {
        raised: analyticsData.totalComplaints,
        resolved: analyticsData.totalResolved,
        resolvedBySubAdmin: analyticsData.resolvedBySubAdmin,
        aiVsHuman: analyticsData.aiVsHuman,
        avgResolutionTime: analyticsData.avgResolutionTime ? `${analyticsData.avgResolutionTime} days` : 'N/A'
      }
    : {
        raised: 0,
        resolved: 0,
        resolvedBySubAdmin: 0,
        aiVsHuman: '0% AI, 0% Human',
        avgResolutionTime: 'N/A'
      };

  return (
    <div className="space-y-6">
      {/* Time-based Analytics Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics & Reports</CardTitle>
          <div className="flex gap-4 mt-4">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map((month, index) => (
                  <SelectItem key={index} value={month.value}>{month.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year, index) => (
                  <SelectItem key={index} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Monthly Report */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Report - {selectedMonth || 'Latest'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h3 className="text-2xl font-bold text-blue-600">{monthlyReport.raised}</h3>
              <p className="text-sm text-gray-600">Complaints Raised</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h3 className="text-2xl font-bold text-green-600">{monthlyReport.resolved}</h3>
              <p className="text-sm text-gray-600">Complaints Resolved</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <h3 className="text-2xl font-bold text-purple-600">{monthlyReport.resolvedBySubAdmin}</h3>
              <p className="text-sm text-gray-600">Resolved by SubAdmin</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <h3 className="text-2xl font-bold text-orange-600">{monthlyReport.aiVsHuman}</h3>
              <p className="text-sm text-gray-600">AI vs Human Ratio</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <h3 className="text-2xl font-bold text-red-600">{monthlyReport.avgResolutionTime}</h3>
              <p className="text-sm text-gray-600">Avg Resolution Time</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Complaint Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData?.categories || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {analyticsData?.categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData?.monthlyStats || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="raised" fill="#8884d8" name="Raised" />
                <Bar dataKey="resolved" fill="#82ca9d" name="Resolved" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Yearly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Yearly Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData?.yearlyStats || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="complaints" stroke="#8884d8" name="Total Complaints" />
              <Line type="monotone" dataKey="resolved" stroke="#82ca9d" name="Resolved" />
            </LineChart>
          </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
  );
};

export default Analytics;