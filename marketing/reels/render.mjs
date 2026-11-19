// Renders motion-graphics reels (HTML scenes) to 1080x1920 30fps H.264 MP4 + cover PNG.
// Usage: node marketing/reels/render.mjs [reel1-word reel2-bulk ...]   (default: all reel*.html)
import { chromium } from '@playwright/test'
import ffmpegPath from 'ffmpeg-static'
import { spawn } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { pathToFileURL } from 'node:url'

const DIR = resolve('marketing/reels')
const FPS = 30
const names = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(DIR).filter((f) => /^reel.*\.html$/.test(f)).map((f) => f.replace('.html', ''))
const COVER_T = { 'reel1-word': 1.6, 'reel2-bulk': 1.8, 'reel3-templates': 7, 'reel4-private': 1.8, 'reel5-tax': 1.8 }

const browser = await chromium.launch()
try {
  for (const name of names) {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })
    await page.goto(pathToFileURL(join(DIR, `${name}.html`)).href)
    await page.evaluate(() => document.fonts.ready)
    await page.waitForFunction(() => [...document.images].every((i) => i.complete))
    const dur = await page.evaluate(() => window.DURATION)
    const frames = Math.round(dur * FPS)
    const out = join(DIR, 'out', `${name}.mp4`)
    const ff = spawn(ffmpegPath, [
      '-y', '-loglevel', 'error',
      '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo',
      '-shortest', '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium',
      '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', out,
    ], { stdio: ['pipe', 'inherit', 'inherit'] })
    const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`)))))
    const t0 = Date.now()
    for (let i = 0; i < frames; i++) {
      await page.evaluate((t) => window.renderFrame(t), i / FPS)
      const buf = await page.screenshot({ type: 'jpeg', quality: 93 })
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r))
    }
    ff.stdin.end()
    await done
    await page.evaluate((t) => window.renderFrame(t), COVER_T[name] ?? 2)
    await page.screenshot({ path: join(DIR, 'out', `${name}-cover.png`) })
    console.log(`${name}: ${frames} frames, ${dur}s → ${out} (${((Date.now() - t0) / 1000).toFixed(0)}s)`)
    await page.close()
  }
} finally {
  await browser.close()
}
