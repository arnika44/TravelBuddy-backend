const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// ===================== MongoDB Connection =====================
const dbURI = "mongodb+srv://arnika0044:Arnika213544@travelbuddydb.ial03ju.mongodb.net/?appName=TravelBuddyDB";

mongoose.connect(dbURI)
  .then(() => {
    console.log("✅ MONGODB SUCCESSFULLY CONNECTED");
  })
  .catch((err) => {
    console.error("❌ MONGODB CONNECTION FAILED");
    console.error(err);
  });

// ===================== Schema =====================
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  aadhaar: {
    type: String,
    required: true,
    unique: true
  }
});

const User = mongoose.model("User", userSchema);

// ===================== Routes =====================

// Home Route
app.get("/", (req, res) => {
  res.send("TravelBuddy Backend is Running!");
});

// Register
app.post("/register", async (req, res) => {
  try {
    const { name, email, password, aadhaar } = req.body;

    const existingUser = await User.findOne({ aadhaar });

    if (existingUser) {
      return res.status(400).json({
        message: "User already registered!"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      aadhaar
    });

    await newUser.save();

    res.status(201).json({
      message: "Registered Successfully!"
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Registration Failed!"
    });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { aadhaar, password } = req.body;

    const user = await User.findOne({ aadhaar });

    if (!user) {
      return res.status(400).json({
        message: "User not found!"
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({
        message: "Wrong Password!"
      });
    }

    res.status(200).json({
      message: "Login Successful!",
      user: {
        name: user.name,
        aadhaar: user.aadhaar
      }
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Login Failed!"
    });
  }
});

// ===================== Server =====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});