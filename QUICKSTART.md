# Quick Start Guide - ERMS

## 🚀 5-Minute Setup

### Step 1: Install MongoDB (if not already installed)

**Ubuntu/Debian:**
```bash
sudo apt-get update && sudo apt-get install -y mongodb
sudo systemctl start mongodb
```

**macOS:**
```bash
brew tap mongodb/brew && brew install mongodb-community
brew services start mongodb-community
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Seed Database
```bash
npm run seed
```

Expected output:
```
MongoDB Connected
Cleared existing data
Seeded users
Seeded venues
Seeded resources

=================================
Database seeded successfully!
=================================

Test Credentials:
Coordinator: coordinator@university.edu / password123
HOD: hod@university.edu / password123
Dean: dean@university.edu / password123
Head: head@university.edu / password123
Admin: admin@university.edu / password123
```

### Step 4: Start Server
```bash
npm start
```

### Step 5: Open Browser
Navigate to: `http://localhost:3000`

## 🎯 Quick Test Workflow

### 1. Login as Coordinator
- Email: `coordinator@university.edu`
- Password: `password123`

### 2. Create an Event
1. Click "New Event" button
2. Fill in event details:
   - Title: "Tech Fest 2024"
   - Start Date: Tomorrow
   - End Date: Tomorrow + 1 day
   - Participants: 100
3. Select resources (e.g., Projector, Chairs)
4. Click "Submit Request"

### 3. Login as HOD
- Logout
- Login with: `hod@university.edu` / `password123`
- Go to "Approvals" section
- Review and approve the event

### 4. Login as Dean
- Logout
- Login with: `dean@university.edu` / `password123`
- Go to "Approvals" section
- Review and approve the event

### 5. Login as Head
- Logout
- Login with: `head@university.edu` / `password123`
- Go to "Approvals" section
- Review and approve the event
- **Event will be automatically allocated resources!**

### 6. Back to Coordinator
- Logout
- Login as coordinator again
- View your event - now shows "Approved" with allocated resources
- Click "Mark as Completed" when done
- Resources will be automatically released!

## 📊 Dashboard Features

### Overview Page
- Total events count
- Pending approvals
- Approved events
- Available venues
- Recent events list

### Events Page
- All events (filtered by role)
- Status filter
- Click any event to see details

### Venues Page
- All available venues
- Capacity information
- Current availability status

### Resources Page
- Resource inventory
- Available quantities
- Utilization percentage

### Approvals Page (HOD/Dean/Head only)
- Events waiting for your approval
- One-click approve/reject
- View full event details

## 🔐 Role Permissions

| Feature | Coordinator | HOD | Dean | Head | Admin |
|---------|------------|-----|------|------|-------|
| Create Events | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Own Events | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Dept Events | ❌ | ✅ | ❌ | ❌ | ✅ |
| View School Events | ❌ | ❌ | ✅ | ❌ | ✅ |
| View All Events | ❌ | ❌ | ❌ | ✅ | ✅ |
| Approve Events | ❌ | ✅ | ✅ | ✅ | ❌ |
| Manage Venues | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage Resources | ❌ | ❌ | ❌ | ❌ | ✅ |

## 🎨 Real-Time Features

The system updates automatically when:
- New events are created
- Events are approved/rejected
- Resources are allocated
- Events are completed
- Any user takes action

**No page refresh needed!** The interface updates in real-time.

## 💡 Tips

1. **Resource Selection**: Only select resources you need. Unused resources remain available for others.

2. **Event Status**: 
   - 🟡 Pending/Under Review = Waiting for approval
   - 🟢 Approved = Ready to go, resources allocated
   - 🔵 Running = Event in progress
   - ⚫ Completed = Finished, resources released
   - 🔴 Rejected = Request denied

3. **Conflict Detection**: The system automatically prevents:
   - Double-booking venues
   - Over-allocating resources
   - Capacity violations

4. **Mobile Friendly**: Access from any device - the UI is fully responsive.

## 🐛 Common Issues

### "Cannot connect to server"
- Check if MongoDB is running: `sudo systemctl status mongodb`
- Check if Node server is running: Should see "Server running on port 3000"

### "Failed to load events"
- Clear browser cache and reload
- Check browser console for errors (F12)
- Verify you're logged in

### "Real-time updates not working"
- Check Socket.IO connection in browser console
- Firewall might be blocking WebSocket connections
- Try refreshing the page

## 🎓 Next Steps

1. **Explore Features**: Try all roles to see different permissions
2. **Test Workflows**: Create multiple events, approve/reject some
3. **Check Conflicts**: Try to create overlapping events
4. **View Analytics**: Check the dashboard statistics
5. **Customize**: Modify venues, resources, or add new ones (as Admin)

## 📞 Need Help?

- Check `README.md` for detailed documentation
- Review code comments for technical details
- Test with provided sample credentials
- MongoDB must be running for the system to work

---

**Congratulations!** You now have a fully functional Event Resource Management System running locally. 🎉
