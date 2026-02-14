# College Attendance Management System

A complete full-stack attendance management system built with Node.js, React, and PostgreSQL. Features role-based authentication, real-time attendance marking, automated email notifications, and file messaging system.

## 🚀 Features

### Super Admin Panel
- Full CRUD operations for students and staff
- User management with role assignment
- System overview and statistics

### Staff Panel
- Mark daily attendance (Present/Absent)
- Automatic email notifications to parents when student is absent
- Send messages to students with file attachments
- View attendance reports and statistics

### Student Panel
- View personal attendance records and percentage
- Receive and read messages from staff
- Download attached files from messages
- Attendance trend visualization

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js, Sequelize ORM
- **Frontend**: React, Vite, TailwindCSS
- **Database**: PostgreSQL
- **Authentication**: JWT with role-based access control
- **Email**: Nodemailer (SMTP)
- **File Upload**: Multer with local storage

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- pgAdmin4 (recommended for database management)
- Git

## ⚡ Quick Setup Guide

### 1. Database Setup

1. **Install PostgreSQL** and **pgAdmin4** if not already installed
2. **Open pgAdmin4** and create a new database:
   - Right-click "Databases" → "Create" → "Database"
   - Database name: `college_attendance`
   - Owner: `postgres` (or your preferred user)
   - Click "Save"

### 2. Project Setup

1. **Clone/Download** this project
2. **Install dependencies**:
   ```bash
   npm run setup
   ```

3. **Configure environment variables**:
   - Copy `server/.env.example` to `server/.env`
   - Update the values:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=college_attendance
   DB_USER=postgres
   DB_PASSWORD=your_postgresql_password

   # JWT Secret (change this!)
   JWT_SECRET=your_super_secret_jwt_key_make_it_long_and_secure

   # Email Configuration (for absence notifications)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_gmail_app_password

   # Server Configuration  
   PORT=5000
   NODE_ENV=development
   ```

4. **Setup Gmail for email notifications** (Optional but recommended):
   - Go to your Google Account settings
   - Enable 2-Step Verification
   - Generate an "App Password" for the application
   - Use this app password in the `EMAIL_PASSWORD` field

5. **Seed the database** with demo data:
   ```bash
   npm run seed
   ```

6. **Start the application**:
   ```bash
   npm run dev
   ```

The application will start:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## 🔐 Demo Login Credentials

### Super Admin
- **Email**: admin@college.com
- **Password**: Admin@123

### Staff Members
- **Dr. John Smith**: john.smith@college.com / Staff@123
- **Prof. Sarah Johnson**: sarah.johnson@college.com / Staff@123

### Students (Example)
- **Alice Brown**: alice.brown@student.com / Student@123
- **Bob Wilson**: bob.wilson@student.com / Student@123
- All students use password: **Student@123**

## 📁 Project Structure

```
college-attendance-system/
├── server/                     # Backend (Node.js + Express)
│   ├── config/
│   │   ├── database.js        # PostgreSQL configuration
│   │   └── email.js           # Email service setup
│   ├── models/
│   │   ├── User.js            # User model (Admin/Staff/Student)
│   │   ├── Attendance.js      # Attendance records
│   │   ├── Message.js         # Staff-Student messaging
│   │   └── index.js           # Model relationships
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── users.js           # User management
│   │   ├── attendance.js      # Attendance operations
│   │   └── messages.js        # Messaging system
│   ├── middleware/
│   │   └── auth.js            # JWT & role-based auth
│   ├── seeders/
│   │   └── seed.js            # Database seeding script
│   ├── uploads/               # File storage directory
│   └── server.js              # Main server file
├── src/                       # Frontend (React + Vite)
│   ├── components/
│   │   └── Layout.tsx         # App layout with navigation
│   ├── contexts/
│   │   └── AuthContext.tsx    # Authentication state management
│   ├── pages/
│   │   ├── Login.tsx          # Login page
│   │   ├── SuperAdminDashboard.tsx
│   │   ├── StaffDashboard.tsx
│   │   └── StudentDashboard.tsx
│   ├── utils/
│   │   └── api.ts             # Axios HTTP client
│   └── App.tsx                # Main app component
└── README.md
```

## 💾 Database Schema

### Users Table
- **id**: Primary key
- **name**: Full name
- **email**: Unique email (login credential)  
- **passwordHash**: Bcrypt hashed password
- **role**: SUPER_ADMIN | STAFF | STUDENT
- **rollNumber**: Student roll number (students only)
- **parentEmail**: Parent's email (students only)
- **isActive**: Soft delete flag

### Attendance Table  
- **id**: Primary key
- **date**: Attendance date
- **status**: PRESENT | ABSENT
- **studentId**: Foreign key to Users
- **staffId**: Foreign key to Users (who marked)
- **remarks**: Optional absence reason

### Messages Table
- **id**: Primary key  
- **content**: Message text
- **filePath**: Uploaded file path (optional)
- **fileName**: Original filename (optional)
- **studentId**: Foreign key to Users (recipient)
- **staffId**: Foreign key to Users (sender)
- **isRead**: Read status flag

## 📧 Email System

When a student is marked **ABSENT**, the system automatically:
1. Sends an email to the parent's email address
2. Includes student name, date, and any remarks
3. Uses a professional email template

**Email Template Preview**:
```
Subject: Attendance Alert - [Student Name] - [Date]

