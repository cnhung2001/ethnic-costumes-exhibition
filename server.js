const express = require("express")
const app = express()
const http = require("http").createServer(app)
const path = require("path")
const cookieParser = require("cookie-parser")
const logger = require("morgan")
const connection = require("./config/database")
const bcrypt = require("bcrypt")

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
  connection.query(
    "SELECT rooms.*, Datas.Dpath FROM rooms JOIN datas ON rooms.DID = datas.DID;",
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

app.get("/room-data", (req, res) => {
  const roomId = req.query.id
  connection.query(
    `SELECT  Datas.Did, Datas.Dtype, Datas.Dpath, RoomDetails.x, RoomDetails.y, RoomDetails.z, RoomDetails.rx, RoomDetails.ry, RoomDetails.rz, RoomDetails.sx, RoomDetails.sy, RoomDetails.sz FROM Datas JOIN RoomDetails ON Datas.DID = RoomDetails.DID WHERE RoomDetails.RID = '${roomId}';`,
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

app.post("/save-data", function (req, res) {
  const { roomId, modelId, position, rotation, scale } = req.body
  connection.query(
    `UPDATE RoomDetails SET x='${position.x}', y='${position.y}', z='${position.z}', rx='${rotation.x}', ry='${rotation.y}', rz='${rotation.z}', sx='${scale.x}',sy='${scale.y}', sz='${scale.z}' where rid='${roomId.roomId}' and did='${modelId.modelId}' ;`,
    (error, results) => {
      if (error) {
        console.error(error)
      }
    }
  )
  console.log(
    `Saved data: position = ${JSON.stringify(
      position
    )}, rotation = ${JSON.stringify(rotation)}, scale = ${JSON.stringify(
      scale
    )}`
  )
  res.status(200).send("Data saved successfully")
})

app.get("/login", (req, res) => {
  res.render("login.html")
})

app.get("/register", (req, res) => {
  res.render("register.html")
})

http.listen(port, function () {
  console.log("listening on *:" + port)
})

module.exports = app
