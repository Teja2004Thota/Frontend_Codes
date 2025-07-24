import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_PATHS } from '@/routes/paths';
import { FileText, Plus, ChevronRight, ChevronLeft, Check, X, Loader2 } from 'lucide-react';

const DatabaseUpdate = () => {
  const [editState, setEditState] = useState<{
    type: string | null;
    itemId: number | null;
    isEditing: boolean;
    stepNumber?: number;
  }>({
    type: null,
    itemId: null,
    isEditing: false,
  });
  const [step, setStep] = useState(1);
  const [mainIssueId, setMainIssueId] = useState<number | null>(null);
  const [relatedIssueId, setRelatedIssueId] = useState<number | null>(null);
  const [subRelatedIssueId, setSubRelatedIssueId] = useState<number | null>(null);
  const [descriptionId, setDescriptionId] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [mainIssues, setMainIssues] = useState<any[]>([]);
  const [relatedIssues, setRelatedIssues] = useState<any[]>([]);
  const [subRelatedIssues, setSubRelatedIssues] = useState<any[]>([]);
  const [descriptions, setDescriptions] = useState<any[]>([]);
  const [solutionSteps, setSolutionSteps] = useState<
    { id?: number; step_number: number; step_instruction: string; isNew: boolean }[]
  >([]);
  const [selectedItems, setSelectedItems] = useState<{
    main: string;
    related: string;
    subRelated: string;
    description: string;
  }>({
    main: '',
    related: '',
    subRelated: '',
    description: '',
  });
  const [isLoading, setIsLoading] = useState({
    main: false,
    related: false,
    subRelated: false,
    description: false,
    solutions: false,
    updating: false,
  });

  const token = localStorage.getItem('token');

  // Fetch functions with loading states
  const fetchMainIssues = async () => {
    setIsLoading(prev => ({ ...prev, main: true }));
    try {
      const res = await axios.get(API_PATHS.admindashboard.getMainIssues, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMainIssues(res.data || []);
    } catch (error) {
      toast.error('Failed to fetch main issues', { toastId: 'fetch-main-issues' });
    } finally {
      setIsLoading(prev => ({ ...prev, main: false }));
    }
  };

  const fetchRelatedIssues = async (mainId: number) => {
    setIsLoading(prev => ({ ...prev, related: true }));
    try {
      const res = await axios.get(API_PATHS.admindashboard.getRelatedIssues(mainId.toString()), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRelatedIssues(res.data || []);
    } catch (error) {
      toast.error('Failed to fetch related issues', { toastId: 'fetch-related-issues' });
    } finally {
      setIsLoading(prev => ({ ...prev, related: false }));
    }
  };

  const fetchSubRelatedIssues = async (relatedId: number) => {
    setIsLoading(prev => ({ ...prev, subRelated: true }));
    try {
      const res = await axios.get(API_PATHS.admindashboard.getSubRelatedIssues(relatedId.toString()), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubRelatedIssues(res.data || []);
    } catch (error) {
      toast.error('Failed to fetch sub-related issues', { toastId: 'fetch-sub-related-issues' });
    } finally {
      setIsLoading(prev => ({ ...prev, subRelated: false }));
    }
  };

  const fetchDescriptions = async (subRelatedIssueId: string) => {
    setIsLoading(prev => ({ ...prev, description: true }));
    try {
      const res = await axios.get(API_PATHS.admindashboard.getDescriptions(subRelatedIssueId), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDescriptions(res.data.descriptions || []);
    } catch (error) {
      toast.error('Failed to load issue descriptions');
    } finally {
      setIsLoading(prev => ({ ...prev, description: false }));
    }
  };

  const fetchSolutions = async (issueDescriptionId: string) => {
    setIsLoading(prev => ({ ...prev, solutions: true }));
    try {
      const res = await axios.get(API_PATHS.admindashboard.getSolutionsByDescription(issueDescriptionId), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSolutionSteps(
        (res.data.solutions || []).map((step: any) => ({
          id: step.id,
          step_number: step.step_number,
          step_instruction: step.step_instruction,
          isNew: false,
        }))
      );
    } catch (error) {
      toast.error('Failed to load solution steps');
    } finally {
      setIsLoading(prev => ({ ...prev, solutions: false }));
    }
  };

  useEffect(() => {
    fetchMainIssues();
  }, []);

  const handleSelect = async (type: string, id: number, name: string) => {
    if (editState.isEditing) return;

    setInput(name);
    setEditState({ type: null, itemId: null, isEditing: false });
    
    // Update selected items
    const updates: Partial<typeof selectedItems> = {};
    if (type === 'main') {
      updates.main = name;
      updates.related = '';
      updates.subRelated = '';
      updates.description = '';
    } else if (type === 'related') {
      updates.related = name;
      updates.subRelated = '';
      updates.description = '';
    } else if (type === 'subRelated') {
      updates.subRelated = name;
      updates.description = '';
    } else if (type === 'description') {
      updates.description = name;
    }
    setSelectedItems(prev => ({ ...prev, ...updates }));

    // Handle state updates and fetch data
    switch (type) {
      case 'main':
        setMainIssueId(id);
        setRelatedIssueId(null);
        setSubRelatedIssueId(null);
        setDescriptionId(null);
        setRelatedIssues([]);
        setSubRelatedIssues([]);
        setDescriptions([]);
        setSolutionSteps([]);
        await fetchRelatedIssues(id);
        setStep(2);
        break;
      case 'related':
        setRelatedIssueId(id);
        setSubRelatedIssueId(null);
        setDescriptionId(null);
        setSubRelatedIssues([]);
        setDescriptions([]);
        setSolutionSteps([]);
        await fetchSubRelatedIssues(id);
        setStep(3);
        break;
      case 'subRelated':
        setSubRelatedIssueId(id);
        setDescriptionId(null);
        setDescriptions([]);
        setSolutionSteps([]);
        await fetchDescriptions(id.toString());
        setStep(4);
        break;
      case 'description':
        setDescriptionId(id);
        setSolutionSteps([]);
        await fetchSolutions(id.toString());
        setStep(5);
        break;
    }
  };

  const handleDelete = async (id: number, type: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    let deleteUrl = '';
    switch (type) {
      case 'main':
        deleteUrl = API_PATHS.admindashboard.deleteMainIssue(id.toString());
        break;
      case 'related':
        deleteUrl = API_PATHS.admindashboard.deleteRelatedIssue(id.toString());
        break;
      case 'subRelated':
        deleteUrl = API_PATHS.admindashboard.deleteSubRelatedIssue(id.toString());
        break;
      case 'description':
        deleteUrl = API_PATHS.admindashboard.deleteDescription(id.toString());
        break;
    }

    try {
      await axios.delete(deleteUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Deleted successfully');
      
      // Refresh the appropriate data
      if (step === 1) await fetchMainIssues();
      if (step === 2 && mainIssueId) await fetchRelatedIssues(mainIssueId);
      if (step === 3 && relatedIssueId) await fetchSubRelatedIssues(relatedIssueId);
      if (step === 4 && subRelatedIssueId) await fetchDescriptions(subRelatedIssueId.toString());
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };
const handleAddNew = (type: string) => {
  if (
    type === 'main' ||
    (type === 'related' && mainIssueId) ||
    (type === 'subRelated' && relatedIssueId) ||
    (type === 'description' && subRelatedIssueId) ||
    (type === 'solution' && descriptionId)
  ) {
    setInput('');
    if (type === 'solution') {
      // Calculate next step number starting from 1 if no steps exist
      const nextStepNumber = solutionSteps.length > 0 
        ? Math.max(...solutionSteps.map(step => step.step_number)) + 1 
        : 1;

      setSolutionSteps(prev => [
        ...prev,
        { step_number: nextStepNumber, step_instruction: '', isNew: true }
      ]);
      setEditState({ type: 'solution', itemId: null, isEditing: true, stepNumber: nextStepNumber });
    } else {
      setEditState({ type, itemId: null, isEditing: true });
    }
  } else {
    toast.error(`Please select a ${type === 'related' ? 'main issue' : type === 'subRelated' ? 'related issue' : 'sub-related issue'} first`);
  }
};


  const handleSolutionChange = (index: number, value: string) => {
    const updatedSteps = [...solutionSteps];
    updatedSteps[index].step_instruction = value;
    setSolutionSteps(updatedSteps);
  };

  const handleFinish = async () => {
    if (!descriptionId || !subRelatedIssueId) return;

    setIsLoading(prev => ({ ...prev, updating: true }));

    try {
      const headers = { Authorization: `Bearer ${token}` };

      await Promise.all(
        solutionSteps.map(step => {
          const payload = {
            step_number: step.step_number,
            step_instruction: step.step_instruction,
          };

          if (step.id && !step.isNew) {
            // Update existing solution
            return axios.put(
              API_PATHS.admindashboard.updateSolution(step.id.toString()),
              payload,
              { headers }
            );
          } else {
            // Create new solution
            return axios.post(
              API_PATHS.admindashboard.createSolution,
              {
                ...payload,
                issue_description_id: descriptionId,
                sub_related_issue_id: subRelatedIssueId,
              },
              { headers }
            );
          }
        })
      );

      toast.success('Solutions saved successfully');

      // Refresh solutions list and reset form
      if (descriptionId) await fetchSolutions(descriptionId.toString());
      setStep(1);
      setSelectedItems({ main: '', related: '', subRelated: '', description: '' });
      setMainIssueId(null);
      setRelatedIssueId(null);
      setSubRelatedIssueId(null);
      setDescriptionId(null);
      setSolutionSteps([]);
    } catch (error) {
      toast.error('Failed to save solutions');
    } finally {
      setIsLoading(prev => ({ ...prev, updating: false }));
    }
    setEditState({ type: null, itemId: null, isEditing: false });
  };

  const handleExcelUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(API_PATHS.admindashboard.importExcel, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Excel file uploaded successfully');
      fetchMainIssues();
    } catch (error) {
      toast.error('Failed to upload Excel file');
    }
  };

  const handleNext = async () => {
  if (!input.trim()) {
    toast.error('Input cannot be empty');
    return;
  }

  setIsLoading(prev => ({ ...prev, updating: true }));

  try {
    const headers = { Authorization: `Bearer ${token}` };

    let url = '';
    let payload: any = {};

    // Calculate step number - start from 1 if no steps exist
    const stepNumber = editState.stepNumber ?? (
      solutionSteps.length > 0 
        ? Math.max(...solutionSteps.map(step => step.step_number)) + 1 
        : 1
    );

    // Rest of the function remains the same...
    // If editing, update logic
    if (editState.isEditing && editState.itemId) {
      switch (editState.type) {
        case 'main':
          url = API_PATHS.admindashboard.updateMainIssue(editState.itemId.toString());
          payload = { name: input };
          break;
        case 'related':
          url = API_PATHS.admindashboard.updateRelatedIssue(editState.itemId.toString());
          payload = { name: input };
          break;
        case 'subRelated':
          url = API_PATHS.admindashboard.updateSubRelatedIssue(editState.itemId.toString());
          payload = { name: input };
          break;
        case 'description':
          url = API_PATHS.admindashboard.updateDescription(editState.itemId.toString());
          payload = { description: input };
          break;
        case 'solution':
          url = API_PATHS.admindashboard.updateSolution(editState.itemId.toString());
          payload = {
            step_instruction: input,
            step_number: stepNumber,
            issue_description_id: descriptionId,
            sub_related_issue_id: subRelatedIssueId,
          };
          break;
      }

      await axios.put(url, payload, { headers });
      toast.success('Updated successfully');
    } else {
      // Create logic
      switch (editState.type) {
        case 'main':
          url = API_PATHS.admindashboard.createMainIssue;
          payload = { name: input };
          break;
        case 'related':
          if (!mainIssueId) throw new Error('Main Issue ID required');
          url = API_PATHS.admindashboard.createRelatedIssue;
          payload = { name: input, main_issue_id: mainIssueId };
          break;
        case 'subRelated':
          if (!relatedIssueId) throw new Error('Related Issue ID required');
          url = API_PATHS.admindashboard.createSubRelatedIssue;
          payload = { name: input, related_issue_id: relatedIssueId };
          break;
        case 'description':
          if (!subRelatedIssueId) throw new Error('Sub-Related Issue ID required');
          url = API_PATHS.admindashboard.createDescription;
          payload = { description: input, sub_related_issue_id: subRelatedIssueId };
          break;
        case 'solution':
          if (!descriptionId || !subRelatedIssueId) throw new Error('Description and Sub-Related Issue required');
          url = API_PATHS.admindashboard.createSolution;
          payload = {
            issue_description_id: descriptionId,
            sub_related_issue_id: subRelatedIssueId,
            step_instruction: input,
            step_number: stepNumber,
          };
          break;
        default:
          toast.error('Invalid creation type');
          return;
      }

      await axios.post(url, payload, { headers });
      toast.success('Created successfully');
    }

    // Refresh list based on current step
    switch (step) {
      case 1:
        await fetchMainIssues();
        break;
      case 2:
        if (mainIssueId) await fetchRelatedIssues(mainIssueId);
        break;
      case 3:
        if (relatedIssueId) await fetchSubRelatedIssues(relatedIssueId);
        break;
      case 4:
        if (subRelatedIssueId) await fetchDescriptions(subRelatedIssueId.toString());
        break;
      case 5:
        if (descriptionId) await fetchSolutions(descriptionId.toString());
        break;
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Operation failed');
  } finally {
    setIsLoading(prev => ({ ...prev, updating: false }));

    if (editState.type !== 'solution') {
      setEditState({ type: null, itemId: null, isEditing: false });
      setInput('');
    }
  }
};

  const StepCard = ({
  stepNumber,
  title,
  items,
  type,
  selected,
  onSelect,
  onAddNew,
  isActive,
}: {
  stepNumber: number;
  title: string;
  items: any[];
  type: string;
  selected: string;
  onSelect: (id: number, name: string) => void;
  onAddNew: () => void;
  isActive: boolean;
}) => (
  <Card className={`transition-all duration-300 h-[400px] flex flex-col ${
    isActive 
      ? 'border-blue-500 shadow-lg bg-white' 
      : 'border-gray-200 bg-gray-50 opacity-90'
  }`}>
    <CardContent className="p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`h-6 w-6 flex items-center justify-center rounded-full ${
            isActive 
              ? 'bg-blue-600 text-white font-bold' 
              : 'bg-gray-300 text-gray-600'
          }`}>
            {stepNumber}
          </div>
          <h3 className={`text-md font-semibold ${
            isActive ? 'text-gray-800' : 'text-gray-500'
          }`}>
            {title}
          </h3>
        </div>
        <Button
          onClick={onAddNew}
          className={`flex items-center gap-1 text-xs h-8 ${
            isActive 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
          }`}
          disabled={!isActive}
          size="sm"
        >
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>

      {selected && (
        <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-100 flex items-center text-sm">
          <FileText className="h-3 w-3 text-blue-600 mr-2" />
          <span className="truncate">Selected: {selected}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-blue-50 pr-2">
        {isLoading[type as keyof typeof isLoading] ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
          </div>
        ) : items.length > 0 ? (
          <ul className="space-y-1">
            {items.map((item) => (
              <li
                key={item.id}
                className={`p-2 rounded text-sm flex justify-between items-center ${
                  selected === (item.name || item.description) 
                    ? 'bg-blue-50 border-l-2 border-blue-500' 
                    : 'hover:bg-gray-100'
                } ${
                  !isActive ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                }`}
              >
                <div
                  className="flex-1 truncate"
                  onClick={() => {
                    if (!isActive || editState.isEditing) return;
                    onSelect(item.id, item.name || item.description);
                  }}
                >
                  {item.name || item.description}
                </div>

                <div className="flex items-center gap-1 ml-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setInput(item.name || item.description);
                      setEditState({ type, itemId: item.id, isEditing: true });
                    }}
                    className="h-6 px-2 text-xs"
                    disabled={!isActive}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(item.id, type)}
                    className="h-6 px-2 text-xs text-red-600 hover:text-red-800"
                    disabled={!isActive}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex justify-center items-center h-full">
            <p className="text-sm text-gray-500 italic">No items available</p>
          </div>
        )}
      </div>

      {editState.isEditing && editState.type === type && isActive && type !== 'solution' && (
        <div className="mt-3 p-2 bg-gray-50 rounded border border-gray-200">
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Enter ${type.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
              className="flex-grow p-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            <Button 
              onClick={handleNext} 
              className="bg-blue-600 hover:bg-blue-700 h-7 px-2"
              disabled={isLoading.updating}
            >
              {isLoading.updating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : editState.itemId ? 'Update' : 'Add'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setEditState({ type: null, itemId: null, isEditing: false })}
              className="h-7 px-2"
              disabled={isLoading.updating}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);

const SolutionStepCard = () => (
  <Card className={`transition-all duration-300 h-[400px] flex flex-col ${
    step === 5 
      ? 'border-blue-500 shadow-lg bg-white' 
      : 'border-gray-200 bg-gray-50 opacity-90'
  }`}>
    <CardContent className="p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`h-6 w-6 flex items-center justify-center rounded-full ${
            step === 5 
              ? 'bg-blue-600 text-white font-bold' 
              : 'bg-gray-300 text-gray-600'
          }`}>
            5
          </div>
          <h3 className={`text-md font-semibold ${
            step === 5 ? 'text-gray-800' : 'text-gray-500'
          }`}>
            Solution Steps
          </h3>
        </div>
        <Button
          onClick={() => {
            const nextStepNumber = solutionSteps.length > 0 
              ? Math.max(...solutionSteps.map(step => step.step_number)) + 1 
              : 1;
            setSolutionSteps(prev => [
              ...prev,
              { step_number: nextStepNumber, step_instruction: '', isNew: true }
            ]);
            setEditState({ type: 'solution', itemId: null, isEditing: true, stepNumber: nextStepNumber });
            setInput('');
          }}
          className={`flex items-center gap-1 text-xs h-8 ${
            step === 5
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
          }`}
          disabled={step !== 5}
          size="sm"
        >
          <Plus className="h-3 w-3" /> Add Step
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-blue-50 pr-2 space-y-2">
        {isLoading.solutions ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
          </div>
        ) : solutionSteps.length > 0 ? (
          solutionSteps.map((solution, index) => (
            <div key={index} className="flex items-start gap-2 w-full">
              <div className="flex-shrink-0 mt-1 bg-blue-100 text-blue-800 rounded-full h-5 w-5 flex items-center justify-center text-xs font-medium">
                {solution.step_number}
              </div>

              {(editState.isEditing && editState.type === 'solution' &&
                ((solution.id && editState.itemId === solution.id) || (solution.isNew && editState.itemId === null && editState.stepNumber === solution.step_number))) ? (
                <div className="flex-grow flex items-center gap-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-grow p-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                  <Button 
                    onClick={handleNext} 
                    className="bg-blue-600 hover:bg-blue-700 h-7 px-2"
                    disabled={isLoading.updating}
                  >
                    {isLoading.updating ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : solution.isNew ? 'Add' : 'Update'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditState({ type: null, itemId: null, isEditing: false })}
                    className="h-7 px-2"
                    disabled={isLoading.updating}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={solution.step_instruction}
                    onChange={(e) => handleSolutionChange(index, e.target.value)}
                    placeholder={`Enter step ${solution.step_number} instruction`}
                    className={`flex-grow p-1 text-sm border ${
                      step === 5 
                        ? 'border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500' 
                        : 'border-gray-200 bg-gray-100'
                    } rounded`}
                    disabled={step !== 5}
                  />
                  <div className="flex items-center gap-1 mt-1">
                    {!solution.isNew && step === 5 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditState({
                            type: 'solution',
                            itemId: solution.id!,
                            isEditing: true,
                            stepNumber: solution.step_number,
                          });
                          setInput(solution.step_instruction);
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        Edit
                      </Button>
                    )}
                    {solution.isNew && step === 5 && (
                      <button
                        onClick={() => setSolutionSteps(solutionSteps.filter((_, i) => i !== index))}
                        className="text-red-500 hover:text-red-700 p-0.5"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        ) : (
          <div className="flex justify-center items-center h-full">
            <p className="text-sm text-gray-500 italic">No solution steps available</p>
          </div>
        )}
      </div>

      {step === 5 && (
        <div className="mt-4 flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setStep(4)}
            className="h-8 px-3 text-sm"
          >
            <ChevronLeft className="h-3 w-3 mr-1" /> Back
          </Button>
          <Button 
            onClick={handleFinish} 
            className="bg-green-600 hover:bg-green-700 h-8 px-3 text-sm"
            disabled={isLoading.updating}
          >
            {isLoading.updating ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Check className="h-3 w-3 mr-1" />
            )}
            Save
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
);

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-7xl">
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Import Issues from Excel</h2>
          <div className="flex items-center gap-4">
            <div className="flex-grow">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>
            <Button 
              onClick={handleExcelUpload} 
              className="bg-blue-600 hover:bg-blue-700 h-10"
              disabled={!file}
            >
              Upload Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">Database Update Wizard</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Step {step} of 5</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-full ${i <= step ? 'bg-blue-600' : 'bg-gray-300'}`}
                />
              ))}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StepCard
            stepNumber={1}
            title="Main Issues"
            items={mainIssues}
            type="main"
            selected={selectedItems.main}
            onSelect={(id, name) => handleSelect('main', id, name)}
            onAddNew={() => handleAddNew('main')}
            isActive={true}
          />
          <StepCard
            stepNumber={2}
            title="Related Issues"
            items={relatedIssues}
            type="related"
            selected={selectedItems.related}
            onSelect={(id, name) => handleSelect('related', id, name)}
            onAddNew={() => handleAddNew('related')}
            isActive={!!mainIssueId}
          />
          <StepCard
            stepNumber={3}
            title="Sub-Related Issues"
            items={subRelatedIssues}
            type="subRelated"
            selected={selectedItems.subRelated}
            onSelect={(id, name) => handleSelect('subRelated', id, name)}
            onAddNew={() => handleAddNew('subRelated')}
            isActive={!!relatedIssueId}
          />
          <StepCard
            stepNumber={4}
            title="Descriptions"
            items={descriptions}
            type="description"
            selected={selectedItems.description}
            onSelect={(id, name) => handleSelect('description', id, name)}
            onAddNew={() => handleAddNew('description')}
            isActive={!!subRelatedIssueId}
          />
          <SolutionStepCard />
        </div>
      </div>
    </div>
  );
};

export default DatabaseUpdate;