import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  outDir: 'dist',
  outDirTemplate: 'extension',
  manifest: {
    name: 'Tab Context Capsule',
    description: 'Seal selected tabs with their meaning, next step, and a portable handoff.',
    version: '1.0.0',
    permissions: ['tabs', 'storage'],
    incognito: 'split',
    action: { default_title: 'Open Tab Context Capsule' },
    icons: {
      16: 'icon-16.png',
      32: 'icon-32.png',
      48: 'icon-48.png',
      128: 'icon-128.png'
    }
  }
});
