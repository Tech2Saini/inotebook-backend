// api/index.js
const express = require('express');
const app = express();
const cors = require('cors');
const authRoutes = require('../routes/auth');
const notesRoutes = require('../routes/notes');

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);

module.exports = app;  // For Vercel

// If running locally
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
