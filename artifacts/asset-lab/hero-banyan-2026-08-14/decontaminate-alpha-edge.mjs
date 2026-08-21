import sharp from 'sharp'

const [input, output] = process.argv.slice(2)

if (!input || !output) {
  throw new Error('Usage: node scripts/decontaminate-alpha-edge.mjs <input.png> <output.png>')
}

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const result = Buffer.from(data)
const { width, height, channels } = info

function pixelOffset(x, y) {
  return (y * width + x) * channels
}

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const offset = pixelOffset(x, y)
    const alpha = data[offset + 3]
    if (alpha === 0 || alpha === 255) continue

    let count = 0
    let red = 0
    let green = 0
    let blue = 0

    // Opaque neighbours represent the sprite's real edge colour, not the generated matte.
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue
        const neighborX = x + dx
        const neighborY = y + dy
        if (neighborX < 0 || neighborX >= width || neighborY < 0 || neighborY >= height) continue
        const neighborOffset = pixelOffset(neighborX, neighborY)
        if (data[neighborOffset + 3] < 245) continue
        red += data[neighborOffset]
        green += data[neighborOffset + 1]
        blue += data[neighborOffset + 2]
        count++
      }
    }

    if (count === 0) continue
    const expected = [red / count, green / count, blue / count]
    const distance = Math.hypot(
      data[offset] - expected[0],
      data[offset + 1] - expected[1],
      data[offset + 2] - expected[2],
    )

    // Only replace obvious matte contamination; preserve intentional leaf highlights.
    if (distance > 105) {
      result[offset] = Math.round(expected[0])
      result[offset + 1] = Math.round(expected[1])
      result[offset + 2] = Math.round(expected[2])
    }
  }
}

await sharp(result, { raw: { width, height, channels } })
  .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(output)
