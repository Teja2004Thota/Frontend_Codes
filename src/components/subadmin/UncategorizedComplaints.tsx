import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Search, CheckCircle, XCircle, UserCheck, Plus, Trash } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import axios from 'axios';
import { API_PATHS, STATIC_PATHS } from '@/routes/paths';

// ReadMore component
const ReadMore = ({ text, maxLength = 100 }: { text: string; maxLength?: number }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return <span className="text-muted-foreground">N/A</span>;

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

// New renderUserPopup function
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
          <p><strong>Name:</strong> {complaint.user_name || 'N/A'}</p>
          <p><strong>Staff No:</strong> {complaint.user_staffNo || 'N/A'}</p>
          <p><strong>Department:</strong> {complaint.department || 'N/A'}</p>
          <p><strong>Designation:</strong> {complaint.designation || 'N/A'}</p>
          <p><strong>Contact:</strong> {Array.isArray(complaint.contacts) ? complaint.contacts.join(', ') : complaint.contacts || 'N/A'}</p>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

interface Complaint {
  complaint_id: number;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Open' | 'Closed' | 'Rejected';
  created_at: string;
  updated_at?: string;
  user_name: string;
  user_staffNo?: string;
  department?: string;
  designation?: string;
  photo?: string;
  contacts?: string | string[];
  assigned_to_id: number | null;
  main_issue_id: number | null;
  sub_related_issue_id: number | null;
  is_ai_resolved: boolean;
  assignedTo?: string | null;
}

interface MainIssue {
  id: number;
  name: string;
}

interface RelatedIssue {
  id: number;
  name: string;
  main_issue_id: number;
}

interface SubRelatedIssue {
  id: number;
  name: string;
  related_issue_id: number;
}

interface UncategorizedComplaintsProps {
  onBack: () => void;
}

const UncategorizedComplaints = ({ onBack }: UncategorizedComplaintsProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [mainIssues, setMainIssues] = useState<MainIssue[]>([]);
  const [relatedIssues, setRelatedIssues] = useState<RelatedIssue[]>([]);
  const [subRelatedIssues, setSubRelatedIssues] = useState<SubRelatedIssue[]>([]);
  const [selectedMainIssue, setSelectedMainIssue] = useState<string>('');
  const [newMainIssue, setNewMainIssue] = useState('');
  const [selectedRelatedIssue, setSelectedRelatedIssue] = useState<string>('');
  const [newRelatedIssue, setNewRelatedIssue] = useState('');
  const [selectedSubRelatedIssue, setSelectedSubRelatedIssue] = useState<string>('');
  const [newSubRelatedIssue, setNewSubRelatedIssue] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [solutionSteps, setSolutionSteps] = useState<string[]>(['']);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [doneByRole, setDoneByRole] = useState<'admin' | 'subadmin' | ''>('');
  const [doneByUsers, setDoneByUsers] = useState<{ id: number; name: string }[]>([]);
  const [doneById, setDoneById] = useState<number | null>(null);
  const [severity, setSeverity] = useState<'Major' | 'Minor'>('Minor'); // Default to 'Minor'

  const navigate = useNavigate();

  const itemsPerPage = 5;
  const filteredComplaints = complaints
    .filter(complaint =>
      (complaint.user_name?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false) ||
      (complaint.user_staffNo?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false) ||
      (complaint.description?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false)
    )
    .sort((a, b) => {
      if (a.status === 'Pending' && b.status !== 'Pending') return -1;
      if (a.status !== 'Pending' && b.status === 'Pending') return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage);
  const paginatedComplaints = filteredComplaints.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    const fetchComplaints = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Unauthorized',
          description: 'Please log in to view complaints.',
          variant: 'destructive',
        });
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(API_PATHS.subadmindashboard.complaints.pending, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const uncategorizedComplaints = response.data.complaints
          .filter((c: any) => (!c.main_issue_id || c.main_issue_id === 1) && (c.status === 'Pending' || (c.status === 'Open' && c.assigned_to_id)))
          .map((c: any) => ({
            complaint_id: c.complaint_id,
            description: c.description || 'N/A',
            priority: c.priority || 'Low',
            status: c.status,
            created_at: c.created_at,
            updated_at: c.updated_at || undefined,
            user_name: c.user_name || 'N/A',
            user_staffNo: c.user_staffNo || 'N/A',
            department: c.department || 'N/A',
            designation: c.designation || 'N/A',
            photo: c.photo || null,
            contacts: c.contacts || 'N/A',
            assigned_to_id: c.assigned_to_id || null,
            assignedTo: c.assigned_to_name || null,
            main_issue_id: c.main_issue_id || null,
            sub_related_issue_id: c.sub_related_issue_id || null,
            is_ai_resolved: c.is_ai_resolved || false,
          }));
        setComplaints(uncategorizedComplaints);
      } catch (err: any) {
        toast({
          title: 'Error',
          description: err.response?.status === 401
            ? 'Session expired. Please log in again.'
            : err.response?.data?.message || 'Failed to fetch uncategorized complaints',
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

    fetchComplaints();
  }, [navigate]);

  useEffect(() => {
    const fetchMainIssues = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const response = await axios.get(API_PATHS.subadmindashboard.getMainIssues, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMainIssues(response.data.mainIssues || []);
      } catch (err: any) {
        toast({
          title: 'Error',
          description: 'Failed to fetch main issues',
          variant: 'destructive',
        });
      }
    };
    fetchMainIssues();
  }, []);

  useEffect(() => {
    if (selectedMainIssue && selectedMainIssue !== 'add-new') {
      const fetchRelatedIssues = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
          const response = await axios.get(
            API_PATHS.subadmindashboard.getRelatedIssues(selectedMainIssue),
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setRelatedIssues(response.data.relatedIssues || []);
          setSelectedRelatedIssue('');
          setNewRelatedIssue('');
          setSubRelatedIssues([]);
          setSelectedSubRelatedIssue('');
          setNewSubRelatedIssue('');
        } catch (err: any) {
          toast({
            title: 'Error',
            description: 'Failed to fetch related issues',
            variant: 'destructive',
          });
        }
      };
      fetchRelatedIssues();
    } else {
      setRelatedIssues([]);
      setSelectedRelatedIssue('');
      setNewRelatedIssue('');
      setSubRelatedIssues([]);
      setSelectedSubRelatedIssue('');
      setNewSubRelatedIssue('');
    }
  }, [selectedMainIssue]);

  useEffect(() => {
    if (selectedRelatedIssue && selectedRelatedIssue !== 'add-new') {
      const fetchSubRelatedIssues = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
          const response = await axios.get(
            API_PATHS.subadmindashboard.getSubRelatedIssues(selectedRelatedIssue),
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setSubRelatedIssues(response.data.subRelatedIssues || []);
          setSelectedSubRelatedIssue('');
          setNewSubRelatedIssue('');
        } catch (err: any) {
          toast({
            title: 'Error',
            description: 'Failed to fetch sub-related issues',
            variant: 'destructive',
          });
        }
      };
      fetchSubRelatedIssues();
    } else {
      setSubRelatedIssues([]);
      setSelectedSubRelatedIssue('');
      setNewSubRelatedIssue('');
    }
  }, [selectedRelatedIssue]);

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

  const handleTakeComplaint = async (complaint: Complaint) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Unauthorized',
          description: 'Please log in to perform this action.',
          variant: 'destructive',
        });
        navigate('/login');
        return;
      }
      const response = await axios.post(
        API_PATHS.subadmindashboard.takeComplaint(String(complaint.complaint_id)),
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComplaints(prev =>
        prev.map(c =>
          c.complaint_id === complaint.complaint_id
            ? { ...c, status: 'Open', assigned_to_id: response.data.assigned_to_id, assignedTo: response.data.assignedTo }
            : c
        )
      );
      toast({
        title: 'Success',
        description: `Complaint #${complaint.complaint_id} taken successfully`,
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to take complaint',
        variant: 'destructive',
      });
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const handleRejectComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setIsRejectDialogOpen(true);
  };

  const handleRejectSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Unauthorized',
          description: 'Please log in to perform this action.',
          variant: 'destructive',
        });
        navigate('/login');
        return;
      }
      if (!selectedComplaint?.complaint_id) {
        toast({
          title: 'Error',
          description: 'Invalid complaint ID.',
          variant: 'destructive',
        });
        return;
      }
      await axios.post(
        API_PATHS.subadmindashboard.rejectComplaint(String(selectedComplaint.complaint_id)),
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComplaints(prev =>
        prev.filter(c => c.complaint_id !== selectedComplaint?.complaint_id)
      );
      toast({
        title: 'Success',
        description: `Complaint #${selectedComplaint?.complaint_id} rejected`,
      });
      setIsRejectDialogOpen(false);
      setSelectedComplaint(null);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to reject complaint',
        variant: 'destructive',
      });
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const handleUpdateSolution = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setSelectedMainIssue('');
    setNewMainIssue('');
    setSelectedRelatedIssue('');
    setNewRelatedIssue('');
    setSelectedSubRelatedIssue('');
    setNewSubRelatedIssue('');
    setIssueDescription('');
    setSolutionSteps(['']);
    setDoneByRole('');
    setDoneByUsers([]);
    setDoneById(null);
    setSeverity('Minor'); // Reset to default 'Minor'
    setIsUpdateDialogOpen(true);
  };

  const addSolutionStep = () => {
    setSolutionSteps([...solutionSteps, '']);
  };

  const removeSolutionStep = (index: number) => {
    setSolutionSteps(solutionSteps.filter((_, i) => i !== index));
  };

  const updateSolutionStep = (index: number, value: string) => {
    const newSteps = [...solutionSteps];
    newSteps[index] = value;
    setSolutionSteps(newSteps);
  };

  const handleSubmitUpdate = async () => {
    if (!selectedMainIssue && !newMainIssue.trim()) {
      toast({
        title: 'Error',
        description: 'Please select or provide a Main Issue.',
        variant: 'destructive',
      });
      return;
    }

    if (!severity) {
      toast({
        title: 'Error',
        description: 'Please select a Severity.',
        variant: 'destructive',
      });
      return;
    }

    const payload: any = {
      mainIssue: selectedMainIssue && selectedMainIssue !== 'add-new'
        ? { id: parseInt(selectedMainIssue) }
        : { name: newMainIssue.trim() },
      relatedIssue: null,
      subRelatedIssue: null,
      issueDescription: issueDescription.trim() || null,
      solutionSteps: solutionSteps.filter(step => step.trim()).length > 0
        ? solutionSteps.filter(step => step.trim())
        : null,
      doneById: doneById || undefined,
      severity, // Include severity in payload
    };

    if (selectedRelatedIssue && selectedRelatedIssue !== 'add-new') {
      payload.relatedIssue = { id: parseInt(selectedRelatedIssue) };
    } else if (newRelatedIssue.trim()) {
      payload.relatedIssue = { name: newRelatedIssue.trim() };
    }

    if (selectedSubRelatedIssue && selectedSubRelatedIssue !== 'add-new') {
      payload.subRelatedIssue = { id: parseInt(selectedSubRelatedIssue) };
    } else if (newSubRelatedIssue.trim()) {
      payload.subRelatedIssue = { name: newSubRelatedIssue.trim() };
    }

    if ((payload.issueDescription || payload.solutionSteps) && !payload.subRelatedIssue) {
      toast({
        title: 'Error',
        description: 'Sub-Related Issue is required when providing Issue Description or Solution Steps.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Unauthorized',
          description: 'Please log in to perform this action.',
          variant: 'destructive',
        });
        navigate('/login');
        return;
      }
      await axios.post(
        API_PATHS.subadmindashboard.updateUncategorizedComplaint(String(selectedComplaint?.complaint_id)),
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComplaints(prev =>
        prev.filter(c => c.complaint_id !== selectedComplaint?.complaint_id)
      );
      toast({
        title: 'Success',
        description: `Complaint #${selectedComplaint?.complaint_id} updated and resolved`,
      });
      setIsUpdateDialogOpen(false);
      setSelectedComplaint(null);
      setDoneByRole('');
      setDoneByUsers([]);
      setDoneById(null);
      setSeverity('Minor'); // Reset to default 'Minor'
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to update complaint',
        variant: 'destructive',
      });
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
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
      case 'Rejected': return 'bg-red-100 text-red-800 hover:bg-red-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <div className="space-y-6 px-4 sm:px-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <Search className="h-5 w-5 text-primary" />
            Uncategorized Complaints
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage and resolve uncategorized complaints from users
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, staff number, or description..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={onBack}
            >
              Back
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading complaints...</div>
          ) : filteredComplaints.length === 0 ? (
            <div className="p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No complaints found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm ? 'No matching complaints' : 'No uncategorized complaints available'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="w-[50px]">S.No</TableHead>
                    <TableHead className="w-[100px]">Complaint ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedComplaints.map((complaint, index) => (
                    <TableRow key={complaint.complaint_id} className="hover:bg-gray-50/50">
                      <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                      <TableCell>#{complaint.complaint_id}</TableCell>
                      <TableCell>
                        {renderUserPopup(complaint)}
                        <div className="text-xs text-muted-foreground">{complaint.user_staffNo || 'N/A'}</div>
                      </TableCell>
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
                        {complaint.assignedTo || 'Unassigned'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {complaint.status === 'Pending' ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleTakeComplaint(complaint)}
                                className="h-8"
                              >
                                <UserCheck className="h-3 w-3 mr-1" />
                                Take
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectComplaint(complaint)}
                                className="h-8"
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </>
                          ) : complaint.status === 'Open' ? (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateSolution(complaint)}
                              className="h-8 bg-emerald-600 hover:bg-emerald-700"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Resolve
                            </Button>
                          ) : (
                            <Badge variant="outline" className="h-8">
                              {complaint.status === 'Closed' && <CheckCircle className="h-3 w-3 mr-1 text-muted-foreground" />}
                              {complaint.status === 'Rejected' && <XCircle className="h-3 w-3 mr-1 text-muted-foreground" />}
                              {complaint.status}
                            </Badge>
                          )}
                        </div>
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

      {/* Update Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              Update Complaint #{selectedComplaint?.complaint_id}
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
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{selectedComplaint?.description || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div>
              <Label className="block text-sm font-medium mb-2">Severity *</Label>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block text-sm font-medium mb-2">Main Issue *</Label>
                <Select value={selectedMainIssue} onValueChange={setSelectedMainIssue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Main Issue" />
                  </SelectTrigger>
                  <SelectContent>
                    {mainIssues.map(issue => (
                      <SelectItem key={issue.id} value={issue.id.toString()}>{issue.name}</SelectItem>
                    ))}
                    <SelectItem value="add-new">Add New Main Issue</SelectItem>
                  </SelectContent>
                </Select>
                {selectedMainIssue === 'add-new' && (
                  <Input
                    placeholder="Enter new Main Issue"
                    value={newMainIssue}
                    onChange={e => setNewMainIssue(e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>
              <div>
                <Label className="block text-sm font-medium mb-2">Related Issue</Label>
                <Select
                  value={selectedRelatedIssue}
                  onValueChange={setSelectedRelatedIssue}
                  disabled={!(selectedMainIssue && selectedMainIssue !== 'add-new') && !newMainIssue.trim()}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Related Issue" />
                  </SelectTrigger>
                  <SelectContent>
                    {relatedIssues.map(issue => (
                      <SelectItem key={issue.id} value={issue.id.toString()}>{issue.name}</SelectItem>
                    ))}
                    <SelectItem value="add-new">Add New Related Issue</SelectItem>
                  </SelectContent>
                </Select>
                {selectedRelatedIssue === 'add-new' && (
                  <Input
                    placeholder="Enter new Related Issue"
                    value={newRelatedIssue}
                    onChange={e => setNewRelatedIssue(e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block text-sm font-medium mb-2">Resolved By Role</Label>
                <Select value={doneByRole} onValueChange={(val: 'admin' | 'subadmin') => {
                  setDoneByRole(val);
                  setDoneById(null);
                  fetchDoneByUsers(val);
                }}>
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
                <Label className="block text-sm font-medium mb-2">Resolved By</Label>
                <Select value={doneById?.toString() || ''} onValueChange={(val) => setDoneById(Number(val))}>
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

            <div>
              <Label className="block text-sm font-medium mb-2">Sub-Related Issue</Label>
              <Select
                value={selectedSubRelatedIssue}
                onValueChange={setSelectedSubRelatedIssue}
                disabled={!(selectedRelatedIssue && selectedRelatedIssue !== 'add-new') && !newRelatedIssue.trim()}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Sub-Related Issue" />
                </SelectTrigger>
                <SelectContent>
                  {subRelatedIssues.map(issue => (
                    <SelectItem key={issue.id} value={issue.id.toString()}>{issue.name}</SelectItem>
                  ))}
                  <SelectItem value="add-new">Add New Sub-Related Issue</SelectItem>
                </SelectContent>
              </Select>
              {selectedSubRelatedIssue === 'add-new' && (
                <Input
                  placeholder="Enter new Sub-Related Issue"
                  value={newSubRelatedIssue}
                  onChange={e => setNewSubRelatedIssue(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>

            <div>
              <Label className="block text-sm font-medium mb-2">Issue Description</Label>
              <Textarea
                placeholder="Describe the issue in detail..."
                value={issueDescription}
                onChange={e => setIssueDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div>
              <Label className="block text-sm font-medium mb-2">Solution Steps</Label>
              <div className="space-y-2">
                {solutionSteps.map((step, index) => (
                  <div key={index} className="flex items-center gap-2">
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
                        <Trash className="h-4 w-4" />
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
          </div>

          <DialogFooter className="pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitUpdate}>
              Submit Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Reject Complaint #{selectedComplaint?.complaint_id}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="font-medium">{selectedComplaint?.user_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{selectedComplaint?.description || 'N/A'}</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Are you sure you want to reject this complaint?</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRejectSubmit}>
                Reject Complaint
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UncategorizedComplaints;