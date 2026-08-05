const express = require('express');
const path = require('path');
const apiApp = require('./api/index');

const app = express();
const PORT = process.env.PORT || 3001;

// Mount API routes
app.use(apiApp);

// Serve static frontend files from public/
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║   Pantauan Harga Pasar - Local Server            ║
║   Server running on http://localhost:${PORT}        ║
╚══════════════════════════════════════════════════╝
    `);
});
