const router = require("express").Router();
const util = require("util");
const db = require("../db/db");
const { body, validationResult, Result, query } = require("express-validator");
const admin = require("../middleware/adminAuth"); // admin middleware

// get Registrion Request
router.get("/reg_requests", admin, async (req, res) => {
  try {
    const query = util.promisify(db.query).bind(db);

    // 1- get waiting user
    const result = await query(
      "select * from users where status = 0 AND role = 1"
    );

    // 2- check if no request
    if (result.length == 0) {
      return res.status(400).json({ errors: [{ msg: "no Requests!" }] });
    }

    //   3- drop pass , token , update status
    delete result[0].pass;
    delete result[0].token;

    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ err: error });
  }
});

// approve Registrion Request
router.put(
  "/reg_requests/:id",
  admin,
  body("numberOfBook")
    .isNumeric()
    .withMessage("Only Numbers")
    .isLength({ max: 10, min: 0 })
    .withMessage("Number of book (0 - 10)"),
  async (req, res) => {
    try {
      const query = util.promisify(db.query).bind(db);

      // 1- validtion requst Express validator
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      //   2-prepare ID and number of book
      const { id } = req.params;
      //   3-check if id exists
      const result = await query("select * from users where id = ?", id);

      if (!result[0]) {
        res.status(400).json({ errors: [{ msg: "User not Found" }] });
      }
      //   3- drop pass , token , update status
      delete result[0].pass;
      delete result[0].token;
      result[0].status = 1;
      result[0].books_number = req.body.numberOfBook;
      //   5-update status
      await query("update users set ? where id = ? ", [result[0], id]);

      res.status(200).json({ msg: "User updated successfully!" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ err: error });
    }
  }
);

// get borrow Requests
router.get("/book_requests", admin, async (req, res) => {
  try {
    const query = util.promisify(db.query).bind(db);

    // 1- get book request
    const result = await query("select * from book_requests");

    // 2- check if no request
    if (result.length == 0) {
      return res.status(400).json({ errors: [{ msg: "no Requests!" }] });
    }

    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ err: error });
  }
});

// approve borrow Requests
router.put("/book_requests/:id", admin, async (req, res) => {
  try {
    const query = util.promisify(db.query).bind(db);

    //   1-prepare ID and number of book
    const { id } = req.params;

    //   2-check if id exists
    const result = await query("select * from book_requests where id = ?", id);

    if (!result[0]) {
      return res.status(400).json({ errors: [{ msg: "Request not Found" }] });
    }

    // 3- get userand check if exsit
    const user = await query(
      "select * from users where id = ? ",
      result[0].user_id
    );

    if (!user[0]) {
      return res.status(400).json({ errors: [{ msg: "Request not Found" }] });
    }
    delete result[0].pass;
    delete result[0].token;

    // 4- check if zero
    if (user[0].books_number != 0) {
      user[0].books_number--;
    }

    //  5- update booke number
    //   5-update status
    await query("update users set ? where id = ? ", [user[0], user[0].id]);

    //  6- prepare user_and_books  Data
    const { yy, mm, dd } = req.body;
    const expDate = yy + "-" + mm + "-" + dd;
    // expDate;
    const userBookData = {
      userID: user[0].id,
      ISBN: result[0].ISBN,
      expaire_date: expDate,
    };

    // res.json(userBookData);
    //  7- insert into user_and_books tible

    query("insert into user_and_books set ?", userBookData);

    // delete book request
    await query("delete from book_requests where id = ?", [id]);
    res.status(200).json({ msg: "book add to user successfully!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ err: error });
  }
});

module.exports = router;
