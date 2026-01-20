# KSW Martial Arts Attendance System

A comprehensive web-based student attendance tracking system designed for martial arts classes. This system features a student sign-in interface, admin portal for student management, and detailed attendance reporting.

## Features

### Student Sign-In Page
- Fast, real-time search to find students by name
- Visual class category badges (Little Lions, Juniors, Youths, Adults)
- One-tap attendance logging
- Prevents duplicate sign-ins on the same day
- Mobile-friendly interface

### Admin Portal
- Secure authentication with JWT tokens
- Complete student management (Create, Read, Update, Delete)
- Student categorization by class level
- Attendance reporting by month and class category
- Statistics dashboard showing:
  - Total students per category
  - Total classes attended
  - Average classes per student
- Recent attendance records with delete capability

### Technical Features
- Fully containerized with Docker
- PostgreSQL database for reliable data storage
- RESTful API backend
- Responsive React frontend
- Can be deployed locally or in the cloud

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: React
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Containerization**: Docker + Docker Compose

## Project Structure

```
KSW-Signin/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── students.js
│   │   │   └── attendance.js
│   │   ├── scripts/
│   │   │   └── initDb.js
│   │   └── server.js
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SignIn.js
│   │   │   ├── AdminLogin.js
│   │   │   └── AdminDashboard.js
│   │   ├── App.js
│   │   ├── api.js
│   │   └── index.js
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── .env.example
└── README.md
```

## Quick Start with Docker (Recommended)

### Prerequisites
- Docker
- Docker Compose

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd KSW-Signin
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Edit `.env` and change the default credentials:
```bash
# IMPORTANT: Change these values for production!
JWT_SECRET=your-very-secure-random-secret-key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
```

4. Start the application:
```bash
docker-compose up -d
```

5. Wait for services to initialize (about 30 seconds), then access:
- **Student Sign-In**: http://localhost:8080
- **Admin Portal**: http://localhost:8080/admin/login

**Note on Port 80 Conflicts:**
The application uses port 8080 by default to avoid conflicts with Apache, native nginx, or other services that commonly use port 80. If port 80 is available on your system, you can change the port in `docker-compose.yml` from `8080:80` to `80:80`. See `PORT_CONFLICT_TROUBLESHOOTING.md` for more details.

### Default Admin Credentials
- Username: `admin`
- Password: `admin123` (or what you set in `.env`)

**IMPORTANT**: Change the admin password immediately after first login!

## Manual Installation (Without Docker)

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Backend Setup

1. Install PostgreSQL and create database:
```bash
createdb ksw_attendance
createuser ksw_user -P  # Set password: ksw_password
```

2. Navigate to backend directory:
```bash
cd backend
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Initialize database:
```bash
npm run init-db
```

5. Start backend server:
```bash
npm start
# Development mode with auto-reload:
npm run dev
```

Backend will run on http://localhost:3001

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
npm install
```

2. Create `.env` file:
```bash
echo "REACT_APP_API_URL=http://localhost:3001/api" > .env
```

3. Start frontend:
```bash
npm start
```

Frontend will run on http://localhost:3000

## Database Schema

### Students Table
```sql
- id: Serial Primary Key
- name: VARCHAR(255) - Student name
- class_category: VARCHAR(50) - One of: Little Lions, Juniors, Youths, Adults
- active: BOOLEAN - Whether student is active
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Attendance Table
```sql
- id: Serial Primary Key
- student_id: INTEGER - Foreign key to students
- attendance_date: DATE - Date of attendance
- created_at: TIMESTAMP
- UNIQUE constraint on (student_id, attendance_date)
```

### Admin Users Table
```sql
- id: Serial Primary Key
- username: VARCHAR(100) - Unique username
- password_hash: VARCHAR(255) - Bcrypt hashed password
- created_at: TIMESTAMP
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/change-password` - Change admin password

### Students
- `GET /api/students/search?query=<name>` - Search students (public)
- `GET /api/students` - Get all students (admin)
- `GET /api/students/:id` - Get student by ID (admin)
- `POST /api/students` - Create student (admin)
- `PUT /api/students/:id` - Update student (admin)
- `DELETE /api/students/:id` - Deactivate student (admin)

### Attendance
- `POST /api/attendance` - Log attendance (public)
- `GET /api/attendance` - Get attendance records (admin)
- `GET /api/attendance/report/by-student` - Get attendance report (admin)
- `GET /api/attendance/stats` - Get attendance statistics (admin)
- `DELETE /api/attendance/:id` - Delete attendance record (admin)

## Usage Guide

### For Students

1. Open the sign-in page on a tablet or kiosk
2. Type your name in the search box
3. Tap your name when it appears
4. See confirmation message

### For Administrators

1. Log in to the admin portal
2. **Students Tab**:
   - View all active students
   - Add new students with name and class category
   - Edit student information
   - Deactivate students who are no longer attending

3. **Reports Tab**:
   - Select month and year
   - Filter by class category
   - View statistics by category
   - See detailed attendance counts per student
   - Review recent attendance records
   - Delete incorrect attendance entries

## Deployment

### Local Network Deployment

1. Find your server's IP address:
```bash
# Linux/Mac
ip addr show  # or ifconfig
# Windows
ipconfig
```

2. Update frontend environment:
```bash
# In frontend/.env
REACT_APP_API_URL=http://<your-server-ip>:3001/api
```

3. Access from any device on the network:
- Student Sign-In: `http://<your-server-ip>:8080`
- Admin Portal: `http://<your-server-ip>:8080/admin/login`

### Cloud Deployment

The application can be deployed to any cloud provider that supports Docker:

- **AWS**: ECS, EC2, or Lightsail
- **Google Cloud**: Cloud Run or GCE
- **Azure**: Container Instances or App Service
- **DigitalOcean**: App Platform or Droplets
- **Heroku**: Container Registry

Update the `REACT_APP_API_URL` environment variable to point to your backend URL.

## Maintenance

### Backup Database

```bash
# With Docker
docker exec ksw-postgres pg_dump -U ksw_user ksw_attendance > backup.sql

# Without Docker
pg_dump -U ksw_user ksw_attendance > backup.sql
```

### Restore Database

```bash
# With Docker
docker exec -i ksw-postgres psql -U ksw_user ksw_attendance < backup.sql

# Without Docker
psql -U ksw_user ksw_attendance < backup.sql
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

## Troubleshooting

### Database Connection Issues

1. Ensure PostgreSQL is running:
```bash
docker-compose ps
```

2. Check database logs:
```bash
docker-compose logs postgres
```

3. Verify credentials in `.env` file

### Frontend Cannot Connect to Backend

1. Check backend is running:
```bash
curl http://localhost:3001/api/health
```

2. Verify REACT_APP_API_URL in frontend/.env

3. Check CORS settings in backend

### Docker Issues

1. Rebuild containers:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

2. Reset database:
```bash
docker-compose down -v  # WARNING: Deletes all data!
docker-compose up -d
```

## Security Considerations

- Change default admin credentials immediately
- Use a strong, random JWT_SECRET in production
- Enable HTTPS for production deployments
- Keep dependencies updated
- Restrict database access to localhost
- Use environment variables for sensitive data
- Regular database backups

## Future Enhancements

- Email notifications for attendance
- Multi-school support
- Parent portal access
- QR code check-in
- Belt rank tracking
- Payment integration
- Automated reports via email
- Mobile apps (iOS/Android)

## License

MIT License - feel free to use and modify for your martial arts school!

## Support

For issues, questions, or contributions, please open an issue on the repository.