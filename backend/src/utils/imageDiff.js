import fs from 'fs'
import path from 'path'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

function readPng(filePath) {
  return PNG.sync.read(fs.readFileSync(filePath))
}

function writePng(filePath, png) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(filePath, PNG.sync.write(png))
}

function resizeToCanvas(source, width, height) {
  const canvas = new PNG({ width, height })
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sx = Math.min(source.width - 1, Math.floor((x / width) * source.width))
      const sy = Math.min(source.height - 1, Math.floor((y / height) * source.height))
      const srcIdx = (source.width * sy + sx) << 2
      const dstIdx = (width * y + x) << 2
      canvas.data[dstIdx] = source.data[srcIdx]
      canvas.data[dstIdx + 1] = source.data[srcIdx + 1]
      canvas.data[dstIdx + 2] = source.data[srcIdx + 2]
      canvas.data[dstIdx + 3] = source.data[srcIdx + 3]
    }
  }
  return canvas
}

/**
 * Compare two PNG images and optionally write a diff heatmap.
 */
export function compareImages(baselinePath, currentPath, diffPath = null) {
  if (!fs.existsSync(baselinePath)) {
    return { error: 'baseline_not_found', compared: false }
  }
  if (!fs.existsSync(currentPath)) {
    return { error: 'current_not_found', compared: false }
  }

  const img1 = readPng(baselinePath)
  const img2 = readPng(currentPath)

  const width = Math.max(img1.width, img2.width)
  const height = Math.max(img1.height, img2.height)

  const norm1 = img1.width === width && img1.height === height ? img1 : resizeToCanvas(img1, width, height)
  const norm2 = img2.width === width && img2.height === height ? img2 : resizeToCanvas(img2, width, height)

  const diff = new PNG({ width, height })
  const diffPixels = pixelmatch(norm1.data, norm2.data, diff.data, width, height, {
    threshold: 0.1,
    includeAA: true
  })

  const totalPixels = width * height
  const diffPercent = totalPixels > 0 ? (diffPixels / totalPixels) * 100 : 0

  if (diffPath) {
    writePng(diffPath, diff)
  }

  return {
    compared: true,
    diffPixels,
    totalPixels,
    diffPercent: parseFloat(diffPercent.toFixed(4)),
    width,
    height,
    diffPath: diffPath || null
  }
}
