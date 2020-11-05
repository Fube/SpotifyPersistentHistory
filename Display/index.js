const MongoClient =  require('mongodb').MongoClient;
const express = require('express');
const path = require('path');
const dotenv = require('dotenv').config();

console.log(process.env.DB_UNAME, process.env.DB_PASS);
const uri = `mongodb+srv://fube:${process.env.DB_PASS}@spotifypersistenthistor.civb3.mongodb.net/${process.env.DB_UNAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useUnifiedTopology: true });
client.connect();

const app = express().use(express.static(path.join(__dirname, '/public')));


app.get('/history', async (req,res) =>{

    with(client){

        const collection = await db('spotify').collection('songs');
        const array = (await (await collection.find()).toArray());
        res.send(array);

    }
});

app.listen(80, ()=>console.log("Listening"));