import type { ExpandedEvent } from '@/types/event';

export interface OverlapLayout {
  event: ExpandedEvent;
  column: number;
  totalColumns: number;
}

export function calculateOverlapLayout(events: ExpandedEvent[]): OverlapLayout[] {
  if (events.length === 0) return [];

  const sorted = [...events].sort(
    (a, b) =>
      new Date(a.start).getTime() - new Date(b.start).getTime() ||
      new Date(b.end).getTime() - new Date(a.end).getTime()
  );

  const groups: ExpandedEvent[][] = [];
  let currentGroup = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const groupEnd = Math.max(
      ...currentGroup.map((e) => new Date(e.end).getTime())
    );
    if (new Date(sorted[i].start).getTime() < groupEnd) {
      currentGroup.push(sorted[i]);
    } else {
      groups.push(currentGroup);
      currentGroup = [sorted[i]];
    }
  }
  groups.push(currentGroup);

  const layout: OverlapLayout[] = [];
  for (const group of groups) {
    const columns: ExpandedEvent[][] = [];
    for (const event of group) {
      let placed = false;
      for (let col = 0; col < columns.length; col++) {
        const lastInCol = columns[col][columns[col].length - 1];
        if (
          new Date(event.start).getTime() >=
          new Date(lastInCol.end).getTime()
        ) {
          columns[col].push(event);
          layout.push({ event, column: col, totalColumns: 0 });
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([event]);
        layout.push({ event, column: columns.length - 1, totalColumns: 0 });
      }
    }
    for (const item of layout) {
      if (group.includes(item.event)) {
        item.totalColumns = columns.length;
      }
    }
  }
  return layout;
}
