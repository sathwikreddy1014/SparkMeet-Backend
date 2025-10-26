const express = require("express");
const { userAuth } = require("../middlewares/adminAuth");
const razorpayInstance = require("../utils/razorpay");
const Payment = require("../models/payments"); // import your payment model
const { membershipAmount } = require("../utils/constants");
const paymentRouter = express.Router();

// Create Payment Order
paymentRouter.post("/payment/create", userAuth, async (req, res) => {
  try {
   
    const { membershipType } = req.body;
    const { firstName, lastName, emailId } = req.user;

    const order = await razorpayInstance.orders.create({
      amount: membershipAmount[membershipType] * 100,
      currency: "INR",
      receipt: "receipt#1",
      notes: {
        firstName,
        lastName,
        emailId,
        membershipType: membershipType,
      },
    });

    console.log("✅ Razorpay Order Created:", order);

    // 2️⃣ Save order to MongoDB
    const payment = new Payment({
      userId: req.user._id,
      orderId: order.id,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      notes: order.notes,
    });

   const savedPayment = await payment.save();
    console.log("💾 Payment saved in DB:", savedPayment);

    // 3️⃣ Respond with order details
  res.json({ ...savedPayment.toJSON(), keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

module.exports = paymentRouter;
