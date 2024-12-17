const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "abc123",
  database: "sms17dec24",
});

con.connect((err) => {
  if (err) {
    console.error("MySQL Connection Error:", err);
    process.exit(1); 
  }
  console.log("Connected to MySQL Database.");
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.post("/ss", upload.single("file"), (req, res) => {
  const { rno, name, marks } = req.body;
  if (!rno || !name || !marks || !req.file) {
    return res.status(400).send("All fields are required.");
  }

  const data = [rno, name, marks, req.file.filename];
  const sql = "INSERT INTO student (rno, name, marks, image) VALUES (?, ?, ?, ?)";

  con.query(sql, data, (err, result) => {
    if (err) {
      console.error("Database Error:", err);
      return res.status(500).send({ error: "Database Error", details: err });
    }
    res.send(result);
  });
});

app.get("/gs", (req, res) => {
  const sql = "SELECT * FROM student";
  con.query(sql, (err, result) => {
    if (err) {
      console.error("Database Error:", err);
      return res.status(500).send({ error: "Database Error", details: err });
    }
    res.send(result);
  });
});

app.delete("/ds", (req, res) => {
  const { rno, image } = req.body;
  if (!rno || !image) return res.status(400).send("Rno and Image are required.");

  const filePath = path.join(__dirname, "uploads", image);
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting file:", err);
    });
  } else {
    console.error("File not found:", filePath);
  }

  const sql = "DELETE FROM student WHERE rno = ?";
  con.query(sql, [rno], (err, result) => {
    if (err) {
      console.error("Database Error:", err);
      return res.status(500).send({ error: "Database Error", details: err });
    }
    res.send(result);
  });
});

app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack);
  res.status(500).send("Internal Server Error");
});

app.listen(9000, () => console.log("Server running at http://localhost:9000"));
