const db = require('../config/db');
const bcrypt = require('bcryptjs');

// GET /api/admin/messes
const getMesses = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
         u.id, u.name AS owner_name, u.email, u.phone, u.status AS user_status, u.created_at,
         m.id AS mess_id, m.mess_name, m.address, m.cuisine_type, m.meal_preference,
         m.status AS mess_status, m.home_delivery,
         COALESCE((SELECT AVG(rating) FROM reviews WHERE LOWER(mess_name) = LOWER(m.mess_name)), 0) AS avg_rating,
         COALESCE((SELECT COUNT(*) FROM reviews WHERE LOWER(mess_name) = LOWER(m.mess_name)), 0) AS total_reviews,
         COALESCE((SELECT COUNT(*) FROM subscriptions WHERE LOWER(mess_name) = LOWER(m.mess_name)), 0) AS total_subscribers
       FROM users u
       LEFT JOIN messes m ON m.owner_id = u.id
       WHERE u.role = 'mess_owner'
       ORDER BY u.created_at DESC`
    );
    return res.status(200).json({ status: 'success', messes: result.rows });
  } catch (err) {
    console.error('Admin get messes error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
};

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, email, phone, role, address, status, created_at
       FROM users
       ORDER BY created_at DESC`
    );
    return res.status(200).json({ status: 'success', users: result.rows });
  } catch (err) {
    console.error('Admin get users error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
};

// POST /api/admin/update-status  (block/unblock user or mess)
const updateStatus = async (req, res) => {
  const { id, status } = req.body;

  if (!id || !status) {
    return res.status(400).json({ status: 'error', message: 'ID and status are required.' });
  }

  try {
    const result = await db.query(
      `UPDATE users SET status = $1 WHERE id = $2 RETURNING id, name, status`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }

    return res.status(200).json({ status: 'success', user: result.rows[0] });
  } catch (err) {
    console.error('Update status error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
};

// POST /api/admin/add-mess-owner
const addMessOwner = async (req, res) => {
  const { name, email, phone, mess_name, address, password, googleMapUrl } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ status: 'error', message: 'Name, email and password are required.' });
  }

  try {
    // Check if email or phone already exists
    const existing = await db.query('SELECT id, email, phone FROM users WHERE email = $1 OR phone = $2', [email, phone]);
    if (existing.rows.length > 0) {
      const match = existing.rows[0];
      if (match.email === email) {
        return res.status(409).json({ status: 'error', message: 'Email already registered.' });
      }
      if (phone && match.phone === phone) {
        return res.status(409).json({ status: 'error', message: 'Phone number already registered.' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const detailsObj = googleMapUrl ? { googleMapUrl } : {};

    const result = await db.query(
      `INSERT INTO users (name, email, phone, role, mess_name, address, password, details)
       VALUES ($1, $2, $3, 'mess_owner', $4, $5, $6, $7)
       RETURNING id, name, email, phone, role, mess_name, address, created_at`,
      [name, email, phone || '', mess_name || null, address || null, hashedPassword, JSON.stringify(detailsObj)]
    );

    const newOwner = result.rows[0];

    // Create mess entry
    if (mess_name) {
      await db.query(
        `INSERT INTO messes (owner_id, mess_name, address)
         VALUES ($1, $2, $3)
         ON CONFLICT (owner_id) DO NOTHING`,
        [newOwner.id, mess_name, address || null]
      );
    }

    return res.status(201).json({ status: 'success', user: newOwner });
  } catch (err) {
    console.error('Add mess owner error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
};

// GET /api/admin/tickets
const getTickets = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT ticket_id, user_name, mess_name, category, subject, description, status, priority, created_at
       FROM tickets
       ORDER BY created_at DESC`
    );
    return res.status(200).json({ status: 'success', tickets: result.rows });
  } catch (err) {
    console.error('Get tickets error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
};

// POST /api/admin/update-ticket-status
const updateTicketStatus = async (req, res) => {
  const { ticket_id, status } = req.body;

  if (!ticket_id || !status) {
    return res.status(400).json({ status: 'error', message: 'ticket_id and status are required.' });
  }

  try {
    const result = await db.query(
      `UPDATE tickets SET status = $1 WHERE ticket_id = $2 RETURNING ticket_id, status`,
      [status, ticket_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Ticket not found.' });
    }

    return res.status(200).json({ status: 'success', ticket: result.rows[0] });
  } catch (err) {
    console.error('Update ticket status error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
};

// GET /api/admin/subscriptions
const getSubscriptions = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM subscriptions ORDER BY created_at DESC`
    );
    return res.status(200).json({ status: 'success', subscriptions: result.rows });
  } catch (err) {
    console.error('Admin get subscriptions error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ status: 'error', message: 'User ID is required.' });
  }

  try {
    // Get user details first (email, name, role, mess_name)
    const userRes = await db.query('SELECT name, email, role, mess_name FROM users WHERE id = $1', [id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }
    const user = userRes.rows[0];

    // 1. Delete associated reviews
    if (user.role === 'mess_owner') {
      if (user.mess_name) {
        await db.query('DELETE FROM reviews WHERE LOWER(mess_name) = LOWER($1)', [user.mess_name]);
      }
    } else {
      await db.query('DELETE FROM reviews WHERE user_id = $1 OR LOWER(user_name) = LOWER($2)', [id, user.name]);
    }

    // 2. Delete associated subscriptions
    if (user.role === 'mess_owner') {
      if (user.mess_name) {
        await db.query('DELETE FROM subscriptions WHERE LOWER(mess_name) = LOWER($1)', [user.mess_name]);
      }
    } else {
      await db.query('DELETE FROM subscriptions WHERE user_id = $1 OR LOWER(user_email) = LOWER($2)', [id, user.email]);
    }
    
    // 3. Delete associated tickets
    if (user.role === 'mess_owner') {
      if (user.mess_name) {
        await db.query('DELETE FROM tickets WHERE LOWER(mess_name) = LOWER($1)', [user.mess_name]);
      }
    } else {
      await db.query('DELETE FROM tickets WHERE LOWER(user_name) = LOWER($1)', [user.name]);
    }

    // 4. Delete associated messes (if they are a mess owner)
    await db.query('DELETE FROM messes WHERE owner_id = $1', [id]);

    // 5. Delete the user
    const result = await db.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, name',
      [id]
    );

    return res.status(200).json({ status: 'success', message: 'User deleted successfully.', user: result.rows[0] });
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
};

module.exports = { 
  getMesses, 
  getUsers, 
  updateStatus, 
  addMessOwner, 
  getTickets, 
  updateTicketStatus,
  getSubscriptions,
  deleteUser
};
