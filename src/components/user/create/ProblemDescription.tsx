import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { API_PATHS } from '@/routes/paths';

interface ProblemDescriptionProps {
  onAnalyze: (data: {
    originalDescription: string;
    mainIssue: string;
    mainIssueId: number;
    relatedIssue: string;
    relatedIssueId: number;
    subRelatedIssues: { id: number; related_issue_id: number; name: string }[];
    subRelatedIssueId?: number | null;
    contactNumber?: string;
  }) => void;
}

export default function ProblemDescription({ onAnalyze }: ProblemDescriptionProps) {
  const [mode, setMode] = useState<'analyze' | 'manual'>('analyze');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [relatedIssues, setRelatedIssues] = useState<any[]>([]);
  const [subRelatedIssues, setSubRelatedIssues] = useState<any[]>([]);
  const [selectedRelatedId, setSelectedRelatedId] = useState<number | null>(null);
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null);
  const [contactNumber, setContactNumber] = useState<string>('');

  useEffect(() => {
    if (mode === 'manual') fetchRelatedIssues();
  }, [mode]);

  const fetchRelatedIssues = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_PATHS.userdashboard.getAllRelatedIssues, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setRelatedIssues(data.relatedIssues);
      else toast.error('Failed to load related issues');
    } catch (err) {
      toast.error('Error loading related issues');
    }
  };

  const fetchSubRelatedIssues = async (relatedId: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_PATHS.userdashboard.getSubRelatedIssues(relatedId.toString()), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setSubRelatedIssues(data.subRelatedIssues);
      else toast.error('Failed to load sub-related issues');
    } catch (err) {
      toast.error('Error loading sub-related issues');
    }
  };

  const handleAnalyze = async () => {
    if (!description.trim()) {
      setError('Please enter a description of your issue.');
      toast.error('Please enter a description of your issue.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_PATHS.userdashboard.classifyDescription, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ description }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to classify issue');
      onAnalyze({
        originalDescription: description,
        mainIssue: data.mainIssue,
        mainIssueId: data.mainIssueId,
        relatedIssue: data.relatedIssue,
        relatedIssueId: data.relatedIssueId,
        subRelatedIssues: data.subRelatedIssues,
      });
      toast.success('Issue analyzed successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Error during analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = () => {
    if (!selectedRelatedId || !selectedSubId || !contactNumber.trim()) {
      toast.error('Please fill all required fields.');
      return;
    }
    const related = relatedIssues.find((r) => r.id === selectedRelatedId);
    const sub = subRelatedIssues.find((s) => s.id === selectedSubId);
    if (!related || !sub) {
      toast.error('Invalid issue selection.');
      return;
    }
    setLoading(true);
    onAnalyze({
      originalDescription: '',
      mainIssue: related.main_issue_name,
      mainIssueId: related.main_issue_id,
      relatedIssue: related.name,
      relatedIssueId: related.id,
      subRelatedIssues: [{ id: sub.id, related_issue_id: related.id, name: sub.name }],
      subRelatedIssueId: sub.id,
      contactNumber,
    });
    setLoading(false);
    toast.success('Manual complaint data submitted!');
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-6 rounded-2xl shadow space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Complaint Submission</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Manual</span>
          <Switch
            checked={mode === 'analyze'}
            onCheckedChange={(val) => setMode(val ? 'analyze' : 'manual')}
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">Analyze</span>
        </div>
      </div>

      {mode === 'analyze' ? (
        <>
          <Label htmlFor="description" className="text-base text-gray-800 dark:text-gray-200">Describe your issue</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            placeholder="Type your issue here..."
            rows={6}
            className="resize-y bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleAnalyze} disabled={loading || !description.trim()} className="w-full">
            {loading && <Loader2 className="animate-spin mr-2" />}
            {loading ? 'Analyzing...' : 'Analyze My Issue'}
          </Button>
        </>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 space-y-6">
          <Label className="text-lg font-semibold text-gray-800 dark:text-gray-200">Select Related Issue</Label>
          <Select
            onValueChange={(val) => {
              const id = Number(val);
              setSelectedRelatedId(id);
              setSelectedSubId(null);
              fetchSubRelatedIssues(id);
            }}
          >
            <SelectTrigger className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md">
              <SelectValue placeholder="Choose Related Issue" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
  {relatedIssues
    .filter((r) => r.name.toLowerCase() !== 'others')
    .map((r) => (
      <SelectItem key={r.id} value={r.id.toString()} className="hover:bg-gray-100 dark:hover:bg-gray-700">
        {r.name}
      </SelectItem>
  ))}
</SelectContent>

          </Select>

          {selectedRelatedId && (
            <>
              <Label className="text-lg font-semibold mt-4 text-gray-800 dark:text-gray-200">Main Issue (Auto-filled)</Label>
              <Input
                type="text"
                disabled
                value={relatedIssues.find((r) => r.id === selectedRelatedId)?.main_issue_name || ''}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md"
              />
            </>
          )}

          {subRelatedIssues.length > 0 && (
            <>
              <Label className="text-lg font-semibold mt-4 text-gray-800 dark:text-gray-200">Sub-Related Issue</Label>
<Select onValueChange={(val) => setSelectedSubId(Number(val))}>
  <SelectTrigger className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md">
    <SelectValue placeholder="Choose Sub-Related Issue" />
  </SelectTrigger>
  <SelectContent className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
    {subRelatedIssues.map((sub) => (
      <SelectItem key={sub.id} value={sub.id.toString()} className="hover:bg-gray-100 dark:hover:bg-gray-700">
        {sub.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

            </>
          )}

          <Label className="text-lg font-semibold mt-4 text-gray-800 dark:text-gray-200">Contact Number</Label>
          <Input
            type="text"
            value={contactNumber}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContactNumber(e.target.value)}
            placeholder="Enter contact number"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md"
          />

          <Button
            className="w-full mt-6 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 p-3 rounded-md transition duration-200"
            onClick={handleManualSubmit}
            disabled={loading || !selectedRelatedId || !selectedSubId || !contactNumber.trim()}
          >
            {loading ? 'Submitting...' : 'Submit Complaint'}
          </Button>
        </div>
      )}
    </div>
  );
}