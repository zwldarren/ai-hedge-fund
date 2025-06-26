import { BottomPanel } from '@/components/panels/bottom/bottom-panel';
import { LeftSidebar } from '@/components/panels/left/left-sidebar';
import { RightSidebar } from '@/components/panels/right/right-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { FlowProvider, useFlowContext } from '@/contexts/flow-context';
import { useLayoutKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { cn } from '@/lib/utils';
import { SidebarStorageService } from '@/services/sidebar-storage';
import { ReactFlowProvider } from '@xyflow/react';
import { ReactNode, useEffect, useState } from 'react';
import { TopBar } from './layout/top-bar';

// Create a LayoutContent component to access the FlowContext
function LayoutContent({ children }: { children: ReactNode }) {
  const { reactFlowInstance } = useFlowContext();
  
  // Initialize sidebar states from storage service
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(() => 
    SidebarStorageService.loadLeftSidebarState(true)
  );
  
  const [isRightCollapsed, setIsRightCollapsed] = useState(() => 
    SidebarStorageService.loadRightSidebarState(true)
  );

  const [isBottomCollapsed, setIsBottomCollapsed] = useState(() => 
    SidebarStorageService.loadBottomPanelState(true)
  );

  // Track actual sidebar widths for dynamic bottom panel positioning
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(280);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(280);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(300);

  // Add keyboard shortcuts for toggling sidebars and fit view
  useLayoutKeyboardShortcuts(
    () => setIsRightCollapsed(!isRightCollapsed), // Cmd+I for right sidebar
    () => setIsLeftCollapsed(!isLeftCollapsed),   // Cmd+B for left sidebar
    () => reactFlowInstance.fitView({ padding: 0.1, duration: 500 }), // Cmd+O for fit view
    // Note: undo/redo will be handled directly in the Flow component for now
    undefined, // undo
    undefined, // redo
    () => setIsBottomCollapsed(!isBottomCollapsed), // Cmd+J for bottom panel
  );

  // Save sidebar states whenever they change
  useEffect(() => {
    SidebarStorageService.saveLeftSidebarState(isLeftCollapsed);
  }, [isLeftCollapsed]);

  useEffect(() => {
    SidebarStorageService.saveRightSidebarState(isRightCollapsed);
  }, [isRightCollapsed]);

  useEffect(() => {
    SidebarStorageService.saveBottomPanelState(isBottomCollapsed);
  }, [isBottomCollapsed]);

  // Calculate bottom panel positioning based on actual sidebar widths
  const getBottomPanelStyle = () => {
    let left = 0;
    let right = 0;
    
    if (!isLeftCollapsed) {
      left = leftSidebarWidth;
    }
    
    if (!isRightCollapsed) {
      right = rightSidebarWidth;
    }
    
    return {
      left: `${left}px`,
      right: `${right}px`,
    };
  };

  // Calculate main content height when bottom panel is visible
  const getMainContentStyle = () => {
    if (!isBottomCollapsed) {
      return { height: `calc(100vh - ${bottomPanelHeight}px)` };
    }
    return { height: '100%' };
  };

  const handleSettingsClick = () => {
    // TODO: Open settings dialog/modal
    console.log('Settings clicked');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden relative bg-background">
      {/* VSCode-style Top Bar */}
      <TopBar
        isLeftCollapsed={isLeftCollapsed}
        isRightCollapsed={isRightCollapsed}
        isBottomCollapsed={isBottomCollapsed}
        onToggleLeft={() => setIsLeftCollapsed(!isLeftCollapsed)}
        onToggleRight={() => setIsRightCollapsed(!isRightCollapsed)}
        onToggleBottom={() => setIsBottomCollapsed(!isBottomCollapsed)}
        onSettingsClick={handleSettingsClick}
      />

      {/* Main content area takes full width but adjusts height for bottom panel */}
      <main className="flex-1 h-full overflow-hidden w-full" style={getMainContentStyle()}>
        {children}
      </main>

      {/* Floating left sidebar */}
      <div className={cn(
        "absolute top-0 left-0 z-30 h-full transition-transform",
        isLeftCollapsed && "transform -translate-x-full opacity-0"
      )}>
        <LeftSidebar
          isCollapsed={isLeftCollapsed}
          onCollapse={() => setIsLeftCollapsed(true)}
          onExpand={() => setIsLeftCollapsed(false)}
          onToggleCollapse={() => setIsLeftCollapsed(!isLeftCollapsed)}
          onWidthChange={setLeftSidebarWidth}
        />
      </div>

      {/* Floating right sidebar */}
      <div className={cn(
        "absolute top-0 right-0 z-30 h-full transition-transform",
        isRightCollapsed && "transform translate-x-full opacity-0"
      )}>
        <RightSidebar
          isCollapsed={isRightCollapsed}
          onCollapse={() => setIsRightCollapsed(true)}
          onExpand={() => setIsRightCollapsed(false)}
          onToggleCollapse={() => setIsRightCollapsed(!isRightCollapsed)}
          onWidthChange={setRightSidebarWidth}
        />
      </div>

      {/* Bottom panel */}
      <div 
        className={cn(
          "absolute bottom-0 z-20 transition-transform",
          isBottomCollapsed && "transform translate-y-full opacity-0"
        )}
        style={getBottomPanelStyle()}
      >
        <BottomPanel
          isCollapsed={isBottomCollapsed}
          onCollapse={() => setIsBottomCollapsed(true)}
          onExpand={() => setIsBottomCollapsed(false)}
          onToggleCollapse={() => setIsBottomCollapsed(!isBottomCollapsed)}
          onHeightChange={setBottomPanelHeight}
        />
      </div>
    </div>
  );
}

type LayoutProps = {
  children: ReactNode;
};

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <ReactFlowProvider>
        <FlowProvider>
          <LayoutContent>{children}</LayoutContent>
        </FlowProvider>
      </ReactFlowProvider>
    </SidebarProvider>
  );
}