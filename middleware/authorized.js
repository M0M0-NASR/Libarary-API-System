const util = require("util");
const db = require("../db/db");

// check user log in or not
const authorazied = async (req, res, next) => {
  let { token } = req.headers;

  const query = util.promisify(db.query).bind(db);
  const user = await query("select * from user where token =?", [token]);

  if (user[0] && user[0].role == "1") {
    res.locals.user = user[0];
    next();
  } else return res.status(403).json({ msg: "you are not Authorazied" });
};

module.exports = authorazied;
