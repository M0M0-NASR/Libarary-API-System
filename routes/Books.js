const router = require("express").Router();
const util = require("util");
const db = require("../db/db");
const { body, validationResult } = require("express-validator");
const admin = require("../middleware/adminAuth"); // admin middleware
const authorazied = require("../middleware/authorized"); // admin middleware
const upload = require("../middleware/uploadimg");
const fs = require("fs");

// for id isbn code
const shortID = require("short-unique-id");
const { exception } = require("console");
const uid = new shortID({ length: 10, dictionary: "alpha_upper" });

// add book
router.post(
  "/",
  admin,
  upload.single("file"),
  body("title") // validate book name
    .isString()
    .withMessage("alphabitic characters only")
    .isLength({ min: 10, max: 40 })
    .withMessage("enter valid name (10 - 40)"),
  body("author") // validate author
    .isString()
    .withMessage("alphabitic characters only")
    .isLength({ min: 10, max: 40 })
    .withMessage("enter valid name (10 - 40)"),
  body("subject") // validate subject
    .isString()
    .withMessage("alphabitic characters only")
    .isLength({ min: 10, max: 40 })
    .withMessage("enter valid name (10 - 40)"),
  body("rack_number") // validate rack number
    .isNumeric()
    .withMessage("number only"),
  async (req, res) => {
    try {
      // 1- validtion requst Express validator
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // validate img
      if (!req.file) {
        return res.status(400).json({
          errors: [
            {
              msg: "image not found",
            },
          ],
        });
      }
      // 2- create bookData object
      const bookData = {
        title: req.body.title,
        author: req.body.author,
        subject: req.body.subject,
        rack_number: req.body.rack_number,
        ISBN: uid(),
        photo: req.file.filename,
      };

      // 3- insert data to db
      const query = util.promisify(db.query).bind(db);
      await query("insert into books set ?", bookData);

      res.json({ msg: "book add successfully!" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ errors: error });
    }
  }
);

// update book
router.put(
  "/:ISBN",
  admin,
  upload.single("file"),
  body("title") // validate book name
    .isString()
    .withMessage("alphabitic characters only")
    .isLength({ min: 10, max: 40 })
    .withMessage("enter valid name (10 - 40)"),
  body("author") // validate author
    .isString()
    .withMessage("alphabitic characters only")
    .isLength({ min: 10, max: 40 })
    .withMessage("enter valid name (10 - 40)"),
  body("subject") // validate subject
    .isString()
    .withMessage("alphabitic characters only")
    .isLength({ min: 10, max: 40 })
    .withMessage("enter valid name (10 - 40)"),
  body("rack_number") // validate rack number
    .isNumeric()
    .withMessage("number only"),
  async (req, res) => {
    const { ISBN } = req.params;

    try {
      const query = util.promisify(db.query).bind(db);

      // 1- validtion requst Express validator
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // 2- check ISBN exixt or not
      const book = await query("select * from books where ISBN = ?", ISBN);
      if (!book[0]) {
        return res.status(404).json({ errors: [{ msg: "book not found !" }] });
      }

      // 3- update bookData object
      const bookData = {
        title: req.body.title,
        author: req.body.author,
        subject: req.body.subject,
        rack_number: req.body.rack_number,
        ISBN: book[0].ISBN,
      };

      // 4- check if img send
      if (req.file) {
        bookData.photo = req.file.filename;
        fs.unlinkSync("./uploads/" + book[0].photo);
      }

      // 5- update data to db
      await query("update books set ? where ISBN = ?", [bookData, ISBN]);

      res.status(200).json({ msg: "book upadated successfully!" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ errors: error });
    }
  }
);

// get all books
router.get("/", authorazied, async (req, res) => {
  try {
    const query = util.promisify(db.query).bind(db);

    // 1-check if search active
    let search = "";
    if (req.query.search) {
      search = `where title LIKE '%${req.query.search}%' or ISBN LIKE '%${req.query.search}%'`;
    }

    // 2- get all books
    const books = await query(`select * from books ${search}`);

    // 3- check if no books found
    if (books.length == 0) {
      return res.status(400).json({ errors: [{ msg: "No Books found!" }] });
    }
    // 4- prepare img to front
    books.map((movie) => {
      movie.photo = "http://" + req.hostname + ":4000/" + movie.photo;
    });

    res.status(200).json(books);
  } catch (error) {
    console.log(error);
    res.status(500).json({ errors: error });
  }
});

// get one book by ISBN
router.get("/:ISBN", authorazied, async (req, res) => {
  try {
    const query = util.promisify(db.query).bind(db);

    // 1- get ISBN
    const { ISBN } = req.params;

    // 2- get books
    const book = await query("select * from books where ISBN = ?", ISBN);

    // 3- check if exist or not
    if (!book[0]) {
      return res.status(404).json({ errors: [{ msg: "book not found" }] });
    }
    // 4- prepare img to front
    book[0].photo = "http://" + req.hostname + ":4000/" + book[0].photo;

    res.status(200).json(book[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ errors: error });
  }
});

// delete book
router.delete("/:ISBN", admin, async (req, res) => {
  try {
    const query = util.promisify(db.query).bind(db);

    const { ISBN } = req.params;

    // 1- check ISBN exixt or not
    const book = await query("select * from books where ISBN = ?", ISBN);

    if (!book[0]) {
      return res.status(404).json({ errors: [{ msg: "book not found !" }] });
    }
    // 2- delete img from server
    fs.unlinkSync("./uploads/" + book[0].photo);

    // 3- update data to db
    await query("delete from books where ISBN = ?", [ISBN]);

    res.status(200).json({ msg: "book deleted successfully!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ errors: error });
  }
});

// request book to borrow
router.post("/request/:ISBN", authorazied, async (req, res) => {
  try {
    const query = util.promisify(db.query).bind(db);
    user = res.locals.user;
    const { ISBN } = req.params;

    // 1-check user not request same book
    result = await query(
      "select * from request where user_id = ? AND ISBN = ?",
      [user.id, ISBN]
    );

    if (result[0]) {
      return res
        .status(400)
        .json({ errors: [{ msg: "You already request this book!" }] });
    }

    // 2- prepare requsetData
    const requestData = {
      user_id: user.id,
      ISBN: ISBN,
    };

    // 3- insert into database
    await query("insert into request set ?", requestData);
    res.json({
      errors: [
        {
          msg:
            "You make requset successfully, waiting for Libararin approvement!",
        },
      ],
    });
    res.status(200).json({ msg: "Request add to book" });
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
