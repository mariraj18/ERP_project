import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import sequelize from './config/database.js';
import './models/index.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import attendanceRoutes from './routes/attendance.js';
import messageRoutes from './routes/messages.js';
import staffMessageRoutes from './routes/staffMessages.js';
import analyticsRoutes from './routes/analytics.js';
import adminRoutes from './routes/admin.js';
import settingsRoutes from './routes/settings.js';
import departmentRoutes from './routes/departments.js';
import classRoutes from './routes/classes.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://erp-project-black.vercel.app/"
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/staff-messages', staffMessageRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/classes', classRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    frontend: 'http://localhost:5173/'
  });
});

// Quick access route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>College Attendance System</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                margin: 40px; 
                background: #f5f5f5;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { color: #333; text-align: center; }
            .link { 
                display: block; 
                margin: 15px 0; 
                padding: 15px; 
                background: #007bff; 
                color: white; 
                text-decoration: none; 
                border-radius: 8px;
                text-align: center;
                font-size: 18px;
                transition: background 0.3s;
            }
            .link:hover { 
                background: #0056b3; 
                transform: translateY(-2px);
            }
            .info { 
                background: #e7f3ff; 
                padding: 15px; 
                border-radius: 5px; 
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎓 College Attendance System</h1>
            <div class="info">
                <strong>Server is running successfully!</strong>
                <p>Use the links below to access different parts of the system.</p>
            </div>
            <a class="link" href="http://localhost:5173/" target="_blank">
                🎯 Open Frontend Application
            </a>
            <a class="link" href="http://localhost:${PORT}/api/health" target="_blank">
                📊 Check API Health Status
            </a>
            <a class="link" href="http://localhost:5173/admin" target="_blank">
                ⚙️ Admin Dashboard
            </a>
            <div style="text-align: center; margin-top: 20px; color: #666;">
                <p>Backend running on port: ${PORT}</p>
            </div>
        </div>
    </body>
    </html>
  `);
});

// Database connection and server start
const startServer = async () => {
  try {
    console.log('🔌 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Department migration already completed during setup

    console.log('🔄 Syncing database...');
    await sequelize.sync({ alter: true, force: false });
    console.log('✅ Database synchronized');

    // Check for staff messaging columns (silent check)
    try {
      const queryInterface = sequelize.getQueryInterface();
      const tableInfo = await queryInterface.describeTable('messages');
      
      const neededColumns = ['senderId', 'recipientId', 'isStaffMessage'];
      const missingColumns = neededColumns.filter(col => !tableInfo[col]);
      
      if (missingColumns.length > 0) {
        console.log(`🔄 Adding missing columns: ${missingColumns.join(', ')}`);
        for (const column of missingColumns) {
          await queryInterface.addColumn('messages', column, {
            type: column === 'isStaffMessage' ? 'BOOLEAN' : 'INTEGER',
            allowNull: true,
            defaultValue: column === 'isStaffMessage' ? false : null
          });
        }
        console.log('✅ Staff messaging setup completed');
      }
    } catch (migrationError) {
      // Silent fail - columns probably already exist
    }

    // Start server
    const server = app.listen(PORT, () => {
      console.log('─'.repeat(50));
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
      console.log(`🎯 Frontend App: http://localhost:5173/`);
      console.log(`🔧 Quick Access: http://localhost:${PORT}/`);
      console.log('─'.repeat(50));
    });

    // Handle port conflicts gracefully
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        const newPort = Number(PORT) + 1;
        console.log(`🔄 Port ${PORT} busy, trying ${newPort}...`);
        app.listen(newPort, () => {
          console.log(`🚀 Server running on port ${newPort}`);
          console.log(`🔗 Access via: http://localhost:${newPort}/`);
        });
      } else {
        console.error('❌ Server error:', error);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.log('💡 Check your database connection and try again');
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

startServer();

export default app;