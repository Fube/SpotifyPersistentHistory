const MongoClient = require('mongodb').MongoClient;
const dotenv = require('dotenv').config();
const path = require('path');
const request = require('request');
const express = require('express');
const https = require('https');
const cors = require('cors');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const fs = require('fs');

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const PORT = process.env.PORT || '8888';
const redirect_uri = `https://localhost:${PORT}/callback`;
const stateKey = 'spotify_auth_state';
const TIMEOUT = 30*49;
const uri = `mongodb+srv://${process.env.DB_UNAME}:${process.env.DB_PASS}@spotifypersistenthistory-civb3.mongodb.net/test?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useUnifiedTopology: true });

client.connect();
const app = express();

/**
 * 
 * @param {*[]} songs 
 */
function ship(songs){
  if(songs.length)
    client.db('spotify').collection('songs').insertMany(songs)
}

function generateRandomString(length) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

function deleteOldRecords(){
  client.db('spotify').collection('songs').deleteMany({ "played_at": { $lt: new Date(new Date().setMonth(new Date().getMonth() - 3)).toString() } })
}

//Renews the access token using the refresh token
function renew(){
    // requesting access token from refresh token
    const authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
      form: {
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      },
      json: true
    };
    request.post(authOptions, function(error, response, body){

      if(!error && response.statusCode === 200){
        access_token = body.access_token;
      }else{
        console.log(error, response.statusCode);
      }
    });
}

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

app.get('/login', function(req, res) {

    const state = generateRandomString(16);
    res.cookie(stateKey, state);
  
    // your application requests authorization
    const scope = 'user-read-recently-played';
    res.redirect('https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
    }));
    deleteOldRecords();
});


app.get('/callback', async function(req, res) {

  function getOptions(){
      return {
        url: 'https://api.spotify.com/v1/me/player/recently-played?limit=50',
        headers: { 'Authorization': 'Bearer ' + access_token },
        json: true
    };
  }

  function foo(){
      request.get(getOptions(), async function(error, response, body) {

          const pats = [];
          const toAdd = [];
          for(let { played_at, track } of body.items){


            const { name, artists, album : { images } , external_urls : { spotify: url } } = track;

            const obj = {
              played_at,
              name,
              artists: artists.map(n => n.name),
              image_url: images[2].url,
              url
            };

            pats.push(played_at);

            toAdd.push(obj);
          }

          const collection = client.db("spotify").collection("songs");

          const toAvoid =  (await collection
                              .find( { played_at: { $in : pats } } )
                              .project({ _id: 0 })
                              .toArray())
                              .map(n => n.played_at);
          ship(toAdd.filter(song => !toAvoid.includes(song.played_at)));
      });
  
  
  }
  
  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  }else {
    res.clearCookie(stateKey);
    const authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code,
        redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        access_token = body.access_token;
        refresh_token = body.refresh_token;

        foo();
        renew();

        setInterval(foo, 1000 * TIMEOUT);
        setInterval(renew, 1000 * TIMEOUT / 2);
      }
    });
    res.redirect('http://localhost:6600')
  }
});

app.get('/history', async (req,res) =>{

  with(client){

      const collection = await db('spotify').collection('songs');
      const array = (await (await collection.find()).toArray());
      res.send(array);

  }
});

console.log(`Listening on ${PORT}`);
const options = {
  key: fs.readFileSync(`${__dirname}/server.key`),
  cert: fs.readFileSync(`${__dirname}/server.cert`)
};
const serv = https.createServer(options, app);
serv.listen(PORT, () => {});