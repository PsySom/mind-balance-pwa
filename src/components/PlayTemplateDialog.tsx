import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Template } from '@/types/activity';

interface PlayTemplateDialogProps {
  template: Template | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PlayTemplateDialog({
  template,
  open,
  onOpenChange,
}: PlayTemplateDialogProps) {
  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{template.title.ru}</DialogTitle>
        </DialogHeader>
        
        <div className="py-6">
          <p className="text-center text-muted-foreground">
            Содержимое активности будет добавлено позже
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
