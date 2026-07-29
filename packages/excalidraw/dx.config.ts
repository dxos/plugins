//
// Copyright 2026 DXOS.org
//

import { Config2 } from '@dxos/app-framework/config';

export default Config2.make({
  plugin: {
    key: 'org.dxos.plugin.excalidraw',
    name: 'Excalidraw',
    description:
      'Professional diagramming powered by Excalidraw for creating hand-drawn style illustrations.\nBuild flowcharts, wireframes, and technical diagrams with a rich set of shapes and styling options.',
    icon: { key: 'ph--compass-tool--regular', hue: 'indigo' },
    source: 'https://github.com/dxos/plugin-excalidraw',
    tags: ['labs'],
    screenshots: [{ dark: 'https://dxos.network/plugin-details-excalidraw-dark.png' }],
  },
  publish: {
    buildCommand: 'vite build',
    outputDirectory: 'out',
  },
});
