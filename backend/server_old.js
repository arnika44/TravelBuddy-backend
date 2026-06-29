const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const dns = require("dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// ===================== MONGO =====================
const dbURI = "mongodb+srv://arnika0044:Arnika213544@travelbuddydb.ial03ju.mongodb.net/?appName=TravelBuddyDB";

mongoose.connect(dbURI)
  .then(() => console.log("✅ MONGODB CONNECTED"))
  .catch(err => console.log("❌ DB ERROR", err));

// ===================== USER SCHEMA =====================
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  otpVerified: {
    type: Boolean,
    default: false
  }
});

const User = mongoose.model("User", userSchema);

// ===================== OTP STORE =====================
const otpStore = {};

// ===================== HOME =====================
app.get("/", (req, res) => {
  res.send("🚀 TravelBuddy Backend Running");
});

// ===================== SEND OTP =====================
app.post("/send-otp", (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ message: "Phone required" });
  }

  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  otpStore[phone] = {
    otp,
    createdAt: Date.now()
  };

  console.log("📱 OTP:", phone, otp);

  res.json({
    message: "OTP sent successfully"
  });
});

// ===================== RESEND OTP =====================
app.post("/resend-otp", (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ message: "Phone required" });
  }

  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  otpStore[phone] = {
    otp,
    createdAt: Date.now()
  };

  console.log("🔁 Resent OTP:", phone, otp);

  res.json({
    message: "OTP resent successfully"
  });
});

// ===================== VERIFY OTP =====================
app.post("/verify-otp", (req, res) => {
  const { phone, otp } = req.body;

  const data = otpStore[phone];

  if (!data) {
    return res.json({ success: false, message: "OTP not found" });
  }

  const isExpired = Date.now() - data.createdAt > 5 * 60 * 1000;

  if (isExpired) {
    delete otpStore[phone];
    return res.json({ success: false, message: "OTP expired" });
  }

  if (data.otp !== otp) {
    return res.json({ success: false, message: "Invalid OTP" });
  }

  delete otpStore[phone];

  return res.json({
    success: true,
    message: "OTP Verified"
  });
});

// ===================== FORGOT PASSWORD VERIFY OTP =====================
app.post("/forgot-password-verify-otp", (req, res) => {
  const { phone, otp } = req.body;

  const data = otpStore[phone];

  if (!data) {
    return res.json({ success: false, message: "OTP not found" });
  }

  const isExpired = Date.now() - data.createdAt > 5 * 60 * 1000;

  if (isExpired) {
    delete otpStore[phone];
    return res.json({ success: false, message: "OTP expired" });
  }

  if (data.otp !== otp) {
    return res.json({ success: false, message: "Invalid OTP" });
  }

  return res.json({
    success: true,
    message: "OTP verified for password reset"
  });
});

// ===================== RESET PASSWORD =====================
app.post("/reset-password", async (req, res) => {
  try {
    const { phone, newPassword } = req.body;

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    user.password = hashed;
    await user.save();

    res.json({
      message: "Password reset successful"
    });

  } catch (err) {
    res.status(500).json({ message: "Reset failed" });
  }
});

// ===================== REGISTER =====================
app.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const existing = await User.findOne({ phone });

    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      phone,
      password: hashed,
      otpVerified: true
    });

    await newUser.save();

    res.status(201).json({ message: "Registered Successfully" });

  } catch (err) {
    res.status(500).json({ message: "Register Failed" });
  }
});

// ===================== LOGIN =====================
app.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ message: "Wrong Password" });
    }

    res.json({
      message: "Login Success",
      user: {
        name: user.name,
        phone: user.phone,
        email: user.email
      }
    });

  } catch (err) {
    res.status(500).json({ message: "Login Failed" });
  }
});

// ===================== SERVER =====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});                                                                    