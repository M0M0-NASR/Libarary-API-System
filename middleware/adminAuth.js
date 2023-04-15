const { check } = require("express-validator");
const util = require("util");
const db = require("../db/db");

// check admin or not
const adminAuth = async (req, res, next) => {
  let { token } = req.headers;
  const query = util.promisify(db.query).bind(db);
  const admin = await query("select * from user where token =?", [token]);

  if (admin[0] && admin[0].role == "0") next();
  else return res.status(400).json({ errors: [{ msg: "you are not admin" }] });
};

module.exports = adminAuth;
