#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

interface GeneratorConfig {
  data?: string
  title?: string
  dataFile?: string
  output?: string
  sheetName?: string
  tabName?: string
  extraFields?: string
  sheetUrl?: string
}

const parseArgs = (): GeneratorConfig => {
  const config: GeneratorConfig = {
    title: 'Timeline',
    output: 'output',
    sheetName: 'Sheet1',
    tabName: 'Default'
  }

  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i]
    if (arg === '--data' && i + 1 < process.argv.length) {
      config.data = process.argv[++i]
    } else if (arg === '--data-file' && i + 1 < process.argv.length) {
      config.dataFile = process.argv[++i]
    } else if (arg === '--title' && i + 1 < process.argv.length) {
      config.title = process.argv[++i]
    } else if (arg === '--output' && i + 1 < process.argv.length) {
      config.output = process.argv[++i]
    } else if (arg === '--sheet-name' && i + 1 < process.argv.length) {
      config.sheetName = process.argv[++i]
    } else if (arg === '--tab-name' && i + 1 < process.argv.length) {
      config.tabName = process.argv[++i]
    } else if (arg === '--extra-fields' && i + 1 < process.argv.length) {
      config.extraFields = process.argv[++i]
    } else if (arg === '--sheet-url' && i + 1 < process.argv.length) {
      config.sheetUrl = process.argv[++i]
    }
  }

  return config
}

const readTasksData = async (config: GeneratorConfig): Promise<any[]> => {
  try {
    if (config.dataFile) {
      const filePath = path.resolve(config.dataFile)
      const content = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(content)
    } else if (config.data) {
      return JSON.parse(config.data)
    } else {
      // Read from stdin
      return new Promise((resolve, reject) => {
        let data = ''
        process.stdin.setEncoding('utf-8')
        process.stdin.on('data', chunk => (data += chunk))
        process.stdin.on('end', () => {
          try {
            resolve(JSON.parse(data))
          } catch (e) {
            reject(new Error('Invalid JSON input'))
          }
        })
        process.stdin.on('error', reject)
      })
    }
  } catch (error) {
    throw new Error(`Failed to read tasks data: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

const buildProject = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log('Building project...')
    exec('npm run build', { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Build failed: ${stderr || error.message}`))
      } else {
        console.log('Build completed')
        resolve()
      }
    })
  })
}

const inlineAssets = (htmlContent: string, dataScript: string): string => {
  const distDir = path.join(__dirname, '..', 'dist')

  // Inline CSS
  const cssRegex = /<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>/g
  htmlContent = htmlContent.replace(cssRegex, (match, href) => {
    const filePath = path.join(distDir, href)
    if (fs.existsSync(filePath)) {
      const cssContent = fs.readFileSync(filePath, 'utf-8')
      return `<style>${cssContent}</style>`
    }
    return match
  })

  // Inline JS — replace external script tag with inline script at end of body
  // so the DOM (including #root) exists when it executes
  const jsPath = path.join(distDir, 'index.js')
  const jsContent = fs.existsSync(jsPath) ? fs.readFileSync(jsPath, 'utf-8') : null
  const jsRegex = /<script[^>]+src="[^"]*index\.js[^"]*"[^>]*><\/script>/g
  htmlContent = htmlContent.replace(jsRegex, '')

  // Inject data script + inline JS before closing body
  htmlContent = htmlContent.replace('</body>', () => `${dataScript}\n  <script>\n${jsContent}\n</script>\n  </body>`)

  return htmlContent
}

const generate = async () => {
  try {
    const config = parseArgs()

    console.log('Timeline Generator')
    console.log('==================')
    console.log(`Title: ${config.title}`)
    console.log(`Sheet: ${config.sheetName}`)
    console.log(`Tab: ${config.tabName}`)

    // Read tasks data
    const tasks = await readTasksData(config)
    console.log(`Loaded ${tasks.length} tasks`)

    // Build project
    await buildProject()

    // Read built HTML
    const htmlPath = path.join(__dirname, '..', 'dist', 'index.html')
    let htmlContent = fs.readFileSync(htmlPath, 'utf-8')

    // Prepare data injection script
    const extraFieldsArr = config.extraFields
      ? config.extraFields.split(',').map(s => s.trim()).filter(Boolean)
      : []
    const injectionScript = `<script>
      window.__TIMELINE_DATA__ = ${JSON.stringify(tasks)};
      window.__TIMELINE_CONFIG__ = { title: ${JSON.stringify(config.title)}, extraFields: ${JSON.stringify(extraFieldsArr)}, sheetUrl: ${JSON.stringify(config.sheetUrl || null)} };
    </script>`

    // Inline all assets into a single self-contained HTML
    htmlContent = inlineAssets(htmlContent, injectionScript)

    // Create nested output directory: output/SHEET_NAME/TAB_NAME/
    const baseOutputDir = path.resolve(config.output || 'output')
    const outputDir = path.join(baseOutputDir, config.sheetName || 'Sheet1', config.tabName || 'Default')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Generate filename as timeline.html
    const outputFile = path.join(outputDir, 'timeline.html')

    // Write final HTML
    fs.writeFileSync(outputFile, htmlContent, 'utf-8')

    console.log(`✓ Generated: ${outputFile}`)
    console.log(`File size: ${(fs.statSync(outputFile).size / 1024).toFixed(2)} KB`)
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error')
    process.exit(1)
  }
}

generate()
