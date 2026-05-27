const db = require('../config/db');

// POST /api/subscriptions
const createSubscription = async (req, res) => {
  const { 
    user_id, user_name, user_phone, user_email, 
    mess_name, plan_duration, meals, delivery_type, 
    total_amount, payment_method, expiry_date 
  } = req.body;

  if (!user_id || !mess_name) {
    return res.status(400).json({ status: 'error', message: 'Missing required fields.' });
  }

  try {
    // Check if user exists in the database
    const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Invalid session or user not found. Please log in again.' 
      });
    }

    // Check if user already has an active or paused subscription
    const existingCheck = await db.query(
      `SELECT id FROM subscriptions 
       WHERE user_id = $1 AND status IN ('ACTIVE', 'PAUSED')`,
      [user_id]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'You already have an active or paused subscription. Please wait until it expires.' 
      });
    }

    const result = await db.query(
      `INSERT INTO subscriptions 
       (user_id, user_name, user_phone, user_email, mess_name, plan_duration, meals, delivery_type, total_amount, payment_method, expiry_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'ACTIVE')
       RETURNING *`,
      [user_id, user_name, user_phone, user_email, mess_name, plan_duration, meals, delivery_type, total_amount, payment_method, expiry_date]
    );

    return res.status(201).json({ status: 'success', subscription: result.rows[0] });
  } catch (err) {
    console.error('Create subscription error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
};

// GET /api/subscriptions/user/:userId
const getUserSubscriptions = async (req, res) => {
  const { userId } = req.params;

  try {
    // Auto-expire
    await db.query(
      `UPDATE subscriptions 
       SET status = 'EXPIRED' 
       WHERE expiry_date < NOW() AND status NOT IN ('EXPIRED', 'CANCELLED')`
    );

    // Auto-resume
    await db.query(
      `UPDATE subscriptions 
       SET status = 'ACTIVE', pause_start_date = NULL, pause_end_date = NULL
       WHERE status = 'PAUSED' AND pause_end_date < CURRENT_DATE`
    );

    const result = await db.query(
      `SELECT s.*, m.meal_preference, m.cuisine_type, m.owner_id 
       FROM subscriptions s
       LEFT JOIN messes m ON LOWER(s.mess_name) = LOWER(m.mess_name)
       WHERE s.user_id = $1 
       ORDER BY s.created_at DESC`,
      [userId]
    );

    return res.status(200).json({ status: 'success', subscriptions: result.rows });
  } catch (err) {
    console.error('Get subscriptions error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
};

// GET /api/subscriptions/mess/:messName
const getMessSubscribers = async (req, res) => {
  const { messName } = req.params;

  try {
    // Auto-expire
    await db.query(
      `UPDATE subscriptions 
       SET status = 'EXPIRED' 
       WHERE expiry_date < NOW() AND status NOT IN ('EXPIRED', 'CANCELLED')`
    );

    // Auto-resume
    await db.query(
      `UPDATE subscriptions 
       SET status = 'ACTIVE', pause_start_date = NULL, pause_end_date = NULL
       WHERE status = 'PAUSED' AND pause_end_date < CURRENT_DATE`
    );

    const result = await db.query(
      `SELECT s.*, u.address AS user_address 
       FROM subscriptions s 
       LEFT JOIN users u ON s.user_id = u.id 
       WHERE s.mess_name = $1 
       ORDER BY s.created_at DESC`,
      [messName]
    );

    return res.status(200).json({ status: 'success', subscriptions: result.rows });
  } catch (err) {
    console.error('Get mess subscribers error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
};

// PUT /api/subscriptions/:id/status
const updateSubscriptionStatus = async (req, res) => {
  const { id } = req.params;
  const { status, pause_start_date, pause_end_date } = req.body;

  try {
    let result;
    if (status === 'PAUSED' && pause_start_date && pause_end_date) {
      result = await db.query(
        `UPDATE subscriptions SET status = $1, pause_start_date = $2, pause_end_date = $3 WHERE id = $4 RETURNING *`,
        [status, pause_start_date, pause_end_date, id]
      );
    } else {
      result = await db.query(
        `UPDATE subscriptions SET status = $1, pause_start_date = NULL, pause_end_date = NULL WHERE id = $2 RETURNING *`,
        [status, id]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Subscription not found.' });
    }

    return res.status(200).json({ status: 'success', subscription: result.rows[0] });
  } catch (err) {
    console.error('Update subscription status error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
};

// DELETE /api/subscriptions/:id
const deleteSubscription = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ status: 'error', message: 'Subscription ID is required.' });
  }

  try {
    const result = await db.query(
      `DELETE FROM subscriptions WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Subscription not found.' });
    }

    return res.status(200).json({ status: 'success', message: 'Subscription deleted successfully.' });
  } catch (err) {
    console.error('Delete subscription error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
};

module.exports = { 
  createSubscription, 
  getUserSubscriptions, 
  getMessSubscribers, 
  updateSubscriptionStatus,
  deleteSubscription
};
