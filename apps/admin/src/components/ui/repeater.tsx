import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Section } from '@/components/ui/form-controls';

/** Editable list of rows (add, move up/down, delete). Rows carry a local `rowId` as React key. */
export function Repeater<T extends { rowId: string }>({
  title,
  description,
  items,
  onChange,
  create,
  addLabel,
  emptyLabel,
  max,
  renderItem,
}: {
  title: string;
  description: string;
  items: T[];
  onChange: (items: T[]) => void;
  create: () => T;
  addLabel: string;
  emptyLabel: string;
  /** Hides the add button once reached. */
  max?: number;
  renderItem: (item: T, index: number, patch: (patch: Partial<T>) => void) => ReactNode;
}) {
  const move = (from: number, to: number) => {
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    onChange(next);
  };

  return (
    <Section
      title={title}
      description={description}
      actions={
        (max === undefined || items.length < max) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange([...items, create()])}
          >
            <Plus /> {addLabel}
          </Button>
        )
      }
    >
      {items.length === 0 && (
        <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </p>
      )}
      {items.map((item, index) => (
        <div key={item.rowId} className="grid gap-3 rounded-lg border bg-muted/20 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted-foreground">#{index + 1}</span>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                disabled={index === 0}
                aria-label="نقل لأعلى"
                onClick={() => move(index, index - 1)}
              >
                <ArrowUp />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                disabled={index === items.length - 1}
                aria-label="نقل لأسفل"
                onClick={() => move(index, index + 1)}
              >
                <ArrowDown />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                aria-label="حذف"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
          {renderItem(item, index, (patch) =>
            onChange(items.map((row, i) => (i === index ? { ...row, ...patch } : row))),
          )}
        </div>
      ))}
    </Section>
  );
}
