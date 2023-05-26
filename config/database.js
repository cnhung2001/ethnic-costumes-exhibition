const mysql = require("mysql2")

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "123456",
  database: "web3d",
})

connection.connect((err) => {
  if (err) {
    console.log(err)
    return
  }
  console.log("Database connected")
})

module.exports = connection
