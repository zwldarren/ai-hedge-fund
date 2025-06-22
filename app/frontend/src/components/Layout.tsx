import { SidebarProvider } from '@/components/ui/sidebar';
import { FlowProvider } from '@/contexts/flow-context';
import { cn } from '@/lib/utils';
import { SidebarStorageService } from '@/services/sidebar-storage';
import { ReactFlowProvider } from '@xyflow/react';
import { PanelLeft, PanelRight } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';
import { LeftSidebar } from './sidebar/left-sidebar';
import { RightSidebar } from './sidebar/right-sidebar';
import { Button } from './ui/button';

type LayoutProps = {
  children: ReactNode;
};

export function Layout({ children }: LayoutProps) {
  // Initialize sidebar states from storage service
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(() => 
    SidebarStorageService.loadLeftSidebarState(true)
  );
  
  const [isRightCollapsed, setIsRightCollapsed] = useState(() => 
    SidebarStorageService.loadRightSidebarState(true)
  );

  // Save left sidebar state whenever it changes
  useEffect(() => {
    SidebarStorageService.saveLeftSidebarState(isLeftCollapsed);
  }, [isLeftCollapsed]);

  // Save right sidebar state whenever it changes
  useEffect(() => {
    SidebarStorageService.saveRightSidebarState(isRightCollapsed);
  }, [isRightCollapsed]);

  return (
    <SidebarProvider defaultOpen={!isLeftCollapsed}>
      <div className="flex h-screen w-screen overflow-hidden relative bg-background">
        <ReactFlowProvider>
          <FlowProvider>
            {/* Main content area takes full width */}
            <main className="flex-1 h-full overflow-hidden w-full">
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
              />
            </div>

            {/* Left sidebar toggle button - visible when sidebar is collapsed */}
            {isLeftCollapsed && (
              <Button 
                className="absolute top-4 left-4 z-30 bg-ramp-grey-800 text-white p-4 rounded-[20px] hover:bg-ramp-grey-700"
                onClick={() => setIsLeftCollapsed(false)}
                aria-label="Show components sidebar"
              >
                Components <PanelLeft size={16} />
              </Button>
            )}

            {/* Right sidebar toggle button - visible when sidebar is collapsed */}
            {isRightCollapsed && (
              <Button 
                className="absolute top-4 right-4 z-30 bg-ramp-grey-800 text-white p-4 rounded-[20px] hover:bg-ramp-grey-700"
                onClick={() => setIsRightCollapsed(false)}
                aria-label="Show flows sidebar"
              >
                <PanelRight size={16} /> Flows
              </Button>
            )}
          </FlowProvider>
        </ReactFlowProvider>
      </div>
    </SidebarProvider>
  );
}