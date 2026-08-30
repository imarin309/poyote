// 変換結果を1件ずつダウンロードすると、ブラウザの「複数ファイルの自動
// ダウンロード」制限に引っかかって2件目以降が黙って落とされる。
// ダウンロードを1回で済ませるため、全件をZIPにまとめる。
// webp/jpegは既に圧縮済みなので、無圧縮(store)で十分。

const LOCAL_HEADER_SIGNATURE = 0x04034b50
const CENTRAL_HEADER_SIGNATURE = 0x02014b50
const END_OF_CENTRAL_DIR_SIGNATURE = 0x06054b50
const STORED = 0
// bit11。ファイル名をUTF-8として読ませる
const UTF8_FLAG = 0x0800
const VERSION_NEEDED = 20
const LOCAL_HEADER_SIZE = 30
const CENTRAL_HEADER_SIZE = 46
const END_OF_CENTRAL_DIR_SIZE = 22
const ZIP_MIME = 'application/zip'

export interface ZipEntry {
  filename: string
  blob: Blob
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)

  for (let index = 0; index < 256; index += 1) {
    let value = index
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    }
    table[index] = value >>> 0
  }

  return table
})()

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff

  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }

  return (crc ^ 0xffffffff) >>> 0
}

// ZIPの日時はMS-DOS形式（2秒刻み、1980年起点）で持つ
function toDosTime(date: Date): { time: number; date: number } {
  return {
    time:
      (date.getHours() << 11) |
      (date.getMinutes() << 5) |
      (Math.floor(date.getSeconds() / 2) & 0x1f),
    date:
      ((Math.max(date.getFullYear() - 1980, 0) & 0x7f) << 9) |
      ((date.getMonth() + 1) << 5) |
      date.getDate(),
  }
}

// 同名のまま入れると展開時にどちらかが消えるので、2件目以降に連番を付ける
function deduplicate(filenames: string[]): string[] {
  const used = new Set<string>()

  return filenames.map((filename) => {
    if (!used.has(filename)) {
      used.add(filename)
      return filename
    }

    const dotIndex = filename.lastIndexOf('.')
    const base = dotIndex > 0 ? filename.slice(0, dotIndex) : filename
    const extension = dotIndex > 0 ? filename.slice(dotIndex) : ''

    let counter = 2
    let candidate = `${base} (${counter})${extension}`
    while (used.has(candidate)) {
      counter += 1
      candidate = `${base} (${counter})${extension}`
    }

    used.add(candidate)
    return candidate
  })
}

export async function createZip(
  entries: ZipEntry[],
  now: Date = new Date(),
): Promise<Blob> {
  const filenames = deduplicate(entries.map((entry) => entry.filename))
  const encoder = new TextEncoder()
  const dosTime = toDosTime(now)

  const files = await Promise.all(
    entries.map(async (entry, index) => {
      const content = new Uint8Array(await entry.blob.arrayBuffer())
      return {
        name: encoder.encode(filenames[index]),
        content,
        crc: crc32(content),
      }
    }),
  )

  const centralSize = files.reduce(
    (total, file) => total + CENTRAL_HEADER_SIZE + file.name.length,
    0,
  )
  const localSize = files.reduce(
    (total, file) =>
      total + LOCAL_HEADER_SIZE + file.name.length + file.content.length,
    0,
  )

  const buffer = new Uint8Array(
    localSize + centralSize + END_OF_CENTRAL_DIR_SIZE,
  )
  const view = new DataView(buffer.buffer)
  let offset = 0

  const writeUint16 = (value: number) => {
    view.setUint16(offset, value, true)
    offset += 2
  }
  const writeUint32 = (value: number) => {
    view.setUint32(offset, value, true)
    offset += 4
  }
  const writeBytes = (bytes: Uint8Array) => {
    buffer.set(bytes, offset)
    offset += bytes.length
  }

  const localOffsets: number[] = []

  for (const file of files) {
    localOffsets.push(offset)
    writeUint32(LOCAL_HEADER_SIGNATURE)
    writeUint16(VERSION_NEEDED)
    writeUint16(UTF8_FLAG)
    writeUint16(STORED)
    writeUint16(dosTime.time)
    writeUint16(dosTime.date)
    writeUint32(file.crc)
    // 無圧縮なので圧縮前後のサイズは同じ
    writeUint32(file.content.length)
    writeUint32(file.content.length)
    writeUint16(file.name.length)
    // extra field は使わない
    writeUint16(0)
    writeBytes(file.name)
    writeBytes(file.content)
  }

  const centralStart = offset

  for (const [index, file] of files.entries()) {
    writeUint32(CENTRAL_HEADER_SIGNATURE)
    // version made by
    writeUint16(VERSION_NEEDED)
    writeUint16(VERSION_NEEDED)
    writeUint16(UTF8_FLAG)
    writeUint16(STORED)
    writeUint16(dosTime.time)
    writeUint16(dosTime.date)
    writeUint32(file.crc)
    writeUint32(file.content.length)
    writeUint32(file.content.length)
    writeUint16(file.name.length)
    // extra field / file comment
    writeUint16(0)
    writeUint16(0)
    // disk number / internal attributes / external attributes
    writeUint16(0)
    writeUint16(0)
    writeUint32(0)
    writeUint32(localOffsets[index])
    writeBytes(file.name)
  }

  writeUint32(END_OF_CENTRAL_DIR_SIGNATURE)
  // disk number / central directory の開始ディスク
  writeUint16(0)
  writeUint16(0)
  writeUint16(files.length)
  writeUint16(files.length)
  writeUint32(centralSize)
  writeUint32(centralStart)
  // zip file comment
  writeUint16(0)

  return new Blob([buffer], { type: ZIP_MIME })
}
