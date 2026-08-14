# Bulk Import Testing Guide

This guide walks through testing the new bulk import feature.

## Prerequisites

- Docker Desktop or Docker Engine + Compose
- Running application: `docker compose up --build`
- Access to http://localhost:3000

## Manual Testing

### Test 1: Upload JSON File

1. Navigate to http://localhost:3000
2. Click the **📥 Import** button
3. In the "Upload JSON or CSV file" section, click to select a file
4. Select `sample-tasks.json` from the repository root
5. Wait for the import to complete
6. Verify:
   - ✓ Import successful message appears
   - ✓ Shows "8 tasks imported"
   - ✓ Tasks appear in the main list
   - ✓ Completed tasks show with strikethrough

### Test 2: Upload CSV File

1. Click **📥 Import** again
2. Click to select a file
3. Select `sample-tasks.csv` from the repository root
4. Wait for the import to complete
5. Verify:
   - ✓ Import successful message appears
   - ✓ Shows "10 tasks imported"
   - ✓ New tasks appear in the list

### Test 3: Paste JSON Data

1. Click **📥 Import**
2. Paste this JSON in the textarea:
```json
[
  {"title": "Learn TypeScript", "completed": false},
  {"title": "Read documentation", "completed": false},
  {"title": "Build a feature", "completed": true}
]
```
3. Click "Import JSON"
4. Verify:
   - ✓ Import successful message appears
   - ✓ Shows "3 tasks imported"
   - ✓ Tasks appear in the list

### Test 4: Paste CSV Data

1. Click **📥 Import**
2. Paste this CSV in the textarea:
```
title,completed
Setup development environment,false
Configure IDE,true
Install dependencies,false
```
3. Click "Import CSV"
4. Verify:
   - ✓ Import successful message appears
   - ✓ Shows "3 tasks imported"

### Test 5: Validation Error - Empty Title

1. Click **📥 Import**
2. Paste this JSON:
```json
[
  {"title": "Valid task", "completed": false},
  {"title": "", "completed": false},
  {"title": "Another valid task", "completed": false}
]
```
3. Click "Import JSON"
4. Verify:
   - ✓ Shows "2 tasks imported"
   - ✓ Shows "1 validation errors" warning
   - ✓ Error details show: "Row 1: title is required and must be a string"

### Test 6: Validation Error - Title Too Long

1. Click **📥 Import**
2. Paste this JSON:
```json
[
  {"title": "Valid task", "completed": false},
  {"title": "a".repeat(501), "completed": false}
]
```
3. Click "Import JSON"
4. Verify:
   - ✓ Shows "1 tasks imported"
   - ✓ Shows "1 validation errors" warning
   - ✓ Error details show: "Row 1: title must be 500 characters or less"

### Test 7: Invalid JSON

1. Click **📥 Import**
2. Paste this invalid JSON:
```
{title: "Invalid JSON", completed: false}
```
3. Click "Import JSON"
4. Verify:
   - ✓ Error message appears
   - ✓ Message says "Invalid JSON: ..."

### Test 8: Empty Array

1. Click **📥 Import**
2. Paste this JSON:
```json
[]
```
3. Click "Import JSON"
4. Verify:
   - ✓ Error message appears
   - ✓ Message says "tasks array cannot be empty"

### Test 9: Task Completion Status

1. Click **📥 Import**
2. Paste this JSON:
```json
[
  {"title": "Incomplete task", "completed": false},
  {"title": "Complete task", "completed": true}
]
```
3. Click "Import JSON"
4. Verify:
   - ✓ "Incomplete task" appears without strikethrough
   - ✓ "Complete task" appears with strikethrough
   - ✓ Completion status matches what was imported

### Test 10: Task Counter Updates

1. Import a batch of tasks (e.g., from `sample-tasks.json`)
2. Verify:
   - ✓ Counter shows updated total count
   - ✓ Counter shows correct number of completed vs total

## API Testing

### Test 11: API Bulk Import Success

```bash
curl -X POST http://localhost:3001/tasks/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [
      {"title": "API Task 1", "completed": false},
      {"title": "API Task 2", "completed": true}
    ]
  }'
```

Expected response (200 OK):
```json
{
  "imported": 2,
  "total": 2,
  "skipped": 0,
  "tasks": [
    {
      "id": X,
      "title": "API Task 1",
      "completed": false,
      "created_at": "..."
    },
    {
      "id": X+1,
      "title": "API Task 2",
      "completed": true,
      "created_at": "..."
    }
  ]
}
```

### Test 12: API Validation Error

