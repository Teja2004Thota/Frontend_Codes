import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, HelpCircle, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import GeneralComplaints from '@/components/subadmin/GeneralComplaints';
import UncategorizedComplaints from '@/components/subadmin/UncategorizedComplaints';
import SubAdminProfile from '@/components/subadmin/SubAdminProfile';
import LogoutButton from '@/components/shared/LogoutButton';
import axios from 'axios';
import { API_PATHS } from '@/routes/paths';

const SubAdminDashboard = () => {
  const [activeSection, setActiveSection] = useState<'dashboard' | 'general' | 'solved' | 'assigned' | 'uncategorized' | 'profile'>('dashboard');
  const [dashboardStats, setDashboardStats] = useState({
    totalSolved: 0,
    uncategorized: 0,
    totalAssigned: 0,
    totalComplaints: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
  const token = localStorage.getItem('token');

  if (!token) {
    toast({
      title: 'Unauthorized',
      description: 'Please log in to view dashboard.',
      variant: 'destructive',
    });
    navigate('/login');
    return;
  }

  const fetchStats = async () => {
    try {
      const response = await axios.get(API_PATHS.subadmindashboard.summary, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDashboardStats({
        totalSolved: response.data.totalSolved || 0,
        uncategorized: response.data.uncategorized || 0,
        totalAssigned: response.data.totalAssigned || 0,
        totalComplaints: response.data.totalComplaints || 0,
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description:
          err.response?.status === 401
            ? 'Session expired. Please log in again.'
            : err.response?.data?.message || 'Failed to fetch dashboard stats',
        variant: 'destructive',
      });
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  fetchStats();

  // Set interval to refresh every 10 seconds
  const intervalId = setInterval(fetchStats, 5000); // 5,000 ms = 5 sec

  // Cleanup interval on unmount
  return () => clearInterval(intervalId);
}, [navigate]);

  const StatCard = ({ title, value, icon: Icon, color, bgColor }: any) => (
    <Card
      className={`hover:shadow-lg transition-all duration-200 cursor-pointer border-0 rounded-xl ${bgColor} bg-opacity-20`}
      onClick={() => setActiveSection(color.section)}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-700 uppercase tracking-wider">{title}</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">
              {loading ? '--' : value}
            </h3>
          </div>
          <div className={`p-3 rounded-lg ${bgColor} bg-opacity-30`}>
            <Icon className={`h-5 w-5 ${color.text}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const QuickActionCard = ({ title, description, icon: Icon, color, bgColor, section }: any) => (
    <Card
      className={`hover:shadow-lg transition-all duration-200 cursor-pointer border-0 rounded-xl ${bgColor} bg-opacity-20 group`}
      onClick={() => setActiveSection(section)}
    >
      <CardContent className="p-6 text-center">
        <div className={`p-3 rounded-lg ${bgColor} bg-opacity-30 mx-auto mb-3 w-12 h-12 flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${color.text}`} />
        </div>
        <h3 className="font-medium text-gray-800 mb-1">{title}</h3>
        <p className="text-xs text-gray-600">{description}</p>
      </CardContent>
    </Card>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'general':
        return <GeneralComplaints type="general" onBack={() => setActiveSection('dashboard')} />;
      case 'solved':
        return <GeneralComplaints type="solved" onBack={() => setActiveSection('dashboard')} />;
      case 'uncategorized':
        return <UncategorizedComplaints onBack={() => setActiveSection('dashboard')} />;
      case 'profile':
        return <SubAdminProfile onBack={() => setActiveSection('dashboard')} />;
      case 'assigned':
        return <GeneralComplaints type="assigned" onBack={() => setActiveSection('dashboard')} />;
      default:
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Complaint Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Complaints"
                  value={dashboardStats.totalComplaints}
                  icon={FileText}
                  color={{ text: 'text-blue-600', section: 'general' }}
                  bgColor="bg-blue-400"
                />
                <StatCard
                  title="Assigned to Me"
                  value={dashboardStats.totalAssigned}
                  icon={Users}
                  color={{ text: 'text-indigo-600', section: 'assigned' }}
                  bgColor="bg-indigo-400"
                />
                <StatCard
                  title="Solved by You"
                  value={dashboardStats.totalSolved}
                  icon={CheckCircle}
                  color={{ text: 'text-green-600', section: 'solved' }}
                  bgColor="bg-green-400"
                />
                <StatCard
                  title="Uncategorized"
                  value={dashboardStats.uncategorized}
                  icon={HelpCircle}
                  color={{ text: 'text-amber-600', section: 'uncategorized' }}
                  bgColor="bg-amber-400"
                />
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <QuickActionCard
                  title="General Complaints"
                  description="Review and resolve structured complaints"
                  icon={FileText}
                  color={{ text: 'text-blue-600' }}
                  bgColor="bg-blue-400"
                  section="general"
                />
                <QuickActionCard
                  title="Uncategorized"
                  description="Process unclear complaints"
                  icon={HelpCircle}
                  color={{ text: 'text-amber-600' }}
                  bgColor="bg-amber-400"
                  section="uncategorized"
                />
                <QuickActionCard
                  title="Profile Settings"
                  description="Update your account details"
                  icon={Users}
                  color={{ text: 'text-indigo-600' }}
                  bgColor="bg-indigo-400"
                  section="profile"
                />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">
                {activeSection === 'dashboard' ? 'Dashboard' : 
                 activeSection === 'general' ? 'General Complaints' :
                 activeSection === 'solved' ? 'Solved Complaints' :
                 activeSection === 'assigned' ? 'Assigned Complaints' :
                 activeSection === 'uncategorized' ? 'Uncategorized Complaints' : 'Profile'}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              {activeSection !== 'dashboard' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveSection('dashboard')}
                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  Back to Dashboard
                </Button>
              )}
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {renderActiveSection()}
      </main>
    </div>
  );
};

export default SubAdminDashboard;