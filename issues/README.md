# Issue Tracking

This folder tracks issues and bugs discovered during development.

## Open Issues

- [JS Chunk Loading Error](open/js-chunk-loading-error/README.md)

## Resolved Issues

- [DataTables Address Parameter Error](resolved/datatables-address-parameter-error/README.md)
- [JSONL Trailing Lines](resolved/jsonl-trailing-lines/README.md)

---

## Structure

```
issues/
├── open/           # Active issues being investigated
│   └── <issue-name>/
│       ├── README.md
│       └── <screenshots, logs, etc>
├── resolved/       # Fixed issues (kept for reference)
│   └── <issue-name>/
│       ├── README.md
│       └── <screenshots, logs, etc>
└── README.md       # This file
```

## Creating a New Issue

1. Create a folder under `open/<issue-name>/`
2. Add a `README.md` with:
   - Status, dates, severity
   - Symptoms
   - Root cause analysis
   - Fix applied
   - Lessons learned
3. Include any screenshots or logs directly in the issue folder
4. Move to `resolved/` when fixed
