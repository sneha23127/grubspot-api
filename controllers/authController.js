const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { sendOtpEmail } = require('../utils/emailService');

// Country-specific phone validation rules (mirrors the frontend PHONE_RULES)
const PHONE_RULES = {
  '+91':  { pattern: /^[6-9]\d{9}$/,     hint: '10 digits starting with 6–9 (India)' },
  '+1':   { pattern: /^[2-9]\d{2}[2-9]\d{6}$/, hint: '10 digits – area code + number (US/Canada)' },
  '+44':  { pattern: /^[1-9]\d{8,9}$/,   hint: '9–10 digits without leading 0 (UK)' },
  '+61':  { pattern: /^[2-9]\d{8}$/,     hint: '9 digits without leading 0 (Australia)' },
  '+49':  { pattern: /^[1-9]\d{9,10}$/,  hint: '10–11 digits without leading 0 (Germany)' },
  '+971': { pattern: /^[0-9]\d{8}$/,     hint: '9 digits (UAE)' },
  '+65':  { pattern: /^[689]\d{7}$/,     hint: '8 digits starting with 6, 8, or 9 (Singapore)' },
};

/**
 * Validates a full phone string like "+91 9876543210".
 * Returns null if valid, or an error message string if invalid.
 */
function validatePhone(phone) {
  if (!phone || !phone.trim()) return 'Phone number is required.';

  // Split on the first space: [countryCode, localNumber]
  const spaceIdx = phone.indexOf(' ');
  if (spaceIdx === -1) return 'Phone must include a country code (e.g. +91 9876543210).';

  const countryCode = phone.slice(0, spaceIdx).trim();
  const localNumber = phone.slice(spaceIdx + 1).replace(/\s/g, '');

  if (!/^\+\d{1,4}$/.test(countryCode)) {
    return 'Invalid country code format.';
  }

  if (!/^\d+$/.test(localNumber)) {
    return 'Phone number must contain digits only (no spaces or symbols in the number part).';
  }

  const rule = PHONE_RULES[countryCode];
  if (rule) {
    if (!rule.pattern.test(localNumber)) {
      return `Invalid phone number for ${countryCode}. Expected format: ${rule.hint}.`;
    }
  } else {
    // Unknown country code — fall back to ITU range (7–15 digits)
    if (localNumber.length < 7 || localNumber.length > 15) {
      return 'Phone number must be 7–15 digits for the provided country code.';
    }
  }

  return null; // valid
}

