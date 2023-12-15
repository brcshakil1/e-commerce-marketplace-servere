const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(express.json());
app.use(cors());

// apis
app.get("/", (req, res) => {
  res.send("E-COMMERCE Marketplace's server is running ");
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
