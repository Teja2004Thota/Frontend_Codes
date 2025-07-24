import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';

interface SubRelatedIssue {
  id: number;
  issue: string;
}

interface SubIssueDescriptionProps {
  selectedSubIssue: SubRelatedIssue;
  description: string;
  onRaiseComplaint: () => void;
  onPreviewSolution: () => void;
}

const SubIssueDescription = ({ selectedSubIssue, description, onRaiseComplaint, onPreviewSolution }: SubIssueDescriptionProps) => {
  const handleRaiseComplaint = () => {
    toast.success(`Confirmed issue: ${selectedSubIssue.issue}. Proceeding to submit complaint.`, {
      position: 'top-right',
      autoClose: 2000,
      theme: 'colored',
    });
    onRaiseComplaint();
  };

  const handlePreviewSolution = () => {
    toast.info(`Viewing solution for: ${selectedSubIssue.issue}.`, {
      position: 'top-right',
      autoClose: 2000,
      theme: 'colored',
    });
    onPreviewSolution();
  };
return (
    <Card className="max-w-3xl mx-auto rounded-2xl shadow-md bg-white dark:bg-gray-900 p-6 space-y-4">
      <CardHeader className="pb-1">
        <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          🛠️ Detailed Issue: <span className="text-blue-600 dark:text-blue-400">{selectedSubIssue.issue}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        <p className="text-gray-800 dark:text-gray-300 text-base leading-relaxed">
          {description}
        </p>

        <div className="flex flex-wrap gap-4">
          <Button
            onClick={handleRaiseComplaint}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium px-6 py-2"
          >
            Raise Complaint
          </Button>

          <Button
            onClick={handlePreviewSolution}
            variant="outline"
            className="border border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-800/20 font-medium px-6 py-2"
          >
            Preview Solution
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubIssueDescription;