const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const dns = require("dns");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());
// ===================== FILE UPLOAD =====================

if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads");
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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
const profileSchema = new mongoose.Schema({

  fullName: String,

  userPhone: String,

  age: Number,

  gender: String,

  budget: Number,

  destination: String,

  days: Number,

  stay: String,

  travelWith: String,

  preferredGender: String,

  profilePhoto: String,

  idProof: String

});

const Profile = mongoose.model("Profile", profileSchema);

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
    console.log("Register Request:", req.body);

    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({
        message: "Phone already registered"
      });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        message: "Email already registered"
      });
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

    return res.status(201).json({
      message: "Registered Successfully"
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);

    return res.status(500).json({
      message: "Register Failed",
      error: err.message
    });
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
app.post("/save-profile", async (req, res) => {

  try {

    const data = {
      ...req.body,
      destination: req.body.destination.trim().toLowerCase()
    };

    const profile = await Profile.findOneAndUpdate(
      { userPhone: data.userPhone },   // same phone = same user
      data,
      {
        new: true,
        upsert: true
      }
    );

    res.json({
      message: "Profile Saved Successfully",
      profile
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Profile Save Failed"
    });

  }

});
// ===================== GET PROFILE =====================
app.get("/get-profile/:phone", async (req, res) => {

  try {

    const profile = await Profile.findOne({
      userPhone: req.params.phone
    });

    if (!profile) {
      return res.status(404).json({
        message: "Profile not found"
      });
    }

    res.json(profile);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Error fetching profile"
    });

  }

});
// ===================== GET HISTORY =====================
app.get("/history/:phone", async (req, res) => {

  try {

    const profiles = await Profile.find({
      userPhone: req.params.phone
    });

    res.json(profiles);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "History fetch failed"
    });

  }

});
// ===================== FIND PARTNERS =====================
app.get("/find-partners/:phone", async (req, res) => {

  try {

    const myProfile = await Profile.findOne({
      userPhone: req.params.phone
    });

    if (!myProfile) {
      return res.status(404).json({
        message: "Profile not found"
      });
    }

    const partners = await Profile.find({
      userPhone: { $ne: myProfile.userPhone }, // khud ko exclude
      destination: myProfile.destination,
      travelWith: "Solo"
    });

    const matchedPartners = partners.filter((p) => {

      // Dono solo hone chahiye
      if (myProfile.travelWith !== "Solo") return false;

      // Mutual gender preference
      const myChoice =
        myProfile.preferredGender === "Any" ||
        myProfile.preferredGender === p.gender;

      const partnerChoice =
        p.preferredGender === "Any" ||
        p.preferredGender === myProfile.gender;

      // Budget difference <= 5000
      const budgetMatch =
        Math.abs(myProfile.budget - p.budget) <= 5000;

      // Days difference <= 2
      const daysMatch =
        Math.abs(myProfile.days - p.days) <= 2;

      return (
        myChoice &&
        partnerChoice &&
        budgetMatch &&
        daysMatch
      );

    });

    res.json(matchedPartners);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Partner search failed"
    });

  }

});
// ===================== UPLOAD PROFILE PHOTO =====================

app.post("/upload-profile-photo", upload.single("photo"), (req, res) => {

  if (!req.file) {
    return res.status(400).json({
      message: "No file uploaded"
    });
  }

  res.json({
    message: "Photo uploaded successfully",
    imageUrl: `/uploads/${req.file.filename}`
  });

});
// ===================== SERVER =====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});                                                                    
