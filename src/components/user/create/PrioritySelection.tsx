import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'react-toastify';
import { API_PATHS } from '@/routes/paths';

interface SubRelatedIssue {
  id: number;
  issue: string;
}

interface PrioritySelectionProps {
  description: string;
  mainIssueId: number | null;
  relatedIssueId: number | null;
  selectedSubIssue: SubRelatedIssue | null;
  onSubmitSuccess: () => void;
  sessionId: string;
}

const PrioritySelection = ({
  description,
  mainIssueId,
  relatedIssueId,
  selectedSubIssue,
  onSubmitSuccess,
  sessionId,
}: PrioritySelectionProps) => {
  const [priority, setPriority] = useState<string>('Medium');
  const [contactNumber, setContactNumber] = useState<string>(''); // NEW
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!mainIssueId || !relatedIssueId || !description) {
      toast.error('Missing required fields to submit the complaint.', {
        position: 'top-right',
        autoClose: 3000,
        theme: 'colored',
      });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You are not authenticated. Please log in.');
      }

      const isOthers = mainIssueId === 1 && relatedIssueId === 1;

      const payload = {
        description,
        mainIssueId,
        relatedIssueId,
        subRelatedIssueId: isOthers ? null : selectedSubIssue?.id,
        priority,
        isResolved: false,
        sessionId,
        issueDescription: isOthers ? 'Others' : selectedSubIssue?.issue || 'Others',
        contactNumber, // NEW FIELD
      };

      console.log('📦 Submitting complaint with:', payload); // mock only

      const response = await fetch(API_PATHS.userdashboard.submitComplaint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          isOthers
            ? 'Complaint submitted as "Others" and is pending subadmin review.'
            : `Complaint submitted successfully for sub-issue: ${selectedSubIssue?.issue || 'Others'}!`,
          {
            position: 'top-right',
            autoClose: 3000,
            theme: 'colored',
          }
        );
        onSubmitSuccess();
      } else {
        throw new Error(data.message || 'Failed to submit complaint.');
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'An error occurred while submitting the complaint.',
        {
          position: 'top-right',
          autoClose: 3000,
          theme: 'colored',
        }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center pt-6 px-4 space-y-6">
      <div className="text-center space-y-2 mb-6">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
          Set Complaint Priority
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Select the priority level for your complaint.
        </p>
        {mainIssueId === 1 && relatedIssueId === 1 && (
          <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
            This complaint is categorized as "Others" and will be reviewed by a subadmin.
          </p>
        )}
      </div>

      <Card className="w-full max-w-sm shadow-xl rounded-2xl border-0 bg-white dark:bg-gray-800">
        <CardHeader className="pb-0">
          <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Complaint Priority
          </CardTitle>
        </CardHeader>

        <CardContent className="mt-4 space-y-6">
          {/* Priority */}
          <div className="space-y-2">
            <Label
              htmlFor="priority"
              className="text-base font-medium text-gray-700 dark:text-gray-300"
            >
              Priority
            </Label>

            <Select onValueChange={setPriority} defaultValue={priority}>
              <SelectTrigger
                id="priority"
                className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100"
              >
                <SelectValue placeholder="Select" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* NEW: Contact Number */}
          <div className="space-y-2">
<Label
  htmlFor="contact"
  className="text-base font-medium text-gray-700 dark:text-gray-300"
>
  Contact Number
</Label>
<Input
  id="contact"
  type="text"
  placeholder="Enter your contact number"

              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="w-full h-10 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || !description}
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition duration-200"
          >
            {loading ? 'Submitting...' : 'Submit Complaint'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrioritySelection;
