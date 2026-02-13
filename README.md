# Institutional Event Resource Management System (ERMS)

A comprehensive, real-time event and resource management system for institutional environments with multi-level approval workflows.

## 🎯 Features

### Core Functionality
- **Multi-Role Access Control**: Coordinator, HOD, Dean, Institutional Head, Admin/ITC
- **Hierarchical Approval Workflow**: Sequential approval from HOD → Dean → Head
- **Real-Time Updates**: Socket.IO powered live notifications
- **Resource Allocation Engine**: Automatic conflict detection and resolution
- **Venue Management**: Track availability and capacity
- **Resource Inventory**: Monitor usage and availability
- **Audit Trail**: Complete approval and allocation history

### Role-Based Features

#### Event Coordinator
- Create and submit event requests
- Track event status in real-time
- Request resources and venues
- Mark events as completed
- View own events and allocations

#### HOD (Head of Department)
- Review department events
- Approve/reject/request modifications
- View department-level analytics
- Track resource utilization

#### Dean
- Review school-wide events
- Multi-department visibility
- Strategic resource planning
- School-level analytics

#### Institutional Head
- Institution-wide overview
- Final approval authority
- Complete event visibility
- Strategic planning insights

#### Admin/ITC
- Full system access
- Venue and resource management
- Add/edit/delete resources
- System configuration

## 🏗️ Architecture

### Technology Stack
- **Backend**: Node.js + Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-Time**: Socket.IO
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Authentication**: JWT (JSON Web Tokens)
- **Password Security**: bcrypt

### System Architecture
```
┌─────────────────┐
│  Presentation   │  HTML5, CSS3, JavaScript
│      Layer      │  Role-based Dashboards
└────────┬────────┘
         │
┌────────▼────────┐
│   Application   │  Express.js REST API
│      Layer      │  Socket.IO Real-time
│                 │  JWT Authentication
│                 │  Workflow Engine
│                 │  Allocation Engine
└────────┬────────┘
         │
┌────────▼────────┐
│   Data Layer    │  MongoDB
│                 │  Event Database
│                 │  User Management
│                 │  Resource Inventory
│                 │  Allocation Logs
└─────────────────┘
```

## 🚀 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Step 1: Install MongoDB

#### Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

#### macOS:
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Windows:
Download and install from: https://www.mongodb.com/try/download/community

### Step 2: Clone and Setup

```bash
# Navigate to project directory
cd event-resource-management

# Install dependencies
npm install

# Seed the database with sample data
npm run seed
```

### Step 3: Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## 📝 Default Test Credentials

After running `npm run seed`, use these credentials to login:

| Role | Email | Password |
|------|-------|----------|
| Coordinator | coordinator@university.edu | password123 |
| HOD | hod@university.edu | password123 |
| Dean | dean@university.edu | password123 |
| Head | head@university.edu | password123 |
| Admin | admin@university.edu | password123 |

## 🔄 Workflow Process

### Event Creation Flow
```
1. Coordinator creates event request
   ↓
2. HOD reviews and approves
   ↓
3. Dean reviews and approves
   ↓
4. Institutional Head approves
   ↓
5. System allocates resources automatically
   ↓
6. Event runs
   ↓
7. Coordinator marks as completed
   ↓
8. Resources automatically released
```

### Approval States
- `Pending`: Initial submission
- `HOD_Review`: Awaiting HOD approval
- `Dean_Review`: Awaiting Dean approval
- `Head_Review`: Awaiting Head approval
- `Approved`: Fully approved, resources allocated
- `Running`: Event in progress
- `Completed`: Event finished, resources released
- `Rejected`: Request denied at any stage

## 🎨 Key Features in Detail

### Conflict Detection
The system automatically detects:
- **Venue Conflicts**: Overlapping bookings
- **Resource Shortages**: Insufficient available quantities
- **Capacity Issues**: Participant count exceeds venue capacity

### Real-Time Notifications
Users receive instant updates for:
- Event creation
- Approval/rejection decisions
- Resource allocation
- Event completion
- System conflicts

### Resource Allocation Algorithm
```
1. Check venue capacity >= participants
2. Verify resource availability
3. Detect time conflicts
4. If conflicts exist:
   - Return detailed conflict report
   - Suggest alternative slots
5. If no conflicts:
   - Reserve venue
   - Allocate resources
   - Update availability
```

## 📊 Database Schema

### Collections

#### Users
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: Enum ['Coordinator', 'HOD', 'Dean', 'Head', 'Admin'],
  department_id: String,
  school_id: String
}
```

#### Events
```javascript
{
  coordinator_id: ObjectId (ref: User),
  title: String,
  description: String,
  schedule_start: Date,
  schedule_end: Date,
  participant_count: Number,
  status: Enum,
  department_id: String,
  school_id: String
}
```

#### Venues
```javascript
{
  name: String,
  capacity: Number,
  type: String,
  availability_status: String,
  features: [String]
}
```

#### Resources
```javascript
{
  resource_name: String,
  category: Enum ['Equipment', 'Food', 'Facility', 'ITC'],
  total_quantity: Number,
  available_quantity: Number,
  unit: String
}
```

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Protected API endpoints
- SQL injection prevention (MongoDB)
- XSS protection

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Events
- `GET /api/events` - Get events (role-filtered)
- `POST /api/events` - Create new event
- `GET /api/events/:id` - Get event details
- `POST /api/events/:id/approve` - Approve/reject event
- `POST /api/events/:id/complete` - Mark event complete

### Venues
- `GET /api/venues` - Get all venues
- `POST /api/venues` - Create venue (Admin only)

### Resources
- `GET /api/resources` - Get all resources
- `POST /api/resources` - Create resource (Admin only)

### Dashboard
- `GET /api/dashboard/stats` - Get statistics (role-filtered)

## 🎨 UI Features

- **Modern Design**: Clean, professional interface
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Real-time Updates**: Live data refresh via Socket.IO
- **Color-Coded Status**: Visual status indicators
- **Interactive Dashboards**: Role-specific views
- **Modal Dialogs**: Smooth user interactions
- **Toast Notifications**: Non-intrusive alerts

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/event_management
JWT_SECRET=your-secure-secret-key-change-this
NODE_ENV=development
```

## 📈 Future Enhancements

- [ ] Email notifications
- [ ] Calendar integration
- [ ] Mobile app
- [ ] Advanced analytics
- [ ] Resource utilization reports
- [ ] Automated conflict resolution
- [ ] Multi-language support
- [ ] Export functionality (PDF, Excel)

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB is running
sudo systemctl status mongodb

# Restart MongoDB
sudo systemctl restart mongodb
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Socket.IO Connection Issues
- Check if port 3000 is accessible
- Verify CORS settings
- Check firewall rules

## 📄 License

This project is for educational purposes.

## 👥 Support

For issues and questions:
- Check the documentation
- Review the code comments
- Test with provided credentials

## 🎓 Learning Outcomes

This project demonstrates:
- Full-stack JavaScript development
- Real-time web applications
- Database design and optimization
- Authentication and authorization
- Complex business logic implementation
- RESTful API design
- Modern UI/UX principles
- Software architecture patterns

---

**Note**: This is a production-ready system suitable for institutional deployment. Customize roles, workflows, and features based on your specific requirements.
