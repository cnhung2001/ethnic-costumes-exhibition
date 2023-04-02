const express = require("express")
const router = express.Router()
const multer = require("multer")
const path = require("path")
const { v4: uuidv4 } = require("uuid")
const db = require("../config/database")

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/assets/model/")
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4() + path.extname(file.originalname))
  },
})

// Init upload
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /obj|gltf|glb/
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    )
    const mimetype = filetypes.test(file.mimetype)
    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb("Error: Only .obj, .gltf, .glb files are allowed!")
    }
  },
}).fields([
  { name: "file", maxCount: 1 },
  { name: "RID", maxCount: 1 },
  { name: "x", maxCount: 1 },
  { name: "y", maxCount: 1 },
  { name: "z", maxCount: 1 },
])

// Handle upload POST request
router.post("/", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      console.log(err)
      res.status(400).send({ message: err })
    } else {
      // Check if file is selected
      if (req.files["file"] == undefined) {
        res.status(400).send({ message: "Error: No file selected!" })
        return
      }

      // Insert data into database
      const modelPath = "/assets/model/" + req.files["file"][0].filename
      const RID = req.body["RID"]
      const x = req.body["x"]
      const y = req.body["y"]
      const z = req.body["z"]

      const data = {
        model: modelPath,
      }

      db.query("INSERT INTO Datas SET ?", data, (error, results) => {
        if (error) {
          console.log(error)
          res.status(500).send({ message: "Internal Server Error!" })
          return
        }

        const DID = results.insertId

        const roomDetails = {
          RID: RID,
          DID: DID,
          x: x,
          y: y,
          z: z,
        }

        db.query(
          "INSERT INTO RoomDetails SET ?",
          roomDetails,
          (error, results) => {
            if (error) {
              console.log(error)
              res.status(500).send({ message: "Internal Server Error!" })
              return
            }

            res.status(200).send({ message: "File uploaded successfully!" })
          }
        )
      })
    }
  })
})

module.exports = router
