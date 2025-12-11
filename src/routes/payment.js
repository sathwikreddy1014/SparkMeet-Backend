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
   🔹 2️⃣ HANDLE RAZORPAY WEBHOOK (Payment Success)
====================================================== */
paymentRouter.post(
  "/payment/webhook",
  express.raw({ type: "*/*" }), // REQUIRED for signature validation
  async (req, res) => {
    try {
      console.log("🔥 Webhook received:", req.headers);

      // 1️⃣ Test webhook WITHOUT signature
      if (!req.headers["x-razorpay-signature"]) {
        console.log("🧪 Test webhook (no signature):", req.body);
        return res.status(200).json({ msg: "Test webhook received" });
      }

      // 2️⃣ Validate Signature
      const signature = req.headers["x-razorpay-signature"];
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
      const body = req.body.toString("utf8");

      const isValid = validateWebhookSignature(body, signature, secret);
      if (!isValid) {
        console.warn("⚠️ Invalid webhook signature");
        return res.status(400).json({ msg: "Invalid signature" });
      }

      // 3️⃣ Parse Razorpay event body
      const payload = JSON.parse(body);
      const event = payload.event;
      const paymentData = payload.payload.payment.entity;

      console.log("🔔 Razorpay Event:", event);
      console.log("💰 Payment Status:", paymentData.status);

      // 4️⃣ Fetch payment from DB
      const payment = await Payment.findOne({ orderId: paymentData.order_id });
      if (!payment) {
        console.warn("⚠️ No payment found:", paymentData.order_id);
        return res.status(200).json({ msg: "Payment not found" });
      }

      // 5️⃣ Update Payment Record
      payment.status = paymentData.status;
      await payment.save();

      // 6️⃣ Update User Premium Status
      const user = await User.findById(payment.userId);
      if (user) {
        if (paymentData.status === "captured") {
          user.isPremium = true; // ✅ SUCCESS — Activate Premium
          user.membershipType = payment.notes?.membershipType || "basic";
        } else {
          user.isPremium = false;
        }
        await user.save();
      }

      console.log("✅ Webhook processed successfully");

      res.status(200).json({ msg: "Webhook processed" });
    } catch (err) {
      console.error("🚨 Webhook Error:", err);
      res.status(500).json({ msg: err.message });
    }
  }
);


/* ======================================================
   🔹 3️⃣ VERIFY PREMIUM STATUS (Frontend Check)
====================================================== */
paymentRouter.get("/premium/verify", userAuth, async (req, res) => {
  try {
    res.json({ isPremium: req.user.isPremium || false });
  } catch (err) {
    console.error("❌ /premium/verify error:", err);
    res.status(500).json({ msg: err.message });
  }
});

module.exports = paymentRouter;
