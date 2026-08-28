import archiver from 'archiver';
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';

await mkdir('site/public/downloads', { recursive: true });
await new Promise((resolve, reject) => {
  const output = createWriteStream('site/public/downloads/tab-context-capsule.zip');
  const archive = archiver('zip', { zlib: { level: 9 } });
  output.on('close', resolve);
  output.on('error', reject);
  archive.on('error', reject);
  archive.pipe(output);
  archive.glob('**/*', { cwd: 'dist/extension' }, { date: new Date('1980-01-01T00:00:00Z') });
  void archive.finalize();
});
