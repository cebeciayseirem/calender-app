import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

interface SeedEvent {
  title: string;
  start: string;
  end: string;
  description: string;
  location: string;
  color: string;
  category: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Work: '#c67703',
  Health: '#0070f3',
  Errand: '#366337',
  Social: '#9C27B0',
  Personal: '#e45787',
};

const SEED_DATA: SeedEvent[] = [
  // ── Monday Mar 9 ──
  {
    title: 'Morning Yoga',
    start: '2026-03-09T06:30:00',
    end: '2026-03-09T07:30:00',
    description: 'Vinyasa flow focusing on hip openers and shoulder stretches. Bring your own mat.',
    location: 'Sunrise Yoga Studio, 142 Elm St',
    color: CATEGORY_COLORS.Health,
    category: 'Health',
  },
  {
    title: 'Sprint Planning',
    start: '2026-03-09T09:00:00',
    end: '2026-03-09T10:30:00',
    description: 'Plan sprint 14 tasks, assign story points, and review backlog priorities with the dev team.',
    location: 'Conference Room B, 4th Floor',
    color: CATEGORY_COLORS.Work,
    category: 'Work',
  },
  {
    title: 'Coffee with Alex',
    start: '2026-03-09T12:00:00',
    end: '2026-03-09T13:00:00',
    description: 'Catch up over coffee, discuss the new startup idea Alex has been working on.',
    location: 'Blue Bottle Coffee, 5th Ave',
    color: CATEGORY_COLORS.Social,
    category: 'Social',
  },
  {
    title: 'Grocery Shopping',
    start: '2026-03-09T17:00:00',
    end: '2026-03-09T18:00:00',
    description: 'Weekly grocery run — restock produce, protein, and pantry staples for the week.',
    location: 'Whole Foods Market, Downtown',
    color: CATEGORY_COLORS.Errand,
    category: 'Errand',
  },
  {
    title: 'Pottery Class',
    start: '2026-03-09T19:00:00',
    end: '2026-03-09T20:30:00',
    description: 'Wheel throwing session — glazing last week\'s bowl and starting a new mug.',
    location: 'Clay & Co Studio, 18 Art Row',
    color: CATEGORY_COLORS.Personal,
    category: 'Personal',
  },

  // ── Tuesday Mar 10 ──
  {
    title: 'Gym — Upper Body',
    start: '2026-03-10T07:00:00',
    end: '2026-03-10T08:15:00',
    description: 'Bench press, overhead press, rows, and bicep curls. Increase bench by 5 lbs.',
    location: 'Iron Works Gym, 200 Fitness Ave',
    color: CATEGORY_COLORS.Health,
    category: 'Health',
  },
  {
    title: 'Car Oil Change',
    start: '2026-03-10T09:00:00',
    end: '2026-03-10T10:00:00',
    description: 'Synthetic oil change and tire rotation. Car is due at 45,000 miles.',
    location: 'Jiffy Lube, 890 Commerce Dr',
    color: CATEGORY_COLORS.Errand,
    category: 'Errand',
  },
  {
    title: 'Client Presentation',
    start: '2026-03-10T14:00:00',
    end: '2026-03-10T15:30:00',
    description: 'Present Q1 product roadmap and demo the new dashboard features to Acme Corp stakeholders.',
    location: 'Zoom — link in calendar invite',
    color: CATEGORY_COLORS.Work,
    category: 'Work',
  },
  {
    title: 'Hair Salon Appointment',
    start: '2026-03-10T16:30:00',
    end: '2026-03-10T18:00:00',
    description: 'Trim and color touch-up with Mia. Bring reference photos for the new highlights.',
    location: 'Glow Beauty Salon, 55 Rose Ave',
    color: CATEGORY_COLORS.Personal,
    category: 'Personal',
  },
  {
    title: 'Book Club Meeting',
    start: '2026-03-10T19:00:00',
    end: '2026-03-10T20:30:00',
    description: 'Discussing "Project Hail Mary" by Andy Weir. Bring snacks — it\'s your turn.',
    location: 'Sarah\'s House, 45 Maple Ln',
    color: CATEGORY_COLORS.Social,
    category: 'Social',
  },

  // ── Wednesday Mar 11 ──
  {
    title: 'Morning Run',
    start: '2026-03-11T06:30:00',
    end: '2026-03-11T07:30:00',
    description: '5K along the river trail. Focus on maintaining a 9-minute mile pace.',
    location: 'Riverside Park Trail',
    color: CATEGORY_COLORS.Health,
    category: 'Health',
  },
  {
    title: 'Code Review Session',
    start: '2026-03-11T11:00:00',
    end: '2026-03-11T12:00:00',
    description: 'Review pull requests for the auth refactor and provide feedback on test coverage.',
    location: 'Engineering Bullpen, 3rd Floor',
    color: CATEGORY_COLORS.Work,
    category: 'Work',
  },
  {
    title: 'Pick Up Dry Cleaning',
    start: '2026-03-11T13:00:00',
    end: '2026-03-11T13:30:00',
    description: 'Pick up suit and two dress shirts dropped off last week. Ticket #4782.',
    location: 'Express Cleaners, 67 Main St',
    color: CATEGORY_COLORS.Errand,
    category: 'Errand',
  },
  {
    title: 'Watercolor Painting Class',
    start: '2026-03-11T18:00:00',
    end: '2026-03-11T19:30:00',
    description: 'Landscape techniques — wet-on-wet blending and sky gradients. All supplies provided.',
    location: 'The Art Loft, 33 Canvas Blvd',
    color: CATEGORY_COLORS.Personal,
    category: 'Personal',
  },
  {
    title: 'Dinner with Parents',
    start: '2026-03-11T20:00:00',
    end: '2026-03-11T21:30:00',
    description: 'Family dinner to celebrate Mom\'s retirement. Reservation for 4 under our last name.',
    location: 'Olive Garden, Westfield Mall',
    color: CATEGORY_COLORS.Social,
    category: 'Social',
  },

  // ── Thursday Mar 12 ──
  {
    title: 'Annual Physical',
    start: '2026-03-12T09:00:00',
    end: '2026-03-12T10:00:00',
    description: 'Annual wellness exam with Dr. Patel. Fasting bloodwork — no food after midnight.',
    location: 'CityHealth Medical, 1500 Wellness Pkwy',
    color: CATEGORY_COLORS.Health,
    category: 'Health',
  },
  {
    title: 'Nail Appointment',
    start: '2026-03-12T11:00:00',
    end: '2026-03-12T12:00:00',
    description: 'Gel manicure refresh — spring color palette. Ask about the new nail art designs.',
    location: 'Polished Nails & Spa, 99 Blossom St',
    color: CATEGORY_COLORS.Personal,
    category: 'Personal',
  },
  {
    title: 'Bank Appointment',
    start: '2026-03-12T13:00:00',
    end: '2026-03-12T13:45:00',
    description: 'Review savings plan and discuss refinancing options with financial advisor.',
    location: 'Chase Bank, 222 Financial District Blvd',
    color: CATEGORY_COLORS.Errand,
    category: 'Errand',
  },
  {
    title: 'Team Retrospective',
    start: '2026-03-12T15:00:00',
    end: '2026-03-12T16:00:00',
    description: 'Sprint 13 retro — what went well, what didn\'t, and action items for improvement.',
    location: 'Conference Room A, 4th Floor',
    color: CATEGORY_COLORS.Work,
    category: 'Work',
  },
  {
    title: 'Game Night',
    start: '2026-03-12T19:30:00',
    end: '2026-03-12T22:00:00',
    description: 'Board game night — Catan, Ticket to Ride, and Codenames. Bring beverages.',
    location: 'Mike\'s Apartment, 12B River Rd',
    color: CATEGORY_COLORS.Social,
    category: 'Social',
  },

  // ── Friday Mar 13 ──
  {
    title: 'Gym — Leg Day',
    start: '2026-03-13T07:00:00',
    end: '2026-03-13T08:15:00',
    description: 'Squats, lunges, leg press, and calf raises. Aim to increase squat weight by 5 lbs.',
    location: 'Iron Works Gym, 200 Fitness Ave',
    color: CATEGORY_COLORS.Health,
    category: 'Health',
  },
  {
    title: '1:1 with Manager',
    start: '2026-03-13T10:00:00',
    end: '2026-03-13T10:30:00',
    description: 'Weekly check-in with Lisa — discuss career growth goals and current project blockers.',
    location: 'Lisa\'s Office, Room 412',
    color: CATEGORY_COLORS.Work,
    category: 'Work',
  },
  {
    title: 'Post Office Drop-off',
    start: '2026-03-13T12:30:00',
    end: '2026-03-13T13:00:00',
    description: 'Ship two return packages and buy a book of stamps. Bring tracking receipts.',
    location: 'USPS, 400 Federal Plaza',
    color: CATEGORY_COLORS.Errand,
    category: 'Errand',
  },
  {
    title: 'Facial Treatment',
    start: '2026-03-13T14:00:00',
    end: '2026-03-13T15:00:00',
    description: 'Deep cleansing facial with hydrating mask. Mention the dry patches on cheeks.',
    location: 'Serenity Spa, 120 Willow Way',
    color: CATEGORY_COLORS.Personal,
    category: 'Personal',
  },
  {
    title: 'Happy Hour',
    start: '2026-03-13T17:00:00',
    end: '2026-03-13T19:00:00',
    description: 'Friday happy hour with the engineering team. Half-price appetizers until 6 PM.',
    location: 'The Tipsy Crow, 88 Harbor St',
    color: CATEGORY_COLORS.Social,
    category: 'Social',
  },

  // ── Saturday Mar 14 ──
  {
    title: 'Morning Hike',
    start: '2026-03-14T07:30:00',
    end: '2026-03-14T09:30:00',
    description: 'Eagle Peak trail — 6.2 mile loop, moderate difficulty. Pack water, snacks, and sunscreen.',
    location: 'Eagle Peak Trailhead, State Park',
    color: CATEGORY_COLORS.Health,
    category: 'Health',
  },
  {
    title: 'Farmer\'s Market',
    start: '2026-03-14T10:00:00',
    end: '2026-03-14T11:30:00',
    description: 'Browse seasonal produce, artisan bread, and local honey. Bring reusable bags.',
    location: 'Downtown Farmer\'s Market, City Square',
    color: CATEGORY_COLORS.Errand,
    category: 'Errand',
  },
  {
    title: 'Side Project Hackathon',
    start: '2026-03-14T12:00:00',
    end: '2026-03-14T14:00:00',
    description: 'Dedicated focus time on the open-source CLI tool. Goal: finish the plugin system.',
    location: 'Home Office',
    color: CATEGORY_COLORS.Work,
    category: 'Work',
  },
  {
    title: 'Candle Making Workshop',
    start: '2026-03-14T14:30:00',
    end: '2026-03-14T16:00:00',
    description: 'Learn to make soy candles with essential oils. Pick your own scent blends to take home.',
    location: 'Craft House, 7 Maker Lane',
    color: CATEGORY_COLORS.Personal,
    category: 'Personal',
  },
  {
    title: 'Birthday Party',
    start: '2026-03-14T17:00:00',
    end: '2026-03-14T20:00:00',
    description: 'Jamie\'s 30th birthday celebration. Gift is wrapped and in the hall closet.',
    location: 'Rooftop Lounge, Grand Hotel',
    color: CATEGORY_COLORS.Social,
    category: 'Social',
  },

  // ── Sunday Mar 15 ──
  {
    title: 'Weekly Planning',
    start: '2026-03-15T09:00:00',
    end: '2026-03-15T10:00:00',
    description: 'Review upcoming week\'s calendar, set top 3 priorities, and prep Monday\'s agenda.',
    location: 'Home Office',
    color: CATEGORY_COLORS.Work,
    category: 'Work',
  },
  {
    title: 'Brunch with Friends',
    start: '2026-03-15T10:30:00',
    end: '2026-03-15T12:00:00',
    description: 'Sunday brunch with the crew. Try the new avocado toast and bottomless mimosas.',
    location: 'The Breakfast Club, 77 Briar Ln',
    color: CATEGORY_COLORS.Social,
    category: 'Social',
  },
  {
    title: 'Meal Prep',
    start: '2026-03-15T12:30:00',
    end: '2026-03-15T14:00:00',
    description: 'Prepare lunches and dinners for the week — grilled chicken, roasted veggies, and rice bowls.',
    location: 'Home Kitchen',
    color: CATEGORY_COLORS.Health,
    category: 'Health',
  },
  {
    title: 'Return Online Orders',
    start: '2026-03-15T14:30:00',
    end: '2026-03-15T15:30:00',
    description: 'Return the shoes and jacket that didn\'t fit. Print labels from email beforehand.',
    location: 'UPS Store, Eastside Plaza',
    color: CATEGORY_COLORS.Errand,
    category: 'Errand',
  },
  {
    title: 'At-Home Spa Day',
    start: '2026-03-15T16:00:00',
    end: '2026-03-15T18:00:00',
    description: 'Full self-care session — face mask, hair treatment, body scrub, and a relaxing bath.',
    location: 'Home',
    color: CATEGORY_COLORS.Personal,
    category: 'Personal',
  },
];

