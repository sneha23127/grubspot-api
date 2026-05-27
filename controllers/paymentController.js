const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../config/db');

// Initialize Razorpay
const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder'
  });
};

// POST /api/payments/create-order
const createOrder = async (req, res) => {
  try {
    const { amount, user_id, mess_name } = req.body;

    if (!amount || !user_id || !mess_name) {
      return res.status(400).json({ status: 'error', message: 'Missing amount, user_id, or mess_name' });
    }

    const razorpay = getRazorpayInstance();

    const options = {
      amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json({ status: 'error', message: 'Failed to create order' });
    }

    // Save pending payment to db
    const result = await db.query(
      `INSERT INTO payments (user_id, mess_name, amount, currency, razorpay_order_id, status)
       VALUES ($1, $2, $3, $4, $5, 'created') RETURNING id`,
      [user_id, mess_name, amount, 'INR', order.id]
    );

    res.status(200).json({
      status: 'success',
      order: order,
      payment_record_id: result.rows[0].id
    });
  } catch (err) {
    console.error('Error creating razorpay order:', err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// POST /api/payments/verify
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      subscriptionData // Passed back from frontend to finalize subscription
    } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder';

    // Verify signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature !== razorpay_signature) {
      // Update payment status to failed
      await db.query(`UPDATE payments SET status = 'failed' WHERE razorpay_order_id = $1`, [razorpay_order_id]);
      return res.status(400).json({ status: 'error', message: 'Payment verification failed. Invalid signature.' });
    }

    // Update payment status to success
    await db.query(
      `UPDATE payments SET razorpay_payment_id = $1, razorpay_signature = $2, status = 'success' WHERE razorpay_order_id = $3`,
      [razorpay_payment_id, razorpay_signature, razorpay_order_id]
    );

    // Now create the subscription
    if (subscriptionData) {
      const {
        user_id, user_name, user_phone, user_email,
        mess_name, plan_duration, meals, delivery_type,
        total_amount, payment_method, expiry_date
      } = subscriptionData;

      // Check for existing active sub
      const existingCheck = await db.query(
        `SELECT id FROM subscriptions WHERE user_id = $1 AND status IN ('ACTIVE', 'PAUSED')`,
        [user_id]
      );

      if (existingCheck.rows.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Payment successful, but you already have an active subscription.'
        });
      }

      const result = await db.query(
        `INSERT INTO subscriptions 
         (user_id, user_name, user_phone, user_email, mess_name, plan_duration, meals, delivery_type, total_amount, payment_method, expiry_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'ACTIVE')
         RETURNING *`,
        [user_id, user_name, user_phone, user_email, mess_name, plan_duration, meals, delivery_type, total_amount, payment_method, expiry_date]
      );

      return res.status(200).json({ status: 'success', subscription: result.rows[0], message: 'Payment verified and subscription created.' });
    }

    return res.status(200).json({ status: 'success', message: 'Payment verified but no subscription data provided.' });
  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

module.exports = {
  createOrder,
  verifyPayment
};
