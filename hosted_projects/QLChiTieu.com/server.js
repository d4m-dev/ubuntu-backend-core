#!/usr/bin/env node

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the src directory
app.use(express.static('./src'));

// Handle all routes by sending the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`QLChiTieu.com đang chạy tại http://localhost:${PORT}`);
  console.log('Ấn Ctrl+C để dừng server');
});