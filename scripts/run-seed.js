const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'data', 'calendar.db'));

const CATEGORY_COLORS = { Work: '#c67703', Health: '#0070f3', Errand: '#366337', Social: '#9C27B0' };

const existing = db.prepare("SELECT COUNT(*) as count FROM events WHERE title = 'Sprint Planning' AND start LIKE '2026-03-09%'").get();
if (existing.count > 0) {
  console.log('Already seeded, skipping.');
  process.exit(0);
}

const events = [
  { title: 'Sprint Planning', start: '2026-03-09T09:00:00', end: '2026-03-09T10:30:00', description: 'Plan sprint 14 tasks, assign story points, and review backlog priorities with the dev team.', location: 'Conference Room B, 4th Floor', color: CATEGORY_COLORS.Work, category: 'Work' },
  { title: 'Morning Yoga', start: '2026-03-09T06:30:00', end: '2026-03-09T07:30:00', description: 'Vinyasa flow class focusing on hip openers and shoulder stretches. Bring your own mat.', location: 'Sunrise Yoga Studio, 142 Elm St', color: CATEGORY_COLORS.Health, category: 'Health' },
  { title: 'Grocery Shopping', start: '2026-03-09T17:30:00', end: '2026-03-09T18:30:00', description: 'Weekly grocery run — restock produce, protein, and pantry staples for the week.', location: 'Whole Foods Market, Downtown', color: CATEGORY_COLORS.Errand, category: 'Errand' },
  { title: 'Coffee with Alex', start: '2026-03-09T12:00:00', end: '2026-03-09T13:00:00', description: 'Catch up over coffee, discuss the new startup idea Alex has been working on.', location: 'Blue Bottle Coffee, 5th Ave', color: CATEGORY_COLORS.Social, category: 'Social' },

  { title: 'Client Presentation', start: '2026-03-10T14:00:00', end: '2026-03-10T15:30:00', description: 'Present Q1 product roadmap and demo the new dashboard features to Acme Corp stakeholders.', location: 'Zoom Meeting — link in calendar invite', color: CATEGORY_COLORS.Work, category: 'Work' },
  { title: 'Dentist Appointment', start: '2026-03-10T10:00:00', end: '2026-03-10T11:00:00', description: 'Routine cleaning and checkup. Mention sensitivity on lower left molar.', location: 'Bright Smiles Dental, 320 Oak Blvd, Suite 200', color: CATEGORY_COLORS.Health, category: 'Health' },
  { title: 'Car Oil Change', start: '2026-03-10T08:00:00', end: '2026-03-10T09:00:00', description: 'Synthetic oil change and tire rotation. Car is due at 45,000 miles.', location: 'Jiffy Lube, 890 Commerce Dr', color: CATEGORY_COLORS.Errand, category: 'Errand' },
  { title: 'Book Club Meeting', start: '2026-03-10T19:00:00', end: '2026-03-10T20:30:00', description: "Discussing \"Project Hail Mary\" by Andy Weir. Bring snacks for your turn.", location: "Sarah's House, 45 Maple Ln", color: CATEGORY_COLORS.Social, category: 'Social' },

  { title: 'Code Review Session', start: '2026-03-11T11:00:00', end: '2026-03-11T12:00:00', description: 'Review pull requests for the authentication refactor and provide feedback on test coverage.', location: 'Engineering Bullpen, 3rd Floor', color: CATEGORY_COLORS.Work, category: 'Work' },
  { title: 'Gym — Leg Day', start: '2026-03-11T07:00:00', end: '2026-03-11T08:15:00', description: 'Squats, lunges, leg press, and calf raises. Aim to increase squat weight by 5 lbs.', location: 'Iron Works Gym, 200 Fitness Ave', color: CATEGORY_COLORS.Health, category: 'Health' },
  { title: 'Pick Up Dry Cleaning', start: '2026-03-11T17:00:00', end: '2026-03-11T17:30:00', description: 'Pick up the suit and two dress shirts dropped off last week. Ticket #4782.', location: 'Express Cleaners, 67 Main St', color: CATEGORY_COLORS.Errand, category: 'Errand' },
  { title: 'Dinner with Parents', start: '2026-03-11T18:30:00', end: '2026-03-11T20:30:00', description: "Family dinner to celebrate Mom's retirement. Reservation for 4 under our last name.", location: 'Olive Garden, Westfield Mall', color: CATEGORY_COLORS.Social, category: 'Social' },

  { title: 'Team Retrospective', start: '2026-03-12T15:00:00', end: '2026-03-12T16:00:00', description: "Sprint 13 retro — discuss what went well, what didn't, and action items for improvement.", location: 'Conference Room A, 4th Floor', color: CATEGORY_COLORS.Work, category: 'Work' },
  { title: 'Annual Physical', start: '2026-03-12T09:00:00', end: '2026-03-12T10:00:00', description: 'Annual wellness exam with Dr. Patel. Fasting bloodwork — no food after midnight.', location: 'CityHealth Medical, 1500 Wellness Pkwy', color: CATEGORY_COLORS.Health, category: 'Health' },
  { title: 'Bank Appointment', start: '2026-03-12T13:00:00', end: '2026-03-12T13:45:00', description: 'Meet with financial advisor to review savings plan and discuss refinancing options.', location: 'Chase Bank, 222 Financial District Blvd', color: CATEGORY_COLORS.Errand, category: 'Errand' },
  { title: 'Game Night', start: '2026-03-12T19:30:00', end: '2026-03-12T22:00:00', description: 'Board game night — playing Catan, Ticket to Ride, and Codenames. Bring beverages.', location: "Mike's Apartment, 12B River Rd", color: CATEGORY_COLORS.Social, category: 'Social' },

  { title: '1:1 with Manager', start: '2026-03-13T10:00:00', end: '2026-03-13T10:30:00', description: 'Weekly check-in with Lisa — discuss career growth goals and current project blockers.', location: "Lisa's Office, Room 412", color: CATEGORY_COLORS.Work, category: 'Work' },
  { title: 'Evening Run', start: '2026-03-13T18:00:00', end: '2026-03-13T19:00:00', description: '5K run along the river trail. Focus on maintaining a 9-minute mile pace.', location: 'Riverside Park Trail', color: CATEGORY_COLORS.Health, category: 'Health' },
  { title: 'Post Office Drop-off', start: '2026-03-13T12:30:00', end: '2026-03-13T13:00:00', description: 'Ship two return packages and buy a book of stamps. Bring tracking receipts.', location: 'USPS, 400 Federal Plaza', color: CATEGORY_COLORS.Errand, category: 'Errand' },
  { title: 'Happy Hour', start: '2026-03-13T17:00:00', end: '2026-03-13T19:00:00', description: 'Friday happy hour with the engineering team. Half-price appetizers until 6 PM.', location: 'The Tipsy Crow, 88 Harbor St', color: CATEGORY_COLORS.Social, category: 'Social' },

  { title: 'Side Project Hackathon', start: '2026-03-14T10:00:00', end: '2026-03-14T14:00:00', description: 'Dedicated focus time on the open-source CLI tool. Goal: finish the plugin system.', location: 'Home Office', color: CATEGORY_COLORS.Work, category: 'Work' },
  { title: 'Hiking Trail', start: '2026-03-14T08:00:00', end: '2026-03-14T11:00:00', description: 'Eagle Peak trail — 6.2 mile loop, moderate difficulty. Pack water, snacks, and sunscreen.', location: 'Eagle Peak Trailhead, State Park', color: CATEGORY_COLORS.Health, category: 'Health' },
  { title: "Farmer's Market", start: '2026-03-14T08:30:00', end: '2026-03-14T10:00:00', description: 'Browse seasonal produce, artisan bread, and local honey. Bring reusable bags.', location: "Downtown Farmer's Market, City Square", color: CATEGORY_COLORS.Errand, category: 'Errand' },
  { title: 'Birthday Party', start: '2026-03-14T16:00:00', end: '2026-03-14T19:00:00', description: "Jamie's 30th birthday celebration. Gift is wrapped and in the hall closet.", location: 'Rooftop Lounge, Grand Hotel', color: CATEGORY_COLORS.Social, category: 'Social' },

  { title: 'Weekly Planning', start: '2026-03-15T09:00:00', end: '2026-03-15T10:00:00', description: "Review upcoming week's calendar, set top 3 priorities, and prep Monday's agenda.", location: 'Home Office', color: CATEGORY_COLORS.Work, category: 'Work' },
  { title: 'Meal Prep', start: '2026-03-15T11:00:00', end: '2026-03-15T13:00:00', description: 'Prepare lunches and dinners for the week — grilled chicken, roasted veggies, and rice bowls.', location: 'Home Kitchen', color: CATEGORY_COLORS.Health, category: 'Health' },
  { title: 'Return Online Orders', start: '2026-03-15T14:00:00', end: '2026-03-15T15:00:00', description: "Return the shoes and jacket that didn't fit. Print labels from email beforehand.", location: 'UPS Store, Eastside Plaza', color: CATEGORY_COLORS.Errand, category: 'Errand' },
  { title: 'Brunch with Friends', start: '2026-03-15T10:30:00', end: '2026-03-15T12:00:00', description: 'Sunday brunch with the crew. Try the new avocado toast and bottomless mimosas.', location: 'The Breakfast Club, 77 Briar Ln', color: CATEGORY_COLORS.Social, category: 'Social' },
];

const now = new Date().toISOString();
const insert = db.prepare('INSERT INTO events (id, title, start, end, description, location, color, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

const tx = db.transaction((evts) => {
  for (const e of evts) {
    insert.run(uuidv4(), e.title, e.start, e.end, e.description, e.location, e.color, e.category, now, now);
  }
});

tx(events);
console.log('Seeded', events.length, 'events successfully.');
