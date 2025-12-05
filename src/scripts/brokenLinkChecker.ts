import fs from "fs"
import http from "http"
import https from "https"
import path from "path"

import matter from "gray-matter"

interface BrokenLink {
  file: string
  line: number
  link: string
  reason: string
  type: "internal" | "external" | "anchor"
}

interface LinkCheckResult {
  brokenLinks: BrokenLink[]
  checkedFiles: number
  totalLinks: number
}

const PATH_TO_ALL_CONTENT = "./public/content/"
const MARKDOWN_LINK_REGEX = /\[([^\]]*)\]\(([^)]+)\)/g
const IMAGE_LINK_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/g

function getAllMarkdownPaths(
  dirPath: string,
  arrayOfMarkdownPaths: string[] = []
): string[] {
  const files: string[] = fs.readdirSync(dirPath)

  for (const file of files) {
    const fullPath = path.join(dirPath, file)
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfMarkdownPaths = getAllMarkdownPaths(fullPath, arrayOfMarkdownPaths)
    } else if (fullPath.endsWith(".md")) {
      arrayOfMarkdownPaths.push(fullPath)
    }
  }

  return arrayOfMarkdownPaths
}

function getLineNumber(content: string, index: number): number {
  const lines = content.substring(0, index).split("\n")
  return lines.length
}

async function checkExternalUrl(
  url: string
): Promise<{ valid: boolean; reason?: string }> {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url)
      const protocol = urlObj.protocol === "https:" ? https : http

      const options = {
        method: "HEAD",
        timeout: 10000,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; LinkChecker/1.0)",
        },
      }

      const req = protocol.request(url, options, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
          resolve({ valid: true })
        } else if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400
        ) {
          // Handle redirects
          resolve({ valid: true })
        } else {
          resolve({ valid: false, reason: `HTTP ${res.statusCode}` })
        }
      })

      req.on("error", (err) => {
        resolve({ valid: false, reason: err.message })
      })

      req.on("timeout", () => {
        req.destroy()
        resolve({ valid: false, reason: "Timeout" })
      })

      req.end()
    } catch (err) {
      resolve({ valid: false, reason: (err as Error).message })
    }
  })
}

function checkInternalPath(
  linkPath: string,
  currentFilePath: string
): { valid: boolean; reason?: string } {
  // Remove query strings and anchors
  const cleanPath = linkPath.split("?")[0].split("#")[0]

  if (!cleanPath) {
    return { valid: true } // Empty path after removing anchor is valid
  }

  // Handle absolute paths from root
  if (cleanPath.startsWith("/")) {
    // Check if it's a public asset
    const publicPath = path.join(process.cwd(), "public", cleanPath)
    if (fs.existsSync(publicPath)) {
      return { valid: true }
    }

    // Check if it's a content path
    const contentPath = path.join(process.cwd(), "public/content", cleanPath)
    if (fs.existsSync(contentPath)) {
      return { valid: true }
    }

    // Check if it's a markdown file without .md extension
    if (fs.existsSync(contentPath + ".md")) {
      return { valid: true }
    }

    // Check if it's a directory with index.md
    if (fs.existsSync(path.join(contentPath, "index.md"))) {
      return { valid: true }
    }

    return { valid: false, reason: "File or directory not found" }
  }

  // Handle relative paths
  const currentDir = path.dirname(currentFilePath)
  const resolvedPath = path.resolve(currentDir, cleanPath)

  if (fs.existsSync(resolvedPath)) {
    return { valid: true }
  }

  // Check if it's a markdown file without .md extension
  if (fs.existsSync(resolvedPath + ".md")) {
    return { valid: true }
  }

  // Check if it's a directory with index.md
  if (fs.existsSync(path.join(resolvedPath, "index.md"))) {
    return { valid: true }
  }

  return { valid: false, reason: "File or directory not found" }
}

