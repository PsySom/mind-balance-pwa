import { Button } from '@/components/ui/button';

interface QuickSuggestionsProps {
  suggestions: string[];
  onClick: (suggestion: string) => void;
}

export default function QuickSuggestions({ suggestions, onClick }: QuickSuggestionsProps) {
  if (!suggestions || suggestions.length === 0) return null;
  
  return (
    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-fade-in">
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onClick(suggestion)}
          className="text-left justify-start h-auto py-2 px-3 whitespace-normal transition-all hover:scale-105"
        >
          {suggestion}
        </Button>
      ))}
    </div>
  );
}
