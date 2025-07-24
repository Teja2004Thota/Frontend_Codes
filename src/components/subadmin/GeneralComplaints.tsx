import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination';
import { Search, CheckCircle, UserCheck, Plus, Trash2, AlertCircle, ChevronRight } from 'lucide-react';
import { toast } from '../../hooks/use-toast';
import axios from 'axios';
import { API_PATHS, STATIC_PATHS } from '@/routes/paths';

interface GeneralComplaintsProps {
  onBack: () => void;
}

interface Complaint {
  complaint_id: number;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  severity: 'Major' | 'Minor';
  status: 'Pending' | 'Open' | 'Closed' | 'Rejected' | 'Assigned';
  created_at: string;
  updated_at?: string;
  user_name: string;
  user_staffNo?: string;
  main_issue_name: string | null;
  related_issue_name: string | null;
  sub_related_issue_name: string | null;
  assigned_to_id: number | null;
  assigned_to_name?: string;
  done_by_id: number | null;
  done_by_name?: string;
  main_issue_id: number;
  sub_related_issue_id: number | null;
}

interface RelatedIssue {
  id: number;
  name: string;
  main_issue_id: number;
}

interface GeneralComplaintsProps {
  onBack: () => void;
  type: 'general' | 'solved' | 'assigned';
}

type ComplaintStatus = 'Pending' | 'Open' | 'Closed' | 'Rejected' | 'Assigned';

const parseJwt = (token: string) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return {};
  }
};

const ReadMore = ({ text, maxLength = 100 }: { text: string; maxLength?: number }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  if (text.length <= maxLength) {
    return <span>{text}</span>;
  }
  
  return (
    <span className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
      {isExpanded ? text : `${text.substring(0, maxLength)}...`}
      <span className="ml-1 text-primary text-sm font-medium hover:underline">
        {isExpanded ? 'Show less' : 'Read more'}
      </span>
    </span>
  );
};

