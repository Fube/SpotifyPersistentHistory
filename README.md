# Spotify Persistent History
## Because Spotify doesn't offer an easy way to see your song history


### ⚠️ Do not use this ⚠️
This program is very poorly made <br>
At the time of writing this, I had no idea what the hell I was doing <br>
This is possibly the worst way to have implemented this application <br>
Spotify stores your history beyond 50 songs, it's just paginated <br>
Stupid me did not realize this at the time

### How it works
Spotify actually keeps a list of the last 50 songs you listened. Anything you listened to for 30+ seconds is added to this list<br>
So every 30\*50 seconds it retrieves your history and adds it to a database (MongoDB)<br>
It then retrieves those records and displays them to you in your browser<br>
Note that it deletes records that are 3 months of age (or older)

### Requirments
This is made by a dev for devs. It is not made to be average user friendly. <br>
You will need:

- A MongoDB (local or not, I used the free tier of [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- A Spotify dev account

### Environment Set Up
Make a .env file and add the following fields:

| Field Name     | What it is                        |
|--------------|------------------------------|
| DB_UNAME  	 | Your MongoDB username             |
| DB_PASS		 | Your MongoDB password             |
| CLIENT_ID	     | Your Spotify dev account's ID     |
| CLIENT_SECRET  | Your Spotify dev account's secret |

### Scripts
Go to the root folder and run:

- `npm run n` (this starts the back end which will make the API calls)
- `npm run m` (this starts up the GUI)

### Usage
Head to [https://localhost:8888](https://localhost:8888)
<br>IMPORTANT: make sure it is https<br>
Click the big green button<br>
It should then redirect you to the page that displays your song history (if the page is empty / blank, just reload it)

### What it looks like
![GUI Example](./example.png)
