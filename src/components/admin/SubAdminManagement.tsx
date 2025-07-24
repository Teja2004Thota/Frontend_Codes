import { useState, useEffect } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import { API_PATHS } from '@/routes/paths';

interface MainIssueStat {
  issue: string;
  issueId: number;
  count: number;
}

interface Complaint {
  id: number;
  description: string;
  created_at: string;
  updated_at: string;
  status: string;
  directSolution?: string;
  mainIssue?: string;
  relatedIssue?: string;
  subRelatedIssue?: string;
  issueDescription?: string;
  solutionSteps?: string[];
}

interface SubAdmin {
  subadminId: number;
  name: string;
  staffNo: string;
  role: string;
  department?: string;
  totalSolved: number;
  avgResolutionDays: number | null;
  mainIssueStats?: MainIssueStat[];
}

const SubAdminManagement = () => {
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [selectedSubAdmin, setSelectedSubAdmin] = useState<SubAdmin | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<MainIssueStat | null>(null);
  const [issueComplaints, setIssueComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    const fetchSubAdmins = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(API_PATHS.admindashboard.getSubadminDashboardData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setSubAdmins(data.subadmins);
        } else {
          console.error('Failed to fetch subadmin data');
        }
      } catch (error) {
        console.error('Fetch error:', error);
      }
    };
    fetchSubAdmins();
  }, []);

  const renderSolution = (comp: any) => {
    const details: string[] = [];

    if (comp.mainIssue) details.push(`Main Issue: ${comp.mainIssue}`);
    if (comp.relatedIssue) details.push(`Related Issue: ${comp.relatedIssue}`);
    if (comp.subRelatedIssue) details.push(`Sub-Related Issue: ${comp.subRelatedIssue}`);
    if (comp.issueDescription) details.push(`Description in One:- ${comp.issueDescription}`);

    if (comp.solutionSteps && comp.solutionSteps.length > 0) {
      details.push('Solution Steps:-');
      comp.solutionSteps.forEach((step: string, index: number) => {
        details.push(`Step ${index + 1}: ${step}`);
      });
    }

    if (comp.directSolution) {
      details.push(`Additional Notes:\n${comp.directSolution}`);
    }

    return details.length > 0 ? details.join('\n') : 'No solution provided.';
  };

  const fetchComplaintsByIssue = async (issue: MainIssueStat, subadminId: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        API_PATHS.admindashboard.getSubadminIssueTimeline(
          subadminId.toString(),
          issue.issueId.toString()
        ),
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await res.json();
      if (res.ok && data.success) {
        setIssueComplaints(data.complaints);
        setSelectedIssue(issue);
      } else {
        console.error('Failed to fetch complaints for main issue');
      }
    } catch (error) {
      console.error('Fetch complaints error:', error);
    }
  };

  const goBackToIssues = () => {
    setSelectedIssue(null);
    setIssueComplaints([]);
  };

  const handleResetPassword = async (staffNo: string, subAdminName: string) => {
    try {
      const newPassword = prompt(`Enter new password for ${subAdminName}`);
      if (!newPassword) {
        alert('Password cannot be empty');
        return;
      }
      const confirmPassword = prompt(`Confirm new password for ${subAdminName}`);
      if (newPassword !== confirmPassword) {
        alert('Passwords do not match');
        return;
      }

      const token = localStorage.getItem('token');
      const res = await fetch(API_PATHS.admindashboard.resetSubadminPassword, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ staffNo, newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
      } else {
        alert(data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      alert('An error occurred while resetting the password');
    }
  };

  // Show complaints under a specific issue
  if (selectedSubAdmin && selectedIssue) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {selectedSubAdmin.name} - {selectedIssue.issue} Complaints
          </h2>
          <Button onClick={goBackToIssues}>← Back to Performance</Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Resolved Complaints</CardTitle>
          </CardHeader>
          <CardContent>
            {issueComplaints.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Solution</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Resolved At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issueComplaints.map((comp) => (
                    <TableRow key={comp.id}>
                      <TableCell>{comp.id}</TableCell>
                      <TableCell>{comp.description}</TableCell>
                      <TableCell>
                        <pre className="whitespace-pre-wrap text-sm">
                          {renderSolution(comp)}
                        </pre>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-700">{comp.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(comp.updated_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p>No complaints found under this issue.</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show subadmin summary
  if (selectedSubAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {selectedSubAdmin.name} - Performance Dashboard
          </h2>
          <Button variant="outline" onClick={() => setSelectedSubAdmin(null)}>
            ← Back to SubAdmins
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <h3 className="text-2xl font-bold text-blue-600">
                {selectedSubAdmin.totalSolved}
              </h3>
              <p className="text-sm text-gray-600">Complaints Solved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <h3 className="text-2xl font-bold text-green-600">
                {selectedSubAdmin.avgResolutionDays !== null
                  ? `${selectedSubAdmin.avgResolutionDays} days`
                  : 'N/A'}
              </h3>
              <p className="text-sm text-gray-600">Avg Resolution Time</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <h3 className="text-2xl font-bold text-purple-600">{selectedSubAdmin.role}</h3>
              <p className="text-sm text-gray-600">Role</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resolved Complaints by Main Issue</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedSubAdmin.mainIssueStats?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Main Issue</TableHead>
                    <TableHead>Total Resolved</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedSubAdmin.mainIssueStats.map((issue, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{issue.issue}</TableCell>
                      <TableCell>{issue.count}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            fetchComplaintsByIssue(issue, selectedSubAdmin.subadminId)
                          }
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-gray-500">No breakdown available.</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show all subadmins initially
  return (
    <Card>
      <CardHeader>
        <CardTitle>SubAdmin Performance Tracking</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Staff No</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Complaints Solved</TableHead>
                <TableHead>Avg Resolution Time</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subAdmins.map((subAdmin, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{subAdmin.name}</TableCell>
                  <TableCell>{subAdmin.staffNo}</TableCell>
                  <TableCell>
                    <Badge className="bg-blue-100 text-blue-800">{subAdmin.role}</Badge>
                  </TableCell>
                  <TableCell>{subAdmin.totalSolved}</TableCell>
                  <TableCell>
                    {subAdmin.avgResolutionDays !== null
                      ? `${subAdmin.avgResolutionDays} days`
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedSubAdmin(subAdmin)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleResetPassword(subAdmin.staffNo, subAdmin.name)}
                      >
                        Reset Password
                      </Button>

                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubAdminManagement;