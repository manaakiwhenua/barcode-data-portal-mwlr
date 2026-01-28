# Issue: Trailing Empty Lines in JSONL File Breaking Data Import

**Status:** RESOLVED ✅  
**Date Identified:** 2026-01-27  
**Date Resolved:** 2026-01-27  
**Severity:** High (breaks local development data loading)

## Symptoms

The local `init.sh` script was failing to load data into Couchbase. The `cbimport` tool was encountering errors when processing `db_data/BCDM.jsonl`.

## Root Cause

The `db_data/BCDM.jsonl` file had trailing empty lines at the end of the file.

JSONL (JSON Lines) format expects each line to be a valid JSON object. Empty lines cause parsing errors because:
1. `cbimport` tries to parse each line as JSON
2. An empty line is not valid JSON
3. The import fails or produces warnings

## The Fix

### Initial Fix (Data)
Removed the trailing empty lines from `db_data/BCDM.jsonl`.

**Commit:** `4598f02` - "Fix data issue with trailing lines"

```
db_data/BCDM.jsonl | 5 +----
1 file changed, 1 insertion(+), 4 deletions(-)
```

### Permanent Fix (Script Improvement)

Updated `db_data/init.sh` to automatically strip empty lines before import, making the script resilient to this issue in the future.

Added `import_jsonl()` function:
```bash
# Function to import JSONL data, stripping empty lines to prevent parse errors
# Usage: import_jsonl <bucket> <collection> <file> <key_pattern>
import_jsonl() {
  local bucket="$1"
  local collection="$2"
  local file="$3"
  local key_pattern="$4"
  
  log "Importing $file into $bucket.$collection..."
  
  # Create a temp file with empty lines removed
  local tmpfile=$(mktemp)
  grep -v '^\s*$' "$file" > "$tmpfile" || true
  
  cbimport json --cluster 127.0.0.1 -u Administrator -p password \
    --bucket "$bucket" --scope-collection-exp "_default.$collection" \
    --format lines --dataset "file://$tmpfile" --generate-key "$key_pattern"
  
  rm -f "$tmpfile"
}
```

This also simplified the import calls from verbose multi-line `cbimport` commands to clean one-liners:
```bash
import_jsonl BCDM primary /db_data/BCDM.jsonl '%record_id%'
import_jsonl DERIVED accepted_terms /db_data/accepted_terms.jsonl '%term%'
# ... etc
```

## Prevention

The `import_jsonl()` function now handles this automatically. However, when editing or generating JSONL files:
1. Ensure no trailing newlines at end of file
2. Use `sed -i -e :a -e '/^\s*$/d' file.jsonl` to remove empty lines
3. Validate with: `wc -l file.jsonl` should equal the number of JSON objects

## Lessons Learned

1. **JSONL files must have no empty lines** - each line must be valid JSON
2. **Editors may add trailing newlines** - be aware when saving files
3. **Validate JSONL before import** - use `jq` or similar to verify: `cat file.jsonl | jq -c . > /dev/null`
4. **Make scripts resilient** - don't assume input data is perfect, sanitize it
