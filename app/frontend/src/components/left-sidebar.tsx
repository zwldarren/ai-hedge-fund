import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PanelLeft } from 'lucide-react';
import { ReactNode, useEffect, useRef, useState } from 'react';

interface LeftSidebarProps {
  children?: ReactNode;
  isCollapsed: boolean;
  onCollapse: () => void;
  onExpand: () => void;
  onToggleCollapse: () => void;
}

export function LeftSidebar({
  children,
  isCollapsed,
  onToggleCollapse,
}: LeftSidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(300); // Default width
  const [isDragging, setIsDragging] = useState(false);
  // Add a ref for tracking dragging state - updates synchronously unlike state
  const isDraggingRef = useRef(false);
  const minWidth = 200;
  const maxWidth = 500;

  // Handle manual resizing with mouse
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    // Set both the ref (for immediate use in mousemove) and state (for rendering)
    isDraggingRef.current = true;
    setIsDragging(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResize);
  };

  const handleMouseMove = (e: MouseEvent) => {
    // Use the ref value instead of state for checking
    if (!isDraggingRef.current) return;
    
    // Get sidebar's left position
    const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left || 0;
    
    // Calculate new width (limit between minWidth and maxWidth)
    const newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX - sidebarLeft));
    
    setWidth(newWidth);
  };

  const stopResize = () => {
    // Update both ref and state
    isDraggingRef.current = false;
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResize);
  };

  // Clean up event listeners when component unmounts
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopResize);
    };
  }, []); // Empty dependency array as we're using refs now

  return (
    <div 
      ref={sidebarRef}
      className={cn(
        "h-full bg-ramp-grey-800 flex flex-col relative",
        isCollapsed ? "shadow-lg" : "",
        isDragging ? "select-none" : ""
      )}
      style={{ 
        width: `${width}px`,
        borderRight: isDragging ? 'none' : '1px solid var(--ramp-grey-900)' 
      }}
    >
      <div className="p-2 flex justify-end flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="h-6 w-6 text-white hover:bg-ramp-grey-700"
          aria-label="Toggle sidebar"
        >
          <PanelLeft size={16} />
        </Button>
      </div>
      
      <div className="pt-2 flex-grow overflow-auto">
        {children}
      </div>
      
      {/* Resize handle - completely hidden during dragging */}
      {!isDragging && (
        <div 
          className="absolute top-0 right-0 h-full w-1 cursor-ew-resize transition-all duration-150 z-10"
          onMouseDown={startResize}
        />
      )}
    </div>
  );
} 