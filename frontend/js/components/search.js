export function highlightSearchResults(container, query) {
    if (!query) {
        container.querySelectorAll('.event-block').forEach(b => b.classList.remove('search-highlight'));
        return;
    }

    const q = query.toLowerCase();
    container.querySelectorAll('.event-block').forEach(block => {
        const title = block.querySelector('.event-title')?.textContent?.toLowerCase() || '';
        if (title.includes(q)) {
            block.classList.add('search-highlight');
        } else {
            block.classList.remove('search-highlight');
        }
    });
}
