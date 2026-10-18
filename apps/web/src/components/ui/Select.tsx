import { Select as Primitive } from 'radix-ui';
import { Check, ChevronDown } from 'lucide-react';
export function Select({
  id,
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <Primitive.Root value={value} onValueChange={onChange} disabled={disabled}>
      <Primitive.Trigger id={id} aria-label={label} className="select-trigger">
        <Primitive.Value />
        <ChevronDown size={14} />
      </Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Content position="popper" className="popover select-popover">
          <Primitive.Viewport>
            {options.map((o) => (
              <Primitive.Item
                key={o.value}
                value={o.value}
                className="select-item"
              >
                <Primitive.ItemText>{o.label}</Primitive.ItemText>
                <Primitive.ItemIndicator>
                  <Check size={14} />
                </Primitive.ItemIndicator>
              </Primitive.Item>
            ))}
          </Primitive.Viewport>
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
