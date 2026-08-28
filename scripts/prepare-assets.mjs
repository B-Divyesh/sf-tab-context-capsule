import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

await mkdir('public', { recursive: true });
await mkdir('site/public/assets', { recursive: true });
await mkdir('site/public/downloads', { recursive: true });

for (const size of [16, 32, 48, 128]) {
  await sharp('assets/src/icon.svg').resize(size, size).png().toFile(`public/icon-${size}.png`);
}

await sharp('assets/src/hero-poster.png')
  .resize({ width: 640, withoutEnlargement: true })
  .webp({ quality: 78 })
  .toFile('site/public/assets/hero-poster-640.webp');
await sharp('assets/src/hero-poster.png')
  .resize({ width: 1024, withoutEnlargement: true })
  .webp({ quality: 82 })
  .toFile('site/public/assets/hero-poster-1024.webp');
await sharp('assets/src/hero-poster.png')
  .resize({ width: 640, withoutEnlargement: true })
  .avif({ quality: 55 })
  .toFile('site/public/assets/hero-poster-640.avif');
await sharp('assets/src/hero-poster.png')
  .resize({ width: 1024, withoutEnlargement: true })
  .avif({ quality: 58 })
  .toFile('site/public/assets/hero-poster-1024.avif');
