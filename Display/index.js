const express = require('express');
const path = require('path');
const app = express().use(express.static(path.join(__dirname, '/public')));
app.listen(6600, ()=>console.log("Listening"));