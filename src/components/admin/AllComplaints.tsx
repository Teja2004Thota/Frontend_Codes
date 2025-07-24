import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RepeatedComplaints from '@/components/admin/RepeatedComplaints';
import { toast } from '@/hooks/use-toast';
import { API_PATHS } from '@/routes/paths';
import { useRef } from 'react';

interface Complaint {
  id?: string; // For normalized ID
  complaint_id?: string; // Raw ID from high-priority data
  userName: string;
  mainIssue: string;
  relatedIssue?: string;
  subRelatedIssue?: string;
  status: string;
  priority: string;
  created_at: any;
  createdAt: string;
  assignedTo?: string;
}


interface TopComplainer {
  user_id: string;
  userName: string;
  totalComplaints: number;
  activeDays: number;
  avgPerDay: number;
  firstComplaint: string;
  lastComplaint: string;
}

interface TimelineEntry {
  day: string;
  complaintCount: number;
}

interface AllComplaintsProps {
  selectedCategory?: string;
  statusFilter?: string;
  priorityFilter?: string;
   complaintsDataOverride?: any[]; // ✅ Add this line
}

const ITEMS_PER_PAGE = 10;


const AllComplaints = ({ selectedCategory, statusFilter = 'all', priorityFilter = 'all',complaintsDataOverride = [] }: AllComplaintsProps) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const hasFetched = useRef(false);
  const [topComplainers, setTopComplainers] = useState<TopComplainer[]>([]);
  const [selectedUserTimeline, setSelectedUserTimeline] = useState<TimelineEntry[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [localStatusFilter, setLocalStatusFilter] = useState(statusFilter);
  const [localPriorityFilter, setLocalPriorityFilter] = useState(priorityFilter);
  const [relatedFilter, setRelatedFilter] = useState('all');
  const [subRelatedFilter, setSubRelatedFilter] = useState('all');
  const [showRepeated, setShowRepeated] = useState(false);
  const [subadmins, setSubadmins] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Format date to MM/DD/YYYY
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'Asia/Kolkata' // Ensure IST timezone
      });
    } catch {
      return 'Invalid Date';
    }
  };

  useEffect(() => {
    const fetchSubadmins = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(API_PATHS.admindashboard.getSubadmins, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setSubadmins(data.subadmins.map((sa: any) => sa.name));
        } else {
          toast({ title: 'Error', description: 'Failed to fetch subadmins', variant: 'destructive' });
        }
      } catch (err) {
        toast({ title: 'Error', description: 'Something went wrong while fetching subadmins', variant: 'destructive' });
      }
    };
    fetchSubadmins();
  }, []);

useEffect(() => {
  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_PATHS.admindashboard.getAllComplaints, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setComplaints(data.complaints);
        hasFetched.current = true;
      } else {
        toast({ title: 'Error', description: 'Failed to fetch complaints', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Something went wrong while fetching complaints', variant: 'destructive' });
    }
  };

  // Fetch immediately on mount
  if ((!complaintsDataOverride || complaintsDataOverride.length === 0)) {
    fetchComplaints();
  }

  // Refresh every 10 seconds
  const intervalId = setInterval(() => {
    if ((!complaintsDataOverride || complaintsDataOverride.length === 0)) {
      fetchComplaints();
    }
  }, 10000); // 10 seconds

  return () => clearInterval(intervalId); // Cleanup on unmount
}, [complaintsDataOverride]);


