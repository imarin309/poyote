import { describe, expect, it } from 'vitest'
import { createZip } from './createZip'

const LOCAL_HEADER_SIGNATURE = 0x04034b50
const END_OF_CENTRAL_DIR_SIGNATURE = 0x06054b50

async function toView(blob: Blob): Promise<DataView> {
  return new DataView(await blob.arrayBuffer())
}

// EOCDは末尾22バイト固定（コメントを書かないため）
function readEntryCount(view: DataView): number {
  const start = view.byteLength - 22
  expect(view.getUint32(start, true)).toBe(END_OF_CENTRAL_DIR_SIGNATURE)
  return view.getUint16(start + 10, true)
}

function readNames(bytes: Uint8Array): string[] {
  const decoder = new TextDecoder()
  const view = new DataView(bytes.buffer)
  const names: string[] = []
  let offset = 0

  while (view.getUint32(offset, true) === LOCAL_HEADER_SIGNATURE) {
    const size = view.getUint32(offset + 18, true)
    const nameLength = view.getUint16(offset + 26, true)
    const nameStart = offset + 30
    names.push(decoder.decode(bytes.slice(nameStart, nameStart + nameLength)))
    offset = nameStart + nameLength + size
  }

  return names
}

function entry(filename: string, content: string) {
  return { filename, blob: new Blob([content], { type: 'image/webp' }) }
}

describe('createZip', () => {
  it('読み込める形のZIPを作る', async () => {
    const zip = await createZip([entry('a.webp', 'hello')])
    const view = await toView(zip)

    expect(zip.type).toBe('application/zip')
    expect(view.getUint32(0, true)).toBe(LOCAL_HEADER_SIGNATURE)
    expect(readEntryCount(view)).toBe(1)
  })

  it('全件を格納する', async () => {
    const zip = await createZip([
      entry('a.webp', 'aaa'),
      entry('b.webp', 'bb'),
      entry('c.jpg', 'c'),
    ])
    const bytes = new Uint8Array(await zip.arrayBuffer())

    expect(readEntryCount(await toView(zip))).toBe(3)
    expect(readNames(bytes)).toEqual(['a.webp', 'b.webp', 'c.jpg'])
  })

  it('無圧縮なので中身はそのまま入る', async () => {
    const zip = await createZip([entry('a.webp', 'hello')])
    const bytes = new Uint8Array(await zip.arrayBuffer())
    const content = new TextDecoder().decode(bytes.slice(30 + 6, 30 + 6 + 5))

    expect(content).toBe('hello')
  })

  // 展開したときにどちらかが消えないようにする
  it('同名のファイルには連番を付ける', async () => {
    const zip = await createZip([
      entry('a.webp', '1'),
      entry('a.webp', '2'),
      entry('a.webp', '3'),
    ])
    const bytes = new Uint8Array(await zip.arrayBuffer())

    expect(readNames(bytes)).toEqual(['a.webp', 'a (2).webp', 'a (3).webp'])
  })

  // 日本語のファイル名はUTF-8のバイト数で長さを書く必要がある
  it('日本語のファイル名をそのまま保つ', async () => {
    const zip = await createZip([entry('写真.webp', 'x')])
    const bytes = new Uint8Array(await zip.arrayBuffer())

    expect(readNames(bytes)).toEqual(['写真.webp'])
  })

  it('1件も渡されなければ空のZIPを返す', async () => {
    const zip = await createZip([])

    expect(readEntryCount(await toView(zip))).toBe(0)
  })
})
