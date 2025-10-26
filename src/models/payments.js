const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true
  },
  orderId: {
    type: String,
    required: true
  },
  paymentId: {
    type: String
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true
  },
   notes: {
      firstName: {
        type: String,
      },
      lastName: {
        type: String,
      },
      emailId: {
        type: String
      },
      membershipType: {
        type: String,
      },
    },
  paidAt: { 
    type: Date 
  },
},{timestamps: true});

module.exports = mongoose.model("Payment", paymentSchema);
