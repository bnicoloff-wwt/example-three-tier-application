# 😄 Dad Joke Feature - Quick Start (2 minutes)

## Start the App

```bash
docker compose up --build
```

This will:
1. Start PostgreSQL
2. Run database migrations (including the new dad_jokes table)
3. Start the API server
4. Start the web frontend

## Open in Browser

```
http://localhost:3000
```

## Use the Feature

### View Jokes
1. Scroll down past your to-do list
2. Find "😄 Joke of the Moment" section
3. Read the setup and punchline
4. Click "🎲 Next Joke" to get another one

### Vote on Jokes
- Click 👍 to upvote (button turns green)
- Click 👎 to downvote (button turns red)
- See the rating update instantly
- Vote count shown below

### Add Your Own Joke
1. Scroll to "✍️ Share Your Dad Joke"
2. Enter the joke setup in first field
3. Enter the punchline in second field
4. Click "Add Joke"
5. See success message
6. Your joke is now in the system!

## Test via API

### Get a Random Joke
```bash
curl http://localhost:3001/dad-jokes/random
```

### Create a Joke
```bash
curl -X POST http://localhost:3001/dad-jokes \
  -H "Content-Type: application/json" \
  -d '{
    "setup": "Why did the developer go broke?",
    "punchline": "Because he lost his Cache!"
  }'
```

### Upvote a Joke
```bash
curl -X PATCH http://localhost:3001/dad-jokes/1/rating \
  -H "Content-Type: application/json" \
  -d '{"value": 1}'
```

### List All Jokes
```bash
curl "http://localhost:3001/dad-jokes?page=1&limit=10&sort=rating"
```

## What's New

### 🎲 Random Joke Generator
- Fetches a new random joke each time
- Shows setup and punchline clearly

### 👍 👎 Voting System
- Upvote jokes you like
- Downvote jokes you don't
- Ratings persist and update in real-time
- Vote counts tracked

### ✍️ Submit Jokes
- Add your own dad jokes
- Form validates input
- Max 1000 characters per field
- Instant feedback

### 🌓 Dark Mode
- Full dark mode support
- All components styled for both light and dark themes

### 📱 Responsive
- Works on mobile, tablet, and desktop
- Touch-friendly buttons
- Readable on all screen sizes

## Features

| Feature | Status |
|---------|--------|
| View random jokes | ✅ |
| Vote up/down | ✅ |
| Submit new jokes | ✅ |
| Ratings persist | ✅ |
| Dark mode | ✅ |
| Responsive design | ✅ |
| Error handling | ✅ |
| Loading states | ✅ |

## Next: Read Full Docs

For more details, see `DAD_JOKE_FEATURE.md`:
- Complete API documentation
- All endpoints explained
- Testing procedures
- Advanced features
- Future enhancements
- Troubleshooting

## File Structure

```
src/
├── api/
│   └── index.js                    (Updated with 5 endpoints)
├── db/
│   └── migrations/
│       └── 1718500002000_create-dad-jokes.js  (New)
└── web/
    └── app/
        ├── actions.ts              (Updated with joke actions)
        ├── HomeClient.tsx          (Updated with components)
        ├── DadJokesPanel.tsx       (New)
        └── AddJokeForm.tsx         (New)

DAD_JOKE_FEATURE.md               (Complete documentation)
```

## Enjoy! 😄

You now have a fully functional Dad Joke feature integrated with your to-do app!

Questions? See `DAD_JOKE_FEATURE.md` for complete documentation.
