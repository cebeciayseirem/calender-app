export function calculateOverlapLayout(events) {
    if (events.length === 0) return [];

    const sorted = [...events].sort((a, b) =>
        new Date(a.start) - new Date(b.start) || new Date(b.end) - new Date(a.end)
    );

    // Find connected overlap groups
    const groups = [];
    let currentGroup = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
        const groupEnd = Math.max(...currentGroup.map(e => new Date(e.end).getTime()));
        if (new Date(sorted[i].start).getTime() < groupEnd) {
            currentGroup.push(sorted[i]);
        } else {
            groups.push(currentGroup);
            currentGroup = [sorted[i]];
        }
    }
    groups.push(currentGroup);

    // Assign columns within each group
    const layout = [];
    for (const group of groups) {
        const columns = [];
        for (const event of group) {
            let placed = false;
            for (let col = 0; col < columns.length; col++) {
                const lastInCol = columns[col][columns[col].length - 1];
                if (new Date(event.start).getTime() >= new Date(lastInCol.end).getTime()) {
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
