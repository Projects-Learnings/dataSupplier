const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors'); // Import the cors package
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
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
// Read the mock data
let data = JSON.parse(fs.readFileSync('db.json', 'utf8'));

// Helper function for full-text search
function fullTextSearch(items, searchTerm) {
    const search = searchTerm.toLowerCase();
    return items.filter(item =>
        JSON.stringify(item).toLowerCase().includes(search)
    );
}

// Helper function for filtering
function filterItems(items, query) {
    return items.filter(item => {
        return Object.keys(query).every(key => {
            if (key.startsWith('_')) return true; // Ignore special query params
            return String(item[key]).toLowerCase().includes(String(query[key]).toLowerCase());
        });
    });
}
// Helper function for sorting
function sortItems(items, sortBy, order) {
    return items.sort((a, b) => {
        if (a[sortBy] < b[sortBy]) return order === 'asc' ? -1 : 1;
        if (a[sortBy] > b[sortBy]) return order === 'asc' ? 1 : -1;
        return 0;
    });
}
// POST new item
app.post('/:resource', (req, res) => {
    // console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    const resource = req.params.resource;
    if (data[resource] || req.body.length>0) {
        const newItem = req.body;
        //console.log(newItem)

        // Generate new ID
        const maxId = Math.max(...data[resource].map(item => parseInt(item.id)), 0);
        newItem.id = (maxId + 1).toString();

        // Add new item to the resource
        data[resource].push(newItem);

        // Write updated data back to the file
        fs.writeFileSync('db.json', JSON.stringify(data, null, 2));

        res.status(201).json(newItem);
    } else {
        res.status(404).send('Resource not found');
    }
});
app.get('/:resource', (req, res) => {
    const resource = req.params.resource;
    if (data[resource]) {
        let result = data[resource];

        // Full-text search
        if (req.query.q) {
            result = fullTextSearch(result, req.query.q);
        }

        // Filtering (exclude 'q' from filtering)
        const filterQuery = {...req.query};
        delete filterQuery.q;
        delete filterQuery._page;
        delete filterQuery._limit;
        delete filterQuery.sort;
        delete filterQuery.order;
        result = filterItems(result, filterQuery);

        // Sorting
        if (req.query.sort) {
            const order = req.query.order || 'asc';
            result = sortItems(result, req.query.sort, order);
        }

        // Pagination
        const page = parseInt(req.query._page) || 1;
        const limit = parseInt(req.query._limit) || result.length;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const paginatedResult = result.slice(startIndex, endIndex);

        res.setHeader('X-Total-Count', result.length);
        res.json(paginatedResult);
    } else {
        res.status(404).send('Resource not found');
    }
});
// GET items with search, filter, sort, and pagination
// app.get('/:resource', (req, res) => {
//     const resource = req.params.resource;
//     if (data[resource]) {
//         let result = data[resource];
//
//         // Full-text search
//         if (req.query.q) {
//             result = fullTextSearch(result, req.query.q);
//
//         }
//
//         // Filtering
//         result = filterItems(result, req.query);
//
//         // Sorting
//         if (req.query.sort) {
//             const order = req.query.order || 'asc';
//             result = sortItems(result, req.query.sort, order);
//         }
//
//         // Pagination
//         const page = parseInt(req.query._page) || 1;
//         const limit = parseInt(req.query._limit) || result.length;
//         const startIndex = (page - 1) * limit;
//         const endIndex = page * limit;
//
//         const paginatedResult = result.slice(startIndex, endIndex);
//
//         res.setHeader('X-Total-Count', result.length);
//         res.json(paginatedResult);
//     } else {
//         res.status(404).send('Resource not found');
//     }
// });
// Add this new route before the existing GET '/:resource' route
app.get('/:resource/:id', (req, res) => {
    const resource = req.params.resource;

    const id = req.params.id;

    if (data[resource]) {
        const item = data[resource].find(item => item.id === id);

        console.log(item);
        if (item) {
            res.json(item);
        } else {
            res.status(404).send('Item not found');
        }
    } else {
        res.status(404).send('Resource not found');
    }
});

// Other CRUD operations (POST, PUT, DELETE) remain the same as in the previous version

// Custom route example
app.get('/posts/:id/comments', (req, res) => {
    const postId = parseInt(req.params.id);
    const comments = data.comments.filter(comment => comment.postId === postId);
    res.json(comments);
});

app.listen(port, () => {
    console.log(`Mock API server running at http://localhost:${port}`);
});