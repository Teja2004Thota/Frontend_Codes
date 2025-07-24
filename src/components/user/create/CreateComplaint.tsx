import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import ProblemDescription from './ProblemDescription';
import IssueSelection from './IssueSelection';
import SubRelatedIssues from './SubRelatedIssues';
import SubIssueDescription from './SubIssueDescription';
import ChatbotAssistance from './ChatbotAssistance';
import PrioritySelection from './PrioritySelection';
import { v4 as uuidv4 } from 'uuid';
import { AnimatePresence, motion } from 'framer-motion';
import { API_PATHS } from '@/routes/paths';

interface SubRelatedIssue {
  id: number;
  issue: string;
}

interface ComplaintData {
  originalDescription: string;
  description?: string; // Optional for manual mode
  mainIssue: string;
  mainIssueId: number | null;
  relatedIssue: string;
  relatedIssueId: number | null;
  selectedSubIssue: SubRelatedIssue | null;
  subRelatedIssues: { id: number; related_issue_id: number; name: string }[];
  subIssueDescription?: string; // Optional for manual mode
  solutions?: string[]; // Optional for manual mode
  contactNumber?: string; // NEW: for manual mode
}

export default function CreateComplaint({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(1);
  const [sessionId, setSessionId] = useState<string>('');
  const [complaintData, setComplaintData] = useState<ComplaintData>({
    originalDescription: '',
    description: '',
    mainIssue: '',
    mainIssueId: null,
    relatedIssue: '',
    relatedIssueId: null,
    selectedSubIssue: null,
    subRelatedIssues: [],
    subIssueDescription: '',
    solutions: [],
    contactNumber: '',
  });

  useEffect(() => {
    setSessionId(uuidv4());
  }, []);

  const handleAnalyze = async (data: {
    originalDescription: string;
    mainIssue: string;
    mainIssueId: number;
    relatedIssue: string;
    relatedIssueId: number;
    subRelatedIssues: { id: number; related_issue_id: number; name: string }[];
    subRelatedIssueId?: number | null;
    contactNumber?: string;
  }) => {
    const newComplaintData = {
      originalDescription: data.originalDescription,
      description: data.originalDescription, // Empty for manual mode
      mainIssue: data.mainIssue,
      mainIssueId: data.mainIssueId,
      relatedIssue: data.relatedIssue,
      relatedIssueId: data.relatedIssueId,
      selectedSubIssue: data.subRelatedIssueId
        ? { id: data.subRelatedIssueId, issue: data.subRelatedIssues.find(s => s.id === data.subRelatedIssueId)?.name || 'Others' }
        : null,
      subRelatedIssues: data.subRelatedIssues,
      subIssueDescription: '',
      solutions: [],
      contactNumber: data.contactNumber || '',
    };
    setComplaintData(newComplaintData);

    if (data.mainIssueId === 1 && data.relatedIssueId === 1) {
      setStep(6); // Skip to PrioritySelection for "Others"
    } else if (data.subRelatedIssueId && !data.originalDescription) {
      // Manual mode: Submit complaint directly
      try {
        const token = localStorage.getItem('token');
        const payload = {
  description: 'No description available',
  mainIssueId: data.mainIssueId,
  relatedIssueId: data.relatedIssueId,
  subRelatedIssueId: data.subRelatedIssueId,
  priority: 'Medium',
  isResolved: false,
  sessionId,
  issueDescription: data.subRelatedIssues.find(s => s.id === data.subRelatedIssueId)?.name || 'Others',
  contactNumber: data.contactNumber,
};

        const response = await fetch(API_PATHS.userdashboard.submitComplaint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (result.success) {
          toast.success('Complaint submitted successfully!');
          resetForm();
          onBack();
        } else {
          throw new Error(result.message || 'Failed to submit complaint');
        }
      } catch (err: unknown) { // Changed to unknown
        const errorMessage = err instanceof Error ? err.message : 'Error submitting complaint';
        toast.error(errorMessage);
      }
    } else {
      setStep(2); // Proceed to IssueSelection for analyze mode
    }
  };

  const handleIssueSelection = (
    mainIssue: string,
    mainIssueId: number,
    relatedIssue: string,
    relatedIssueId: number,
    subRelatedIssues: { id: number; related_issue_id: number; name: string }[]
  ) => {
    setComplaintData({
      ...complaintData,
      mainIssue,
      mainIssueId,
      relatedIssue,
      relatedIssueId,
      subRelatedIssues,
    });
    setStep(3);
  };

  const handleSubIssueSelection = (data: {
    selectedSubIssue: SubRelatedIssue;
    description: string;
    solutions: string[];
  }) => {
    const isOthers = data.selectedSubIssue.id === -1 || data.selectedSubIssue.issue === 'Others';
    setComplaintData({
      ...complaintData,
      selectedSubIssue: isOthers ? { id: -1, issue: 'Others' } : data.selectedSubIssue,
      subIssueDescription: data.description,
      solutions: data.solutions,
    });
    setStep(isOthers ? 6 : 4);
  };

  const handleRaiseComplaint = () => {
    setStep(6);
  };

  const handlePreviewSolution = () => {
    setStep(5);
  };

  const handleIssueSolved = () => {
    toast.success('Issue resolved successfully!');
    resetForm();
    onBack();
  };

  const handleAgentFailed = () => {
    toast.info('Proceeding to priority selection.');
    setStep(6);
  };

  const handleNotResolved = () => {
    setStep(6);
  };

  const handleSubmitSuccess = () => {
    resetForm();
    onBack();
  };

  const resetForm = () => {
    setStep(1);
    setSessionId(uuidv4());
    setComplaintData({
      originalDescription: '',
      description: '',
      mainIssue: '',
      mainIssueId: null,
      relatedIssue: '',
      relatedIssueId: null,
      selectedSubIssue: null,
      subRelatedIssues: [],
      subIssueDescription: '',
      solutions: [],
      contactNumber: '',
    });
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {step === 1 && <ProblemDescription onAnalyze={handleAnalyze} />}

          {step === 2 && complaintData.mainIssueId && complaintData.relatedIssueId && (
            <>
              <IssueSelection
                mainIssue={complaintData.mainIssue}
                mainIssueId={complaintData.mainIssueId}
                relatedIssue={complaintData.relatedIssue}
                relatedIssueId={complaintData.relatedIssueId}
                subRelatedIssues={complaintData.subRelatedIssues}
                onConfirm={handleIssueSelection}
              />
              <Button onClick={handleBack} variant="outline">
                Back
              </Button>
            </>
          )}

          {step === 3 && (
            <>
              <SubRelatedIssues
                mainIssueId={complaintData.mainIssueId}
                relatedIssueId={complaintData.relatedIssueId}
                subRelatedIssues={complaintData.subRelatedIssues}
                onUpdateSubIssues={handleSubIssueSelection}
              />
              <div className="flex space-x-4">
                <Button onClick={handleBack} variant="outline">
                  Back
                </Button>
                <Button
                  onClick={() => {
                    if (complaintData.selectedSubIssue) {
                      handleSubIssueSelection({
                        selectedSubIssue: complaintData.selectedSubIssue,
                        description: complaintData.subIssueDescription || '',
                        solutions: complaintData.solutions || [],
                      });
                    }
                  }}
                  disabled={!complaintData.selectedSubIssue}
                >
                  Proceed
                </Button>
              </div>
            </>
          )}

          {step === 4 && complaintData.selectedSubIssue && (
            <>
              <SubIssueDescription
                selectedSubIssue={complaintData.selectedSubIssue}
                description={complaintData.subIssueDescription || ''}
                onRaiseComplaint={handleRaiseComplaint}
                onPreviewSolution={handlePreviewSolution}
              />
              <Button onClick={handleBack} variant="outline">
                Back
              </Button>
            </>
          )}

          {step === 5 &&
            complaintData.mainIssueId &&
            complaintData.relatedIssueId &&
            complaintData.selectedSubIssue && (
              <ChatbotAssistance
                summary={{
                  description: complaintData.originalDescription,
                  mainIssue: complaintData.mainIssue,
                  relatedIssues: [complaintData.relatedIssue],
                  faqs: [],
                  subIssue: complaintData.selectedSubIssue,
                }}
                solutions={complaintData.solutions || []}
                onIssueSolved={handleIssueSolved}
                onAgentFailed={handleAgentFailed}
                onNotResolved={handleNotResolved}
                mainIssueId={complaintData.mainIssueId}
                relatedIssueId={complaintData.relatedIssueId}
                sessionId={sessionId}
              />
            )}

          {step === 6 &&
            complaintData.mainIssueId &&
            complaintData.relatedIssueId && (
              <PrioritySelection
                description={complaintData.description || ''}
                mainIssueId={complaintData.mainIssueId}
                relatedIssueId={complaintData.relatedIssueId}
                selectedSubIssue={complaintData.selectedSubIssue?.id === -1 ? null : complaintData.selectedSubIssue}
                onSubmitSuccess={handleSubmitSuccess}
                sessionId={sessionId}
              />
            )}

          <Button onClick={onBack} variant="outline" className="mt-4">
            Back to Dashboard
          </Button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}