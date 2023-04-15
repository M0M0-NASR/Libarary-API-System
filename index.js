// ======================global vairbels ================
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || "localhost";
const express = require("express");
const router = require("./routes/Books");
const app = express();
const cors = require("cors");

// ===================== global middlewares ===============
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("uploads"));
app.use(cors());

// ==================== required modeules =================
const auth = require("./routes/Auth");
const books = require("./routes/Books");
const User = require("./routes/User");
const Lib = require("./routes/Librarian");
app.use("/auth", auth);
app.use("/book", books);
app.use("/user", User);
app.use("/lib", Lib);

// ======================= run app =========================
app.listen(PORT, HOST, () => {
  console.log(`Server started on http://${HOST}:${PORT}`);
});
