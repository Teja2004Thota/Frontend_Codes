import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, User, CheckCircle, X, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown';
import { API_PATHS } from '@/routes/paths';

interface SubRelatedIssue {
  id: number;
  issue: string;
}

interface ComplaintData {
  description: string;
  mainIssue: string;
  relatedIssues: string[];
  faqs: { question: string; answer: string }[];
  subIssue: SubRelatedIssue;
}

interface ChatbotAssistanceProps {
  summary: ComplaintData;
  solutions: string[];
  onIssueSolved: () => void;
  onAgentFailed: () => void;
  onNotResolved: () => void;
  mainIssueId: number | null;
  relatedIssueId: number | null;
  sessionId: string;
}

interface ChatMessage {
  id: number;
  type: 'bot' | 'user' | 'option' | 'step';
  message: string;
  timestamp: Date;
  options?: { id: string; label: string; icon?: React.ReactNode }[];
  isThinking?: boolean;
}

interface Solution {
  id: string;
  label: string;
  steps: string[];
}

// ... all your imports and interfaces remain unchanged

const ChatbotAssistance = ({ summary, solutions, onIssueSolved, onAgentFailed, onNotResolved, mainIssueId, relatedIssueId, sessionId }: ChatbotAssistanceProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [solution, setSolution] = useState<Solution | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const hasInitialized = useRef(false);

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setMessages((prev) => [...prev, { ...message, id: prev.length + 1, timestamp: new Date() }]);
  };

  const addThinkingMessage = () => {
    setIsTyping(true);
    addMessage({ type: 'bot', message: 'Analyzing your issue...', isThinking: true });
  };

  const removeThinkingMessage = () => {
    setIsTyping(false);
    setMessages((prev) => prev.filter((msg) => !msg.isThinking));
  };

  const logResolutionStatus = async (isResolved: boolean) => {
    const token = localStorage.getItem('token');
    const response = await fetch(API_PATHS.userdashboard.logResolution, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        isResolved,
        sessionId,
      }),
    });

    if (!response.ok) throw new Error('Failed to log resolution');
    return await response.json();
  };

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (solutions && solutions.length > 0) {
      const selectedSolution: Solution = {
        id: summary.subIssue.id.toString(),
        label: summary.subIssue.issue,
        steps: solutions,
      };
      setSolution(selectedSolution);

      addThinkingMessage();
      setTimeout(() => {
        removeThinkingMessage();
        addMessage({
          type: 'bot',
          message: `Let’s resolve "**${summary.subIssue.issue}**". Please follow this step:\n\n**Step ${currentStepIndex + 1}**: ${selectedSolution.steps[0]}`,
          options: [{ id: 'step-completed', label: 'Step Completed' }],
        });
      }, 2000);
    } else {
      addMessage({
        type: 'bot',
        message: 'No solution available for this issue. Please select "Request Human Support" or proceed to raise a complaint.',
        options: [{ id: 'not-resolved', label: 'Proceed to Complaint' }],
      });
    }
  }, [summary, solutions]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleOptionClick = async (optionId: string) => {
    if (!solution && optionId !== 'not-resolved') return;

    if (optionId === 'step-completed') {
      addMessage({ type: 'user', message: 'Step Completed' });

      if (currentStepIndex + 1 < solution!.steps.length) {
        setCurrentStepIndex(currentStepIndex + 1);
        addThinkingMessage();
        setTimeout(() => {
          removeThinkingMessage();
          addMessage({
            type: 'bot',
            message: `Great! Now try this:\n\n**Step ${currentStepIndex + 2}**: ${solution!.steps[currentStepIndex + 1]}`,
            options: [{ id: 'step-completed', label: 'Step Completed' }],
          });
        }, 1500);
      } else {
        addThinkingMessage();
        setTimeout(() => {
          removeThinkingMessage();
          addMessage({
            type: 'bot',
            message: 'You’ve completed all the steps. Please select "Issue Resolved" if your issue is fixed, or "Request Human Support" if you need further assistance.',
          });
        }, 1500);
      }
    } else if (optionId === 'not-resolved') {
      addMessage({ type: 'user', message: 'Proceed to Complaint' });
      addThinkingMessage();
      try {
        await logResolutionStatus(false);
        removeThinkingMessage();
        addMessage({ type: 'bot', message: 'Let’s proceed to set the priority and submit your complaint.' });
        toast.info('Proceeding to priority selection.', {
          position: 'top-right',
          autoClose: 3000,
          theme: 'colored',
        });
        setTimeout(() => onNotResolved(), 2000);
      } catch (err) {
        removeThinkingMessage();
        toast.error('Failed to log resolution status.', {
          position: 'top-right',
          autoClose: 3000,
          theme: 'colored',
        });
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">AI Support Assistant</h1>
        <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed mt-2">Guiding you to resolve your issue with clear, step-by-step assistance.</p>
      </div>

      <Card className="bg-white dark:bg-gray-800 border-none shadow-lg rounded-2xl mb-6">
        <CardHeader>
          <CardTitle className="flex items-center text-lg font-semibold text-gray-900 dark:text-gray-100">
            <Bot className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
            Issue Resolution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[500px] border border-gray-200 dark:border-gray-600 rounded-xl p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900/50 shadow-inner">
            {messages.map((message) => {
              const isBot = ['bot', 'option', 'step'].includes(message.type);
              return (
                <div key={message.id} className={`mb-4 ${isBot ? 'flex justify-start' : 'flex justify-end'}`}>
                  <div className={`flex max-w-[85%] ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className={`flex-shrink-0 ${isBot ? 'mr-3' : 'ml-3'}`}>
                      {isBot ? (
                        <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center">
                          {message.isThinking ? (
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                          ) : (
                            <Bot className="w-5 h-5 text-white" />
                          )}
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-green-600 dark:bg-green-500 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className={`px-4 py-3 rounded-xl ${isBot ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600' : 'bg-blue-600 dark:bg-blue-500 text-white'}`}>
                      <div className="text-sm leading-relaxed">
                        <ReactMarkdown>{message.message}</ReactMarkdown>
                      </div>
                      {message.options && (
                        <div className="mt-3 space-y-2">
                          {message.options.map((option) => (
                            <button
                              key={`${message.id}-${option.id}`}
                              onClick={() => handleOptionClick(option.id)}
                              className="w-full flex items-center justify-center px-4 py-2 text-sm bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/50 text-blue-700 dark:text-blue-300 rounded-lg transition-all duration-200 border border-blue-200 dark:border-blue-600 font-medium"
                            >
                              {option.icon && <span className="mr-2">{option.icon}</span>}
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={async () => {
            try {
              await logResolutionStatus(true); // ✅ Log resolved
              toast.success('Issue marked as resolved.', {
                position: 'top-right',
                autoClose: 3000,
                theme: 'colored',
              });
              onIssueSolved();
            } catch (err) {
              toast.error('Failed to log resolution status.', {
                position: 'top-right',
                autoClose: 3000,
                theme: 'colored',
              });
            }
          }}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white py-3 px-8 font-semibold rounded-lg shadow-md transition-all duration-200"
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          Issue Resolved
        </Button>

        <Button
          onClick={async () => {
            addMessage({ type: 'user', message: 'Request Human Support' });
            addThinkingMessage();
            try {
              await logResolutionStatus(false); // ✅ Log not-resolved
              removeThinkingMessage();
              addMessage({ type: 'bot', message: 'Let’s proceed to set the priority and submit your complaint.' });
              toast.info('Proceeding to priority selection.', {
                position: 'top-right',
                autoClose: 3000,
                theme: 'colored',
              });
              setTimeout(() => onNotResolved(), 2000);
            } catch (err) {
              removeThinkingMessage();
              toast.error('Failed to log resolution status.', {
                position: 'top-right',
                autoClose: 3000,
                theme: 'colored',
              });
            }
          }}
          variant="outline"
          className="border-red-600 dark:border-red-400 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 py-3 px-8 font-semibold rounded-lg shadow-md transition-all duration-200"
        >
          <X className="w-5 h-5 mr-2" />
          Request Human Support
        </Button>
      </div>
    </div>
  );
};

export default ChatbotAssistance;
