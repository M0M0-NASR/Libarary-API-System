const router = require("express").Router();
const util = require("util");
const db = require("../db/db");
const { body, validationResult } = require("express-validator");
const admin = require("../middleware/adminAuth"); // admin middleware
const authorazied = require("../middleware/authorized"); // admin middleware

// get user books
router.get("", authorazied, async (req, res) => {
  const query = util.promisify(db.query).bind(db);
  const user = res.locals.user;

  //   1- get user book from database
  result = await query(
    "select * from user_and_books where userID = ?",
    user.id
  );

  //   2- check if no books
  if (result.length == 0) {
    res.status(400).json({ errors: [{ msg: "No books !" }] });
  }
  res.status(200).json(result);
});

// Export the router
module.exports = router;
