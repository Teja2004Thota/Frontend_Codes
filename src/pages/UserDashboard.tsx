import LogoutButton from '@/components/shared/LogoutButton';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText, CheckCircle, AlertCircle, Calendar,
  Plus, Search, User, Settings
} from 'lucide-react';

import CreateComplaint from '@/components/user/create/CreateComplaint';
import ManageComplaints from '@/components/user/manage/ManageComplaints';
import TrackComplaints from '@/components/user/track/TrackComplaints';
import ProfileManager from '@/components/user/profile/ProfileManager';
import { API_PATHS } from '@/routes/paths';

type ViewSection = 'dashboard' | 'create' | 'manage' | 'track' | 'profile';
type FilterType = 'all' | 'month' | 'resolved' | 'unresolved' | undefined;

const Index = () => {
  const [activeSection, setActiveSection] = useState<{ view: ViewSection; filter?: FilterType }>({ view: 'dashboard' });

  const [dashboardStats, setDashboardStats] = useState({
    total: 0,
    resolved: 0,
    unresolved: 0,
    thisMonth: 0,
  });

 useEffect(() => {
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_PATHS.userdashboard.summary, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDashboardStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching dashboard summary', err);
    }
  };

  fetchStats(); // Fetch on mount

  const intervalId = setInterval(fetchStats, 5000); // Refresh every 5 seconds

  return () => clearInterval(intervalId); // Cleanup on unmount
}, []);

  const StatCard = ({ title, value, icon: Icon, color, onClick }: any) => (
    <Card
      onClick={onClick}
      className="hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer border-none shadow-lg bg-white dark:bg-gray-800 rounded-2xl"
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <div className="flex items-center gap-2 mt-2">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</h3>
            </div>
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const QuickActionCard = ({ title, description, icon: Icon, onClick, color }: any) => (
    <Card
      onClick={onClick}
      className="hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer border-none shadow-lg bg-white dark:bg-gray-800 rounded-2xl group"
    >
      <CardContent className="p-6 text-center">
        <div className={`p-4 rounded-full ${color} mx-auto mb-4 w-16 h-16 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="h-8 w-8 text-white" />
        </div>
        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </CardContent>
    </Card>
  );

  const renderActiveSection = () => {
    switch (activeSection.view) {
      case 'create':
        return <CreateComplaint onBack={() => setActiveSection({ view: 'dashboard' })} />;
      case 'manage':
        return (
          <ManageComplaints
            onBack={() => setActiveSection({ view: 'dashboard' })}
            filter={
              activeSection.filter === 'all' || activeSection.filter === 'month'
                ? activeSection.filter
                : undefined
            }
          />
        );
      case 'track':
        return (
          <TrackComplaints
            onBack={() => setActiveSection({ view: 'dashboard' })}
            filter={
              activeSection.filter === 'all' ||
              activeSection.filter === 'resolved' ||
              activeSection.filter === 'unresolved'
                ? activeSection.filter
                : undefined
            }
          />
        );
      case 'profile':
        return <ProfileManager onBack={() => setActiveSection({ view: 'dashboard' })} />;
      default:
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Complaints Raised"
                value={dashboardStats.total}
                icon={FileText}
                color="bg-gradient-to-r from-blue-500 to-blue-600"
                onClick={() => setActiveSection({ view: 'manage', filter: 'all' })}
              />
              <StatCard
                title="Resolved Complaints"
                value={dashboardStats.resolved}
                icon={CheckCircle}
                color="bg-gradient-to-r from-green-500 to-green-600"
                onClick={() => setActiveSection({ view: 'track', filter: 'resolved' })}
              />
              <StatCard
                title="Unresolved Complaints"
                value={dashboardStats.unresolved}
                icon={AlertCircle}
                color="bg-gradient-to-r from-red-500 to-red-600"
                onClick={() => setActiveSection({ view: 'track', filter: 'unresolved' })}
              />
              <StatCard
                title="Complaints This Month"
                value={dashboardStats.thisMonth}
                icon={Calendar}
                color="bg-gradient-to-r from-purple-500 to-purple-600"
                onClick={() => setActiveSection({ view: 'manage', filter: 'month' })}
              />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <QuickActionCard
                  title="📝 Create Complaint"
                  description="File a new complaint with guided assistance"
                  icon={Plus}
                  color="bg-gradient-to-r from-emerald-500 to-emerald-600"
                  onClick={() => setActiveSection({ view: 'create' })}
                />
                <QuickActionCard
                  title="🗂️ Manage Complaints"
                  description="Edit and delete your recent complaints"
                  icon={Settings}
                  color="bg-gradient-to-r from-orange-500 to-orange-600"
                  onClick={() => setActiveSection({ view: 'manage' })}
                />
                <QuickActionCard
                  title="📍 Track Complaints"
                  description="Monitor status and resolution progress"
                  icon={Search}
                  color="bg-gradient-to-r from-cyan-500 to-cyan-600"
                  onClick={() => setActiveSection({ view: 'track' })}
                />
                <QuickActionCard
                  title="👤 Profile"
                  description="Manage your account and preferences"
                  icon={User}
                  color="bg-gradient-to-r from-indigo-500 to-indigo-600"
                  onClick={() => setActiveSection({ view: 'profile' })}
                />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {{
                  dashboard: 'Complaint Management Dashboard',
                  create: 'Create New Complaint',
                  manage: 'Manage Complaints',
                  track: 'Track Complaints',
                  profile: 'User Profile'
                }[activeSection.view]}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {{
                  dashboard: "Welcome back! Here's your complaint overview.",
                  create: 'Let us help you resolve your issue efficiently',
                  manage: 'Edit or delete your recent complaints',
                  track: 'Monitor your complaint resolution progress',
                  profile: 'Manage your account settings'
                }[activeSection.view]}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {activeSection.view !== 'dashboard' && (
                <Button
                  variant="outline"
                  onClick={() => setActiveSection({ view: 'dashboard' })}
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  ← Back to Dashboard
                </Button>
              )}
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-300">
        {renderActiveSection()}
      </div>
    </div>
  );
};

export default Index;
