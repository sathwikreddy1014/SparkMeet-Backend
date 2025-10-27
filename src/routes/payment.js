const express = require("express");
const { userAuth } = require("../middlewares/adminAuth");
const razorpayInstance = require("../utils/razorpay");
const Payment = require("../models/payments"); // import your payment model
const { membershipAmount } = require("../utils/constants");
const { validateWebhookSignature } = require("razorpay/dist/utils/razorpay-utils");
const User = require("../models/user");
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


paymentRouter.post("/payment/webhook", async (req, res) => {
  try {
    const webhookSignature = req.get("X-Razorpay-Signature");
    console.log("Signature:", webhookSignature);
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Razorpay sends raw body as buffer, convert to string
    const body = req.body.toString();
    console.log("Raw body:", req.body.toString());

    const isWebhookValid = validateWebhookSignature(
      body,
      webhookSignature,
      webhookSecret
    );

    if (!isWebhookValid) {
      return res.status(400).json({ msg: "Invalid webhook signature" });
    }

    const parsedBody = JSON.parse(body);
    console.log("Parsed payload:", parsedBody);
    const paymentDetails = parsedBody.payload.payment.entity;

    // Ensure payment exists
    const payment = await Payment.findOne({ orderId: paymentDetails.order_id });
    if (!payment) {
      return res.status(404).json({ msg: "Payment record not found" });
    }

    // Update payment status
    payment.status = paymentDetails.status;
    await payment.save();

    // Update user membership
    const user = await User.findById(payment.userId);
    if (user) {
      user.isPremium = paymentDetails.status === "captured";
      user.membershipType = payment.notes?.membershipType || "basic";
      await user.save();
    }

    return res.status(200).json({ msg: "Webhook processed successfully" });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({ msg: error.message });
  }
});



module.exports = paymentRouter;
