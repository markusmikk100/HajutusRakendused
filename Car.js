const fs = require('fs');
const Papa = require('papaparse');
const express = require('express');
const app = express();
app.use(express.json());

const columnNames = [
    "Part Number", "Part Name", "Quantity", "Price", "Discount", 
    "Tax", "Additional Info", "Part Category", "Price (Local Currency)", 
    "Brand", "Weight"
];

let data = [];
//    read    path    decoder  error  CSV          need utf 8 for encoding and use of special characters, also makes papa work correctly
fs.readFile('LE.txt', 'utf8', (err, csvData) => {
    if (err) return console.error(err); // this runs if error
    Papa.parse(csvData, { header: false, complete: results => data = results.data });  // papa changes CSV to json
});   


// App gets
app.get('/spare-parts', (req, res) => {
    const { name, sn, sort, page = 1 } = req.query;
    let filteredData = data;

    //Filtering
    if (name) filteredData = filteredData.filter(row => row.includes(name));
    if (sn) filteredData = filteredData.filter(row => row.includes(sn));
    if (sort) {
        const ascending = !sort.startsWith('-');
        const sortKey = parseInt(sort.replace('-', ''));
        filteredData.sort((a, b) => ascending ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey]);
    }

    // Pages
    const perPage = 30;
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / perPage);

    const paginatedData = filteredData.slice((page - 1) * perPage, page * perPage);

    // ?  ??? ?
    const jsonData = paginatedData.map(row => row.reduce((acc, cell, idx) => {
        acc[columnNames[idx]] = cell;
        return acc;
    }, {}));

    res.json({
        data: jsonData,
        pagination: { currentPage: page, totalPages, totalItems, perPage }
    });
});

// Server wrooom
app.listen(3300, () => console.log('Server running on http://localhost:3300'));
