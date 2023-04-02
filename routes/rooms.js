const express = require("express")
const connection = require("../config/database")
const router = express.Router()

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index")
})

router.get("/room", function (req, res) {
  const roomId = req.query.id
  res.render("room", { roomId: roomId })
})
module.exports = router
