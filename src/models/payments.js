const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  membershipType: { 
    type: String, 
    enum: ["standard", "premium", "gold"], 
    required: true 
  },
  razorpayOrderId: { 
    type: String, 
    required: true 
  },
  razorpayPaymentId: { 
    type: String 
  },
  razorpaySignature: { 
    type: String 
  },
  amount: { 
    type: Number, // in paise
    required: true 
  },
  currency: { 
    type: String, 
    default: "INR" 
  },
  status: { 
    type: String, 
    enum: ["created", "paid", "failed"], 
    default: "created" 
  },
}, { timestamps: true });

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
