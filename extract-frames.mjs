import { execFileSync } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';

const VIDEO   = './product/Smart Watch Dissection.mp4';
const OUT_DIR = './product/frames';

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
fs.readdirSync(OUT_DIR).forEach(f => fs.unlinkSync(path.join(OUT_DIR, f)));

console.log('Extracting frames as JPEG...');
execFileSync(ffmpegPath, [
  '-y',
  '-i', VIDEO,
  '-vsync', '0',
  '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black',
  '-f', 'image2',
  '-vcodec', 'mjpeg',
  '-q:v', '3',
  path.join(OUT_DIR, 'frame_%04d.jpg'),
], { stdio: 'inherit' });

const saved = fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.jpg')).length;
console.log(`\n✓ ${saved} frames saved to ${OUT_DIR}`);
