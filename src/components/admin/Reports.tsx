import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Calendar, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { API_PATHS } from '@/routes/paths';

interface Complaint {
  id: number;
  complaintId: string;
  userName: string;
  userRole: string;
  mainIssue: string;
  relatedIssue: string;
  status: string;
  priority: string;
  createdAt: string;
  resolvedAt: string | null;
  assignedTo: string | null;
  resolutionType: string;
}

interface SummaryData {
  totalComplaints: number;
  totalResolved: number;
  aiResolved: number;
  avgResolutionTime: number | null;
}

const Reports = () => {
  const [dateRange, setDateRange] = useState('this-month');
  const [userRole, setUserRole] = useState('all');
  const [complaintType, setComplaintType] = useState('all');
  const [reportData, setReportData] = useState<Complaint[]>([]);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);

  // Fetch complaints and summary data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast({ title: 'Error', description: 'Authentication token missing', variant: 'destructive' });
          return;
        }

        // Determine date range for filtering
        const now = new Date();
        let startDate: Date, endDate: Date;
        switch (dateRange) {
          case 'this-week':
            startDate = subDays(now, 7);
            endDate = now;
            break;
          case 'this-month':
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
            break;
          case 'last-month':
            startDate = startOfMonth(subMonths(now, 1));
            endDate = endOfMonth(subMonths(now, 1));
            break;
          case 'this-year':
            startDate = startOfYear(now);
            endDate = endOfYear(now);
            break;
          default:
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
        }

        // Fetch complaints
        const complaintsRes = await fetch(API_PATHS.admindashboard.getAllComplaints, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const complaintsData = await complaintsRes.json();
        if (!complaintsRes.ok || !complaintsData.success) {
          throw new Error(complaintsData.message || 'Failed to fetch complaints');
        }

        // Fetch summary for the selected date range
        const month = dateRange === 'this-month' || dateRange === 'last-month' ? format(startDate, 'MMMM') : '';
        const year = format(startDate, 'yyyy');
        const summaryRes = await fetch(API_PATHS.admindashboard.getFilteredSummary(month, year), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const summaryData = await summaryRes.json();
        if (!summaryRes.ok || !summaryData.success) {
          throw new Error(summaryData.message || 'Failed to fetch summary');
        }

        // Filter complaints based on userRole and complaintType
        let filteredComplaints = complaintsData.complaints.map((c: any) => ({
          id: c.id,
          complaintId: `CMP${c.id.toString().padStart(3, '0')}`,
          userName: c.userName || 'Unknown',
          userRole: c.user_id ? 'User' : 'Unknown',
          mainIssue: c.mainIssue || 'N/A',
          relatedIssue: c.relatedIssue || 'N/A',
          status: c.status,
          priority: c.priority || 'Unknown',
          createdAt: c.created_at ? format(new Date(c.created_at), 'yyyy-MM-dd') : 'N/A',
          resolvedAt: c.updated_at && c.status === 'Closed' ? format(new Date(c.updated_at), 'yyyy-MM-dd') : null,
          assignedTo: c.assignedTo || 'N/A',
          resolutionType: c.is_ai_resolved ? 'AI' : c.done_by_id ? 'Human' : 'N/A',
        }));

        if (userRole !== 'all') {
          filteredComplaints = filteredComplaints.filter((c: Complaint) => c.userRole.toLowerCase() === userRole);
        }

        if (complaintType !== 'all') {
          filteredComplaints = filteredComplaints.filter((c: Complaint) => {
            if (complaintType === 'ai-resolved') return c.resolutionType === 'AI';
            if (complaintType === 'human-resolved') return c.resolutionType === 'Human';
            if (complaintType === 'unresolved') return c.status !== 'Closed';
            return true;
          });
        }

        // Apply date range filter
        filteredComplaints = filteredComplaints.filter((c: Complaint) => {
          const createdAt = new Date(c.createdAt);
          return createdAt >= startDate && createdAt <= endDate;
        });

        setReportData(filteredComplaints);
        setSummaryData({
          totalComplaints: summaryData.totalComplaints,
          totalResolved: summaryData.totalResolved,
          aiResolved: summaryData.aiResolved,
          avgResolutionTime: summaryData.avgResolutionTime,
        });
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to fetch report data', variant: 'destructive' });
      }
    };
    fetchData();
  }, [dateRange, userRole, complaintType]);

  const generateReport = () => {
    toast({
      title: 'Report Generated',
      description: 'Report has been generated based on your filters.',
    });
  };

  const downloadReport = (format: string) => {
    const data = reportData.map((item) => ({
      'Complaint ID': item.complaintId,
      'User Name': item.userName,
      'User Role': item.userRole,
      'Main Issue': item.mainIssue,
      'Related Issue': item.relatedIssue,
      Status: item.status,
      Priority: item.priority,
      'Created At': item.createdAt,
      'Resolved At': item.resolvedAt || 'N/A',
      'Resolved By': item.assignedTo,
      'Resolution Type': item.resolutionType,
    }));

    if (format === 'xlsx' || format === 'csv') {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      XLSX.writeFile(wb, `Complaint_Report_${format}_${new Date().toISOString().split('T')[0]}.${format}`);
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.text('Complaint Report', 14, 20);
      autoTable(doc, {
        head: [['Complaint ID', 'User Name', 'User Role', 'Main Issue', 'Related Issue', 'Status', 'Priority', 'Created At', 'Resolved At', 'Resolved By', 'Resolution Type']],
        body: data.map((item) => [
          item['Complaint ID'],
          item['User Name'],
          item['User Role'],
          item['Main Issue'],
          item['Related Issue'],
          item.Status,
          item.Priority,
          item['Created At'],
          item['Resolved At'],
          item['Resolved By'],
          item['Resolution Type'],
        ]),
        startY: 30,
      });
      doc.save(`Complaint_Report_PDF_${new Date().toISOString().split('T')[0]}.pdf`);
    }

    toast({
      title: 'Download Started',
      description: `Report is being downloaded in ${format.toUpperCase()} format.`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Closed':
        return 'bg-green-100 text-green-800';
      case 'Open':
      case 'Assigned':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Generation Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Reports Generation Panel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this-week">This Week</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="this-year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">User Role</label>
              <Select value={userRole} onValueChange={setUserRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="subadmin">SubAdmin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Complaint Type</label>
              <Select value={complaintType} onValueChange={setComplaintType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select complaint type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="ai-resolved">AI-Resolved</SelectItem>
                  <SelectItem value="human-resolved">Human-Resolved</SelectItem>
                  <SelectItem value="unresolved">Unresolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Action</label>
              <Button onClick={generateReport} className="w-full">
                Generate Report
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => downloadReport('pdf')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => downloadReport('xlsx')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Excel
            </Button>
            <Button
              variant="outline"
              onClick={() => downloadReport('csv')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-blue-600">{summaryData?.totalComplaints || 0}</h3>
            <p className="text-sm text-gray-600">Total Complaints</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-green-600">{summaryData?.totalResolved || 0}</h3>
            <p className="text-sm text-gray-600">Resolved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-purple-600">
              {summaryData?.totalResolved ? `${Math.round((summaryData.aiResolved / summaryData.totalResolved) * 100)}%` : '0%'}
            </h3>
            <p className="text-sm text-gray-600">AI Resolution Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-orange-600">
              {summaryData?.avgResolutionTime ? `${summaryData.avgResolutionTime} days` : 'N/A'}
            </h3>
            <p className="text-sm text-gray-600">Avg Resolution</p>
          </CardContent>
        </Card>
      </div>

      {/* Report Data Table */}
      
    </div>
  );
};

export default Reports;