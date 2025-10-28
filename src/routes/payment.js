const express = require("express");
const { userAuth } = require("../middlewares/adminAuth");
const razorpayInstance = require("../utils/razorpay");
const Payment = require("../models/payments");
const User = require("../models/user");
const { membershipAmount } = require("../utils/constants");
const { validateWebhookSignature } = require("razorpay/dist/utils/razorpay-utils");

const paymentRouter = express.Router();

/* ---------------------- CREATE PAYMENT ORDER ---------------------- */
paymentRouter.post("/payment/create", userAuth, async (req, res) => {
  try {
    const { membershipType } = req.body;
    const { firstName, lastName, emailId } = req.user;

    const order = await razorpayInstance.orders.create({
      amount: membershipAmount[membershipType] * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: { firstName, lastName, emailId, membershipType },
    });

    console.log("✅ Razorpay Order Created:", order);

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

    res.json({ ...savedPayment.toJSON(), keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error("❌ Payment creation error:", err);
    res.status(500).json({ msg: err.message });
  }
});

/* ---------------------- WEBHOOK HANDLER ---------------------- */
const handleWebhook = async (req, res) => {
  console.log("🔥 Incoming webhook request at /payment/webhook");
  console.log("Headers:", req.headers);

  try {
    const signature = req.get("X-Razorpay-Signature");
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const body = req.body.toString("utf8"); // Convert raw buffer to string
    console.log("📦 Raw body (first 500 chars):", body.slice(0, 500));

    const isValid = validateWebhookSignature(body, signature, secret);
    console.log("✅ Webhook Signature Valid:", isValid);

    if (!isValid) {
      console.log("❌ Invalid webhook signature");
      return res.status(400).json({ msg: "Invalid webhook signature" });
    }

    const parsed = JSON.parse(body);
    console.log("🧾 Webhook Event:", parsed.event);

    const paymentDetails = parsed.payload.payment.entity;

    // Update Payment
    const payment = await Payment.findOne({ orderId: paymentDetails.order_id });
    if (!payment) {
      console.log("⚠️ Payment not found in DB for order:", paymentDetails.order_id);
      return res.status(404).json({ msg: "Payment record not found" });
    }

    payment.status = paymentDetails.status;
    await payment.save();
    console.log("💾 Payment updated:", payment.orderId, payment.status);

    // Update User
    const user = await User.findById(payment.userId);
    if (user) {
      user.isPremium = paymentDetails.status === "captured";
      user.membershipType = payment.notes?.membershipType || "basic";
      await user.save();
      console.log("👑 User upgraded:", user.emailId, user.membershipType);
    } else {
      console.log("⚠️ User not found for payment:", payment.userId);
    }

    res.status(200).json({ msg: "Webhook processed successfully" });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    res.status(500).json({ msg: error.message });
  }
};

module.exports = paymentRouter;
module.exports.handleWebhook = handleWebhook;
