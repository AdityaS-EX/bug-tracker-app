const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects'); // Import project routes
const ticketRoutes = require('./routes/tickets'); // Import ticket routes
const commentRoutes = require('./routes/comments'); // Import comment routes

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});


// Use Auth Routes
app.use('/api/auth', authRoutes);
// Use Project Routes
app.use('/api/projects', projectRoutes); // Use project routes
// Use Ticket Routes
app.use('/api/tickets', ticketRoutes); // Use ticket routes
// Use Comment Routes
app.use('/api/comments', commentRoutes); // Use comment routes

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));