export function seedHabits(sqlite: Database.Database): void {
  const existing = sqlite.prepare("SELECT COUNT(*) as count FROM habits WHERE title = 'Skincare Routine'").get() as { count: number };
  if (existing.count > 0) return;

  const now = new Date().toISOString();
  const insert = sqlite.prepare(`
    INSERT INTO habits (id, title, subtitle, category, recurrence, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // Daily habit — no recurrence filter means it shows every day
  insert.run(uuidv4(), 'Skincare Routine', 'Cleanser, serum, moisturizer & SPF', 'Personal', null, now, now);

  // Weekly recurrence — Mon, Wed, Fri, Sun (days 0=Sun,1=Mon,3=Wed,5=Fri)
  insert.run(
    uuidv4(),
    'Journal & Reflect',
    'Write 3 gratitudes and reflect on the day',
    'Personal',
    JSON.stringify({ type: 'weekly', interval: 1, daysOfWeek: [0, 1, 3, 5] }),
    now,
    now,
  );
}

export function seedEvents(sqlite: Database.Database): void {
  const existing = sqlite.prepare("SELECT COUNT(*) as count FROM events WHERE title = 'Sprint Planning' AND start LIKE '2026-03-09%'").get() as { count: number };
  if (existing.count > 0) return;

  const now = new Date().toISOString();
  const insert = sqlite.prepare(`
    INSERT INTO events (id, title, start, end, description, location, color, category, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = sqlite.transaction((evts: SeedEvent[]) => {
    for (const e of evts) {
      insert.run(uuidv4(), e.title, e.start, e.end, e.description, e.location, e.color, e.category, now, now);
    }
  });

  insertMany(SEED_DATA);
}
