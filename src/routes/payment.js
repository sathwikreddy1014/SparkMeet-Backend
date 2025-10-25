const express = require("express");
const { userAuth } = require("../middlewares/adminAuth");
const razorpayInstance = require("../utils/razorpay");
const Payment = require("../models/payments"); // import your payment model
const paymentRouter = express.Router();

// Create Payment Order
paymentRouter.post("/payment/create", userAuth, async (req, res) => {
  try {
    const amount = 70000; // hardcoded amount in paise (₹700)
    const membershipType = "standard"; // hardcoded membership

    // 1️⃣ Create order in Razorpay
    const order = await razorpayInstance.orders.create({
      amount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        membershipType,
        userId: req.user?._id || "testUser",
      },
    });

    console.log("✅ Razorpay Order Created:", order);

    // 2️⃣ Save order to MongoDB
    const payment = new Payment({
      userId: req.user?._id || null,
      membershipType,
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      status: "created",
    });

    const savedPayment = await payment.save();
    console.log("💾 Payment saved in DB:", savedPayment);

    // 3️⃣ Respond with order details
    res.status(201).json({ ...savedPayment.toJSON()});
  } catch (error) {
    console.error("❌ Payment Creation Error:", error);
    return res.status(500).json({
      msg: "Internal Server Error",
      error: error.message,
    });
  }
});

module.exports = paymentRouter;
