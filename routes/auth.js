const express = require("express")
const connection = require("../config/database")
const router = express.Router()
const bycrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

router.post("/register", function (req, res) {
  const { email, password, username } = req.body

  connection.query(
    `SELECT * from users WHERE email ='${email}'`,
    (error, results) => {
      if (error) {
        console.error(error)
        res.status(500).send({
          success: false,
          msg: "Internal server error",
        })
      } else {
        // check if user exists
        if (results.length) {
          res.status(400).send({
            success: false,
            msg: "User has already registed.",
          })
        } else {
          // hash password for secure
          bycrypt.hash(password, 10).then((hashedPassword) => {
            // create new user
            connection.query(
              `INSERT INTO users (username, email, password, role) VALUES ('${username}', '${email}', '${hashedPassword}', 'user')`,
              (error) => {
                if (error) {
                  console.error(error)
                  res.status(500).send({
                    success: false,
                    msg: "Internal server error",
                  })
                } else {
                  res.send({
                    success: true,
                    msg: "Login successful!",
                    data: {
                      username,
                      email,
                    },
                  })
                }
              }
            )
          })
        }
      }
    }
  )
})

router.post("/login", (req, res) => {
  // check if user exists or not
  const { email, password } = req.body
  connection.query(
    `SELECT * FROM users WHERE email = '${email}'`,
    (err, result) => {
      if (err) {
        console.error(err)
        res.status(500).send("Internal server error")
      } else {
        if (result.length) {
          // check password is correct or not
          if (bycrypt.compareSync(password, result[0].password)) {
            // create access token
            const { id, role } = result[0]
            const access_token = jwt.sign(
              { id, role },
              process.env.JWT_SECRET,
              {
                expiresIn: "30d",
              }
            )
            return res.send({
              userInfo: result[0],
              access_token,
            })
          } else {
            res.status(400).send({
              success: false,
              msg: "Password is incorrect",
            })
          }
        } else {
          res.status(400).send({
            success: false,
            msg: "User does not exist",
          })
        }
      }
    }
  )
})

module.exports = router
