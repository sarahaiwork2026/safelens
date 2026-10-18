import { useState } from 'react';
import { Popover } from 'radix-ui';
import { Command } from 'cmdk';
import { Check, ChevronsUpDown } from 'lucide-react';
import { searchAreas } from 'core';
import { copy } from '../../copy';
export function AreaCombobox({
  id,
  value,
  onChange,
  byId = false,
  required = false,
  label = copy.fields.area,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  byId?: boolean;
  required?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false),
    [search, setSearch] = useState('');
  const areas = searchAreas(search);
  const displayed = byId
    ? searchAreas('').find((a) => a.id === value)?.name
    : value;
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          id={id}
          type="button"
          className="combobox-trigger"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-required={required}
          aria-label={label}
        >
          {displayed || copy.report.areaPlaceholder}
          <ChevronsUpDown size={16} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="popover area-popover"
          sideOffset={8}
          align="start"
        >
          <Command shouldFilter={false}>
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder={copy.report.search}
              aria-label={copy.report.search}
            />
            <Command.List id={`${id}-list`}>
              <Command.Empty>{copy.report.noArea}</Command.Empty>
              {areas.map((a) => (
                <Command.Item
                  key={a.id}
                  value={a.id}
                  onSelect={() => {
                    onChange(byId ? a.id : a.name);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  <span>{a.name}</span>
                  <span className="muted" dir="rtl" lang="ur">
                    {a.urdu[0]}
                  </span>
                  {(value === a.id || value === a.name) && <Check size={14} />}
                </Command.Item>
              ))}
              {search.trim() && !byId && (
                <Command.Item
                  value="typed"
                  onSelect={() => {
                    onChange(search.slice(0, 120));
                    setOpen(false);
                  }}
                >
                  {copy.report.use(search)}
                </Command.Item>
              )}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
