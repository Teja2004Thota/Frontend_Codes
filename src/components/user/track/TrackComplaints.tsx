import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  Search, Clock, CheckCircle, AlertCircle, User,
  ChevronDown, ChevronRight, Calendar, Info, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { API_PATHS } from '@/routes/paths';

const ReadMore = ({ text, maxLength = 100 }: { text: string; maxLength?: number }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  if (text.length <= maxLength) {
    return <span>{text}</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          {isExpanded ? text : `${text.substring(0, maxLength)}...`}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }} 
            className="ml-1 text-primary text-sm font-medium hover:underline focus:outline-none"
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {text}
      </TooltipContent>
    </Tooltip>
  );
};

interface TrackComplaintsProps {
  filter?: 'resolved' | 'unresolved' | 'all';
  onBack: () => void;
}

interface Complaint {
  id: number;
  sno: number;
  description: string;
  mainIssue?: string;
  relatedIssue?: string;
  subRelatedIssue?: string;
  status: string;
  assignedTo?: string | null;
  assignedToId?: number | null;
  assignedToPhone?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  doneBy?: string | null;
  directSolution?: string;
  issueDescription?: string;
  solutionSteps?: string[];
  hasFeedback?: boolean;
  feedbackLabel?: string;
  feedbackComment?: string;
}

