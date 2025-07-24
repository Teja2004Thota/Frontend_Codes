import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_PATHS } from '@/routes/paths';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';

const AdminManagement = () => {
  const [admins, setAdmins] = useState<any[]>([]);

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(API_PATHS.admindashboard.getAllAdmins, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setAdmins(res.data.admins);
      } else {
        toast.error(res.data.message || 'Failed to fetch admins');
      }
    } catch (err) {
      toast.error('Something went wrong while fetching admin profiles');
    }
  };

  const handleResetPassword = async (staffNo: string, name: string) => {
    const newPassword = prompt(`Enter new password for ${name}:`);
    const confirmPassword = prompt(`Confirm new password for ${name}:`);

    if (!newPassword || !confirmPassword) {
      toast.error('Password fields cannot be empty');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        API_PATHS.auth.resetAdminPassword,
        { staffNo, newPassword, confirmPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.success(`Password reset successful for ${name}`);
      } else {
        toast.error(res.data.message || 'Password reset failed');
      }
    } catch (err) {
      toast.error('Error resetting admin password');
    }
  };

  const handleDeleteAdmin = async (staffNo: string, name: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete ${name}?`);
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`${API_PATHS.admindashboard.base}/admins/${staffNo}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        toast.success(`${name} deleted successfully`);
        fetchAdmins(); // Refresh list
      } else {
        toast.error(res.data.message || 'Failed to delete admin');
      }
    } catch (err) {
      toast.error('Error deleting admin');
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Admin Team</h2>

        {admins.length === 0 ? (
          <p className="text-gray-500">No admin profiles found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-gray-500 border">
              <thead className="bg-gray-100 text-gray-700 uppercase text-xs border-b">
                <tr>
                  <th className="px-4 py-2">S.No</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Department</th>
                  <th className="px-4 py-2">Designation</th>
                  <th className="px-4 py-2">Staff Number</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin, i) => (
                  <tr key={admin.admin_id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{i + 1}</td>
                    <td className="px-4 py-2 font-medium text-gray-800">{admin.name}</td>
                    <td className="px-4 py-2">{admin.department}</td>
                    <td className="px-4 py-2">{admin.designation}</td>
                    <td className="px-4 py-2">{admin.staffNo}</td>
                    <td className="px-4 py-2 space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetPassword(admin.staffNo, admin.name)}
                      >
                        Reset
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleDeleteAdmin(admin.staffNo, admin.name)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminManagement;
