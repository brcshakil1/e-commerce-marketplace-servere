const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
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
    // users
    const usersCollection = client.db("unityDB").collection("users");
    // catalog's collection
    const catalogsCollection = client.db("unityDB").collection("catalogs");

    // auth related api
    // login
    app.post("/api/auth/login", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET_KEY, { expiresIn: "1h" });
      console.log("token is -----> ", token);
      res.send({ token });
    });

    // users
    app.put("/api/auth/register", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const options = { upsert: true };

      //   checking is user already exist
      const isExist = await usersCollection.findOne(query);

      // If the user is already created an account then return his previous data
      if (isExist) return res.send(isExist);

      // if user is new then create a new data
      const result = await usersCollection.updateOne(
        query,
        {
          $set: { ...user, timeStamp: Date.now() },
        },
        options
      );
      res.send(result);
    });

    // APIs for buyer
    app.get("/api/buyer/list-of-sellers", async (req, res) => {
      const query = { typeOfUser: "seller" };
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    // app.get("/api/buyer/seller-catalog/:seller_id", async(req, res)=)

    // APIs for sellers
    app.post("/api/seller/create-catalog", async (req, res) => {
      const sellerId = req.body.sellerId;
      const sellerCatalog = await catalogsCollection.findOne({ sellerId });
      if (!sellerCatalog) {
        const newCatalog = {
          sellerId,
          catalog: req.body.catalog,
          items: req.body.items || [],
        };
        const result = await catalogsCollection.insertOne(newCatalog);
        res
          .status(201)
          .send({ message: "Successfully created catalog", data: result });
      } else {
        const sellerCatalog = await catalogsCollection.findOne({ sellerId });
        const existingItems = sellerCatalog.items.map((item) => item.name);
        console.log(existingItems);
        const newItems = req.body?.items?.filter(
          (item) => !existingItems?.includes(item.name)
        );

        if (newItems.length > 0) {
          const updateCatalog = {
            $push: { items: { $each: newItems || [] } },
          };
          await catalogsCollection.updateOne({ sellerId }, updateCatalog);
          res
            .status(201)
            .send({ message: "Successfully inserted new items on catalog" });
        } else {
          res.status(400).send({ message: "All items already exist" });
        }
      }
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
