// Imports remain unchanged
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText, Clock, Bot, Users, UserCheck, UserPlus, Shield, Activity, FileBarChart2, CheckCircle
} from 'lucide-react';

import AdminOverview from '@/components/admin/AdminOverview';
import AllComplaints from '@/components/admin/AllComplaints';
import SubAdminManagement from '@/components/admin/SubAdminManagement';
import UserManagement from '@/components/admin/UserManagement';
import AdminManagement from '@/components/admin/AdminManagement';
import Analytics from '@/components/admin/Analytics';
import Reports from '@/components/admin/Reports';
import CreateUser from '@/components/admin/CreateUser';
import DatabaseUpdate from '@/components/admin/DatabaseUpdate';
import LogoutButton from '@/components/shared/LogoutButton';
import axios from 'axios';
import { API_PATHS } from '@/routes/paths';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const [highPriorityComplaints, setHighPriorityComplaints] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [dashboardStats, setDashboardStats] = useState({
    totalComplaints: 0,
    pendingComplaints: 0,
    totalResolved: 0,
    aiResolved: 0,
    highPriority: 0,
    totalUsers: 0,
    totalAdmins: 0,
    totalSubAdmins: 0,
    activeThisMonth: 0,
    categories: [],
    monthlyStats: [],
    avgResolutionTime: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(API_PATHS.admindashboard.summary, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setDashboardStats(data);
        } else {
          toast.error(data.message || 'Failed to fetch dashboard stats');
        }
      } catch (err) {
        toast.error('Something went wrong while fetching stats');
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setStatusFilter('all');
    setPriorityFilter('all');
    setActiveTab('complaints');
  };

  const handleComplaintsClick = () => {
    setHighPriorityComplaints([]);
    setSelectedCategory(undefined);
    setStatusFilter('all');
    setPriorityFilter('all');
    setActiveTab('complaints');
  };

  const handlePendingClick = () => {
    setHighPriorityComplaints([]);
    setSelectedCategory(undefined);
    setStatusFilter('Pending');
    setPriorityFilter('all');
    setActiveTab('complaints');
  };

  const handleResolvedClick = () => {
    setHighPriorityComplaints([]);
    setSelectedCategory(undefined);
    setStatusFilter('Resolved');
    setPriorityFilter('all');
    setActiveTab('complaints');
  };

  const handleHighPriorityClick = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_PATHS.admindashboard.getHighPriorityComplaints, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.complaints)) {
        if (data.complaints.length === 0) toast.info('No high priority complaints found.');
        setHighPriorityComplaints(data.complaints);
        setSelectedCategory('HIGH_PRIORITY_TOP_DEPTS');
        setStatusFilter('all');
        setPriorityFilter('all');
        setActiveTab('high-priority');
      } else {
        toast.error(data.message || 'Failed to fetch high priority complaints');
      }
    } catch (error) {
      toast.error('Something went wrong while fetching high priority complaints');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(API_PATHS.admindashboard.importUsers, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { created, updated, failed } = res.data;
      toast.success(`${created} created, ${updated} updated, ${failed.length} failed.`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Something went wrong during import');
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, onClick }: any) => (
    <Card
      className={`hover:shadow-md transition-all duration-200 cursor-pointer border-l-4 ${color.border} bg-white`}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{value}</h3>
          </div>
          <div className={`p-2 rounded-md ${color.bg} bg-opacity-10`}>
            <Icon className={`h-5 w-5 ${color.icon}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

const renderTabContent = () => {
  switch (activeTab) {
    case 'overview':
      return <AdminOverview stats={dashboardStats} onCategoryClick={handleCategoryClick} />;
    case 'complaints':
      return <AllComplaints selectedCategory={selectedCategory} statusFilter={statusFilter} priorityFilter={priorityFilter} />;
    case 'high-priority':
      return <AllComplaints selectedCategory="HIGH_PRIORITY_TOP_DEPTS" complaintsDataOverride={highPriorityComplaints} statusFilter="all" priorityFilter="all" />;
    case 'subadmins':
      return <SubAdminManagement />;
    case 'users':
      return <UserManagement />;
    case 'analytics':
      return <Analytics />;
    case 'reports':
      return <Reports />;
    case 'db-update':
      return <DatabaseUpdate />;
    case 'create-user':
      return <CreateUser onBack={() => setActiveTab('overview')} />;
    case 'admin-management':
      return <AdminManagement />;
    default:
      return <AdminOverview stats={dashboardStats} onCategoryClick={handleCategoryClick} />;
  }
};


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-50">
              <Shield className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">System administration and monitoring</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button onClick={() => setActiveTab('create-user')} className="bg-indigo-600 text-white">
              <UserPlus className="h-4 w-4 mr-2" />
              Create User
            </Button>
            <Button onClick={() => document.getElementById('fileInput')?.click()} variant="outline" className="text-indigo-600 border-indigo-600">
              📥 Import Users
            </Button>
            <input type="file" id="fileInput" hidden accept=".xlsx,.csv" onChange={handleFileUpload} />
            <LogoutButton />
            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center cursor-pointer text-sm font-semibold" title="Admin Management" onClick={() => setActiveTab('admin-management')}>
              AD
            </div>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <div className="px-6 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Complaints" value={dashboardStats.totalComplaints} icon={FileText} color={{ border: 'border-blue-500', bg: 'bg-blue-500', icon: 'text-blue-600' }} onClick={handleComplaintsClick} />
        <StatCard title="Pending Resolution" value={dashboardStats.pendingComplaints} icon={Clock} color={{ border: 'border-yellow-500', bg: 'bg-yellow-500', icon: 'text-yellow-600' }} onClick={handlePendingClick} />
        <StatCard title="Total Resolved" value={dashboardStats.totalResolved} icon={CheckCircle} color={{ border: 'border-green-500', bg: 'bg-green-500', icon: 'text-green-600' }} onClick={handleResolvedClick} />
        <StatCard title="High Priority" value={dashboardStats.highPriority} icon={Activity} color={{ border: 'border-red-500', bg: 'bg-red-500', icon: 'text-red-600' }} onClick={handleHighPriorityClick} />
        <StatCard title="AI Resolved" value={dashboardStats.aiResolved} icon={Bot} color={{ border: 'border-purple-500', bg: 'bg-purple-500', icon: 'text-purple-600' }} onClick={() => setActiveTab('analytics')} />
      </div>

      <div className="flex px-6 py-6">
        <div className="w-1/5 pr-6 space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 font-medium text-gray-800">User Management</h3>
              <StatCard title="Total Users" value={dashboardStats.totalUsers} icon={Users} color={{ border: 'border-green-500', bg: 'bg-green-500', icon: 'text-green-600' }} onClick={() => setActiveTab('users')} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 font-medium text-gray-800">Admin Team</h3>
              <StatCard title="Total Admins" value={dashboardStats.totalAdmins} icon={UserCheck} color={{ border: 'border-teal-500', bg: 'bg-teal-500', icon: 'text-teal-600' }} onClick={() => setActiveTab('admin-management')} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 font-medium text-gray-800">SubAdmin Team</h3>
              <StatCard title="Total SubAdmins" value={dashboardStats.totalSubAdmins} icon={UserCheck} color={{ border: 'border-indigo-500', bg: 'bg-indigo-500', icon: 'text-indigo-600' }} onClick={() => setActiveTab('subadmins')} />
            </CardContent>
          </Card>
        </div>

        <div className="w-4/5 pl-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 lg:grid-cols-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="complaints">Complaints</TabsTrigger>
              <TabsTrigger value="high-priority">High Priority</TabsTrigger>
              <TabsTrigger value="subadmins">SubAdmins</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="db-update">DB Update</TabsTrigger>
            </TabsList>
            <div className="mt-4">
              <Card>
                <CardContent className="p-6">{renderTabContent()}</CardContent>
              </Card>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
