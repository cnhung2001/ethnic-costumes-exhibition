const express = require("express")
const app = express()
const http = require("http").createServer(app)
const path = require("path")
const cookieParser = require("cookie-parser")
const logger = require("morgan")
const connection = require("./config/database")
require("dotenv").config()

const port = process.env.PORT || 80

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
app.use("/auth", require("./routes/auth"))

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

app.get("/public/assets/font/*", function (req, res) {
  const fileName = req.path.split("/").pop()
  res.sendFile(path.join(__dirname, "/public/assets/font", fileName))
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
    "SELECT rooms.*, datas.Dpath FROM rooms JOIN datas ON rooms.DID = datas.DID;",
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

app.get("/users", (req, res) => {
  connection.query(
    "SELECT users.*, rooms.* from users join rooms on users.UID = rooms.RID;",
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

app.get("/comments", (req, res) => {
  connection.query(
    "SELECT comments.*, users.name from users join comments on users.UID = comments.UID;",
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
    `SELECT  roomdetails.id, datas.Dtype, datas.Dpath, roomdetails.x, roomdetails.y, roomdetails.z, roomdetails.rx, roomdetails.ry, roomdetails.rz, roomdetails.sx, roomdetails.sy, roomdetails.sz FROM datas JOIN roomdetails ON datas.DID = roomdetails.DID WHERE roomdetails.RID = '${roomId}';`,
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

app.get("/IslandHeader", (req, res) => {
  const roomId = req.query.id
  connection.query(
    `SELECT islandheader.id, islandheader.rDid, islandheader.content, islandheader.fontpath, islandheader.size, islandheader.height, islandheader.color, roomdetails.x, roomdetails.y,  roomdetails.z FROM islandheader JOIN roomdetails ON islandheader.rDId = roomdetails.id WHERE roomdetails.RID = '${roomId}';`,
    (error, results) => {
      if (error) {
        console.error(error)
        res.status(500).send("Internal server error")
      } else {
        //console.log(results)
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
  connection.query("SELECT * FROM rooms", (error, results) => {
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
    `UPDATE roomdetails SET x='${position.x}', y='${position.y}', z='${position.z}', rx='${rotation.x}', ry='${rotation.y}', rz='${rotation.z}', sx='${scale.x}',sy='${scale.y}', sz='${scale.z}' where id='${modelId.modelId}' ;`,
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

app.post("/register", (req, res) => {})

app.listen(80, () => {
  console.log("Server is running on port 80!");
});

module.exports = app
