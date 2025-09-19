import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Simple server running' });
});

app.get('/', (req, res) => {
    res.json({ message: 'Hello from Railway!' });
});

app.listen(PORT, () => {
    console.log(`Simple server running on port ${PORT}`);
});
