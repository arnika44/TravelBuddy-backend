const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  senderPhone: {
    type: String,
    required: true,
  },

  receiverPhone: {
    type: String,
    required: true,
  },

  status: {
    type: String,
    default: "Pending",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Request", requestSchema);