const renderUserPopup = (complaint: any) => (
  <Dialog>
    <DialogTrigger asChild>
      <span className="font-medium hover:underline cursor-pointer">{complaint.user_name}</span>
    </DialogTrigger>
    <DialogContent className="max-w-md">
      <div className="flex items-center gap-4">
        <img
  src={
    complaint.photo
      ? `${STATIC_PATHS.profilePhoto}${complaint.photo}`
      : STATIC_PATHS.defaultProfile
  }
  alt="Profile"
  className="h-20 w-20 object-cover rounded-full border"
  onError={(e) => (e.currentTarget.src = STATIC_PATHS.defaultProfile)}
/>

        <div className="text-sm space-y-1">
          <p><strong>Name:</strong> {complaint.user_name}</p>
          <p><strong>Staff No:</strong> {complaint.user_staffNo}</p>
          <p><strong>Department:</strong> {complaint.department || 'N/A'}</p>
          <p><strong>Designation:</strong> {complaint.designation || 'N/A'}</p>
          <p><strong>Contact:</strong> {Array.isArray(complaint.contacts) ? complaint.contacts.join(', ') : complaint.contacts}</p>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

const GeneralComplaints = ({ onBack, type }: GeneralComplaintsProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [solutionMode, setSolutionType] = useState<'direct' | 'structured'>('direct');
  const [directSolution, setDirectSolution] = useState('');
  const [subRelatedIssueName, setSubRelatedIssueName] = useState('');
  const [relatedIssueId, setRelatedIssueId] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [severity, setSeverity] = useState<'Major' | 'Minor'>('Minor');
  const [solutionSteps, setSolutionSteps] = useState<string[]>(['']);
  const [relatedIssues, setRelatedIssues] = useState<RelatedIssue[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRelatedIssues, setLoadingRelatedIssues] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'All' | ComplaintStatus>('All');
  const [error, setError] = useState<string | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [doneByRole, setDoneByRole] = useState<'admin' | 'subadmin' | ''>('');
  const [doneByUsers, setDoneByUsers] = useState<{ id: number; name: string }[]>([]);
  const [doneById, setDoneById] = useState<number | null>(null);
  const [hoveredComplaintId, setHoveredComplaintId] = useState<number | null>(null);

  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const { id: subadminId } = token ? parseJwt(token) : { id: undefined };

  const itemsPerPage = 10;
  const totalPages = Math.ceil(complaints.length / itemsPerPage);

  const statusMap: Record<'All' | ComplaintStatus, string[] | null> = {
    All: null,
    Pending: ['Pending', 'Open', 'Assigned'],
    Open: ['Open'],
    Closed: ['Closed'],
    Rejected: ['Rejected'],
    Assigned: ['Assigned'],
  };

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) throw new Error('Unauthorized');

      const { id: subadminId } = parseJwt(token);

      const url =
  type === 'solved'
    ? API_PATHS.subadmindashboard.complaints.solved
    : type === 'assigned'
    ? API_PATHS.subadmindashboard.complaints.assigned
    : API_PATHS.subadmindashboard.complaints.general;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const categorizedComplaints = response.data.complaints
        .filter((c: any) => {
          if (type === 'solved') {
            return c.status === 'Closed' && c.done_by_id === subadminId;
          } else if (type === 'assigned') {
            return c.assigned_to_id === subadminId;
          } else {
            return c.main_issue_name && c.main_issue_name !== 'Others';
          }
        })
        .map((c: any) => ({
          ...c,
          main_issue_name: c.main_issue_name || 'N/A',
          related_issue_name: c.related_issue_name || 'N/A',
          sub_related_issue_name: c.sub_related_issue_name || 'N/A',
          severity: c.severity || 'Minor',
          updated_at: c.updated_at || undefined,
          done_by_name: c.done_by_name || undefined,
          user_staffNo: c.user_staffNo || 'N/A',
          assignedTo: c.assigned_to_name || 'Unassigned',
        }));

      setComplaints(categorizedComplaints);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch complaints');
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, type]);

  const fetchRelatedIssues = useCallback(async () => {
    if (!selectedComplaint || !isDialogOpen || solutionMode !== 'structured') return;
    try {
      setLoadingRelatedIssues(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Unauthorized');
      }
      const response = await axios.get(
        API_PATHS.subadmindashboard.getRelatedIssues(String(selectedComplaint.main_issue_id)),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRelatedIssues(response.data.relatedIssues || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch related issues');
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoadingRelatedIssues(false);
    }
  }, [isDialogOpen, solutionMode, selectedComplaint, navigate]);

  const fetchDoneByUsers = async (role: 'admin' | 'subadmin') => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(API_PATHS.subadmindashboard.getAllByRole(role), {
      headers: { Authorization: `Bearer ${token}` },
    });
      setDoneByUsers(response.data.users || []);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: `Failed to fetch ${role}s`,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  useEffect(() => {
    fetchRelatedIssues();
  }, [fetchRelatedIssues]);

  const filteredComplaints = complaints
    .filter(complaint =>
      [
        complaint.user_name?.toLowerCase(),
        complaint.user_staffNo?.toLowerCase(),
        complaint.main_issue_name?.toLowerCase(),
        complaint.related_issue_name?.toLowerCase(),
        complaint.sub_related_issue_name?.toLowerCase(),
        complaint.severity?.toLowerCase(),
        issueDescription?.toLowerCase(),
      ].some(field => field?.includes(searchTerm.toLowerCase()))
    )
    .filter((complaint: { status: string }) => {
      const mappedStatuses = statusMap[statusFilter];
      if (!mappedStatuses) return true;
      return mappedStatuses.includes(complaint.status);
    });

  const paginatedComplaints = filteredComplaints.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const confirmAction = (action: () => void, message: string) => {
    setPendingAction(() => action);
    toast({ title: 'Confirm Action', description: message });
    setIsConfirmDialogOpen(true);
  };

  const handleTakeComplaint = async (complaint: Complaint) => {
    confirmAction(async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Unauthorized');
        }
        const response = await axios.post(
          API_PATHS.subadmindashboard.takeComplaint(String(complaint.complaint_id)),
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setComplaints(prev =>
          prev.map(c =>
            c.complaint_id === complaint.complaint_id
              ? {
                  ...c,
                  status: 'Open',
                  assigned_to_id: response.data.assigned_to_id,
                  assigned_to_name: response.data.assignedTo || 'Unassigned',
                }
              : c
          )
        );
        toast({ title: 'Success', description: `Complaint #${complaint.complaint_id} taken.` });
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to take complaint');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setIsConfirmDialogOpen(false);
      }
    }, `Are you sure you want to take complaint #${complaint.complaint_id}?`);
  };

  const handleGiveSolution = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setDirectSolution('');
    setSubRelatedIssueName('');
    setRelatedIssueId('');
    setIssueDescription('');
    setSeverity('Minor');
    setSolutionSteps(['']);
    setSolutionType('direct');
    setDoneByRole('');
    setDoneByUsers([]);
    setDoneById(null);
    setIsDialogOpen(true);
  };

  const addSolutionStep = () => {
    setSolutionSteps(prev => [...prev, '']);
  };

  const updateSolutionStep = (index: number, value: string) => {
    if (value.length <= 500) {
      setSolutionSteps(prev => prev.map((step, i) => (i === index ? value : step)));
    } else {
      toast({ title: 'Error', description: 'Solution step cannot exceed 500 characters.', variant: 'destructive' });
    }
  };

  const removeSolutionStep = (index: number) => {
    if (solutionSteps.length > 1) {
      setSolutionSteps(prev => prev.filter((_, i) => i !== index));
    }
  };

  const validateInputs = () => {
    if (solutionMode === 'direct') {
      if (!directSolution.trim()) {
        toast({ title: 'Error', description: 'Direct solution is required.', variant: 'destructive' });
        return false;
      }
      if (directSolution.length > 1000) {
        toast({ title: 'Error', description: 'Direct solution cannot exceed 1000 characters.', variant: 'destructive' });
        return false;
      }
    } else {
      if (!subRelatedIssueName.trim() || !relatedIssueId) {
        toast({ title: 'Error', description: 'Sub-related issue name and related issue selection are required.', variant: 'destructive' });
        return false;
      }
      if (subRelatedIssueName.length > 100) {
        toast({ title: 'Error', description: 'Sub-related issue name cannot exceed 100 characters.', variant: 'destructive' });
        return false;
      }
      if (issueDescription.length > 1000) {
        toast({ title: 'Error', description: 'Issue description cannot exceed 1000 characters.', variant: 'destructive' });
        return false;
      }
      if (!issueDescription.trim() && solutionSteps.every(step => !step.trim())) {
        toast({ title: 'Error', description: 'Either issue description or at least one solution step is required.', variant: 'destructive' });
        return false;
      }
    }
    if (!severity) {
      toast({ title: 'Error', description: 'Severity is required.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleSubmitSolution = async () => {
    if (!validateInputs()) return;

    confirmAction(async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Unauthorized');
        }

        const payload = solutionMode === 'direct'
          ? {
              directSolution,
              severity,
              doneById: doneById || undefined,
            }
          : {
              subRelatedIssue: { name: subRelatedIssueName, related_issue_id: parseInt(relatedIssueId) },
              issueDescription: issueDescription.trim() || undefined,
              solutionSteps: solutionSteps.filter(step => step.trim()).length > 0 ? solutionSteps.filter(step => step.trim()) : undefined,
              severity,
              doneById: doneById || undefined,
            };

        await axios.post(
          API_PATHS.subadmindashboard.updateGeneralSolution(String(selectedComplaint?.complaint_id)),
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setComplaints(prev =>
          prev.map(c =>
            c.complaint_id === selectedComplaint?.complaint_id
              ? { ...c, status: 'Closed', updated_at: new Date().toISOString(), severity }
              : c
          )
        );
        toast({
          title: 'Success',
          description: `Solution submitted for complaint #${selectedComplaint?.complaint_id}. View details in the track section.`,
        });
        setIsDialogOpen(false);
        setSelectedComplaint(null);
        setDirectSolution('');
        setSubRelatedIssueName('');
        setRelatedIssueId('');
        setIssueDescription('');
        setSeverity('Minor');
        setSolutionSteps(['']);
        setDoneByRole('');
        setDoneByUsers([]);
        setDoneById(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to submit solution');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setIsConfirmDialogOpen(false);
      }
    }, `Are you sure you want to submit solution for complaint #${selectedComplaint?.complaint_id}?`);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'Medium': return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
      case 'Low': return 'bg-green-100 text-green-800 hover:bg-green-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Closed': return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200';
      case 'Pending': return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
      case 'Open': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'Assigned': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'Rejected': return 'bg-red-100 text-red-800 hover:bg-red-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Major': return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'Minor': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">Error loading complaints</h3>
        <p className="mt-2 text-sm text-gray-600">{error}</p>
        <Button onClick={fetchComplaints} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <Search className="h-5 w-5 text-primary" />
            Categorized Complaints
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage and resolve categorized complaints from users
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search complaints..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value.slice(0, 100))}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {['All', 'Pending', 'Closed'].map(status => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(status as 'All' | ComplaintStatus)}
                  className="rounded-md"
                >
                  {status}
                </Button>
              ))}
              <Button
                variant="outline"
                onClick={onBack}
                className="border-gray-200"
              >
                Back
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading complaints...</div>
          ) : paginatedComplaints.length === 0 ? (
            <div className="p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No complaints found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {statusFilter === 'All'
                  ? 'No complaints available'
                  : `No ${statusFilter.toLowerCase()} complaints found`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>S.No</TableHead>
                    <TableHead>Complaint ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Main Issue</TableHead>
                    <TableHead>Related Issue</TableHead>
                    <TableHead>Sub-Related</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedComplaints.map((complaint, index) => (
                    <TableRow
                      key={complaint.complaint_id}
                      className="hover:bg-gray-50/50"
                      onMouseEnter={() => setHoveredComplaintId(complaint.complaint_id)}
                      onMouseLeave={() => setHoveredComplaintId(null)}
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{complaint.complaint_id}</TableCell>
                      <TableCell>{renderUserPopup(complaint)}</TableCell>
                      <TableCell>{complaint.main_issue_name}</TableCell>
                      <TableCell>{complaint.related_issue_name}</TableCell>
                      <TableCell>{complaint.sub_related_issue_name}</TableCell>
                      <TableCell className="max-w-[200px]">
                        <ReadMore text={complaint.description} maxLength={60} />
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(complaint.status)} font-medium`}>
                          {complaint.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getPriorityColor(complaint.priority)} font-medium`}>
                          {complaint.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex flex-col">
                          <span>{new Date(complaint.created_at).toLocaleDateString()}</span>
                          <span className="text-xs">{new Date(complaint.created_at).toLocaleTimeString()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {complaint.assigned_to_name || 'Unassigned'}
                      </TableCell>
                      <TableCell className="relative">
                        {(type === 'assigned' && (
                          complaint.main_issue_name?.toLowerCase() === 'others' ||
                          complaint.related_issue_name?.toLowerCase() === 'others'
                        )) ? (
                          <span className="text-[11px] text-red-600 leading-tight">
                            Go to Uncategorized Section in Subadmin Dashboard and Update the complaint
                          </span>
                        ) : (
                          <div className="flex gap-2">
                            {!complaint.assigned_to_id ? (
                              <Button size="sm" onClick={() => handleTakeComplaint(complaint)} className="h-8">
                                <UserCheck className="h-3 w-3 mr-1" />
                                Take
                              </Button>
                            ) : (complaint.status === 'Open' || complaint.status === 'Assigned') ? (
                              <Button
                                size="sm"
                                onClick={() => handleGiveSolution(complaint)}
                                className="h-8 bg-emerald-600 hover:bg-emerald-700"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Resolve
                              </Button>
                            ) : (
                              <Badge variant="outline" className="h-8">
                                <CheckCircle className="h-3 w-3 mr-1 text-muted-foreground" />
                                {complaint.status}
                              </Badge>
                            )}
                          </div>
                        )}
                        {hoveredComplaintId === complaint.complaint_id && complaint.done_by_name && (
                          <div className="absolute top-[70%] right-5 mt-1 bg-gray-800 text-white text-xs rounded px-3 py-1 shadow-lg z-10 whitespace-nowrap">
                            ✅ Resolved by: {complaint.done_by_name}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => currentPage > 1 && setCurrentPage(p => p - 1)}
                className={currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}
              />
            </PaginationItem>
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  onClick={() => setCurrentPage(i + 1)}
                  isActive={currentPage === i + 1}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => currentPage < totalPages && setCurrentPage(p => p + 1)}
                className={currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              Provide Solution for Complaint #{selectedComplaint?.complaint_id}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto pr-2 space-y-4" style={{ maxHeight: '65vh' }}>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="font-medium">{selectedComplaint?.user_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Main Issue</p>
                  <p className="font-medium">{selectedComplaint?.main_issue_name || 'N/A'}</p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{selectedComplaint?.description || 'N/A'}</p>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Solution Type</label>
              <Select value={solutionMode} onValueChange={(value: 'direct' | 'structured') => setSolutionType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select solution type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct Solution</SelectItem>
                  <SelectItem value="structured">Structured Solution</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Severity *</label>
              <Select value={severity} onValueChange={(val) => setSeverity(val as 'Major' | 'Minor')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Minor">Minor</SelectItem>
                  <SelectItem value="Major">Major</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Resolved By Role</label>
                <Select
                  value={doneByRole}
                  onValueChange={(val: 'admin' | 'subadmin') => {
                    setDoneByRole(val);
                    setDoneById(null);
                    fetchDoneByUsers(val);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admins</SelectItem>
                    <SelectItem value="subadmin">Subadmins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Resolved By</label>
                <Select
                  value={doneById?.toString() || ''}
                  onValueChange={(val) => setDoneById(Number(val))}
                  disabled={!doneByRole}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={doneByUsers.length === 0 ? 'Select role first' : 'Select Person'} />
                  </SelectTrigger>
                  <SelectContent>
                    {doneByUsers.map(user => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {solutionMode === 'direct' ? (
              <div>
                <label className="block text-sm font-medium mb-2">Direct Solution</label>
                <Textarea
                  placeholder="Enter direct solution..."
                  value={directSolution}
                  onChange={e => setDirectSolution(e.target.value.slice(0, 1000))}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {directSolution.length}/1000 characters
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Related Issue</label>
                  <Select value={relatedIssueId} onValueChange={setRelatedIssueId}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingRelatedIssues ? 'Loading...' : 'Select related issue'} />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingRelatedIssues ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : relatedIssues.length === 0 ? (
                        <SelectItem value="no-issues" disabled>No related issues available</SelectItem>
                      ) : (
                        relatedIssues.map(issue => (
                          <SelectItem key={issue.id} value={issue.id.toString()}>
                            {issue.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Sub-Related Issue Name</label>
                  <Input
                    placeholder="Enter sub-related issue name..."
                    value={subRelatedIssueName}
                    onChange={e => setSubRelatedIssueName(e.target.value.slice(0, 100))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {subRelatedIssueName.length}/100 characters
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Issue Description</label>
                  <Textarea
                    placeholder="Enter issue description..."
                    value={issueDescription}
                    onChange={e => setIssueDescription(e.target.value.slice(0, 1000))}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {issueDescription.length}/1000 characters
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Solution Steps</label>
                  <div className="space-y-2">
                    {solutionSteps.map((step, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Input
                          placeholder={`Step ${index + 1}`}
                          value={step}
                          onChange={e => updateSolutionStep(index, e.target.value)}
                          className="flex-1"
                        />
                        {solutionSteps.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSolutionStep(index)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addSolutionStep}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Step
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitSolution}>
              Submit Solution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to proceed with this action?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => pendingAction && pendingAction()}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GeneralComplaints;