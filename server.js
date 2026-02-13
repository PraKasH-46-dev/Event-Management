const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/event_management';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB Connected');
}).catch(err => console.error('MongoDB connection error:', err));

// Schemas
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Coordinator', 'HOD', 'Dean', 'Head', 'Admin'],
    required: true 
  },
  department_id: String,
  school_id: String,
  createdAt: { type: Date, default: Date.now }
});

const venueSchema = new mongoose.Schema({
  name: { type: String, required: true },
  capacity: { type: Number, required: true },
  type: String,
  availability_status: { type: String, default: 'Available' },
  features: [String],
  createdAt: { type: Date, default: Date.now }
});

const resourceSchema = new mongoose.Schema({
  resource_name: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Equipment', 'Food', 'Facility', 'ITC'],
    required: true 
  },
  total_quantity: { type: Number, required: true },
  available_quantity: { type: Number, required: true },
  unit: String,
  createdAt: { type: Date, default: Date.now }
});

const eventSchema = new mongoose.Schema({
  coordinator_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: String,
  department_id: String,
  school_id: String,
  schedule_start: { type: Date, required: true },
  schedule_end: { type: Date, required: true },
  participant_count: { type: Number, required: true },
  venue_type_required: String,
  status: { 
    type: String, 
    enum: ['Pending', 'HOD_Review', 'Dean_Review', 'Head_Review', 'Approved', 'Running', 'Completed', 'Rejected'],
    default: 'Pending'
  },
  rejection_reason: String,
  modification_comments: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const eventResourceRequestSchema = new mongoose.Schema({
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  resource_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
  quantity_requested: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

const allocationSchema = new mongoose.Schema({
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  venue_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue' },
  resource_allocations: [{
    resource_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource' },
    allocated_quantity: Number
  }],
  start_time: { type: Date, required: true },
  end_time: { type: Date, required: true },
  status: { type: String, default: 'Active' },
  createdAt: { type: Date, default: Date.now }
});

const approvalLogSchema = new mongoose.Schema({
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: String,
  decision: { 
    type: String, 
    enum: ['Approved', 'Rejected', 'Modify'],
    required: true 
  },
  comments: String,
  timestamp: { type: Date, default: Date.now }
});

// Models
const User = mongoose.model('User', userSchema);
const Venue = mongoose.model('Venue', venueSchema);
const Resource = mongoose.model('Resource', resourceSchema);
const Event = mongoose.model('Event', eventSchema);
const EventResourceRequest = mongoose.model('EventResourceRequest', eventResourceRequestSchema);
const Allocation = mongoose.model('Allocation', allocationSchema);
const ApprovalLog = mongoose.model('ApprovalLog', approvalLogSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Authentication Middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error();
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) throw new Error();
    
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

// Socket.IO Connection
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('join_room', (userId) => {
    socket.join(userId);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Helper function to emit real-time updates
const emitUpdate = (event, data) => {
  io.emit(event, data);
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, department_id, school_id } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      department_id,
      school_id
    });
    
    await user.save();
    
    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    res.status(201).json({ 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    res.json({ 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department_id: user.department_id,
        school_id: user.school_id
      },
      token 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Event Routes
app.post('/api/events', authenticate, async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      coordinator_id: req.user._id,
      status: 'HOD_Review'
    };
    
    const event = new Event(eventData);
    await event.save();
    
    // Create resource requests
    if (req.body.resources && req.body.resources.length > 0) {
      const resourceRequests = req.body.resources.map(r => ({
        event_id: event._id,
        resource_id: r.resource_id,
        quantity_requested: r.quantity
      }));
      await EventResourceRequest.insertMany(resourceRequests);
    }
    
    emitUpdate('event_created', event);
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/events', authenticate, async (req, res) => {
  try {
    let query = {};
    
    // Role-based filtering
    if (req.user.role === 'Coordinator') {
      query.coordinator_id = req.user._id;
    } else if (req.user.role === 'HOD') {
      query.department_id = req.user.department_id;
    } else if (req.user.role === 'Dean') {
      query.school_id = req.user.school_id;
    }
    // Head and Admin can see all
    
    const events = await Event.find(query)
      .populate('coordinator_id', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/events/:id', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('coordinator_id', 'name email role');
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Get resource requests
    const resourceRequests = await EventResourceRequest.find({ event_id: event._id })
      .populate('resource_id');
    
    // Get allocation if exists
    const allocation = await Allocation.findOne({ event_id: event._id })
      .populate('venue_id')
      .populate('resource_allocations.resource_id');
    
    // Get approval logs
    const approvalLogs = await ApprovalLog.find({ event_id: event._id })
      .populate('approved_by', 'name role')
      .sort({ timestamp: 1 });
    
    res.json({
      event,
      resourceRequests,
      allocation,
      approvalLogs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approval Routes
app.post('/api/events/:id/approve', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const { decision, comments } = req.body;
    
    // Create approval log
    const approvalLog = new ApprovalLog({
      event_id: event._id,
      approved_by: req.user._id,
      role: req.user.role,
      decision,
      comments
    });
    await approvalLog.save();
    
    if (decision === 'Rejected') {
      event.status = 'Rejected';
      event.rejection_reason = comments;
      await event.save();
      emitUpdate('event_rejected', event);
      return res.json({ message: 'Event rejected', event });
    }
    
    if (decision === 'Modify') {
      event.status = 'Pending';
      event.modification_comments = comments;
      await event.save();
      emitUpdate('event_modification_requested', event);
      return res.json({ message: 'Modification requested', event });
    }
    
    // Approve - move to next stage
    const statusFlow = {
      'HOD_Review': 'Dean_Review',
      'Dean_Review': 'Head_Review',
      'Head_Review': 'Approved'
    };
    
    const nextStatus = statusFlow[event.status];
    if (!nextStatus) {
      return res.status(400).json({ error: 'Invalid approval flow' });
    }
    
    event.status = nextStatus;
    event.updatedAt = new Date();
    await event.save();
    
    // If fully approved, allocate resources
    if (nextStatus === 'Approved') {
      await allocateResources(event);
    }
    
    emitUpdate('event_approved', event);
    res.json({ message: 'Event approved', event });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resource Allocation Logic
async function allocateResources(event) {
  try {
    // Check for conflicts
    const conflicts = await checkConflicts(event);
    
    if (conflicts.length > 0) {
      event.status = 'Pending';
      event.modification_comments = `Conflicts detected: ${JSON.stringify(conflicts)}`;
      await event.save();
      emitUpdate('allocation_conflict', { event, conflicts });
      return;
    }
    
    // Find suitable venue
    const venue = await findSuitableVenue(event);
    if (!venue) {
      event.status = 'Pending';
      event.modification_comments = 'No suitable venue available';
      await event.save();
      emitUpdate('allocation_failed', event);
      return;
    }
    
    // Get resource requests
    const resourceRequests = await EventResourceRequest.find({ event_id: event._id });
    
    // Allocate resources
    const resourceAllocations = [];
    for (const request of resourceRequests) {
      const resource = await Resource.findById(request.resource_id);
      if (resource.available_quantity >= request.quantity_requested) {
        resource.available_quantity -= request.quantity_requested;
        await resource.save();
        
        resourceAllocations.push({
          resource_id: resource._id,
          allocated_quantity: request.quantity_requested
        });
      }
    }
    
    // Create allocation
    const allocation = new Allocation({
      event_id: event._id,
      venue_id: venue._id,
      resource_allocations: resourceAllocations,
      start_time: event.schedule_start,
      end_time: event.schedule_end
    });
    await allocation.save();
    
    venue.availability_status = 'Occupied';
    await venue.save();
    
    emitUpdate('resources_allocated', { event, allocation });
  } catch (error) {
    console.error('Allocation error:', error);
  }
}

async function checkConflicts(event) {
  const conflicts = [];
  
  // Check venue conflicts
  const overlappingEvents = await Allocation.find({
    $and: [
      { event_id: { $ne: event._id } },
      { status: 'Active' },
      {
        $or: [
          {
            start_time: { $lte: event.schedule_end },
            end_time: { $gte: event.schedule_start }
          }
        ]
      }
    ]
  }).populate('event_id');
  
  if (overlappingEvents.length > 0) {
    conflicts.push({
      type: 'venue',
      events: overlappingEvents.map(a => a.event_id.title)
    });
  }
  
  // Check resource conflicts
  const resourceRequests = await EventResourceRequest.find({ event_id: event._id });
  for (const request of resourceRequests) {
    const resource = await Resource.findById(request.resource_id);
    if (resource.available_quantity < request.quantity_requested) {
      conflicts.push({
        type: 'resource',
        resource: resource.resource_name,
        requested: request.quantity_requested,
        available: resource.available_quantity
      });
    }
  }
  
  return conflicts;
}

async function findSuitableVenue(event) {
  return await Venue.findOne({
    capacity: { $gte: event.participant_count },
    availability_status: 'Available'
  });
}

// Event Completion
app.post('/api/events/:id/complete', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    if (event.coordinator_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    event.status = 'Completed';
    await event.save();
    
    // Release resources
    const allocation = await Allocation.findOne({ event_id: event._id });
    if (allocation) {
      // Release venue
      if (allocation.venue_id) {
        await Venue.findByIdAndUpdate(allocation.venue_id, {
          availability_status: 'Available'
        });
      }
      
      // Release resources
      for (const resAlloc of allocation.resource_allocations) {
        await Resource.findByIdAndUpdate(resAlloc.resource_id, {
          $inc: { available_quantity: resAlloc.allocated_quantity }
        });
      }
      
      allocation.status = 'Completed';
      await allocation.save();
    }
    
    emitUpdate('event_completed', event);
    res.json({ message: 'Event completed and resources released', event });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Venue Routes
app.get('/api/venues', authenticate, async (req, res) => {
  try {
    const venues = await Venue.find();
    res.json(venues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/venues', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const venue = new Venue(req.body);
    await venue.save();
    emitUpdate('venue_created', venue);
    res.status(201).json(venue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resource Routes
app.get('/api/resources', authenticate, async (req, res) => {
  try {
    const resources = await Resource.find();
    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/resources', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const resource = new Resource(req.body);
    await resource.save();
    emitUpdate('resource_created', resource);
    res.status(201).json(resource);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard Stats
app.get('/api/dashboard/stats', authenticate, async (req, res) => {
  try {
    let eventQuery = {};
    
    if (req.user.role === 'Coordinator') {
      eventQuery.coordinator_id = req.user._id;
    } else if (req.user.role === 'HOD') {
      eventQuery.department_id = req.user.department_id;
    } else if (req.user.role === 'Dean') {
      eventQuery.school_id = req.user.school_id;
    }
    
    const totalEvents = await Event.countDocuments(eventQuery);
    const pendingEvents = await Event.countDocuments({ ...eventQuery, status: { $in: ['Pending', 'HOD_Review', 'Dean_Review', 'Head_Review'] } });
    const approvedEvents = await Event.countDocuments({ ...eventQuery, status: 'Approved' });
    const completedEvents = await Event.countDocuments({ ...eventQuery, status: 'Completed' });
    const runningEvents = await Event.countDocuments({ ...eventQuery, status: 'Running' });
    
    const totalVenues = await Venue.countDocuments();
    const availableVenues = await Venue.countDocuments({ availability_status: 'Available' });
    
    const totalResources = await Resource.countDocuments();
    
    res.json({
      events: {
        total: totalEvents,
        pending: pendingEvents,
        approved: approvedEvents,
        running: runningEvents,
        completed: completedEvents
      },
      venues: {
        total: totalVenues,
        available: availableVenues
      },
      resources: {
        total: totalResources
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
