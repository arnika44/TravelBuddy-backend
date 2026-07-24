const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderPhone: {
      type: String,
      required: true,
    },
    receiverPhone: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Message", messageSchema);