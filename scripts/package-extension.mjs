import archiver from 'archiver';
import { createWriteStream } from 'node:fs';
import { copyFile, mkdir, readFile } from 'node:fs/promises';

await mkdir('site/public/downloads', { recursive: true });
const { version } = JSON.parse(await readFile('package.json', 'utf8'));
const versionedArchive = `site/public/downloads/tab-context-capsule-${version}.zip`;
await new Promise((resolve, reject) => {
  const output = createWriteStream(versionedArchive);
  const archive = archiver('zip', { zlib: { level: 9 } });
  output.on('close', resolve);
  output.on('error', reject);
  archive.on('error', reject);
  archive.pipe(output);
  archive.glob('**/*', { cwd: 'dist/extension' }, { date: new Date('1980-01-01T00:00:00Z') });
  void archive.finalize();
});
// Keep the original URL working for existing links while the release page uses
// the immutable, versioned artifact.
await copyFile(versionedArchive, 'site/public/downloads/tab-context-capsule.zip');
