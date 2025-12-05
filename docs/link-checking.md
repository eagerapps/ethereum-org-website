# Link Checking

This document describes how to use the broken link checker tool to find and fix broken links in the ethereum.org website.

## Overview

The broken link checker (`src/scripts/brokenLinkChecker.ts`) scans all markdown files in the repository and identifies:

- **Internal links**: Links to files and pages within the repository
- **Anchor links**: Links to specific sections within documents (headings)
- **External links**: Links to external websites (optional, disabled by default)

## Usage

### Basic Link Check (Internal & Anchor Links Only)

Run the link checker without external URL validation:

```bash
pnpm link-checker
```

This will:
- Scan all markdown files in `public/content/`
- Check internal file paths
- Validate anchor links point to existing headings
- Generate reports with broken links found

### Full Link Check (Including External URLs)

Run the link checker with external URL validation:

```bash
pnpm link-checker:external
```

⚠️ **Warning**: External link checking can take a long time and may be rate-limited by some websites.

### Command Line Options

```bash
# Check only internal links (default)
pnpm link-checker

# Check including external URLs
pnpm link-checker:external

# Or run directly with ts-node
ts-node -O '{ "module": "commonjs" }' src/scripts/brokenLinkChecker.ts
ts-node -O '{ "module": "commonjs" }' src/scripts/brokenLinkChecker.ts --external
```

## Output

The link checker produces two output files:

### 1. Console Output

Real-time progress and summary displayed in the terminal:

```
Starting broken link checker...
Checking external links: false

Found 4033 markdown files to check

[4033/4033] Checking public/content/zero-knowledge-proofs/index.md...

Check complete!

================================================================================
BROKEN LINK REPORT
================================================================================
Files checked: 4033
Total links found: 98973
Broken links found: 17639
================================================================================

🔗 BROKEN INTERNAL LINKS (6675):
...

⚓ BROKEN ANCHOR LINKS (10964):
...
```

### 2. JSON Report (`broken-links-report.json`)

A detailed JSON file containing all broken links with:
- File path where the broken link was found
- Line number in the file
- The broken link URL
- Reason why it's broken
- Link type (internal, anchor, or external)

Example structure:
```json
{
  "brokenLinks": [
    {
      "file": "public/content/about/index.md",
      "line": 21,
      "link": "/what-is-ethereum/",
      "reason": "File or directory not found",
      "type": "internal"
    }
  ],
  "checkedFiles": 4033,
  "totalLinks": 98973
}
```

## Understanding Broken Links

### Internal Links

Internal links point to files or pages within the repository. Common issues:

- **Missing pages**: The target file doesn't exist
- **Incorrect path**: The path is wrong or uses the wrong format
- **Missing index.md**: Directory exists but doesn't have an index.md file

Examples:
```markdown
[Broken](/what-is-ethereum/)          # Page doesn't exist
[Working](/developers/docs/intro-to-ethereum/)  # Correct internal link
```

### Anchor Links

Anchor links point to specific headings within documents. Common issues:

- **Missing heading**: The heading doesn't exist in the target document
- **Incorrect anchor format**: The anchor doesn't match the heading slug
- **Target file missing**: The file containing the heading doesn't exist

Examples:
```markdown
[Broken](/glossary/#missing-term)     # Heading doesn't exist
[Working](/glossary/#blockchain)      # Correct anchor link
```

The link checker converts headings to anchors by:
1. Converting to lowercase
2. Replacing spaces with hyphens
3. Removing special characters
4. Example: "What is Ethereum?" → `#what-is-ethereum`

### External Links

External links point to websites outside the repository. Issues:

- **404 Not Found**: The page doesn't exist
- **Timeout**: The server didn't respond in time
- **Connection error**: Network or DNS issues

## Current Status

As of the latest check:

- **Files checked**: 4,033 markdown files
- **Total links**: 98,973 links found
- **Broken links**: 17,639 broken links
  - Internal links: 6,675 broken
  - Anchor links: 10,964 broken

### Top Files with Broken Links

The glossary files in various languages have the most broken links, with 234-266 broken links each:
- `translations/tr/glossary/index.md` - 266 broken links
- `translations/ro/glossary/index.md` - 266 broken links
- `translations/pt-br/glossary/index.md` - 266 broken links
- And many more language variants

## Fixing Broken Links

### Common Fixes

1. **Update the link path**: Change the link to point to the correct location
2. **Create missing content**: Add the missing page or section
3. **Remove the link**: If the target is no longer relevant
4. **Update anchors**: Ensure anchor matches the actual heading

### Testing Your Fixes

After fixing broken links, run the link checker again to verify:

```bash
pnpm link-checker
```

The exit code will be:
- `0` if no broken links found (success)
- `1` if broken links exist (failure)

This makes it suitable for CI/CD pipelines.

## Integration with CI/CD

You can add the link checker to your CI pipeline:

```yaml
# Example GitHub Actions workflow
- name: Check for broken links
  run: pnpm link-checker
```

## Performance Tips

1. **Skip external checks locally**: External link checking is slow; use it sparingly
2. **Focus on changed files**: When fixing links, focus on files you've modified
3. **Batch fixes**: Group similar fixes together for efficiency

## Known Limitations

1. **Glossary anchors**: Many glossary anchor links are broken due to format differences
2. **Translated content**: Translated pages may reference paths that don't exist in that language
3. **Dynamic routes**: The checker only validates static file paths, not Next.js dynamic routes
4. **External rate limiting**: Some external sites may block or rate-limit automated checks

## Related Tools

- `pnpm markdown-checker`: Checks for markdown formatting issues
- Next.js build: Validates some internal links at build time
