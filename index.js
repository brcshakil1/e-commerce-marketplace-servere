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
    const ordersCollection = client.db("unityDB").collection("orders");

    // auth related api
    // login
    app.post("/api/auth/login", async (req, res) => {
      // get logged in user email
      const user = req.body;
      // create token
      const token = jwt.sign(user, process.env.SECRET_KEY, { expiresIn: "1h" });
      // send token. This token have to set in local storage
      res.send({ token });
    });

    // users
    app.put("/api/auth/register", async (req, res) => {
      // get user from body
      const user = req.body;
      // set email in query
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
      // set user type 'seller' to query
      const query = { typeOfUser: "seller" };
      // find the user by query
      const result = await usersCollection.find(query).toArray();
      // return only seller
      res.send(result);
    });

    app.get("/api/buyer/seller-catalog/:seller_id", async (req, res) => {
      const id = req.params.seller_id;
      console.log(id);
      const query = { sellerId: id };
      const result = await catalogsCollection.findOne(query);
      res.send(result);
    });

    app.post("/api/buyer/create-order/:seller_id", async (req, res) => {
      // get seller if from params
      const sellerId = req.params.seller_id;
      // find all order by buyer for seller
      const receiveOrder = await ordersCollection.findOne({ sellerId });
      // if doesn't exist seller's order which was done by buyer
      if (!receiveOrder) {
        // create new order
        const newOrder = {
          sellerId,
          orders: req.body.orders || [],
        };
        const result = await ordersCollection.insertOne(newOrder);
        res
          .status(201)
          .send({ message: "items ordered by buyer", data: result });
      } else {
        const newOrder = {
          $push: { orders: { $each: req.body.orders || [] } },
        };
        const result = await ordersCollection.updateOne({ sellerId }, newOrder);
        return res
          .status(201)
          .send({ message: "New order by buyer", data: result });
      }
    });

    // APIs for sellers
    app.post("/api/seller/create-catalog", async (req, res) => {
      // get seller id from body
      const sellerId = req.body.sellerId;
      // find the seller by seller id
      const sellerCatalog = await catalogsCollection.findOne({ sellerId });
      // if seller catalog doesn't exist
      if (!sellerCatalog) {
        // create new catalog
        const newCatalog = {
          sellerId,
          catalog: req.body.catalog,
          items: req.body.items || [],
        };
        // inset catalog
        const result = await catalogsCollection.insertOne(newCatalog);
        res
          .status(201)
          .send({ message: "Successfully created catalog", data: result });
      }
      // if seller already created a catalog and want to insert a new products
      else {
        // find the seller
        const sellerCatalog = await catalogsCollection.findOne({ sellerId });
        // get all items
        const existingItems = sellerCatalog.items.map((item) => item.name);

        // filter if item doesn't exit
        const newItems = req.body?.items?.filter(
          (item) => !existingItems?.includes(item.name)
        );

        // if new items is true then push the new items
        if (newItems.length > 0) {
          const updateCatalog = {
            $push: { items: { $each: newItems || [] } },
          };
          // update catalog
          await catalogsCollection.updateOne({ sellerId }, updateCatalog);
          res
            .status(201)
            .send({ message: "Successfully inserted new items on catalog" });
        }
        // if items already exist
        else {
          res.status(400).send({ message: "All items already exist" });
        }
      }
    });

    app.get("/api/seller/orders/:seller_id", async (req, res) => {
      try {
        const id = req.params.seller_id;
        const query = { sellerId: id };
        const result = await ordersCollection.findOne(query);
        res.send(result.orders);
      } catch {
        return res.status(400).send({ message: "User doesn't exist" });
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
