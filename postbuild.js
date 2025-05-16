var fs = require('fs');

if (!fs.existsSync('dist/generated')) {
    fs.mkdirSync('dist/generated', { recursive: true });
}

fs.cpSync('generated', 'dist/generated', {
    recursive: true,
});