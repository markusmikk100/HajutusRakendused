const fs = require('fs');
const Papa = require('papaparse');
const express = require('express');
const app = express(); // Create an instance of the express app
app.use(express.json());

let data = [];

// Read and parse the CSV file asynchronously when the server starts
fs.readFile('LE.txt', 'utf8', (err, csvData) => {
    if (err) {
        console.error(err);
        return;
    }

    Papa.parse(csvData, {
        header: false, // Assuming no header row or inconsistent headers
        complete: function(results) {
            data = results.data;
            console.log('Data loaded into memory.');
        }
    });
});

// Handle the `/spare-parts` route
app.get('/spare-parts', (req, res) => {
    if (data.length === 0) {
        return res.status(500).json({ error: 'Data is still loading, please try again later.' });
    }

    let filteredData = data;

    // Apply filters based on query parameters
    const name = req.query.name;
    const sn = req.query.sn;
    if (name) {
        filteredData = filteredData.filter(row => row.includes(name));
    }
    if (sn) {
        filteredData = filteredData.filter(row => row.includes(sn));
    }

    // Apply sorting if sort parameter is provided
    const sort = req.query.sort;
    if (sort) {
        let ascending = true;
        let sortKey = parseInt(sort); // Assuming sort by column index
        if (sort.startsWith('-')) {
            ascending = false;
            sortKey = parseInt(sort.slice(1));
        }

        filteredData.sort((a, b) => {
            if (a[sortKey] < b[sortKey]) return ascending ? -1 : 1;
            if (a[sortKey] > b[sortKey]) return ascending ? 1 : -1;
            return 0;
        });
    }

    // Generate generic column names
    const numColumns = filteredData[0].length;
    const columnNames = Array.from({ length: numColumns }, (_, i) => `Column ${i + 1}`);

    // Transform data into a format with headers
    const transformedData = [
        columnNames, // Header row
        ...filteredData.map(row => row)
    ];

    // Pagination logic
    const page = parseInt(req.query.page) || 1;
    const perPage = 31; // Items per page
    const totalItems = transformedData.length - 1; // Subtract 1 for the header row
    const totalPages = Math.ceil(totalItems / perPage);

    if (page < 1 || page > totalPages) {
        return res.status(400).json({ error: 'Invalid page number' });
    }

    const start = (page - 1) * perPage + 1; // Start index of data (skip header)
    const end = start + perPage;

    const paginatedData = transformedData.slice(start, end);

    // Map data to objects with proper column names as keys
    const jsonData = paginatedData.map(row => {
        return row.reduce((acc, cell, index) => {
            acc[columnNames[index]] = cell;
            return acc;
        }, {});
    });

    res.json({
        data: jsonData,
        pagination: {
            currentPage: page,
            totalPages: totalPages,
            totalItems: totalItems,
            perPage: perPage
        }
    });
});

// Start the server
app.listen(3300, () => {
    console.log('Server is running on http://localhost:3300');
});
