CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  mess_name VARCHAR(150),
  amount NUMERIC(10, 2),
  currency VARCHAR(10) DEFAULT 'INR',
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  razorpay_signature VARCHAR(255),
  status VARCHAR(50) DEFAULT 'created' CHECK (status IN ('created', 'success', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
