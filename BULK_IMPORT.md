# Bulk Import Feature

## Overview

The bulk import feature allows you to import multiple tasks at once using JSON or CSV formats. This is useful when migrating tasks from other applications or creating a large number of tasks at once.

## Features

- **File Upload**: Upload JSON or CSV files
- **Text Input**: Paste JSON or CSV data directly
- **Validation**: Automatic validation with detailed error reporting
- **Batch Processing**: Import up to 1000 tasks at once
- **Partial Success**: Continue importing even if some tasks fail validation

## Supported Formats

### JSON Format

JSON should be an array of task objects. Each task must have a `title` field.

```json
[
  {
    "title": "Task 1",
    "completed": false
  },
  {
    "title": "Task 2",
    "completed": true
  }
]
```

**Fields:**
- `title` (required, string): The task title (max 500 characters)
- `completed` (optional, boolean): Whether the task is completed (defaults to false)

### CSV Format

CSV files must have headers in the first row. The supported headers are `title` and `completed`.

```csv
title,completed
Buy groceries,false
Write proposal,true
Review code,false
```

**Fields:**
- `title` (required): The task title
- `completed` (optional): "true" or "false" (case-insensitive), "1" or "0"

## Usage

### Via Web UI

1. Click the **📥 Import** button in the top-right corner of the page
2. Choose one of these options:
   - **Upload File**: Select a `.json` or `.csv` file from your computer
   - **Paste JSON**: Paste JSON data directly and click "Import JSON"
   - **Paste CSV**: Paste CSV data directly and click "Import CSV"
3. Review the import results
4. Import additional tasks or close the modal

### Via API

Make a POST request to `/tasks/bulk` with the following payload:

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

**Response (Success):**
```json
{
  "imported": 2,
  "total": 2,
  "skipped": 0,
  "tasks": [
    {
      "id": 1,
      "title": "Task 1",
      "completed": false,
      "created_at": "2024-01-15T10:00:00Z"
    },
    {
      "id": 2,
      "title": "Task 2",
      "completed": true,
      "created_at": "2024-01-15T10:00:01Z"
    }
  ]
}
```

**Response (Partial Success):**
```json
{
  "imported": 1,
  "total": 2,
  "skipped": 1,
  "tasks": [
    {
      "id": 1,
      "title": "Task 1",
      "completed": false,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "validationErrors": [
    {
      "index": 1,
      "error": "title is required and must be a string"
    }
  ]
}
```

## Validation Rules

1. **Title Required**: Every task must have a non-empty title
2. **Title Type**: Title must be a string
3. **Title Length**: Title must be 500 characters or less
4. **Completed Type**: If provided, `completed` must be boolean
5. **Batch Size**: Maximum 1000 tasks per import request

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `tasks must be an array` | Invalid JSON structure | Ensure your JSON is an array, not an object |
| `tasks array cannot be empty` | Empty array provided | Add at least one task |
| `Cannot import more than 1000 tasks at once` | Too many tasks | Split into multiple imports |
| `No valid tasks to import` | All tasks failed validation | Check the `validationErrors` array for details |
| `Invalid JSON: ...` | Malformed JSON | Validate your JSON syntax |

### Validation Errors

When some tasks fail validation, they are skipped and the rest are imported. The response includes a `validationErrors` array with details about each failure:

```json
{
  "index": 2,
  "error": "title must be 500 characters or less"
}
```

The `index` refers to the position in your input array (0-indexed).

## Examples

See the sample files included with this project:

- `sample-tasks.json` - Example JSON import file
- `sample-tasks.csv` - Example CSV import file

To test the feature:

1. Start the application: `docker compose up --build`
2. Open http://localhost:3000
3. Click **📥 Import**
4. Upload `sample-tasks.json` or `sample-tasks.csv`
5. Review the results

## Implementation Details

### Backend

The bulk import endpoint is implemented in `src/api/index.js`:

- **Endpoint**: `POST /tasks/bulk`
- **Payload**: `{ "tasks": [...] }`
- **Response**: Import result with imported count, skipped count, and validation errors
- **Validation**: Each task is validated before insertion
- **Transaction Safety**: Each task is inserted individually (can be optimized with batch inserts)

### Frontend

The bulk import feature is implemented in:

- `src/web/app/BulkImportModal.tsx` - Modal component with file upload and text input
- `src/web/app/HomeClient.tsx` - Main page component with import button
- `src/web/app/actions.ts` - Server action for bulk import

### Features

- Auto-detection of file format (JSON or CSV)
- Streaming file parsing
- Real-time error feedback
- Success/error states with detailed messages
- Dark mode support
- Responsive design

## Performance Considerations

- **Maximum Batch Size**: 1000 tasks per request (configurable in API)
- **Processing Time**: ~50-100ms per 1000 tasks (varies by system)
- **Memory Usage**: Streaming file parsing for efficient memory usage
- **Database**: Each insert is a separate query (can be optimized with batch inserts for better performance)

## Future Enhancements

Potential improvements to the bulk import feature:

1. **Batch Inserts**: Use PostgreSQL batch insert for better performance
2. **Scheduled Imports**: Support scheduled imports from URLs
3. **Import History**: Track and display past imports
4. **Duplicate Detection**: Prevent importing duplicate tasks
5. **Filtering**: Allow importing only completed/incomplete tasks
6. **Custom Fields**: Support additional task fields (description, due date, priority, etc.)
7. **Progress Indicator**: Show real-time import progress for large batches
8. **Export**: Add bulk export feature (JSON/CSV)
