const express = require("express")
const app = express()
const http = require("http").createServer(app)
const path = require("path")
const cookieParser = require("cookie-parser")
const logger = require("morgan")
const connection = require("./config/database")

const port = process.env.PORT || 3000

app.set("views", "./views")
app.set("view engine", "html")
app.engine("html", require("ejs").renderFile)

app.use(logger("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, "public")))

app.use("/", require("./routes/rooms"))
//app.use("/", require("./routes/myroom"))

app.get("/", (req, res) => {
  res.render("index")
})

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/views/index.html")
})

// app.get("/public/javascripts/index.js", function (req, res) {
//   res.sendFile(path.join(__dirname + "/public/javascripts/index.js"))
// })

app.get("/public/assets/model/*", function (req, res) {
  const fileName = req.path.split("/").pop()
  res.sendFile(path.join(__dirname, "/public/assets/model", fileName))
})

app.get("/public/assets/image/*", function (req, res) {
  const fileName = req.path.split("/").pop()
  res.sendFile(path.join(__dirname, "/public/assets/image", fileName))
})

app.get("/public/stylesheets/*", function (req, res) {
  const fileName = req.path.split("/").pop()
  res.sendFile(path.join(__dirname, "/public/stylesheets", fileName))
})

app.get("/public/javascripts/*", function (req, res) {
  const fileName = req.path.split("/").pop()
  res.sendFile(path.join(__dirname, "/public/javascripts", fileName))
})

// app.get("/public/assets/sound/*", function (req, res) {
//   const fileName = req.path.split("/").pop()
//   res.sendFile(path.join(__dirname, "/public/assets/sound", fileName))
// })

app.get("/rooms", (req, res) => {
  connection.query("SELECT * FROM Rooms", (error, results) => {
    if (error) {
      console.error(error)
      res.status(500).send("Internal server error")
    } else {
      res.json(results)
    }
  })
})

app.get("/room-data", (req, res) => {
  const roomId = req.query.id
  connection.query(
    `SELECT Datas.Dpath, RoomDetails.x, RoomDetails.y, RoomDetails.z FROM Datas JOIN RoomDetails ON Datas.DID = RoomDetails.DID WHERE RoomDetails.RID = '${roomId}';`,
    (error, results) => {
      if (error) {
        console.error(error)
        res.status(500).send("Internal server error")
      } else {
        res.json(results)
      }
    }
  )
})

// app.get("/myroom", (req, res) => {
//   connection.query("SELECT * FROM RoomDetails where ", (error, results) => {
//     if (error) {
//       console.error(error)
//       res.status(500).send("Internal server error")
//     } else {
//       res.json(results)
//     }
//   })
// })

app.get("/myroom", (req, res) => {
  connection.query("SELECT * FROM Rooms", (error, results) => {
    if (error) {
      console.error(error)
      res.status(500).send("Internal server error")
    } else {
      res.json(results)
    }
  })
})

http.listen(port, function () {
  console.log("listening on *:" + port)
})

module.exports = app
