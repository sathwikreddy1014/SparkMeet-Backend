const Razorpay = require('razorpay');
var razorpayInstance = new Razorpay({ 
    key_id: process.env.RAZORPAY_ACCESS_KEY, 
    key_secret: process.env.RAZORPAY_SECRET_KEY
 })

module.exports = razorpayInstance;