```bash
curl -X POST http://localhost:3001/tasks/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [
      {"title": "Valid", "completed": false},
      {"title": "", "completed": false}
    ]
  }'
```

Expected response (201 Created):
```json
{
  "imported": 1,
  "total": 2,
  "skipped": 1,
  "tasks": [...],
  "validationErrors": [
    {
      "index": 1,
      "error": "title is required and must be a string"
    }
  ]
}
```

### Test 13: API Error - Invalid Request

```bash
curl -X POST http://localhost:3001/tasks/bulk \
  -H "Content-Type: application/json" \
  -d '{"tasks": "not an array"}'
```

Expected response (400 Bad Request):
```json
{
  "error": "tasks must be an array"
}
```

### Test 14: API Error - Too Many Tasks

```bash
curl -X POST http://localhost:3001/tasks/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": ['"$(printf '{"title":"Task"},%.0s' {1..1001})"']
  }'
```

Expected response (400 Bad Request):
```json
{
  "error": "Cannot import more than 1000 tasks at once"
}
```

## Edge Cases to Test

### Test 15: CSV with Missing Completed Column

Paste in CSV:
```
title
Task without completed
Another task
```

Expected:
- ✓ Tasks imported successfully
- ✓ Completed defaults to false

### Test 16: CSV with Extra Columns

Paste in CSV:
```
title,completed,priority,due_date
Task 1,false,high,2024-01-20
Task 2,true,low,2024-01-21
```

Expected:
- ✓ Tasks imported (extra columns ignored)
- ✓ "Task 1" and "Task 2" appear in list

### Test 17: Mixed Case Boolean Values

Paste JSON:
```json
[
  {"title": "Task 1", "completed": "true"},
  {"title": "Task 2", "completed": "false"},
  {"title": "Task 3", "completed": 1}
]
```

Expected:
- ✓ "Task 1" is marked as complete (treated as true)
- ✓ "Task 2" is not complete (treated as false)
- ✓ "Task 3" is not complete (only boolean true is marked complete)

### Test 18: Whitespace Handling

Paste JSON:
```json
[
  {"title": "  Task with spaces  ", "completed": false}
]
```

Expected:
- ✓ Task appears as "Task with spaces" (trimmed)
- ✓ No leading/trailing spaces

### Test 19: Dark Mode

1. Test in dark mode (browser dark mode or system preference)
2. Click **📥 Import** and verify:
   - ✓ Modal appears with proper dark mode styling
   - ✓ Input fields are readable
   - ✓ Buttons have appropriate contrast
   - ✓ Error/success messages are visible

### Test 20: Responsive Design

1. Test on different screen sizes:
   - Mobile (375px width)
   - Tablet (768px width)
   - Desktop (1920px width)
2. Verify:
   - ✓ Modal is centered and properly sized
   - ✓ Text is readable on all sizes
   - ✓ Form controls are accessible
   - ✓ No horizontal scrolling on small screens

## Performance Testing

### Test 21: Large Batch Import

1. Create a JSON file with 1000 tasks:
```python
import json
tasks = [{"title": f"Task {i}", "completed": i % 2 == 0} for i in range(1000)]
print(json.dumps(tasks))
```

2. Click **📥 Import**
3. Upload the file
4. Verify:
   - ✓ Import completes in reasonable time (<5 seconds)
   - ✓ All 1000 tasks appear in the list
   - ✓ Counter shows "500 / 1000 completed"

### Test 22: Maximum Batch Exceeded

1. Try to import 1001 tasks via API:
```bash
curl -X POST http://localhost:3001/tasks/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": ['"$(printf '{"title":"Task %d"},%.0s' {1..1001})"']
  }'
```

Expected:
- ✓ Request rejected with error
- ✓ Message: "Cannot import more than 1000 tasks at once"

## Cleanup

After testing, you can:

1. Clear all tasks: Delete them one by one, or
2. Reset the database: `docker compose down -v` (deletes all data)
3. Restart: `docker compose up --build`

## Troubleshooting

### Import button not appearing

- Verify page has fully loaded
- Check browser console for errors
- Refresh the page

### Modal appears but buttons don't work

- Check browser console for JavaScript errors
- Verify API is running: `curl http://localhost:3001/health`
- Check network tab to see if requests are being sent

### Tasks don't appear after import

- Check task list in browser
- Verify database: `docker compose logs api`
- Check API logs for errors: `docker compose logs api | grep -i error`

### CSV parsing fails

- Verify CSV headers are correct: `title,completed`
- Check for special characters that need escaping
- Ensure headers are lowercase
