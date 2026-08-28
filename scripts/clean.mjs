import { rmSync } from 'node:fs';
rmSync('dist', { recursive: true, force: true });
rmSync('.output', { recursive: true, force: true });
