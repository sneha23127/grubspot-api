const db = require('../config/db');
const { geocodeAddress } = require('../utils/geocode');

// GET /api/messes — returns all mess owners joined with messes table
const getMesses = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
         u.id, u.name AS owner_name, u.email, u.phone, u.address AS owner_address,
         u.details, u.menu_data, u.created_at,
         m.id AS mess_id, m.mess_name, m.cuisine_type, m.meal_preference,
         m.pricing, m.timings, m.home_delivery, m.address, m.status AS mess_status,
         m.latitude, m.longitude,
         COALESCE((SELECT AVG(rating) FROM reviews r WHERE LOWER(r.mess_name) = LOWER(m.mess_name)), 0) AS avg_rating,
         (SELECT COUNT(*) FROM reviews r WHERE LOWER(r.mess_name) = LOWER(m.mess_name)) AS total_reviews
       FROM users u
       JOIN messes m ON m.owner_id = u.id
       WHERE u.role = 'mess_owner'
       ORDER BY u.created_at DESC`
    );

    const messes = result.rows;

    // Auto-geocode any messes that are missing lat/lng (fire-and-forget per mess)
    for (const mess of messes) {
      if ((mess.latitude == null || mess.longitude == null) && (mess.address || mess.details?.googleMapUrl)) {
        // Don't await — geocode asynchronously and save to DB in the background
        geocodeAndSave(mess.mess_id, mess.address, mess.details?.googleMapUrl).then(coords => {
          if (coords) {
            // Update in-memory row so THIS response already has coordinates
            mess.latitude = coords.lat;
            mess.longitude = coords.lng;
          }
        });
      }
    }

    // Small delay to allow fast geocoding to populate before sending response
    // (Only matters for the very first request per mess)
    await new Promise(r => setTimeout(r, 300));

    return res.status(200).json({ status: 'success', messes });
  } catch (err) {
    console.error('Get messes error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
};

/**
 * Geocode a mess address (or extract from URL) and persist lat/lng to the messes table.
 */
async function geocodeAndSave(messId, address, googleMapUrl = null) {
  try {
    const coords = await geocodeAddress(address, googleMapUrl);
    if (coords) {
      await db.query(
        `UPDATE messes SET latitude = $1, longitude = $2 WHERE id = $3`,
        [coords.lat, coords.lng, messId]
      );
      console.log(`[Geocode] Saved coords for mess ${messId}: ${coords.lat}, ${coords.lng}`);
    }
    return coords;
  } catch (err) {
    console.error(`[Geocode] Failed to save coords for mess ${messId}:`, err.message);
    return null;
  }
}

module.exports = { getMesses };
