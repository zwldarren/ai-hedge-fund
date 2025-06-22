import { useFlowContext } from '@/contexts/flow-context';
import { useToastManager } from '@/hooks/use-toast-manager';
import { flowService } from '@/services/flow-service';
import { Flow } from '@/types/flow';
import { useCallback, useEffect, useState } from 'react';

export interface UseFlowManagementReturn {
  // State
  flows: Flow[];
  searchQuery: string;
  isLoading: boolean;
  openGroups: string[];
  createDialogOpen: boolean;
  
  // Computed values
  filteredFlows: Flow[];
  recentFlows: Flow[];
  templateFlows: Flow[];
  
  // Actions
  setSearchQuery: (query: string) => void;
  setOpenGroups: (groups: string[]) => void;
  setCreateDialogOpen: (open: boolean) => void;
  handleAccordionChange: (value: string[]) => void;
  handleCreateNewFlow: () => void;
  handleFlowCreated: (newFlow: Flow) => Promise<void>;
  handleSaveCurrentFlow: () => Promise<void>;
  handleLoadFlow: (flow: Flow) => Promise<void>;
  handleRefresh: () => Promise<void>;
  
  // Internal functions (for testing/advanced use)
  loadFlows: () => Promise<void>;
  createDefaultFlow: () => Promise<void>;
}

export function useFlowManagement(): UseFlowManagementReturn {
  // Get flow context and toast manager
  const { saveCurrentFlow, loadFlow, reactFlowInstance } = useFlowContext();
  const { success, error } = useToastManager();
  
  // State for flows
  const [flows, setFlows] = useState<Flow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(['recent-flows']);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Create default flow for new users
  const createDefaultFlow = useCallback(async () => {
    try {
      console.log('Creating default flow for new user...');
      // Get current React Flow state, fallback to empty arrays if nothing exists
      const nodes = reactFlowInstance?.getNodes() || [];
      const edges = reactFlowInstance?.getEdges() || [];
      const viewport = reactFlowInstance?.getViewport() || { x: 0, y: 0, zoom: 1 };
      
      const defaultFlow = await flowService.createDefaultFlow(nodes, edges, viewport);
      console.log('Default flow created:', defaultFlow);
      setFlows([defaultFlow]);
      await loadFlow(defaultFlow);
      console.log('Default flow loaded successfully');
    } catch (error) {
      console.error('Failed to create default flow:', error);
    }
  }, [reactFlowInstance, loadFlow]);

  // Load flows from API
  const loadFlows = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('Loading flows from API...');
      const flowsData = await flowService.getFlows();
      console.log('Loaded flows:', flowsData);
      setFlows(flowsData);
      
      if (flowsData.length === 0) {
        // Create default flow if user has no flows
        console.log('No flows found, creating default flow...');
        await createDefaultFlow();
      } else {
        // Try to restore the last selected flow from localStorage
        const lastSelectedFlowId = localStorage.getItem('lastSelectedFlowId');
        let flowToLoad = null;

        if (lastSelectedFlowId) {
          // Try to find the last selected flow
          flowToLoad = flowsData.find(flow => flow.id === parseInt(lastSelectedFlowId));
          if (flowToLoad) {
            console.log('Restoring last selected flow:', flowToLoad.name);
          }
        }

        // If no last selected flow or it doesn't exist anymore, use the most recent
        if (!flowToLoad) {
          flowToLoad = flowsData.reduce((latest, current) => {
            const latestDate = new Date(latest.updated_at || latest.created_at);
            const currentDate = new Date(current.updated_at || current.created_at);
            return currentDate > latestDate ? current : latest;
          });
          console.log('Loading most recent flow:', flowToLoad.name);
        }

        // Fetch the full flow data before loading
        const fullFlow = await flowService.getFlow(flowToLoad.id);
        await loadFlow(fullFlow);
      }
    } catch (error) {
      console.error('Error loading flows:', error);
    } finally {
      setIsLoading(false);
    }
  }, [createDefaultFlow, loadFlow]);

  // Load flows on mount
  useEffect(() => {
    loadFlows();
  }, [loadFlows]);

  // Filter flows based on search query
  const filteredFlows = flows.filter(flow =>
    flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    flow.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    flow.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Sort flows by updated_at descending, then group them
  const sortedFlows = [...filteredFlows].sort((a, b) => {
    const dateA = new Date(a.updated_at || a.created_at);
    const dateB = new Date(b.updated_at || b.created_at);
    return dateB.getTime() - dateA.getTime();
  });

  // Group flows
  const recentFlows = sortedFlows.filter(f => !f.is_template).slice(0, 10);
  const templateFlows = sortedFlows.filter(f => f.is_template);

  // Event handlers
  const handleAccordionChange = useCallback((value: string[]) => {
    setOpenGroups(value);
  }, []);

  const handleCreateNewFlow = useCallback(() => {
    setCreateDialogOpen(true);
  }, []);

  const handleFlowCreated = useCallback(async (newFlow: Flow) => {
    // Load the new flow and remember it
    await loadFlow(newFlow);
    localStorage.setItem('lastSelectedFlowId', newFlow.id.toString());
    
    // Refresh the flows list to show the new flow
    await loadFlows();
  }, [loadFlow, loadFlows]);

  const handleSaveCurrentFlow = useCallback(async () => {
    try {
      const savedFlow = await saveCurrentFlow();
      if (savedFlow) {
        // Remember the saved flow
        localStorage.setItem('lastSelectedFlowId', savedFlow.id.toString());
        // Refresh the flows list
        await loadFlows();
        success(`"${savedFlow.name}" saved!`, 'flow-save');
      } else {
        error('Failed to save flow', 'flow-save-error');
      }
    } catch (err) {
      console.error('Failed to save flow:', err);
      error('Failed to save flow', 'flow-save-error');
    }
  }, [saveCurrentFlow, loadFlows, success, error]);

  const handleLoadFlow = useCallback(async (flow: Flow) => {
    try {
      // Fetch the full flow data including nodes, edges, and viewport
      const fullFlow = await flowService.getFlow(flow.id);
      await loadFlow(fullFlow);
      // Remember the selected flow
      localStorage.setItem('lastSelectedFlowId', flow.id.toString());
      console.log('Flow loaded:', fullFlow.name);
    } catch (error) {
      console.error('Failed to load flow:', error);
    }
  }, [loadFlow]);

  const handleRefresh = useCallback(async () => {
    await loadFlows();
  }, [loadFlows]);

  return {
    // State
    flows,
    searchQuery,
    isLoading,
    openGroups,
    createDialogOpen,
    
    // Computed values
    filteredFlows,
    recentFlows,
    templateFlows,
    
    // Actions
    setSearchQuery,
    setOpenGroups,
    setCreateDialogOpen,
    handleAccordionChange,
    handleCreateNewFlow,
    handleFlowCreated,
    handleSaveCurrentFlow,
    handleLoadFlow,
    handleRefresh,
    
    // Internal functions
    loadFlows,
    createDefaultFlow,
  };
} 