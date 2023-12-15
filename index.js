const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(express.json());
app.use(cors());

// MongoDB

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ufgx0zu.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // all collections
    const usersCollections = client.db("unityDB").collection("users");

    // users
    app.put("/api/auth/register/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      console.log(email, user);
      const query = { email: email };
      const options = { upsert: true };

      //   checking is user already exist
      const isExist = await usersCollections.findOne(query);

      // If the user is already created an account then return his previous data
      if (isExist) res.send(isExist);

      // if user is new then create a new data
      const result = await usersCollections.updateOne(
        query,
        {
          $set: { ...user, timeStamp: Date.now() },
        },
        options
      );
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// apis
app.get("/", (req, res) => {
  res.send("E-COMMERCE Marketplace's server is running ");
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