// POST /api/signup
const signup = async (req, res) => {
  const { name, email, phone, role, mess_name, address, password } = req.body;

  // --- Server-side validation ---
  if (!name || !email || !password || !role) {
    return res.status(400).json({ status: 'error', message: 'Missing required fields.' });
  }

  // Name: at least 2 characters
  if (name.trim().length < 2) {
    return res.status(400).json({ status: 'error', message: 'Name must be at least 2 characters long.' });
  }

  // Email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ status: 'error', message: 'Invalid email address format.' });
  }

  const emailLower = email.trim().toLowerCase();
  if (role === 'mess_owner') {
    if (!emailLower.endsWith('@gmail.com')) {
      return res.status(400).json({ status: 'error', message: 'Mess owner email must be a Gmail address (@gmail.com).' });
    }
  } else {
    if (!emailLower.endsWith('@gmail.com') && !emailLower.endsWith('@kristujayanti.com')) {
      return res.status(400).json({ status: 'error', message: 'Email must be @gmail.com or @kristujayanti.com.' });
    }
  }

  // Phone: country-code-aware validation
  const phoneError = validatePhone(phone);
  if (phoneError) {
    return res.status(400).json({ status: 'error', message: phoneError });
  }

  // Password strength
  const hasLength   = password.length >= 8;
  const hasUpper    = /[A-Z]/.test(password);
  const hasNumber   = /[0-9]/.test(password);
  const hasSpecial  = /[^A-Za-z0-9]/.test(password);
  if (!hasLength || !hasUpper || !hasNumber || !hasSpecial) {
    return res.status(400).json({
      status: 'error',
      message: 'Password must be at least 8 characters and include one uppercase letter, one number, and one special character.'
    });
  }

  // Mess owner must provide mess_name
  if (role === 'mess_owner' && !mess_name) {
    return res.status(400).json({ status: 'error', message: 'Mess name is required for mess owners.' });
  }

  // Role validation
  const validRoles = ['student', 'mess_owner', 'admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ status: 'error', message: 'Invalid role specified.' });
  }

  try {
    // Check if email already exists
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ status: 'error', message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO users (name, email, phone, role, mess_name, address, password)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, phone, role, mess_name, address, status, created_at`,
      [name, email, phone || '', role, mess_name || null, address || null, hashedPassword]
    );

    const newUser = result.rows[0];

    // If mess_owner, also create a row in messes table
    if (role === 'mess_owner' && mess_name) {
      await db.query(
        `INSERT INTO messes (owner_id, mess_name, address)
         VALUES ($1, $2, $3)
         ON CONFLICT (owner_id) DO NOTHING`,
        [newUser.id, mess_name, address || null]
      );
    }

    return res.status(201).json({ status: 'success', user: newUser });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
};

// POST /api/login
const login = async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ status: 'error', message: 'Please provide email/username and password.' });
  }

  try {
    const result = await db.query(
      `SELECT id, name, email, phone, role, mess_name, address, password,
              details, menu_data, status, created_at
       FROM users
       WHERE email = $1`,
      [identifier]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials.' });
    }

    const user = result.rows[0];

    if (user.status === 'Blocked' || user.status === 'blocked') {
      return res.status(403).json({ status: 'error', message: 'Account is blocked. Contact admin.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials.' });
    }

    // Remove password before sending
    delete user.password;

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({ status: 'success', user, token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
};

// In-memory OTP store for simulated verification
const otpStore = new Map();

// POST /api/forgot-password
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ status: 'error', message: 'Email is required.' });
  }

  // Email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ status: 'error', message: 'Invalid email address format.' });
  }

  try {
    // Check if user exists
    const result = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'No account found with this email address.' });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP
    otpStore.set(email.toLowerCase(), { otp, expiresAt });

    // Send email using SMTP
    let emailResult;
    try {
      emailResult = await sendOtpEmail(email, otp);
    } catch (mailErr) {
      console.error('SMTP Send Error:', mailErr);
      return res.status(500).json({
        status: 'error',
        message: 'SMTP connection failed. Please verify SMTP settings in backend/.env.'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: emailResult.previewUrl
        ? 'Verification code sent! Check the preview link in your email client.'
        : 'Verification code sent to your email address.',
      previewUrl: emailResult.previewUrl || null
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
};

// POST /api/reset-password
const resetPassword = async (req, res) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
    return res.status(400).json({ status: 'error', message: 'Email, OTP, and new password are required.' });
  }

  // Password strength validation
  const hasLength  = password.length >= 8;
  const hasUpper   = /[A-Z]/.test(password);
  const hasNumber  = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  if (!hasLength || !hasUpper || !hasNumber || !hasSpecial) {
    return res.status(400).json({
      status: 'error',
      message: 'New password must be at least 8 characters and include one uppercase letter, one number, and one special character.'
    });
  }

  try {
    const cached = otpStore.get(email.toLowerCase());
    if (!cached) {
      return res.status(400).json({ status: 'error', message: 'No verification code requested or session expired.' });
    }

    if (Date.now() > cached.expiresAt) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ status: 'error', message: 'Verification code has expired. Please request a new one.' });
    }

    if (cached.otp !== otp) {
      return res.status(400).json({ status: 'error', message: 'Invalid verification code.' });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(password, 10);
    const updateResult = await db.query(
      'UPDATE users SET password = $1 WHERE email = $2 RETURNING id',
      [hashedPassword, email]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }

    // Clean up OTP
    otpStore.delete(email.toLowerCase());

    return res.status(200).json({
      status: 'success',
      message: 'Password reset successful. You can now log in with your new password.'
    });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
};

module.exports = { signup, login, forgotPassword, resetPassword };

