const express = require("express");
const app = express();
const cors = require("cors");

const PORT = 3000;

app.use(cors());
app.use(express.json());

const db = require("./models");



//users endpoints
const users = require("./routes/Customers");
app.use("/users", users);

//cards endpoints
const cards = require("./routes/Cards");
app.use("/cards", cards);

//authors endpoints
const authors = require("./routes/Authors")
app.use("/authors", authors)

//categories endpoints
const categories = require("./routes/Categories")
app.use("/categories", categories)

//publications endpoints
const publications = require("./routes/Publications")
app.use("/publications", publications)

//instances endpoints
const instances = require("./routes/Instances")
app.use("/instances", instances)

//rentals endpoints
const rentals = require("./routes/Rentals")
app.use("/rentals", rentals)

//rentals endpoints
const reservations = require("./routes/Reservations")
app.use("/reservations", reservations)



app.use("/", (req, res) => {
  res.send("serus");
});

db.sequelize.sync().then(() => {
  app.listen(PORT, (err) => {
    if (err) console.log(err);
    console.log("Listening on PORT ", PORT);
  });
});
