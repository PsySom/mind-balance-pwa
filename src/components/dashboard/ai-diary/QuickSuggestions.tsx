import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface QuickSuggestionsProps {
  suggestions: string[];
  onSelectSuggestion: (suggestion: string) => void;
  disabled?: boolean;
}

export default function QuickSuggestions({
  suggestions,
  onSelectSuggestion,
  disabled = false
}: QuickSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="border-t p-4 bg-muted/30">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">Варианты продолжения:</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            className="justify-start text-left h-auto py-3 px-4 whitespace-normal"
            onClick={() => onSelectSuggestion(suggestion)}
            disabled={disabled}
          >
            <span className="text-sm">{suggestion}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
