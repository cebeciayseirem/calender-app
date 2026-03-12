'use client';

import { useState, useEffect } from 'react';

const FALLBACK_QUOTES = [
  { q: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', a: 'Winston Churchill' },
  { q: 'Your daily actions are the building blocks of your future self.', a: 'James Clear' },
  { q: 'The secret of getting ahead is getting started.', a: 'Mark Twain' },
];

interface Quote {
  q: string;
  a: string;
}

function getCachedQuote(): Quote | null {
  try {
    const cached = localStorage.getItem('daily-quote');
    if (!cached) return null;
    const { quote, date } = JSON.parse(cached);
    if (date === new Date().toISOString().slice(0, 10)) return quote;
    return null;
  } catch {
    return null;
  }
}

function cacheQuote(quote: Quote) {
  localStorage.setItem(
    'daily-quote',
    JSON.stringify({ quote, date: new Date().toISOString().slice(0, 10) })
  );
}

export function DailyQuote() {
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    const cached = getCachedQuote();
    if (cached) {
      setQuote(cached);
      return;
    }

    fetch('https://zenquotes.io/api/today')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data[0]?.q) {
          const q = { q: data[0].q, a: data[0].a };
          cacheQuote(q);
          setQuote(q);
        } else {
          throw new Error('bad response');
        }
      })
      .catch(() => {
        const fallback = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
        setQuote(fallback);
      });
  }, []);

  if (!quote) return null;

  return (
    <div className="px-5 py-6 text-center">
      <p className="text-sm italic text-text-muted leading-relaxed">
        &ldquo;{quote.q}&rdquo;
      </p>
      {quote.a && (
        <p className="text-xs text-text-muted/60 mt-2">&mdash; {quote.a}</p>
      )}
    </div>
  );
}
