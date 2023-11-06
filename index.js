require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'https://plate-pals-e55ac.web.app', 'https://plate-pals-e55ac.firebaseapp.com'],
  credentials: true,
}));
app.use(cookieParser())

// MONGODB CONFIG
const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.en41ppq.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});


// JWT VERIFY
const verify = (req, res, next) => {
  const token = req?.cookies.token;
  if(!token){
    return res.status(401).send({message: 'Not authorized'})
  }

  jwt.verify(token, process.env.SECRET_TOKEN, (err, decoded) => {
    if(err) {
      return res.status(401).send({message: 'Not authorized'})
    }
    req.user = decoded
    next();
  })
}
async function run() {
  try {
    //   await client.connect();
    const database = client.db("PlatePals");
    const teams = database.collection("teams");
    const foods = database.collection("foods");

    // JWT Authorization
    app.post('/jwt', async (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.SECRET_TOKEN, {
        expiresIn : '1h',
      })
      res.cookie('token', token,{
        httpOnly:true,
        secure:  true,
        sameSite: "none",
      }).send({status: true})
    })

    app.post('/login', async(req, res) => {
      const user = req.body;
      res.clearCookie('token', {maxAge: 0}.send({status: true}))
    })

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
        const query = { food_status: {$in: ['available', "pending"]} };
        const option = {
          sort: { food_quantity: -1 },
        };
        const result = await foods.find(query, option).toArray();
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });
    // get single food from database
    app.get("/api/food/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await foods.findOne(query);
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });
    // get foods by donator email
    app.get("/api/myFood",verify, async (req, res) => {
      try {
        if(req.user.email !== req.query.email) {
          return res.status(403).send({message: 'not authorized'});
        }
        let query = {}
        const email = req.query?.email
        if(email) {
          query = { donator_email : email };
        }
        const result = await foods.find(query).toArray();
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });
    // filterBY date of food short
    app.get("/api/foodsExpireDataShort", async (req, res) => {
      try {
        const query = { food_status: {$in: ['available', "pending"]} };
        const result = await foods
          .find(query)
          .sort({ food_expire: 1 })
          .toArray();
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });
    // filterBY date of food long
    app.get("/api/foodsExpireDataLong", async (req, res) => {
      try {
        const query = { food_status: {$in: ['available', "pending"]} };
        const result = await foods
          .find(query)
          .sort({ food_expire: -1 })
          .toArray();
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });
    // get food by search
    app.get("/api/foods", async (req, res) => {
      let query = {};
      if (req.query?.name) {
        query = { food_name: { $regex: new RegExp(req.query.name, "i") } };
      }
      const result = await foods.find(query).toArray();
      res.send(result);
    });
    // get user requests
    app.get('/api/myRequest',verify, async (req, res) => {
      if(req.user.email !== req.query.email) {
        return res.status(403).send({message: 'not authorized'});
      }
      let query = {}
      const email = req.query?.email
      if(email) {
        query = {requester_email : email}
      }
      const result = await foods.find(query).toArray()
      res.send(result);
    })

    // get food by id for donator 
     app.get("/api/pendingFoods/:id", async (req, res) => {
      try {
        const id = req.params.id
        const query = { _id : new ObjectId(id) };
        const result = await foods.findOne(query)
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });

    // insert Foods in database
    app.post("/api/foods", async (req, res) => {
      try {
        const food = req.body;
        const data = {
          food_name: food.food_name,
          food_image: food.food_image,
          food_quantity: parseInt(food.food_quantity),
          food_location: food.food_location,
          food_expire: food.food_expire,
          food_note: food.food_note,
          food_status: food.food_status,
          donator_email: food.donator_email,
          donator_name: food.donator_name,
          donator_image: food.donator_image,
        };
        const result = await foods.insertOne(data);
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });
    // update food
    app.put("/api/myFood/:id", async (req, res) => {
      try {
        const food = req.body;
        const id = req.params.id;
        const filter = { _id : new ObjectId(id) };
        const update = {
          $set: {
            food_name: food.food_name,
            food_image: food.food_image,
            food_quantity: parseInt(food.food_quantity),
            food_location: food.food_location,
            food_expire: food.food_expire,
            food_note: food.food_note,
          },
        };
        const result = await foods.updateOne(filter, update);
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });

    // request for food
    app.patch("/api/request/:id", async (req, res) => {
     try{
      const food = req.body;
      const id = req.params.id;
      const filter = { _id : new ObjectId(id) };
      const option = {upsert: true };
      const update = {
          $set : {
            food_status: food.food_status,
            requester_note: food.requester_note,
            request_date: food.request_date,
            requester_email: food.requester_email,
            requester_image: food.requester_image,
            requester_name: food.requester_name,
            money: parseInt(food.money)

          }
      }
      const result = await foods.updateOne(filter,update,option);
      res.send(result);
     }catch(err){
      console.log(err);
     }
    });
    // request cancel for food
    app.patch("/api/request/:id", async (req, res) => {
     try{
      const food = req.body;
      const id = req.params.id;
      const filter = { _id : new ObjectId(id) };
      const option = {upsert: true };
      const update = {
          $set : {
            food_status: food.food_status,
            request_date: food.request_date,
            requester_email: food.requester_email,
            requester_image: food.requester_image,
            requester_name: food.requester_name,
            money: food.money
          }
      }
      const result = await foods.updateOne(filter,update,option);
      res.send(result);
     }catch(err){
      console.log(err);
     }
    });
    // delivery for food donate
    app.patch("/api/delivery/:id", async (req, res) => {
     try{
      const food = req.body;
      const id = req.params.id;
      const filter = { _id : new ObjectId(id) };
      const option = {upsert: true };
      const update = {
          $set : {
            food_status: food.food_status,
          }
      }
      const result = await foods.updateOne(filter,update,option);
      res.send(result);
     }catch(err){
      console.log(err);
     }
    });

    // delete food
    app.delete("/api/myFood/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foods.deleteOne(query);
      res.send(result);
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
