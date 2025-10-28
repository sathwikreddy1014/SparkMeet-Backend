const express = require("express");
const { userAuth } = require("../middlewares/adminAuth");
const razorpayInstance = require("../utils/razorpay");
const Payment = require("../models/payments");
const User = require("../models/user");
const { membershipAmount } = require("../utils/constants");
const { validateWebhookSignature } = require("razorpay/dist/utils/razorpay-utils");

const paymentRouter = express.Router();

/* ======================================================
   🔹 1️⃣ CREATE PAYMENT ORDER
====================================================== */
paymentRouter.post("/payment/create", userAuth, async (req, res) => {
  try {
    const { membershipType } = req.body;
    const { firstName, lastName, emailId } = req.user;

    if (!membershipType || !membershipAmount[membershipType]) {
      return res.status(400).json({ msg: "Invalid membership type" });
    }

    const order = await razorpayInstance.orders.create({
      amount: membershipAmount[membershipType] * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: { firstName, lastName, emailId, membershipType },
    });

    const payment = new Payment({
      userId: req.user._id,
      orderId: order.id,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      notes: order.notes,
    });

    const saved = await payment.save();

    res.json({
      ...saved.toJSON(),
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("❌ /payment/create error:", err);
    res.status(500).json({ msg: err.message });
  }
});

/* ======================================================
   🔹 2️⃣ HANDLE WEBHOOK (Razorpay → Your Server)
====================================================== */
paymentRouter.post("/payment/webhook", express.raw({ type: "*/*" }), async (req, res) => {
  try {
    console.log("🔥 Webhook hit:", req.headers);

    // Handle manual test webhook (no signature)
    if (!req.headers["x-razorpay-signature"]) {
      console.log("🧪 Manual webhook test:", req.body);
      return res.status(200).json({ msg: "Test webhook received successfully" });
    }

    const signature = req.headers["x-razorpay-signature"];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const bodyString = req.body.toString("utf8");
    const isValid = validateWebhookSignature(bodyString, signature, secret);

    if (!isValid) {
      console.warn("⚠️ Invalid Razorpay signature");
      return res.status(400).json({ msg: "Invalid signature" });
    }

    const payload = JSON.parse(bodyString);
    const paymentData = payload.payload.payment.entity;

    const payment = await Payment.findOne({ orderId: paymentData.order_id });
    if (payment) {
      payment.status = paymentData.status;
      await payment.save();

      const user = await User.findById(payment.userId);
      if (user) {
        user.isPremium = paymentData.status === "captured";
        user.membershipType = payment.notes?.membershipType || "basic";
        await user.save();
      }

      console.log("✅ Webhook processed:", paymentData.status);
    } else {
      console.warn("⚠️ No payment record found for:", paymentData.order_id);
    }

    res.status(200).json({ msg: "Webhook processed successfully" });
  } catch (err) {
    console.error("🚨 Webhook error:", err);
    res.status(500).json({ msg: err.message });
  }
});

/* ======================================================
   🔹 3️⃣ VERIFY PREMIUM STATUS
====================================================== */
paymentRouter.get("/premium/verify", userAuth, async (req, res) => {
  try {
    const user = req.user;
    return res.json({ isPremium: user.isPremium || false });
  } catch (err) {
    console.error("❌ /premium/verify error:", err);
    res.status(500).json({ msg: err.message });
  }
});

module.exports = paymentRouter;