useEffect(() => {
  if (complaintsDataOverride?.length > 0) {
    console.log('⚡ Using override complaints:', complaintsDataOverride);
    const normalized = complaintsDataOverride.map((c: any, i: number) => ({
      ...c,
      id: c.complaint_id?.toString() || c.id?.toString() || i.toString(),
      userName: c.userName || c.user_name || 'Unknown',
      mainIssue: c.mainIssue || c.main_issue || '—',
      relatedIssue: c.relatedIssue || c.related_issue || '—',
      subRelatedIssue: c.subRelatedIssue || c.sub_related_issue || '—',
      createdAt: c.created_at || c.createdAt,
      assignedTo: c.assignedTo || c.assigned_to || '—',
    }));

    setComplaints(normalized);
  }
}, [complaintsDataOverride]);

  useEffect(() => {
    const fetchTopComplainers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(API_PATHS.admindashboard.topComplainers, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setTopComplainers(data.topComplainers);
        } else {
          toast({ title: 'Error', description: 'Failed to fetch top complainers', variant: 'destructive' });
        }
      } catch (err) {
        toast({ title: 'Error', description: 'Something went wrong while fetching top complainers', variant: 'destructive' });
      }
    };
    fetchTopComplainers();
  }, []);

  const fetchUserTimeline = async (userId: string, userName: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_PATHS.admindashboard.getUserTimeline(userId), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedUserTimeline(data.timeline);
        setSelectedUser(userName);
      } else {
        toast({ title: 'Error', description: 'Failed to fetch user timeline', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Something went wrong while fetching user timeline', variant: 'destructive' });
    }
  };

  useEffect(() => setLocalStatusFilter(statusFilter), [statusFilter]);
  useEffect(() => setLocalPriorityFilter(priorityFilter), [priorityFilter]);

  const handleAssign = async (complaintId: string, subadmin: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_PATHS.admindashboard.assignComplaint(complaintId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ assignedTo: subadmin }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Success', description: `Complaint assigned to ${subadmin}`, variant: 'default' });
        setComplaints((prev) =>
          prev.map((c) =>
            c.id === complaintId
              ? { ...c, assignedTo: data.assignedTo || subadmin, status: 'Assigned' }
              : c
          )
        );
      } else {
        toast({ title: 'Error', description: data.message || 'Failed to assign complaint', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Something went wrong during assignment', variant: 'destructive' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Assigned': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const uniqueRelatedIssues = [...new Set(complaints.map((c) => c.relatedIssue).filter(Boolean))];
  const uniqueSubRelatedIssues = [...new Set(complaints.map((c) => c.subRelatedIssue).filter(Boolean))];

  const filteredComplaints = complaints.filter((complaint) => {
    const search = searchTerm.toLowerCase();

    // Map backend statuses to frontend display
    const status =
      ['Open', 'Assigned'].includes(complaint.status) ? 'Pending' :
      complaint.status === 'Closed' ? 'Resolved' :
      complaint.status === 'Rejected' ? 'Rejected' :
      complaint.status;

    const matchesSearch =
      complaint.userName?.toLowerCase().includes(search) ||
      complaint.mainIssue?.toLowerCase().includes(search);

  const matchesCategory = !selectedCategory || selectedCategory === 'HIGH_PRIORITY_TOP_DEPTS'
  ? true
  : complaint.mainIssue?.toLowerCase() === selectedCategory.toLowerCase();


    const matchesStatus = localStatusFilter === 'all' || 
      (localStatusFilter === 'Pending' && ['Open', 'Assigned'].includes(complaint.status)) ||
      status === localStatusFilter;

    const matchesPriority = localPriorityFilter === 'all' || complaint.priority === localPriorityFilter;
    const matchesRelated = relatedFilter === 'all' || complaint.relatedIssue === relatedFilter;
    const matchesSubRelated = subRelatedFilter === 'all' || complaint.subRelatedIssue === subRelatedFilter;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesStatus &&
      matchesPriority &&
      matchesRelated &&
      matchesSubRelated
    );
  });

  const paginatedComplaints = filteredComplaints.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">All Complaints Overview</CardTitle>
        <div className="flex flex-wrap gap-2 mt-2 items-center">
          <Input
            placeholder="Search issues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-40 h-8 text-sm"
          />
          <Select value={localStatusFilter} onValueChange={setLocalStatusFilter}>
            <SelectTrigger className="w-36 h-8 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={localPriorityFilter} onValueChange={setLocalPriorityFilter}>
            <SelectTrigger className="w-36 h-8 text-sm">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Priority's</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={relatedFilter} onValueChange={setRelatedFilter}>
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue placeholder="Related" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Related Issues</SelectItem>
              {uniqueRelatedIssues.map((r, i) => (
                <SelectItem key={i} value={r ?? ''}>{r ?? '—'}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={subRelatedFilter} onValueChange={setSubRelatedFilter}>
            <SelectTrigger className="w-44 h-8 text-sm">
              <SelectValue placeholder="Sub-Related" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Sub Related Issues</SelectItem>
              {uniqueSubRelatedIssues.map((s, i) => (
                <SelectItem key={i} value={s ?? ''}>{s ?? '—'}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex items-center text-sm ml-2">
            <input
              type="checkbox"
              checked={showRepeated}
              onChange={() => setShowRepeated(prev => !prev)}
              className="mr-2"
            />
            Show Repeated
          </label>
        </div>
      </CardHeader>

      <CardContent>
        {showRepeated ? (
          <RepeatedComplaints />
        ) : (
          <>
            {/* Top Complainers Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-xl">Top Repeat Complainers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-sm py-2 px-2">S.No</TableHead>
                        <TableHead className="text-sm py-2 px-2">User</TableHead>
                        <TableHead className="text-sm py-2 px-2">Total Complaints</TableHead>
                        <TableHead className="text-sm py-2 px-2">Active Days</TableHead>
                        <TableHead className="text-sm py-2 px-2">Avg Complaints/Day</TableHead>
                        <TableHead className="text-sm py-2 px-2">First Complaint</TableHead>
                        <TableHead className="text-sm py-2 px-2">Last Complaint</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topComplainers.map((user, index) => (
                        <TableRow key={user.user_id} className="text-sm">
                          <TableCell className="py-1 px-2">{index + 1}</TableCell>
                          <TableCell className="py-1 px-2">
                            <button
                              className="text-blue-600 hover:underline"
                              onClick={() => fetchUserTimeline(user.user_id, user.userName)}
                            >
                              {user.userName}
                            </button>
                          </TableCell>
                          <TableCell className="py-1 px-2">{user.totalComplaints}</TableCell>
                          <TableCell className="py-1 px-2">{user.activeDays}</TableCell>
                          <TableCell className="py-1 px-2">{user.avgPerDay}</TableCell>
                          <TableCell className="py-1 px-2">{formatDate(user.firstComplaint)}</TableCell>
                          <TableCell className="py-1 px-2">{formatDate(user.lastComplaint)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* User Complaint Timeline Section */}
            {selectedUser && selectedUserTimeline.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-xl">Complaint Timeline for {selectedUser}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-sm py-2 px-2">Date</TableHead>
                          <TableHead className="text-sm py-2 px-2">Complaint Count</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedUserTimeline.map((entry, index) => (
                          <TableRow key={index} className="text-sm">
                            <TableCell className="py-1 px-2">{formatDate(entry.day)}</TableCell>
                            <TableCell className="py-1 px-2">{entry.complaintCount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Existing Complaints Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-sm py-2 px-2">S.No</TableHead>
                    <TableHead className="text-sm py-2 px-2">User</TableHead>
                    <TableHead className="text-sm py-2 px-2">Main Issue</TableHead>
                    <TableHead className="text-sm py-2 px-2">Related</TableHead>
                    <TableHead className="text-sm py-2 px-2">Sub-Related</TableHead>
                    <TableHead className="text-sm py-2 px-2">Status</TableHead>
                    <TableHead className="text-sm py-2 px-2">Priority</TableHead>
                    <TableHead className="text-sm py-2 px-2">Created</TableHead>
                    <TableHead className="text-sm py-2 px-2 w-[120px]">Assign</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedComplaints.map((complaint, index) => {
                    const status =
                      ['Open', 'Assigned'].includes(complaint.status) ? 'Pending' :
                      complaint.status === 'Closed' ? 'Resolved' :
                      complaint.status === 'Rejected' ? 'Rejected' :
                      complaint.status;

                    return (
                      <TableRow key={complaint.id || complaint.complaint_id} className="text-sm">
                        <TableCell className="py-1 px-2">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                        <TableCell className="py-1 px-2">{complaint.userName}</TableCell>
                        <TableCell className="py-1 px-2">{complaint.mainIssue}</TableCell>
                        <TableCell className="py-1 px-2">{complaint.relatedIssue || '—'}</TableCell>
                        <TableCell className="py-1 px-2">{complaint.subRelatedIssue || '—'}</TableCell>
                        <TableCell className="py-1 px-2">
                          <Badge className={getStatusColor(status)}>{status}</Badge>
                        </TableCell>
                        <TableCell className="py-1 px-2">
                          <Badge className={getPriorityColor(complaint.priority)}>{complaint.priority}</Badge>
                        </TableCell>
                        <TableCell className="py-1 px-2">
                          {complaint.created_at ? (
                            <div className="flex flex-col">
                              <span>{formatDate(complaint.created_at)}</span>
                              <span className="text-xs text-gray-500">{new Date(complaint.created_at).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">Not Available</span>
                          )}
                        </TableCell>
                        <TableCell className="py-1 px-2 w-[120px]">
                          {complaint.status === 'Open' && (
                            (complaint.mainIssue?.toLowerCase() === 'others' || complaint.relatedIssue?.toLowerCase() === 'others') ? (
                              <span className="text-[11px] text-red-600 leading-tight">
                                Go to Uncategorized Section in Subadmin Dashboard and take & Update the complaint
                              </span>
                            ) : (
                              <Select onValueChange={(val) => handleAssign((complaint.id || complaint.complaint_id || '').toString(), val)}>
                                <SelectTrigger className="w-[100px] h-8 text-xs">
                                  <SelectValue placeholder="Assign" />
                                </SelectTrigger>
                                <SelectContent>
                                  {subadmins.map((sub, i) => (
                                    <SelectItem key={i} value={sub}>{sub}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )
                          )}
                          {complaint.assignedTo &&
                            complaint.mainIssue?.toLowerCase() !== 'others' &&
                            complaint.relatedIssue?.toLowerCase() !== 'others' && (
                              <span className="text-xs text-gray-600">{complaint.assignedTo}</span>
                            )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <button
                className="text-sm px-3 py-1 border rounded disabled:opacity-50"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="text-sm font-medium px-2">
                Page {currentPage} of {Math.ceil(filteredComplaints.length / ITEMS_PER_PAGE)}
              </span>
              <button
                className="text-sm px-3 py-1 border rounded disabled:opacity-50"
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, Math.ceil(filteredComplaints.length / ITEMS_PER_PAGE)))
                }
                disabled={currentPage === Math.ceil(filteredComplaints.length / ITEMS_PER_PAGE)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AllComplaints;