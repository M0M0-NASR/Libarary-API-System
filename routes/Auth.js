const router = require("express").Router();
const db = require("../db/db");
const util = require("util");
const { body, validationResult } = require("express-validator");
const { connect } = require("http2");
const crypto = require("crypto");
const bcrypto = require("bcrypt");

// registeration
router.post(
  "/register",
  body("email").isEmail().withMessage("please enter a valid email!"),
  body("pass")
    .isLength({ max: 18, min: 10 })
    .withMessage("enter password between 10 and 18"),
  body("name")
    .isString()
    .isLength({ max: 25, min: 10 })
    .withMessage("enter name between 10 and 18 charcter!"),
  body("phone")
    .isNumeric()
    .isLength({ max: 11, min: 11 })
    .withMessage("enter phone between must be 11 numbers!"),
  async (req, res) => {
    try {
      // 1- validtion requst Express validator
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // 1- validtion requst manual
      // 1-check email exist
      const query = util.promisify(db.query).bind(db);
      const checkEmailQuery = await query(
        "select * from users where email= ?",
        [req.body.email]
      );

      if (checkEmailQuery.length > 0) {
        return res.status(400).json({
          errors: [
            {
              msg: "email already exist!",
            },
          ],
        });
      }

      if (req.body.role == null) {
        req.body.role = 1;
      }

      // 2- prepare user data

      const salt = await bcrypto.genSalt(10);
      const userData = {
        name: req.body.name,
        email: req.body.email,
        pass: await bcrypto.hash(req.body.pass, salt),
        token: crypto.randomBytes(16).toString("hex"),
        role: req.body.role,
        phone: req.body.phone,
        status: 0,
      };

      // 3- insert data to db
      await query("insert into users set ?", userData);
      delete userData.pass;
      res
        .status(200)
        .json({ errors: [{ msg: "waiting for admin Approvment!" }] });
    } catch (error) {
      console.log(error);
      res.status(500).json({ err: error });
    }
  }
);

// login
router.post(
  "/login",
  body("email").isEmail().withMessage("please enter a valid email!"),
  body("pass")
    .isLength({ max: 18, min: 10 })
    .withMessage("enter password between 10 and 18"),
  async (req, res) => {
    try {
      // 1- validtion requst Express validator
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // 1- validtion requst manual
      // 1-check email exist
      const query = util.promisify(db.query).bind(db);
      const user = await query("select * from users where email= ?", [
        req.body.email,
      ]);

      if (user.length == 0) {
        return res.status(400).json({
          errors: [
            {
              msg: "email not correct",
            },
          ],
        });
      }

      // 3- check status
      if (user[0].status == 0) {
        return res.status(400).json({
          errors: [
            {
              msg: "Your Account not Active Yet!",
            },
          ],
        });
      }

      // 3- compare pass
      const pass = await bcrypto.hash(req.body.pass, 10);
      const checkPass = await bcrypto.compare(req.body.pass, user[0].pass);

      if (checkPass == true) {
        delete user[0].pass;
        return res.status(200).json(user[0]);
      } else {
        return res.status(400).json({
          errors: [
            {
              msg: "password is not correct",
            },
          ],
        });
      }
    } catch (error) {
      res.status(500).json({ err: error });
    }
  }
);

// 3- logout
router.post("/logout", (req, res) => {
  try {
    res.status(200).json({ msg: "log out Successfully!" });
  } catch (error) {
    res.status(500).json({ err: error });
  }
});

// Export the router
module.exports = router;
