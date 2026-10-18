import { AlertDialog } from 'radix-ui';
import { Button } from './index';
import { copy } from '../../copy';
export function Confirm({
  open,
  onOpenChange,
  title,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  title: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="dialog-overlay" />
        <AlertDialog.Content className="dialog-card">
          <AlertDialog.Title>{title}</AlertDialog.Title>
          <AlertDialog.Description className="sr-only">
            {title}
          </AlertDialog.Description>
          <div className="actions">
            <AlertDialog.Action asChild>
              <Button onClick={onConfirm}>{copy.actions.reset}</Button>
            </AlertDialog.Action>
            <AlertDialog.Cancel asChild>
              <Button variant="secondary">{copy.actions.cancel}</Button>
            </AlertDialog.Cancel>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
