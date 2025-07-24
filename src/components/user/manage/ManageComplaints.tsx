import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import axios from 'axios';
import { API_PATHS } from '@/routes/paths';

interface Complaint {
  id: number;
  description: string;
  main_issue_name: string;
  related_issue_name: string;
  sub_related_issue_name: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
  priority: string;
}

interface ManageComplaintsProps {
  onBack: () => void;
  filter?: 'all' | 'month';
}

const ManageComplaints = ({ onBack, filter }: ManageComplaintsProps) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [timeLeft, setTimeLeft] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(API_PATHS.userdashboard.allComplaints, {
          headers: { Authorization: `Bearer ${token}` },
        });

        let filteredComplaints = response.data.complaints;

        if (filter === 'month') {
          const now = new Date();
          filteredComplaints = filteredComplaints.filter((c: Complaint) => {
            const created = new Date(c.created_at);
            return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
          });
        }

        setComplaints(filteredComplaints);
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to fetch complaints.',
          variant: 'destructive',
        });
      }
    };

    fetchComplaints();
  }, [filter]);

  useEffect(() => {
    const interval = setInterval(() => {
      const updated: { [key: number]: number } = {};
      complaints.forEach((c) => {
        const elapsed = Date.now() - new Date(c.created_at).getTime();
        const remaining = Math.max(0, 5 * 60 * 1000 - elapsed);
        updated[c.id] = remaining;
      });
      setTimeLeft(updated);
    }, 1000);

    return () => clearInterval(interval);
  }, [complaints]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Open':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Closed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Manage Your Complaints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-medium text-gray-900">S.No</th>
                  <th className="text-left p-3 font-medium text-gray-900">Complaint ID</th>
                  <th className="text-left p-3 font-medium text-gray-900">Description</th>
                  <th className="text-left p-3 font-medium text-gray-900">Main Issue</th>
                  <th className="text-left p-3 font-medium text-gray-900">Related Issue</th>
                  <th className="text-left p-3 font-medium text-gray-900">Sub-Related Issue</th>
                  <th className="text-left p-3 font-medium text-gray-900">Status</th>
                  <th className="text-left p-3 font-medium text-gray-900">Created At</th>
                  <th className="text-left p-3 font-medium text-gray-900">Updated At</th>
                  <th className="text-left p-3 font-medium text-gray-900">Priority</th>
                </tr>
              </thead>
              <tbody>
  {complaints.map((complaint, index) => (
    <tr
      key={complaint.id}
      className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
    >
      <td className="p-3">{index + 1}</td>
      <td className="p-3 text-sm text-muted-foreground">{complaint.id}</td> {/* ✅ Complaint ID */}
      <td className="p-3 max-w-xs">
        <p className="text-sm text-gray-900 line-clamp-2">{complaint.description}</p>
      </td>
      <td className="p-3">
        <Badge variant="outline" className="text-xs">{complaint.main_issue_name}</Badge>
      </td>
      <td className="p-3">
        <Badge variant="outline" className="text-xs">{complaint.related_issue_name}</Badge>
      </td>
      <td className="p-3">
        <Badge variant="outline" className="text-xs">
          {complaint.sub_related_issue_name || 'Others'}
        </Badge>
      </td>
      <td className="p-3">
        <Badge className={`text-xs ${getStatusColor(complaint.status)}`}>
          {complaint.status}
        </Badge>
      </td>
      <td className="p-3">
        <p className="text-sm text-gray-900">{new Date(complaint.created_at).toLocaleDateString()}</p>
        <p className="text-xs text-gray-500">{new Date(complaint.created_at).toLocaleTimeString()}</p>
      </td>
      <td className="p-3">
        <p className="text-sm text-gray-900">{complaint.updated_at ? new Date(complaint.updated_at).toLocaleDateString() : '-'}</p>
        <p className="text-xs text-gray-500">{complaint.updated_at ? new Date(complaint.updated_at).toLocaleTimeString() : '-'}</p>
      </td>
      <td className="p-3">
        <Badge className={`text-xs ${getPriorityColor(complaint.priority)}`}>{complaint.priority}</Badge>
      </td>
    </tr>
  ))}
</tbody>

            </table>
          </div>
        </CardContent>
      </Card>

      {complaints.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-lg font-medium text-gray-600">No complaints to manage</p>
            <p className="text-sm text-gray-400">Create your first complaint to see it here</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ManageComplaints;
