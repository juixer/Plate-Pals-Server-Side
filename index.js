require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

// MONGODB CONFIG
const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.en41ppq.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    //   await client.connect();
    const database = client.db("PlatePals");
    const teams = database.collection("teams");
    const foods = database.collection("foods");

    // GET Team DATA
    app.get("/api/teams", async (req, res) => {
      try {
        const cursor = teams.find();
        const result = await cursor.toArray();
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });
    // available food from database
    app.get("/api/availableFoods", async (req, res) => {
      try {
        const query = { food_status: "available" };
        const option = {
          sort: { food_quantity: -1 },
        };
        const result = await foods.find(query, option).toArray();
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });
    // filterBY date of food short
    app.get('/api/foodsExpireDataShort', async (req , res) => {
        try{
            const query = { food_status: "available" }
            const result = await foods.find(query).sort({food_expire: 1}).toArray();
            res.send(result);
        }catch(err){
            console.log(err);
        }
    })
    // filterBY date of food long
    app.get('/api/foodsExpireDataLong', async (req , res) => {
        try{
            const query = { food_status: "available" }
            const result = await foods.find(query).sort({food_expire: -1}).toArray();
            res.send(result);
        }catch(err){
            console.log(err);
        }
    })
    // get food by search
    app.get('/api/foods', async (req, res) => {
        let query = {};
        if(req.query?.name){
            query= {food_name : req.query.name}
        }
        const result = await foods.find(query).toArray();
        res.send(result)
    })

    // insert Foods in database
    app.post("/api/foods", async (req, res) => {
      try {
        const food = req.body;
        const data = {
            food_name : food.food_name,
            food_image : food.food_image,
            food_quantity : parseInt(food.food_quantity),
            food_location : food.food_location,
            food_expire : food.food_expire,
            food_note : food.food_note,
            food_status : food.food_status,
            donator_email : food.donator_email,
            donator_name : food.donator_name,
            donator_image : food.donator_image,
        }
        const result = await foods.insertOne(data);
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    //   await client.close();
  }
}
run().catch(console.dir);


app.get("/", (req, res) => {
  res.send("Welcome to PlatePals DATABASE");
});

app.listen(port, () => {
  console.log(`you are listening on ${port}`);
});
