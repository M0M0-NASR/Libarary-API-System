const db = require("mysql");

const connection = db.createConnection({
  host: "localhost",
  user: "root",
  pass: "",
  database: "lsp",
  port: "3306",
});

connection.connect((err) => {
  if (err) {
    console.log("db error");
    throw err;
  }
  console.log("db connected");
});

module.exports = connection;
