# Quick Start: Bulk Import Feature

## 🚀 Get Started in 60 Seconds

### 1. Start the Application
```bash
docker compose up --build
```

Open http://localhost:3000 in your browser.

### 2. Click the Import Button
Look for the **📥 Import** button in the top-right corner of the page.

### 3. Choose Your Method

#### Method A: Upload File
- Click the file input
- Select `sample-tasks.json` or `sample-tasks.csv` from the repo root
- Click "Import JSON" or "Import CSV"

#### Method B: Paste JSON
```json
[
  {"title": "Buy milk", "completed": false},
  {"title": "Write docs", "completed": true},
  {"title": "Deploy app", "completed": false}
]
```

#### Method C: Paste CSV
```csv
title,completed
Buy milk,false
Write docs,true
Deploy app,false
```

### 4. Done! 🎉
Your tasks are imported and appear in the list immediately.

---

## 📚 Learn More

- **Full Documentation**: See `BULK_IMPORT.md`
- **Test Procedures**: See `TESTING.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **API Endpoint**: `POST /tasks/bulk`

## 🔧 API Usage

```bash
curl -X POST http://localhost:3001/tasks/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [
      {"title": "Task 1", "completed": false},
      {"title": "Task 2", "completed": true}
    ]
  }'
```

## ⚡ Features

- ✅ Import up to 1,000 tasks at once
- ✅ Support for JSON and CSV formats
- ✅ File upload or paste text
- ✅ Automatic validation
- ✅ Partial success (skip invalid tasks)
- ✅ Detailed error reporting
- ✅ Dark mode support
- ✅ Mobile responsive

## 🎯 Key Limits

- **Max tasks per import**: 1,000
- **Max title length**: 500 characters
- **Required fields**: `title`
- **Optional fields**: `completed` (default: false)

## ❌ Common Issues

| Issue | Solution |
|-------|----------|
| Tasks don't appear | Refresh the page or check browser console for errors |
| Import button missing | Make sure the page fully loaded |
| CSV parsing error | Check headers are `title,completed` (lowercase) |
| File upload fails | Ensure file is valid JSON or CSV format |

## 📖 Full Documentation

- Start here: `BULK_IMPORT.md`
- Want to test? See: `TESTING.md`
- Technical details? Check: `IMPLEMENTATION_SUMMARY.md`

---

**Happy importing!** 🚀
