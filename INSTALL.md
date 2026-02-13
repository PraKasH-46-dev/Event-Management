# 🚀 INSTALLATION INSTRUCTIONS

## Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)

---

## Step 1: Install MongoDB

### On Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### On macOS:
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### On Windows:
Download from: https://www.mongodb.com/try/download/community

---

## Step 2: Extract and Setup

1. Extract the ZIP file
2. Open terminal/command prompt
3. Navigate to the extracted folder:
```bash
cd event-management-system
```

---

## Step 3: Install Dependencies

```bash
npm install
```

This will install:
- express
- mongoose
- bcryptjs
- jsonwebtoken
- socket.io
- cors
- dotenv

---

## Step 4: Seed Database (IMPORTANT!)

```bash
npm run seed
```

This creates:
- 5 test users (one for each role)
- 5 sample venues
- 10 sample resources

**Test Credentials:**
- Coordinator: coordinator@university.edu / password123
- HOD: hod@university.edu / password123
- Dean: dean@university.edu / password123
- Head: head@university.edu / password123
- Admin: admin@university.edu / password123

---

## Step 5: Start the Server

```bash
npm start
```

You should see:
```
Server running on port 3000
MongoDB Connected
```

---

## Step 6: Open Browser

Navigate to:
```
http://localhost:3000
```

---

## 🎉 You're Done!

Login with any test credential and start exploring the system.

---

## Troubleshooting

### MongoDB Connection Error
Make sure MongoDB is running:
```bash
# Check status
sudo systemctl status mongodb

# Start if not running
sudo systemctl start mongodb
```

### Port 3000 Already in Use
Create a `.env` file and set a different port:
```bash
PORT=4000
MONGODB_URI=mongodb://localhost:27017/event_management
JWT_SECRET=your-secret-key
```

### Dependencies Installation Failed
Try:
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

## Next Steps

1. Read **QUICKSTART.md** for a guided tour
2. Check **README.md** for detailed documentation
3. Review **ARCHITECTURE.md** for system design
4. Explore the code to understand implementation

---

**Happy Event Managing!** 🎊