function extractHeadings(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf-8")
  const { content: markdownContent } = matter(content)

  const headings: string[] = []
  const headingRegex = /^#{1,6}\s+(.+)$/gm
  let match

  while ((match = headingRegex.exec(markdownContent))) {
    const headingText = match[1]
    // Convert heading to anchor format (lowercase, replace spaces with hyphens)
    const anchor = headingText
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")

    headings.push(anchor)
  }

  return headings
}

function checkAnchor(
  linkPath: string,
  currentFilePath: string
): { valid: boolean; reason?: string } {
  const [pathPart, anchor] = linkPath.split("#")

  if (!anchor) {
    return { valid: true } // No anchor to check
  }

  let targetFile = currentFilePath

  // If there's a path part, resolve it first
  if (pathPart) {
    if (pathPart.startsWith("/")) {
      const contentPath = path.join(process.cwd(), "public/content", pathPart)
      if (fs.existsSync(contentPath) && fs.statSync(contentPath).isFile()) {
        targetFile = contentPath
      } else if (fs.existsSync(path.join(contentPath, "index.md"))) {
        targetFile = path.join(contentPath, "index.md")
      } else {
        return { valid: false, reason: "Target file not found" }
      }
    } else {
      const currentDir = path.dirname(currentFilePath)
      const resolvedPath = path.resolve(currentDir, pathPart)

      if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
        targetFile = resolvedPath
      } else if (fs.existsSync(path.join(resolvedPath, "index.md"))) {
        targetFile = path.join(resolvedPath, "index.md")
      } else {
        return { valid: false, reason: "Target file not found" }
      }
    }
  }

  // Now check if the anchor exists in the target file
  const headings = extractHeadings(targetFile)

  if (!headings.includes(anchor)) {
    return { valid: false, reason: `Anchor "#${anchor}" not found in document` }
  }

  return { valid: true }
}

async function checkLinks(
  filePath: string,
  content: string,
  checkExternal: boolean = false
): Promise<BrokenLink[]> {
  const brokenLinks: BrokenLink[] = []
  const allMatches: Array<{ link: string; index: number; isImage: boolean }> =
    []

  // Find all regular links
  let match
  while ((match = MARKDOWN_LINK_REGEX.exec(content)) !== null) {
    allMatches.push({
      link: match[2],
      index: match.index,
      isImage: false,
    })
  }

  // Find all image links
  MARKDOWN_LINK_REGEX.lastIndex = 0
  while ((match = IMAGE_LINK_REGEX.exec(content)) !== null) {
    allMatches.push({
      link: match[2],
      index: match.index,
      isImage: true,
    })
  }

  for (const { link, index } of allMatches) {
    const lineNumber = getLineNumber(content, index)

    // Skip email links
    if (link.startsWith("mailto:")) {
      continue
    }

    // Skip data URIs
    if (link.startsWith("data:")) {
      continue
    }

    // External URL
    if (link.startsWith("http://") || link.startsWith("https://")) {
      if (checkExternal) {
        const result = await checkExternalUrl(link)
        if (!result.valid) {
          brokenLinks.push({
            file: filePath,
            line: lineNumber,
            link,
            reason: result.reason || "Unknown error",
            type: "external",
          })
        }
      }
      continue
    }

    // Internal link with anchor
    if (link.includes("#")) {
      const result = checkAnchor(link, filePath)
      if (!result.valid) {
        brokenLinks.push({
          file: filePath,
          line: lineNumber,
          link,
          reason: result.reason || "Anchor not found",
          type: "anchor",
        })
      }
      continue
    }

    // Internal path
    if (link.startsWith("/") || link.startsWith(".")) {
      const result = checkInternalPath(link, filePath)
      if (!result.valid) {
        brokenLinks.push({
          file: filePath,
          line: lineNumber,
          link,
          reason: result.reason || "File not found",
          type: "internal",
        })
      }
    }
  }

  return brokenLinks
}

