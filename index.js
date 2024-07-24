const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors'); // Import the cors package
const app = express();
const port = 3040;

// Function to read data from data.json file
async function readData() {
    try {
        const data = await fs.readFile(path.join(__dirname, 'data.json'), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading data:', error);
        return { articles: [] };
    }
}

// Use the cors middleware with specific configuration
app.use(cors({
    origin: function (origin, callback) {
        // Check if the origin is allowed
        // For production, you should validate the origin against a whitelist
        callback(null, origin);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true // Enable to allow cookies to be sent with the request
}));
// Endpoint to list all articles
app.get('/articles', async (req, res) => {
    const data = await readData();
    const { author } = req.query;

    if (author) {
        const filteredArticles = data.articles.filter(article => article.author === author);
        res.json({ articles: filteredArticles });
    } else {
        res.json(data);
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});