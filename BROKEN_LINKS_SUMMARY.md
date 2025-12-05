# Broken Links Report Summary

**Date**: December 5, 2024  
**Repository**: ethereum-org-website

## Executive Summary

A comprehensive link check was performed on all markdown content in the ethereum.org website repository. The analysis revealed **17,639 broken links** across **4,033 markdown files** out of **98,973 total links**.

## Statistics

| Metric | Count |
|--------|-------|
| **Files Checked** | 4,033 |
| **Total Links Found** | 98,973 |
| **Broken Links** | 17,639 |
| **Success Rate** | 82.2% |

## Broken Links by Type

| Type | Count | Description |
|------|-------|-------------|
| **Anchor Links** | 10,964 | Links to document sections (headings) that don't exist |
| **Internal Links** | 6,675 | Links to pages/files within the repository that don't exist |
| **External Links** | 0 | Not checked by default (would require `--external` flag) |

## Top 20 Files with Most Broken Links

| Rank | File | Broken Links |
|------|------|--------------|
| 1 | `translations/tr/glossary/index.md` | 266 |
| 2 | `translations/ro/glossary/index.md` | 266 |
| 3 | `translations/pt-br/glossary/index.md` | 266 |
| 4 | `translations/id/glossary/index.md` | 266 |
| 5 | `translations/de/glossary/index.md` | 266 |
| 6 | `translations/pl/glossary/index.md` | 241 |
| 7 | `translations/ja/glossary/index.md` | 234 |
| 8 | `translations/tr/developers/docs/apis/json-rpc/index.md` | 64 |
| 9 | `translations/pt-br/developers/docs/apis/json-rpc/index.md` | 64 |
| 10 | `translations/it/developers/docs/apis/json-rpc/index.md` | 64 |
| 11 | `translations/hu/developers/docs/apis/json-rpc/index.md` | 64 |
| 12 | `translations/fr/developers/docs/apis/json-rpc/index.md` | 64 |
| 13 | `translations/es/developers/docs/apis/json-rpc/index.md` | 64 |
| 14 | `translations/de/developers/docs/apis/json-rpc/index.md` | 64 |
| 15 | `developers/docs/apis/json-rpc/index.md` | 64 |
| 16 | `translations/zh/developers/docs/apis/json-rpc/index.md` | 63 |
| 17 | `translations/zh-tw/developers/docs/apis/json-rpc/index.md` | 63 |
| 18 | `translations/ja/developers/docs/apis/json-rpc/index.md` | 63 |
| 19 | `translations/el/developers/docs/apis/json-rpc/index.md` | 63 |
| 20 | `translations/ga/ethereum-forks/index.md` | 51 |

## Common Issues Identified

### 1. Glossary Anchor Links (Most Common)
**Problem**: Many links to glossary terms use anchors that don't match the actual heading format.

**Examples**:
- `/glossary/#blockchain` → Anchor "#blockchain" not found
- `/glossary/#smart-contract` → Anchor "#smart-contract" not found
- `/glossary/#pos` → Anchor "#pos" not found

**Impact**: Affects translations across all languages (Turkish, Romanian, Portuguese, Indonesian, German, Polish, Japanese, etc.)

### 2. Missing Pages
**Problem**: Links point to pages that don't exist in the repository.

**Common Missing Pages**:
- `/what-is-ethereum/`
- `/get-eth/`
- `/layer-2/`
- `/wallets/`
- `/wallets/find-wallet/`
- `/resources/`
- `/founders/`

### 3. JSON-RPC Documentation
**Problem**: The JSON-RPC API documentation has many broken anchor links across all language versions.

**Examples**:
- Links to method sections that don't exist
- Section anchors that have changed or been renamed

### 4. Ethereum Forks Documentation
**Problem**: Links to historical fork information with missing anchors.

**Examples**:
- `/ethereum-forks/#constantinople`
- `/ethereum-forks/#beacon-chain-genesis`
- `/ethereum-forks/#london`

### 5. Developer Documentation
**Problem**: Various broken anchors in developer documentation.

**Examples**:
- `/developers/docs/scaling/#onchain-scaling`
- `/developers/docs/consensus-mechanisms/pos/#finality`

## Detailed Reports

Three detailed reports are available:

1. **`broken-links-report.json`** (4.0 MB)
   - Complete list of all broken links
   - Includes file path, line number, link URL, and reason for each broken link

2. **`broken-links-summary.json`**
   - Statistical summary and top broken files
   - JSON format for programmatic processing

3. **Console Output** (displayed during scan)
   - Real-time progress and categorized results

## Recommendations

### Immediate Actions

1. **Fix Glossary Anchors** (Priority: High)
   - Review glossary heading format and anchor generation
   - Update or standardize how glossary terms are linked
   - This affects ~11,000 broken links across all translations

2. **Create Missing Pages** (Priority: High)
   - Evaluate which missing pages are actually needed
   - Create redirects or update links for deprecated pages
   - Top candidates: `/what-is-ethereum/`, `/get-eth/`, `/layer-2/`, `/wallets/`

3. **Fix JSON-RPC Documentation** (Priority: Medium)
   - Review and update anchor links in JSON-RPC API documentation
   - Ensure consistency across all translated versions

4. **Update Fork Documentation** (Priority: Medium)
   - Add missing historical fork sections or update references

### Process Improvements

1. **Add CI/CD Integration**
   - Run link checker on pull requests
   - Prevent new broken links from being introduced

2. **Regular Monitoring**
   - Schedule periodic link checks (weekly or monthly)
   - Track broken link trends over time

3. **Documentation Updates**
   - Document anchor format standards for contributors
   - Add link validation to contributor guidelines

## How to Use the Link Checker

The link checker tool is now available in the repository:

```bash
# Check internal and anchor links only (fast)
pnpm link-checker

# Check including external URLs (slow)
pnpm link-checker:external
```

For detailed usage instructions, see [`docs/link-checking.md`](./link-checking.md).

## Next Steps

1. Review this summary and prioritize fixes
2. Create issues for major categories of broken links
3. Assign team members to fix high-priority broken links
4. Integrate link checking into CI/CD pipeline
5. Schedule regular link health checks

---

**Generated by**: Broken Link Checker v1.0  
**Script Location**: `src/scripts/brokenLinkChecker.ts`  
**Full Report**: `broken-links-report.json` (17,639 entries)
