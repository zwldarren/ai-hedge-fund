import { cn } from '@/lib/utils';
import { getStatusColor } from '../utils';

interface OutputNodeStatusProps {
  isProcessing: boolean;
  isOutputAvailable: boolean;
  isConnected: boolean;
  onViewOutput?: () => void;
  processingText?: string;
  availableText?: string;
  unavailableText?: string;
}

export function OutputNodeStatus({
  isProcessing,
  isOutputAvailable,
  isConnected,
  onViewOutput,
  processingText = "In Progress",
  availableText = "View Output",
  unavailableText = "View Output"
}: OutputNodeStatusProps) {
  const status = isProcessing ? 'IN_PROGRESS' : 'IDLE';
  const isClickable = isOutputAvailable && !isProcessing;
  
  let displayText: string;
  if (isProcessing) {
    displayText = processingText;
  } else if (isOutputAvailable) {
    displayText = availableText;
  } else {
    displayText = unavailableText;
  }

  return (
    <div 
      className={cn(
        "text-foreground text-xs rounded p-2 border border-border transition-colors",
        isProcessing ? "gradient-animation" : getStatusColor(status),
        isClickable && "bg-primary text-primary-foreground cursor-pointer hover:bg-primary/80",
        !isOutputAvailable && !isProcessing && "opacity-50 cursor-not-allowed"
      )}
      onClick={isClickable ? onViewOutput : undefined}
    >
      {isProcessing ? (
        <div className="flex items-center gap-2 justify-center">
          <span className="capitalize">{displayText}</span>
        </div>
      ) : (
        <span className="capitalize">{displayText}</span>
      )}
    </div>
  );
} 