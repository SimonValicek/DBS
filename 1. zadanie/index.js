const { Client } = require("pg");
const express = require("express");
const app = express();
const port = 8000;

const client = new Client({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  port: process.env.DATABASE_PORT
});

app.use(express.static("public"));

app.get("/v1/status", (req, res) => {
  client
    .query("SELECT VERSION()")
    .then((data) => {
      res.send(JSON.stringify(data.rows[0]))
    })
    .catch((err) => {
      res.send(JSON.stringify(err))
    });
});

(() => {
  client.connect();
  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  });
})();