const TrackComplaints = ({ filter, onBack }: TrackComplaintsProps) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [expandedComplaint, setExpandedComplaint] = useState<number | null>(null);
  const [feedbackData, setFeedbackData] = useState<{
    [key: number]: {
      label: string;
      comment: string;
    }
  }>({});

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(API_PATHS.userdashboard.trackComplaints, {
          headers: { Authorization: `Bearer ${token}` },
        });
        let allComplaints = response.data.complaints.map((c: any, index: number) => ({
          ...c,
          sno: index + 1,
          assignedTo: c.assignedTo || null,
          hasFeedback: c.hasFeedback || false
        }));

        if (filter === 'resolved') {
          allComplaints = allComplaints.filter((c: any) => c.status === 'Closed');
        } else if (filter === 'unresolved') {
          allComplaints = allComplaints.filter(
            (c: any) => c.status === 'Open'
          );
        }

        setComplaints(allComplaints);
      } catch (error) {
        console.error('Error fetching complaints:', error);
      }
    };

    fetchComplaints();
  }, [filter]);

  const handleFeedbackChange = (complaintId: number, field: string, value: string) => {
    setFeedbackData(prev => ({
      ...prev,
      [complaintId]: {
        ...prev[complaintId],
        [field]: value
      }
    }));
  };

  const submitFeedback = async (complaintId: number) => {
    try {
      const token = localStorage.getItem('token');
      const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
      const { label, comment } = feedbackData[complaintId] || {};

      if (!label) {
        toast({
          title: "Error",
          description: "Please select a rating",
          variant: "destructive",
        });
        return;
      }

      await axios.post(
        API_PATHS.userdashboard.submitFeedback,
        {
          complaint_id: complaintId,
          user_id: userId,
          subadmin_id: complaints.find((c: any) => c.id === complaintId)?.assignedToId,
          label,
          comment
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: "Success",
        description: "Feedback submitted successfully",
      });

      setComplaints(prev => prev.map((c: any) => 
        c.id === complaintId ? { ...c, hasFeedback: true } : c
      ));

      setFeedbackData(prev => {
        const newData = { ...prev };
        delete newData[complaintId];
        return newData;
      });

    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive",
      });
    }
  };

  const formatStatus = (status: string, assignedTo: string | null) => {
    if (status === 'Rejected') return 'Rejected';
    if (status === 'Closed') return 'Resolved';
    if (status === 'Open' && assignedTo) return 'In Progress';
    if (status === 'Open' && !assignedTo) return 'Pending';
    return 'Pending';
  };

  const getStatusColor = (status: string, assignedTo: string | null) => {
    const mapped = formatStatus(status, assignedTo);
    switch (mapped) {
      case 'Pending': return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'Resolved': return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200';
      case 'Rejected': return 'bg-red-100 text-red-800 hover:bg-red-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getStatusIcon = (status: string, assignedTo: string | null) => {
    const mapped = formatStatus(status, assignedTo);
    switch (mapped) {
      case 'Pending': return <Clock className="h-4 w-4 text-amber-500" />;
      case 'In Progress': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'Resolved': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'Rejected': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSolutionText = (complaint: any) => {
    if (formatStatus(complaint.status, complaint.assignedTo) === 'Pending') 
      return 'Description in One:- Your complaint is awaiting assignment to a support team member.';
    if (formatStatus(complaint.status, complaint.assignedTo) === 'In Progress') 
      return 'Description in One:- Our team is currently working on your complaint.';
    if (complaint.directSolution) 
      return `Description in One:- ${complaint.directSolution}`;
    
    const details = [];

    if (complaint.mainIssue) details.push(`Main Issue: ${complaint.mainIssue}`);
    if (complaint.relatedIssue) details.push(`Related Issue: ${complaint.relatedIssue}`);
    if (complaint.subRelatedIssue) details.push(`Sub-Related Issue: ${complaint.subRelatedIssue}`);
    if (complaint.issueDescription) details.push(`Description in One:- ${complaint.issueDescription}`);

    if (complaint.solutionSteps && complaint.solutionSteps.length > 0) {
      details.push('Solution Steps:-');
      complaint.solutionSteps.forEach((step: string, index: number) => {
        details.push(`Step ${index + 1}: ${step}`);
      });
    }

    return details.length > 0
      ? details.join('\n')
      : 'Description in Oneline:- No detailed description is provided.';
  };

  const formatTimeTaken = (createdAt: string, updatedAt: string | null) => {
    if (!updatedAt) return 'In progress';
    const created = new Date(createdAt);
    const updated = new Date(updatedAt);
    const ms = updated.getTime() - created.getTime();
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days >= 1) return `${days} day${days > 1 ? 's' : ''}`;
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold">
              <Search className="h-5 w-5 text-primary" />
              Complaint Tracking Dashboard
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Monitor the status and progress of all your submitted complaints
            </p>
          </CardHeader>
        </Card>

        <div className="space-y-4">
          {complaints.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="text-center py-16">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Search className="h-6 w-6 opacity-50" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No complaints found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  You haven't submitted any complaints yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            complaints.map((complaint: any, index) => (
              <Card key={complaint.id} className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-0">
                  <Collapsible
                    open={expandedComplaint === complaint.id}
                    onOpenChange={(open) => setExpandedComplaint(open ? complaint.id : null)}
                  >
                    <CollapsibleTrigger className="w-full p-6 text-left hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-[50px_100px_2fr_1fr_1fr_1fr_1fr] gap-2 items-center">
                          <div className="text-sm font-medium text-gray-500">
                            {complaint.sno}
                          </div>
                          <div className="text-sm font-medium text-gray-500">
                            Complaint ID: #{complaint.id}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 mb-1">
                              <ReadMore text={complaint.description} maxLength={60} />
                            </p>
                            <div className="flex gap-1 items-center flex-wrap text-sm">
                              {[complaint.mainIssue, complaint.relatedIssue, complaint.subRelatedIssue]
                                .filter(Boolean)
                                .map((issue, idx, arr) => (
                                  <div key={idx} className="flex items-center gap-1">
                                    <Badge variant="outline" className="text-xs font-normal">
                                      {issue}
                                    </Badge>
                                    {idx !== arr.length - 1 && (
                                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                    )}
                                  </div>
                                ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(complaint.status, complaint.assignedTo)}
                            <Badge className={`text-xs font-medium ${getStatusColor(complaint.status, complaint.assignedTo)}`}>
                              {formatStatus(complaint.status, complaint.assignedTo)}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-700 flex items-center gap-1">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="line-clamp-1">{complaint.assignedTo || 'Unassigned'}</span>
                          </div>
                          <div className="text-sm text-gray-700">
                            {formatDate(complaint.createdAt)}
                          </div>
                          <div className="text-center">
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="inline-flex items-center gap-1">
                                  <span className="text-sm font-medium text-gray-900">
                                    {formatTimeTaken(complaint.createdAt, complaint.updatedAt)}
                                  </span>
                                  <Info className="h-3 w-3 text-muted-foreground" />
                                </div>
                                <div className="text-xs text-muted-foreground">Resolution time</div>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs space-y-1">
                                <p>Created: {formatDate(complaint.createdAt)}</p>
                                {complaint.updatedAt && (
                                  <p>Resolved: {formatDate(complaint.updatedAt)}</p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                        <div className="ml-4">
                          {expandedComplaint === complaint.id ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-6 pb-6 pt-2 border-t bg-gray-50/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-primary" />
                              Complaint Timeline
                            </h4>
                            <div className="space-y-4">
                              <div className="relative pl-6 pb-4 border-l border-gray-200">
                                <div className="absolute -left-[5px] top-0 h-3 w-3 rounded-full bg-primary"></div>
                                <div>
                                  <p className="font-medium text-sm">Complaint Submitted</p>
                                  <p className="text-muted-foreground text-xs">{formatDate(complaint.createdAt)}</p>
                                </div>
                              </div>
                              {complaint.assignedTo && (
                                <div className="relative pl-6 pb-4 border-l border-gray-200">
                                  <div className="absolute -left-[5px] top-0 h-3 w-3 rounded-full bg-blue-500"></div>
                                  <div>
                                    <p className="font-medium text-sm">Assigned to Support</p>
                                    <p className="text-muted-foreground text-xs">
                                      {complaint.assignedTo} is investigating your complaint
                                    </p>
                                  </div>
                                </div>
                              )}
                              {formatStatus(complaint.status, complaint.assignedTo) === 'Resolved' && (
                                <div className="relative pl-6 pb-4">
                                  <div className="absolute -left-[5px] top-0 h-3 w-3 rounded-full bg-emerald-500"></div>
                                  <div>
                                    <p className="font-medium text-sm">Complaint Resolved</p>
                                    <p className="text-muted-foreground text-xs">
                                      {formatDate(complaint.updatedAt)} by {complaint.doneBy || complaint.assignedTo}
                                    </p>
                                  </div>
                                </div>
                              )}
                              {formatStatus(complaint.status, complaint.assignedTo) === 'Resolved' && (
  <div className="relative pl-6">
    <div className="absolute -left-[5px] top-2 h-3 w-3 rounded-full bg-yellow-400"></div>
    <div className="mt-2">
      {!complaint.hasFeedback ? (
        <>
          <p className="text-sm font-medium mb-1 text-gray-800">
            Give your feedback to help us improve
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <Select
              onValueChange={(value) =>
                handleFeedbackChange(complaint.id, 'label', value)
              }
              value={feedbackData[complaint.id]?.label || ''}
            >
              <SelectTrigger className="h-9 text-sm w-40">
                <SelectValue placeholder="Rate experience" />
              </SelectTrigger>
              <SelectContent className="text-sm">
                <SelectItem value="Excellent">Excellent</SelectItem>
                <SelectItem value="Good">Good</SelectItem>
                <SelectItem value="Average">Average</SelectItem>
                <SelectItem value="Poor">Poor</SelectItem>
                <SelectItem value="Very Poor">Very Poor</SelectItem>
              </SelectContent>
            </Select>

            <input
              type="text"
              placeholder="Comment (optional)"
              value={feedbackData[complaint.id]?.comment || ''}
              onChange={(e) =>
                handleFeedbackChange(complaint.id, 'comment', e.target.value)
              }
              className="text-sm border rounded px-3 py-2 h-9 w-72 focus:outline-none focus:ring-1 focus:ring-primary"
            />

            <Button
              onClick={() => submitFeedback(complaint.id)}
              size="sm"
              className="h-9 px-4 text-sm"
              disabled={!feedbackData[complaint.id]?.label}
            >
              Submit
            </Button>
          </div>
        </>
      ) : (
        <div className="text-sm flex flex-wrap items-center gap-1 text-gray-700 mt-2">
          
          <span>
            Rated: <span className="font-medium">{complaint.feedbackLabel}</span>
          </span>
         
        </div>
      )}
    </div>
  </div>
)}

                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-emerald-500" />
                              {formatStatus(complaint.status, complaint.assignedTo) === 'Resolved' ? 'Resolution Details' : 'Current Status'}
                            </h4>
                            <div className="bg-white rounded-lg p-4 border text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                              {getSolutionText(complaint)}
                            </div>
                            {complaint.assignedTo && (
                              <div className="mt-4">
                                <h4 className="font-medium text-gray-900 mb-2 text-sm flex items-center gap-2">
                                  <User className="h-4 w-4 text-primary" />
                                  Assigned Support Contact
                                </h4>
                                <div className="bg-white rounded-lg p-3 border text-sm">
                                  <p className="font-medium">{complaint.assignedTo}</p>
                                  {complaint.assignedToPhone && (
                                    <p className="text-muted-foreground text-xs">📞 {complaint.assignedToPhone}</p>
                                  )}
                                  <p className="text-muted-foreground text-xs">Please contact for any updates</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default TrackComplaints;