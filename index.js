require('dotenv').config()
const express = require('express');
const cors = require('cors');
const app = express()
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000

app.use(express.json())
app.use(cors())

// MONGODB CONFIG
const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.en41ppq.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  async function run() {
    try {

    //   await client.connect();
        const database = client.db('PlatePals')
        const teams = database.collection('teams')
        const foods = database.collection('foods')

    // GET Team DATA
    app.get('/api/teams', async (req, res) => {
        try{
            const cursor = teams.find();
            const result = await cursor.toArray();
            res.send(result);
        }
        catch(err){
            console.log(err);
        }
    })
    // insert Foods in database
    app.post('/api/foods', async (req, res) => {
        const food = req.body;
        const result = await foods.insertOne(food);
        res.send(result)
    })


      // Send a ping to confirm a successful connection
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
      // Ensures that the client will close when you finish/error
    //   await client.close();
    }
  }
  run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Welcome to PlatePals DATABASE')
})

app.listen(port, () =>{
    console.log(`you are listening on ${port}`);
})