'use client';

interface CategoryBadgeProps {
  name: string;
}

const categoryColors: Record<string, string> = {
  Health: 'bg-emerald-500/20 text-emerald-400',
  Fitness: 'bg-orange-500/20 text-orange-400',
  Learning: 'bg-blue-500/20 text-blue-400',
  Mindfulness: 'bg-purple-500/20 text-purple-400',
  Productivity: 'bg-yellow-500/20 text-yellow-400',
};

const defaultColor = 'bg-white/10 text-text-muted';

export function CategoryBadge({ name }: CategoryBadgeProps) {
  const colorClass = categoryColors[name] || defaultColor;
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${colorClass}`}>
      {name}
    </span>
  );
}
