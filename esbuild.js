// build.js
require('esbuild').build({
    entryPoints: ['./src/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile: 'dist/index.js',
    sourcemap: true,
    external: [],
}).catch(() => process.exit(1));

var fs = require('fs');

if (!fs.existsSync('dist/static/logo.svg')) {
    fs.mkdirSync('dist/static', { recursive: true });
    fs.copyFileSync('logo.svg', 'dist/static/logo.svg');
}
