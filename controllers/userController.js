const db = require('../config/db');

// POST /api/users/update-profile
const updateProfile = async (req, res) => {
  const { id, name, mess_name, phone, address, email, details } = req.body;

  if (!id) {
    return res.status(400).json({ status: 'error', message: 'User ID is required.' });
  }

  try {
    // Update the users table
    const userResult = await db.query(
      `UPDATE users
       SET name    = COALESCE($1, name),
           phone   = COALESCE($2, phone),
           address = COALESCE($3, address),
           email   = COALESCE($4, email),
           details = COALESCE($5::jsonb, details)
       WHERE id = $6
       RETURNING id, name, email, phone, role, mess_name, address, details, menu_data, status, created_at`,
      [name, phone, address, email, details ? JSON.stringify(details) : null, id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }

    const updatedUser = userResult.rows[0];

    // If mess_owner, also sync to messes table
    if (mess_name) {
      await db.query(
        `UPDATE users SET mess_name = $1 WHERE id = $2`,
        [mess_name, id]
      );
      updatedUser.mess_name = mess_name;

      await db.query(
        `UPDATE messes
         SET mess_name     = $1,
             address       = COALESCE($2, address),
             cuisine_type  = COALESCE($3, cuisine_type),
             meal_preference = COALESCE($4, meal_preference),
             pricing       = COALESCE($5::jsonb, pricing),
             timings       = COALESCE($6::jsonb, timings),
             home_delivery = COALESCE($7, home_delivery)
         WHERE owner_id = $8`,
        [
          mess_name,
          address || null,
          details?.type || null,
          details?.tag || null,
          details?.pricing ? JSON.stringify(details.pricing) : null,
          details?.timings ? JSON.stringify(details.timings) : null,
          details?.homeDelivery ?? null,
          id
        ]
      );
    }

    return res.status(200).json({ status: 'success', user: updatedUser });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
};

// POST /api/users/update-menu
const updateMenu = async (req, res) => {
  const { id, menu_data } = req.body;

  if (!id || !menu_data) {
    return res.status(400).json({ status: 'error', message: 'User ID and menu_data are required.' });
  }

  try {
    const result = await db.query(
      `UPDATE users SET menu_data = $1::jsonb WHERE id = $2
       RETURNING id, menu_data`,
      [JSON.stringify(menu_data), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }

    return res.status(200).json({ status: 'success', user: result.rows[0] });
  } catch (err) {
    console.error('Update menu error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
};

module.exports = { updateProfile, updateMenu };
