import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'react-toastify';

interface SubRelatedIssue {
  id: number;
  related_issue_id: number;
  name: string;
}

interface IssueSelectionProps {
  mainIssue: string;
  mainIssueId: number | null;
  relatedIssue: string;
  relatedIssueId: number | null;
  subRelatedIssues: SubRelatedIssue[];
  onConfirm: (mainIssue: string, mainIssueId: number, relatedIssue: string, relatedIssueId: number, subRelatedIssues: SubRelatedIssue[]) => void;
}

export default function IssueSelection({
  mainIssue,
  mainIssueId,
  relatedIssue,
  relatedIssueId,
  subRelatedIssues,
  onConfirm,
}: IssueSelectionProps) {
  const handleConfirm = () => {
    if (mainIssueId && relatedIssueId && mainIssueId !== 1 && relatedIssueId !== 1) {
      onConfirm(mainIssue, mainIssueId, relatedIssue, relatedIssueId, subRelatedIssues);
      toast.success('Issues confirmed successfully.');
    } else {
      toast.error('Cannot confirm issues. Please ensure valid issues are selected.');
    }
  };

  if (mainIssueId === 1 && relatedIssueId === 1) {
    return null; // Skip rendering for "Others"
  }

  return (
    <Card className="max-w-md mx-auto shadow-lg rounded-2xl p-6 bg-white space-y-6">
      <CardContent className="space-y-4">
        <div>
          <Label className="text-lg font-semibold text-gray-800">Main Issue</Label>
          <p className={`mt-1 text-base ${mainIssue ? 'text-gray-700' : 'text-red-500 italic'}`}>
            {mainIssue || 'Not identified'}
          </p>
        </div>
        <div>
          <Label className="text-lg font-semibold text-gray-800">Related Issue</Label>
          <p className={`mt-1 text-base ${relatedIssue ? 'text-gray-700' : 'text-red-500 italic'}`}>
            {relatedIssue || 'Not identified'}
          </p>
        </div>
        <Button
          onClick={handleConfirm}
          disabled={!mainIssueId || !relatedIssueId || mainIssueId === 1 || relatedIssueId === 1}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
        >
          Confirm Issues
        </Button>
      </CardContent>
    </Card>
  );
}