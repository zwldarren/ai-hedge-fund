/**
 * Splits text into smaller paragraphs for better readability.
 * @param text The text to format
 * @returns An array of formatted paragraphs
 */
export function formatTextIntoParagraphs(text: string): string[] {
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
} 