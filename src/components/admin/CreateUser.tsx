import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import axios from 'axios';
import { API_PATHS } from '@/routes/paths';
import { toast } from 'react-toastify'; // ✅ import toast from react-toastify
import 'react-toastify/dist/ReactToastify.css'; // ✅ import CSS once in your root layout

const CreateUser = ({ onBack }: { onBack: () => void }) => {
  const [formData, setFormData] = useState({
    staffNo: '',
    role: 'user',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { staffNo, password, role } = formData;

    if (!staffNo || !role || (role !== 'user' && !password)) {
      toast.error('Please fill all required fields. Password is optional for Users.');
      return;
    }

    try {
      await axios.post(API_PATHS.admindashboard.createUser, formData);

      toast.success(`User (${role}) created successfully.`);

      setFormData({ staffNo: '', role: 'user', password: '' });

      setTimeout(() => {
        onBack();
      }, 800);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create user.');
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New User</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="staffNo">Staff Number *</Label>
            <Input
              id="staffNo"
              value={formData.staffNo}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, staffNo: e.target.value }))
              }
              placeholder="e.g., 450066"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              value={formData.role}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, role: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="subadmin">SubAdmin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Password{' '}
              {formData.role === 'user' && (
                <span className="text-xs text-gray-500">(optional)</span>
              )}
            </Label>
            <div className="flex gap-2">
              <Input
                id="password"
                type="text"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    password: e.target.value
                  }))
                }
                placeholder={
                  formData.role === 'user'
                    ? 'Optional for User'
                    : 'Required for Admin/Subadmin'
                }
                required={formData.role !== 'user'}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1">
              Create User
            </Button>
            <Button type="button" variant="outline" onClick={onBack}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateUser;
