import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MessageItem } from '@/contexts/node-context';
import { Copy, MessageSquare } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface AgentOutputDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  messages: MessageItem[];
}

export function AgentOutputDialog({ 
  isOpen, 
  onOpenChange, 
  name, 
  messages 
}: AgentOutputDialogProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const initialFocusRef = useRef<HTMLDivElement>(null);

  // Format ISO timestamp to local browser time
  const formatTime = (timestamp: string) => {
    // Parse ISO timestamp string into Date object
    const date = new Date(timestamp);
    
    // Format as HH:MM:SS in local browser timezone
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Collect all decisions from all messages into a single decision dictionary
  const allDecisions = messages.reduce<Record<string, string>>((acc, msg) => {
    // Add decisions from this message to our accumulated decisions
    if (msg.analysis && Object.keys(msg.analysis).length > 0) {
      // Filter out null values before adding to our accumulated decisions
      const validDecisions = Object.entries(msg.analysis)
        .filter(([_, value]) => value !== null && value !== undefined)
        .reduce((obj, [key, value]) => {
          obj[key] = value;
          return obj;
        }, {} as Record<string, string>);
      
      if (Object.keys(validDecisions).length > 0) {
        // Combine with accumulated decisions, newer messages overwrite older ones for the same ticker
        return { ...acc, ...validDecisions };
      }
    }
    return acc;
  }, {});

  // Get all unique tickers that have decisions
  const tickersWithDecisions = Object.keys(allDecisions);

  // If no ticker is selected but we have decisions, select the first one
  useEffect(() => {
    if (tickersWithDecisions.length > 0 && (!selectedTicker || !tickersWithDecisions.includes(selectedTicker))) {
      setSelectedTicker(tickersWithDecisions[0]);
    }
  }, [tickersWithDecisions, selectedTicker]);

  // Get the selected decision text
  const selectedDecision = selectedTicker && allDecisions[selectedTicker] ? allDecisions[selectedTicker] : null;

  const copyToClipboard = () => {
    if (selectedDecision) {
      navigator.clipboard.writeText(selectedDecision)
        .then(() => {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
        });
    }
  };

  // Split text into smaller paragraphs for better readability
  const formatReasoningText = (text: string) => {
    if (!text) return [];
    
    // First split by any existing paragraphs
    const paragraphs = text.split('\n').filter(p => p.trim().length > 0);
    
    const formattedParagraphs: string[] = [];
    
    // Process each paragraph
    paragraphs.forEach(paragraph => {
      // Split into sentences using period, question mark, or exclamation mark followed by space
      const sentences = paragraph.match(/[^.!?]+[.!?]+\s*/g) || [paragraph];
      
      let currentChunk = '';
      let sentenceCount = 0;
      
      // Group every 2-3 sentences
      sentences.forEach(sentence => {
        currentChunk += sentence;
        sentenceCount++;
        
        // After 2-3 sentences, create a new paragraph
        if (sentenceCount >= 2 && (sentenceCount % 3 === 0 || sentence.endsWith('. '))) {
          formattedParagraphs.push(currentChunk.trim());
          currentChunk = '';
          sentenceCount = 0;
        }
      });
      
      // Add any remaining text
      if (currentChunk.trim()) {
        formattedParagraphs.push(currentChunk.trim());
      }
    });
    
    return formattedParagraphs;
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={onOpenChange}
      defaultOpen={false}
      modal={true}
    >
      <DialogTrigger asChild>
        <div className="border-t border-border p-3 flex justify-end items-center cursor-pointer hover:bg-accent/50" onClick={() => onOpenChange(true)}>
          <div className="flex items-center gap-1">
            <div className="text-subtitle text-muted-foreground">Messages</div>
            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </div>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-[900px]" 
        autoFocus={false} 
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{name}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-6 pt-4" ref={initialFocusRef} tabIndex={-1}>
          {/* Activity Log Section */}
          <div>
            <h3 className="font-medium mb-3 text-primary">Activity Log</h3>
            <div className="h-[400px] overflow-y-auto border border-border rounded-lg p-3">
              {messages.length > 0 ? (
                <div className="p-3 space-y-3">
                  {messages.map((msg, idx) => (
                    <div key={idx} className="border-l-2 border-primary pl-3 text-sm">
                      <div className="text-blue-500">
                        {formatTime(msg.timestamp)}
                      </div>
                      <div className="text-foreground">
                        {msg.ticker && <span className="ml-1">[{msg.ticker}] </span>}
                        {msg.message}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-6">
                  No activity yet
                </div>
              )}
            </div>
          </div>
          
          {/* Analysis Section */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-primary">Analysis</h3>
              <div className="flex items-center gap-2">
                {/* Ticker selector */}
                {tickersWithDecisions.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">Ticker:</span>
                    <select 
                      className="text-xs p-1 rounded bg-background border border-border cursor-pointer"
                      value={selectedTicker || ''}
                      onChange={(e) => setSelectedTicker(e.target.value)}
                      autoFocus={false}
                    >
                      {tickersWithDecisions.map((ticker) => (
                        <option key={ticker} value={ticker}>
                          {ticker}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="h-[400px] overflow-y-auto border border-border rounded-lg p-3">
              {tickersWithDecisions.length > 0 ? (
                <div className="p-3 rounded-lg text-sm leading-relaxed">
                  {selectedTicker && (
                    <div className="mb-3 flex justify-between items-center">
                      <div className=" text-blue-500 font-medium">{selectedTicker}</div>
                      {selectedDecision && (
                        <button 
                          onClick={copyToClipboard}
                          className="flex items-center gap-1.5 text-xs p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground"
                          title="Copy to clipboard"
                        >
                          <Copy className="h-3.5 w-3.5 " />
                          <span>{copySuccess ? 'Copied!' : 'Copy'}</span>
                        </button>
                      )}
                    </div>
                  )}
                  {selectedDecision ? (
                    formatReasoningText(selectedDecision).map((paragraph, idx) => (
                      <p key={idx} className="mb-3 last:mb-0">{paragraph}</p>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                      <p>No analysis available for {selectedTicker}</p>
                      <p className="text-xs mt-2">The backend might not have provided reasoning data for this ticker yet.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Analysis in progress...
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 