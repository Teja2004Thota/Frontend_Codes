import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { API_PATHS } from '@/routes/paths';
import { Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

interface UserSummary {
  id: number;
  name: string;
  staffNo: string;
  totalComplaints: number;
  resolved: number;
  pending: number;
  lastComplaintAt: string;
}

const ITEMS_PER_PAGE = 10;

const UserManagement = () => {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(API_PATHS.admindashboard.getUserSummary, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.users);
      } else {
        console.error('Failed to load user summary');
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (staffNo: string, name: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete ${name}?`);
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_PATHS.admindashboard.deleteUser(staffNo), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Deleted user: ${name}`);
        fetchUsers(); // refresh user list
      } else {
        toast.error(data.message || 'Failed to delete user');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while deleting the user');
    }
  };

  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);
  const paginatedUsers = users.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Staff No</TableHead>
                <TableHead>Total Complaints</TableHead>
                <TableHead>Resolved</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead>Last Complaint</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.map((user, index) => (
                <TableRow key={user.id}>
                  <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.staffNo}</TableCell>
                  <TableCell>{user.totalComplaints}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800">{user.resolved}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        user.pending > 0
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }
                    >
                      {user.pending}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.lastComplaintAt}</TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDeleteUser(user.staffNo, user.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          <div className="flex justify-center gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="px-2 py-1 border rounded">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
