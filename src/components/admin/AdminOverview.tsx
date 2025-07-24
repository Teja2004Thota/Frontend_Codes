import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface CategoryData {
  category: string;
  value: number;
}

interface MonthlyStat {
  month: string;
  raised: number;
  resolved: number;
}

interface FeedbackStat {
  label: string;
  count: number;
}

interface FeedbackBySubadmin {
  subadminName: string;
  label: string;
  count: number;
}

interface AdminStats {
  categories?: CategoryData[];
  monthlyStats?: MonthlyStat[];
  minorComplaints?: number;
  majorComplaints?: number;
  feedbackStats?: FeedbackStat[];
  feedbackBySubadmin?: FeedbackBySubadmin[];
}

interface AdminOverviewProps {
  stats: AdminStats;
  onCategoryClick: (category: string) => void;
}

const AdminOverview = ({ stats, onCategoryClick }: AdminOverviewProps) => {
  const colors = [
    '#8884d8',
    '#82ca9d',
    '#ffc658',
    '#ff7300',
    '#00c49f',
    '#ff8c00',
    '#a4de6c',
    '#d0ed57',
    '#36A2EB',
    '#FF6384',
  ];

  const issueData =
    stats.categories?.map((item, index) => ({
      name: item.category || 'Others',
      value: item.value,
      color: colors[index % colors.length],
    })) || [];

  const monthlyData = stats.monthlyStats || [];

  const severityData = [
    { name: 'Minor', value: stats.minorComplaints || 0 },
    { name: 'Major', value: stats.majorComplaints || 0 },
  ];

  const feedbackData = stats.feedbackStats || [];

  const groupedFeedback =
    stats.feedbackBySubadmin?.reduce<Record<string, any>>((acc, curr) => {
      if (!acc[curr.subadminName]) {
        acc[curr.subadminName] = { subadminName: curr.subadminName };
      }
      acc[curr.subadminName][curr.label] = curr.count;
      return acc;
    }, {}) || {};

  const feedbackChartData = Object.values(groupedFeedback);

  const uniqueLabels = Array.from(
    new Set(stats.feedbackBySubadmin?.map(item => item.label) || [])
  );

  return (
    <div className="space-y-6">
      {/* Complaint Categories & Monthly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Complaint Categories Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Complaint Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={issueData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label
                >
                  {issueData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      cursor="pointer"
                      onClick={() => onCategoryClick(entry.name)}
                      className="transition-opacity duration-200 hover:opacity-80"
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trends Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
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

      {/* Complaint Severity & Feedback Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Complaint Severity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Complaint Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    <Cell fill="#36A2EB" />
                    <Cell fill="#FF6384" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <h3 className="text-xl font-semibold text-blue-600">
                  {severityData[0].value}
                </h3>
                <p className="text-sm text-gray-600">Minor Complaints</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <h3 className="text-xl font-semibold text-red-600">
                  {severityData[1].value}
                </h3>
                <p className="text-sm text-gray-600">Major Complaints</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Summary Pie Chart */}
        {feedbackData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>User Feedback Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={feedbackData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="count"
                    nameKey="label"
                    label
                  >
                    {feedbackData.map((entry, index) => (
                      <Cell
                        key={`feedback-cell-${index}`}
                        fill={colors[index % colors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Feedback Breakdown by Subadmin */}
      {feedbackChartData.length > 0 && (
        <div className="grid grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle>Subadmin Feedback Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={feedbackChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subadminName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {uniqueLabels.map((label, index) => (
                    <Bar
                      key={label}
                      dataKey={label}
                      stackId="a"
                      fill={colors[index % colors.length]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminOverview;
