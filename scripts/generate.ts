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

  const cssRegex = /<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>/g
  htmlContent = htmlContent.replace(cssRegex, (match, href) => {
    const filePath = path.join(distDir, href)
    if (fs.existsSync(filePath)) {
      const cssContent = fs.readFileSync(filePath, 'utf-8')
      return `<style>${cssContent}</style>`
    }
    return match
  })

  const jsPath = path.join(distDir, 'index.js')
  const jsContent = fs.existsSync(jsPath) ? fs.readFileSync(jsPath, 'utf-8') : null
  const jsRegex = /<script[^>]+src="[^"]*index\.js[^"]*"[^>]*><\/script>/g
  htmlContent = htmlContent.replace(jsRegex, '')

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

    const tasks = await readTasksData(config)
    const taskCount = (Array.isArray(tasks) && tasks.length > 0 && Array.isArray(tasks[0])) ? tasks.length - 1 : tasks.length
    console.log(`Loaded ${taskCount} tasks`)

    // Parse filter and popup field selections from CLI args
    let filterFields: string[] = []
    let popupFields: string[] = []

    if (config.extraFields) {
      const parts = config.extraFields.split(';').map(s => s.trim()).filter(Boolean)
      if (parts.length >= 2) {
        filterFields = parts[0].split(',').map(s => s.trim()).filter(Boolean)
        popupFields = parts[1].split(',').map(s => s.trim()).filter(Boolean)
      } else {
        filterFields = parts[0].split(',').map(s => s.trim()).filter(Boolean)
        popupFields = [...filterFields]
      }
    }

    // Build project
    await buildProject()

    // Read built HTML
    const htmlPath = path.join(__dirname, '..', 'dist', 'index.html')
    let htmlContent = fs.readFileSync(htmlPath, 'utf-8')

    // Transform raw 2D array into objects
    const [header, ...rows] = (Array.isArray(tasks) && tasks.length > 0 && Array.isArray(tasks[0]))
      ? tasks
      : [[], []]

    const colMap: string[] = []
    header.forEach((h: string, i: number) => {
      if (i === 0) colMap[i] = 'name'
      else if (i === 1) colMap[i] = 'start'
      else if (i === 2) colMap[i] = 'end'
      else if (i === 3) colMap[i] = 'due'
      else colMap[i] = h
    })

    const transformedTasks = rows.map((row: any[]) => {
      const obj: Record<string, any> = {}
      row.forEach((val: any, i: number) => {
        const key = colMap[i] || `col${i}`
        obj[key] = val
      })
      return obj
    })

    const injectionScript = `<script>
      window.__TIMELINE_DATA__ = ${JSON.stringify(transformedTasks)};
      window.__TIMELINE_CONFIG__ = { title: ${JSON.stringify(config.title)}, extraFields: ${JSON.stringify(filterFields)}, popupFields: ${JSON.stringify(popupFields)}, sheetUrl: ${JSON.stringify(config.sheetUrl || null)} };
    </script>`

    // Inline all assets
    htmlContent = inlineAssets(htmlContent, injectionScript)

    // Create output directory
    const baseOutputDir = path.resolve(config.output || 'output')
    const outputDir = path.join(baseOutputDir, config.sheetName || 'Sheet1', config.tabName || 'Default')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const outputFile = path.join(outputDir, 'timeline.html')

    // Write final HTML
    fs.writeFileSync(outputFile, htmlContent, 'utf-8')

    console.log(`✓ Generated: ${outputFile}`)
    console.log(`File size: ${(fs.statSync(outputFile).size / 1024).toFixed(2)} KB`)

    // Open in default browser
    const platform = process.platform
    if (platform === 'win32') {
      exec(`start "" "${outputFile}"`)
    } else if (platform === 'darwin') {
      exec(`open "${outputFile}"`)
    } else {
      exec(`xdg-open "${outputFile}"`)
    }
    console.log('Opened in browser')
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error')
    process.exit(1)
  }
}

generate()
