const db = require('../config/db');

// POST /api/reviews
const createReview = async (req, res) => {
  const { user_id, user_name, mess_name, rating, comment } = req.body;

  if (!user_id || !mess_name || !rating) {
    return res.status(400).json({ status: 'error', message: 'User ID, Mess Name and Rating are required.' });
  }

  try {
    const result = await db.query(
      `INSERT INTO reviews (user_id, user_name, mess_name, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, user_name, mess_name, rating, comment]
    );

    return res.status(201).json({ status: 'success', review: result.rows[0] });
  } catch (err) {
    console.error('Create review error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
};

// GET /api/reviews/mess/:messName
const getMessReviews = async (req, res) => {
  const { messName } = req.params;

  try {
    const result = await db.query(
      `SELECT * FROM reviews WHERE LOWER(mess_name) = LOWER($1) ORDER BY created_at DESC`,
      [messName]
    );

    return res.status(200).json({ status: 'success', reviews: result.rows });
  } catch (err) {
    console.error('Get reviews error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
};

module.exports = { createReview, getMessReviews };
