const express = require('express');
const app = express();
app.use(express.static(__dirname + '/public'));

app.get('/history', (req,res) =>{
    res.send("soo guys, we did it");
});

app.listen(5500, ()=>console.log("Listening"));