async function checkAllLinks(
  checkExternal: boolean = false
): Promise<LinkCheckResult> {
  console.log("Starting broken link checker...")
  console.log(`Checking external links: ${checkExternal}`)

  const markdownPaths = getAllMarkdownPaths(PATH_TO_ALL_CONTENT)
  const brokenLinks: BrokenLink[] = []
  let totalLinks = 0

  console.log(`Found ${markdownPaths.length} markdown files to check\n`)

  for (let i = 0; i < markdownPaths.length; i++) {
    const filePath = markdownPaths[i]
    const progress = `[${i + 1}/${markdownPaths.length}]`
    process.stdout.write(`\r${progress} Checking ${filePath}...`)

    const content = fs.readFileSync(filePath, "utf-8")
    const links = await checkLinks(filePath, content, checkExternal)

    brokenLinks.push(...links)

    // Count total links in file
    const linkMatches = content.match(MARKDOWN_LINK_REGEX) || []
    const imageMatches = content.match(IMAGE_LINK_REGEX) || []
    totalLinks += linkMatches.length + imageMatches.length
  }

  console.log("\n\nCheck complete!\n")

  return {
    brokenLinks,
    checkedFiles: markdownPaths.length,
    totalLinks,
  }
}

function generateReport(result: LinkCheckResult) {
  console.log("=".repeat(80))
  console.log("BROKEN LINK REPORT")
  console.log("=".repeat(80))
  console.log(`Files checked: ${result.checkedFiles}`)
  console.log(`Total links found: ${result.totalLinks}`)
  console.log(`Broken links found: ${result.brokenLinks.length}`)
  console.log("=".repeat(80))
  console.log()

  if (result.brokenLinks.length === 0) {
    console.log("✅ No broken links found!")
    return
  }

  // Group by type
  const byType = {
    internal: result.brokenLinks.filter((l) => l.type === "internal"),
    external: result.brokenLinks.filter((l) => l.type === "external"),
    anchor: result.brokenLinks.filter((l) => l.type === "anchor"),
  }

  if (byType.internal.length > 0) {
    console.log(`\n🔗 BROKEN INTERNAL LINKS (${byType.internal.length}):`)
    console.log("-".repeat(80))
    byType.internal.forEach((link) => {
      console.log(`📄 ${link.file}:${link.line}`)
      console.log(`   Link: ${link.link}`)
      console.log(`   Reason: ${link.reason}`)
      console.log()
    })
  }

  if (byType.anchor.length > 0) {
    console.log(`\n⚓ BROKEN ANCHOR LINKS (${byType.anchor.length}):`)
    console.log("-".repeat(80))
    byType.anchor.forEach((link) => {
      console.log(`📄 ${link.file}:${link.line}`)
      console.log(`   Link: ${link.link}`)
      console.log(`   Reason: ${link.reason}`)
      console.log()
    })
  }

  if (byType.external.length > 0) {
    console.log(`\n🌐 BROKEN EXTERNAL LINKS (${byType.external.length}):`)
    console.log("-".repeat(80))
    byType.external.forEach((link) => {
      console.log(`📄 ${link.file}:${link.line}`)
      console.log(`   Link: ${link.link}`)
      console.log(`   Reason: ${link.reason}`)
      console.log()
    })
  }

  // Write to JSON file
  const outputPath = "./broken-links-report.json"
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2))
  console.log(`\n📝 Full report written to: ${outputPath}`)
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  const checkExternal = args.includes("--external") || args.includes("-e")

  if (checkExternal) {
    console.log(
      "⚠️  External link checking is enabled. This may take a while...\n"
    )
  } else {
    console.log(
      "ℹ️  External link checking is disabled. Use --external or -e to enable.\n"
    )
  }

  const result = await checkAllLinks(checkExternal)
  generateReport(result)

  // Exit with error code if broken links found
  if (result.brokenLinks.length > 0) {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error("Error running link checker:", error)
  process.exit(1)
})