Dear Parent,

Your child John Doe (Roll No: CS001) was marked ABSENT on 2024-01-15.

Remarks: No reason provided

If you have any concerns, please contact the school administration.

Best regards,
College Administration
```

## 🗂 File Upload System

Staff can send messages with file attachments:
- **Supported formats**: PDF, DOC, DOCX, Images, TXT, Excel, PowerPoint
- **File size limit**: 10MB per file
- **Storage**: Local filesystem (`server/uploads/`)
- **Security**: Role-based access control for downloads

## 🔒 Security Features

- **JWT Authentication** with role-based access control
- **Password hashing** using bcryptjs
- **SQL injection protection** via Sequelize ORM
- **File upload validation** with type and size restrictions
- **CORS configuration** for cross-origin requests
- **Environment variable protection** for sensitive data

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### User Management (Super Admin)
- `GET /api/users/students` - List all students  
- `POST /api/users/students` - Create student
- `PUT /api/users/students/:id` - Update student
- `DELETE /api/users/students/:id` - Delete student
- `GET /api/users/staff` - List all staff
- `POST /api/users/staff` - Create staff

### Attendance (Staff)
- `POST /api/attendance/mark` - Mark attendance
- `GET /api/attendance/date/:date` - Get attendance for date
- `GET /api/attendance/report` - Attendance report

### Attendance (Student)  
- `GET /api/attendance/my-attendance` - Get own attendance

### Messages
- `POST /api/messages/send` - Send message (Staff)
- `GET /api/messages/sent` - Get sent messages (Staff)
- `GET /api/messages/received` - Get received messages (Student)
- `PUT /api/messages/:id/read` - Mark message as read (Student)
- `GET /api/messages/download/:id` - Download attachment

## 🐛 Troubleshooting

### Database Connection Issues
1. Verify PostgreSQL is running
2. Check database name, username, and password in `.env`
3. Ensure the database `college_attendance` exists
4. Test connection in pgAdmin4

### Email Not Sending
1. Verify Gmail app password (not regular password)
2. Check EMAIL_HOST and EMAIL_PORT settings
3. Ensure 2-Step Verification is enabled on Gmail
4. Check console logs for detailed error messages

### Port Already in Use
1. Kill existing processes:
   ```bash
   killall node
   ```
2. Change ports in `.env` and `vite.config.ts`

### File Upload Issues
1. Check file size (max 10MB)
2. Verify file type is supported
3. Ensure `uploads` directory exists and is writable

## 🔧 Development

### Adding New Features
1. Backend: Add routes in `server/routes/`
2. Frontend: Add pages in `src/pages/`
3. Database: Update models in `server/models/`

### Running in Production
1. Set `NODE_ENV=production` in `.env`
2. Build frontend: `npm run build`
3. Use PM2 or similar for process management
4. Configure reverse proxy (nginx/Apache)
5. Use environment-specific database

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes  
4. Push to the branch
5. Open a Pull Request

---

**Happy Coding! 🚀**

For support or questions, please create an issue in the repository.