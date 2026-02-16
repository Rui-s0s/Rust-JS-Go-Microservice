const express = require('express');
const app = express();
const port = 3000;

app.use((req, res, next) => {
    console.log(`Express received: ${req.method} ${req.url}`);
    next();
});

app.get('/admin', (req, res) => {
  res.json({ message: 'Textony Ferguson'})
});

app.get('/user', (req, res) => {
    res.json({ message: 'Userony Ferguson'})
})

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
})