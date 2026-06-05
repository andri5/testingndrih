import fs from 'fs'
import path from 'path'
import { PNG } from 'pngjs'
import { compareImages } from '../imageDiff.js'

const tmpDir = path.join(process.cwd(), 'uploads', 'visual', '_test')

function writeSolidPng(filePath, width, height, rgba) {
  const png = new PNG({ width, height })
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = rgba[0]
    png.data[i + 1] = rgba[1]
    png.data[i + 2] = rgba[2]
    png.data[i + 3] = rgba[3]
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, PNG.sync.write(png))
}

describe('imageDiff', () => {
  const base = path.join(tmpDir, 'base.png')
  const same = path.join(tmpDir, 'same.png')
  const diff = path.join(tmpDir, 'diff.png')
  const out = path.join(tmpDir, 'out.png')

  beforeAll(() => {
    writeSolidPng(base, 10, 10, [255, 0, 0, 255])
    writeSolidPng(same, 10, 10, [255, 0, 0, 255])
    writeSolidPng(diff, 10, 10, [0, 255, 0, 255])
  })

  it('reports zero diff for identical images', () => {
    const result = compareImages(base, same, out)
    expect(result.compared).toBe(true)
    expect(result.diffPercent).toBe(0)
    expect(fs.existsSync(out)).toBe(true)
  })

  it('reports diff for different images', () => {
    const result = compareImages(base, diff, out)
    expect(result.compared).toBe(true)
    expect(result.diffPercent).toBeGreaterThan(0)
  })
})
