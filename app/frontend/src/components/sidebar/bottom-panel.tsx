import { useResizable } from '@/hooks/use-resizable';
import { cn } from '@/lib/utils';
import { AlertCircle, Bug, FileText, Terminal, X } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface BottomPanelProps {
  children?: ReactNode;
  isCollapsed: boolean;
  onCollapse: () => void;
  onExpand: () => void;
  onToggleCollapse: () => void;
  onHeightChange?: (height: number) => void;
}

export function BottomPanel({
  isCollapsed,
  onToggleCollapse,
  onHeightChange,
}: BottomPanelProps) {
  // Use our custom hooks for vertical resizing
  const { height, isDragging, elementRef, startResize } = useResizable({
    defaultHeight: 300,
    minHeight: 200,
    maxHeight: 600,
    side: 'bottom',
  });
  
  // Notify parent component of height changes
  useEffect(() => {
    onHeightChange?.(height);
  }, [height, onHeightChange]);
  
  const [activeTab, setActiveTab] = useState('terminal');

  if (isCollapsed) {
    return null;
  }

  return (
    <div 
      ref={elementRef}
      className={cn(
        "bg-panel flex flex-col relative border-t border-ramp-grey-900",
        isDragging ? "select-none" : ""
      )}
      style={{ 
        height: `${height}px`,
      }}
    >
      {/* Resize handle - on the top for bottom panel */}
      {!isDragging && (
        <div 
          className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize transition-all duration-150 z-10 hover:bg-primary/20"
          onMouseDown={startResize}
        />
      )}

      {/* Header with tabs and close button */}
      <div className="flex items-center justify-between border-b border-ramp-grey-700 px-4 py-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <div className="flex items-center justify-between">
            <TabsList className="bg-transparent border-none p-0 h-auto">
              <TabsTrigger 
                value="terminal" 
                className="flex items-center gap-2 px-3 py-1.5 text-sm data-[state=active]:bg-ramp-grey-700 data-[state=active]:text-white text-muted-foreground"
              >
                <Terminal size={14} />
                Terminal
              </TabsTrigger>
              <TabsTrigger 
                value="output"
                className="flex items-center gap-2 px-3 py-1.5 text-sm data-[state=active]:bg-ramp-grey-700 data-[state=active]:text-white text-muted-foreground"
              >
                <FileText size={14} />
                Output
              </TabsTrigger>
              <TabsTrigger 
                value="debug"
                className="flex items-center gap-2 px-3 py-1.5 text-sm data-[state=active]:bg-ramp-grey-700 data-[state=active]:text-white text-muted-foreground"
              >
                <Bug size={14} />
                Debug Console
              </TabsTrigger>
              <TabsTrigger 
                value="problems"
                className="flex items-center gap-2 px-3 py-1.5 text-sm data-[state=active]:bg-ramp-grey-700 data-[state=active]:text-white text-muted-foreground"
              >
                <AlertCircle size={14} />
                Problems
              </TabsTrigger>
            </TabsList>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="h-6 w-6 text-white hover:bg-ramp-grey-700"
              aria-label="Close panel"
            >
              <X size={14} />
            </Button>
          </div>
        </Tabs>
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <Tabs value={activeTab} className="h-full">
          <TabsContent value="terminal" className="h-full m-0 p-4">
            <div className="h-full bg-black/20 rounded-md p-3 font-mono text-sm text-green-400 overflow-auto">
              <div className="whitespace-pre-wrap">
                <span className="text-blue-400">$ </span>
                <span className="text-white">Welcome to AI Hedge Fund Terminal</span>
                {'\n'}
                <span className="text-muted-foreground">Type commands here...</span>
                {'\n'}
                <span className="text-blue-400">$ </span>
                <span className="animate-pulse">_</span>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="output" className="h-full m-0 p-4">
            <div className="h-full bg-background/50 rounded-md p-3 text-sm overflow-auto">
              <div className="text-muted-foreground">
                No output to display
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="debug" className="h-full m-0 p-4">
            <div className="h-full bg-background/50 rounded-md p-3 text-sm overflow-auto">
              <div className="text-muted-foreground">
                Debug console is ready...
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="problems" className="h-full m-0 p-4">
            <div className="h-full bg-background/50 rounded-md p-3 text-sm overflow-auto">
              <div className="text-muted-foreground">
                No problems detected
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 