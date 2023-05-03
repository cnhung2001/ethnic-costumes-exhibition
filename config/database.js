const mysql = require("mysql2")

const connection = mysql.createConnection({
  host: "sql12.freemysqlhosting.net",
  user: "sql12615861",
  password: "DIWBKA1Vu5",
  database: "sql12615861",
})

connection.connect((err) => {
  if (err) {
    console.log(err)
    return
  }
  console.log("Database connected")
})

module.exports = connection
