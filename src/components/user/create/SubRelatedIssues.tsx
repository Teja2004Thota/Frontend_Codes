import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'react-toastify';
import { API_PATHS } from '@/routes/paths';

interface SubRelatedIssue {
  id: number;
  issue: string;
}

interface SubRelatedIssuesProps {
  mainIssueId: number | null;
  relatedIssueId: number | null;
  subRelatedIssues: { id: number; related_issue_id: number; name: string }[];
  onUpdateSubIssues: (data: {
    selectedSubIssue: SubRelatedIssue;
    description: string;
    solutions: string[];
  }) => void;
}

export default function SubRelatedIssues({
  mainIssueId,
  relatedIssueId,
  subRelatedIssues,
  onUpdateSubIssues,
}: SubRelatedIssuesProps) {
  const [selectedSubIssue, setSelectedSubIssue] = useState<SubRelatedIssue | null>(null);

  const handleSubIssueChange = async (value: string) => {
    if (value === 'others') {
      const othersSubIssue: SubRelatedIssue = {
        id: -1, // use -1 or null for "others"
        issue: 'Others',
      };

      setSelectedSubIssue(othersSubIssue);

      onUpdateSubIssues({
        selectedSubIssue: othersSubIssue,
        description: '',
        solutions: [],
      });

      // Directly scroll or trigger next step here if needed.
      document.getElementById('priority-section')?.scrollIntoView({ behavior: 'smooth' });

      toast.info(`Selected: Others`, {
        position: 'top-right',
        autoClose: 2000,
        theme: 'colored',
      });

      return;
    }

    const subIssue = subRelatedIssues.find((issue) => issue.id.toString() === value);
    if (subIssue) {
      const mappedSubIssue: SubRelatedIssue = { id: subIssue.id, issue: subIssue.name };
      setSelectedSubIssue(mappedSubIssue);

      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('You are not authenticated. Please log in.');

        const response = await fetch(
          API_PATHS.userdashboard.getSolutions(subIssue.id.toString()),
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 401) throw new Error('Unauthorized access. Please log in again.');

        const data = await response.json();

        if (!data.success) throw new Error(data.message || 'Failed to fetch solution.');

        const solutions = data.solutions.map(
          (step: { id: number; step_number: number; step_instruction: string }) =>
            step.step_instruction
        );

        onUpdateSubIssues({
          selectedSubIssue: mappedSubIssue,
          description: data.issueDescription || 'No description available.',
          solutions,
        });

        toast.info(`Selected sub-issue: ${subIssue.name}`, {
          position: 'top-right',
          autoClose: 2000,
          theme: 'colored',
        });
      } catch (error) {
        const errorMessage =
          typeof error === 'object' && error !== null && 'message' in error
            ? (error as { message: string }).message
            : 'Error fetching solution. Please try again.';
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 3000,
          theme: 'colored',
        });
      }
    }
  };

  return (
    <Card className="max-w-2xl mx-auto shadow-lg rounded-2xl p-6 bg-white dark:bg-gray-800 space-y-6">
      <CardContent className="space-y-4">
        <Label className="text-lg font-semibold text-gray-800 dark:text-gray-100">Select a Sub-Related Issue</Label>
        {subRelatedIssues.length > 0 ? (
          <RadioGroup onValueChange={handleSubIssueChange} className="space-y-3">
            {[...subRelatedIssues, { id: -1, related_issue_id: relatedIssueId || -1, name: 'Others' }].map((subIssue) => (
              <div key={subIssue.id} className="flex items-center space-x-3 p-3 border rounded-md bg-gray-50 dark:bg-gray-900/50">
                <RadioGroupItem
                  value={subIssue.id === -1 ? 'others' : subIssue.id.toString()}
                  id={`sub-issue-${subIssue.id}`}
                />
                <Label htmlFor={`sub-issue-${subIssue.id}`} className="text-gray-800 dark:text-gray-200">
                  {subIssue.name}
                </Label>
              </div>
            ))}
          </RadioGroup>
        ) : (
          <p className="text-gray-700 dark:text-gray-300">No sub-related issues available.</p>
        )}
      </CardContent>
    </Card>
  );
}
