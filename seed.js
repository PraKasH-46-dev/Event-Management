const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/event_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Import models (simplified for seed)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  department_id: String,
  school_id: String
});

const venueSchema = new mongoose.Schema({
  name: String,
  capacity: Number,
  type: String,
  availability_status: String,
  features: [String]
});

const resourceSchema = new mongoose.Schema({
  resource_name: String,
  category: String,
  total_quantity: Number,
  available_quantity: Number,
  unit: String
});

const User = mongoose.model('User', userSchema);
const Venue = mongoose.model('Venue', venueSchema);
const Resource = mongoose.model('Resource', resourceSchema);

async function seedDatabase() {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Venue.deleteMany({});
    await Resource.deleteMany({});
    
    console.log('Cleared existing data');
    
    // Seed Users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const users = [
      {
        name: 'John Coordinator',
        email: 'coordinator@university.edu',
        password: hashedPassword,
        role: 'Coordinator',
        department_id: 'CS',
        school_id: 'Engineering'
      },
      {
        name: 'Sarah HOD',
        email: 'hod@university.edu',
        password: hashedPassword,
        role: 'HOD',
        department_id: 'CS',
        school_id: 'Engineering'
      },
      {
        name: 'Michael Dean',
        email: 'dean@university.edu',
        password: hashedPassword,
        role: 'Dean',
        department_id: null,
        school_id: 'Engineering'
      },
      {
        name: 'Dr. James Head',
        email: 'head@university.edu',
        password: hashedPassword,
        role: 'Head',
        department_id: null,
        school_id: null
      },
      {
        name: 'Admin User',
        email: 'admin@university.edu',
        password: hashedPassword,
        role: 'Admin',
        department_id: null,
        school_id: null
      }
    ];
    
    await User.insertMany(users);
    console.log('Seeded users');
    
    // Seed Venues
    const venues = [
      {
        name: 'Main Auditorium',
        capacity: 500,
        type: 'Auditorium',
        availability_status: 'Available',
        features: ['Projector', 'Sound System', 'AC', 'Stage']
      },
      {
        name: 'Conference Hall A',
        capacity: 150,
        type: 'Conference Hall',
        availability_status: 'Available',
        features: ['Projector', 'Whiteboard', 'AC', 'WiFi']
      },
      {
        name: 'Seminar Room 101',
        capacity: 60,
        type: 'Seminar Room',
        availability_status: 'Available',
        features: ['Projector', 'Whiteboard', 'AC']
      },
      {
        name: 'Open Amphitheater',
        capacity: 300,
        type: 'Outdoor',
        availability_status: 'Available',
        features: ['Stage', 'Sound System']
      },
      {
        name: 'Computer Lab 3',
        capacity: 80,
        type: 'Lab',
        availability_status: 'Available',
        features: ['Computers', 'Projector', 'AC', 'WiFi']
      }
    ];
    
    await Venue.insertMany(venues);
    console.log('Seeded venues');
    
    // Seed Resources
    const resources = [
      {
        resource_name: 'Projector',
        category: 'Equipment',
        total_quantity: 15,
        available_quantity: 15,
        unit: 'units'
      },
      {
        resource_name: 'Microphone',
        category: 'Equipment',
        total_quantity: 25,
        available_quantity: 25,
        unit: 'units'
      },
      {
        resource_name: 'Chairs',
        category: 'Facility',
        total_quantity: 1000,
        available_quantity: 1000,
        unit: 'units'
      },
      {
        resource_name: 'Tables',
        category: 'Facility',
        total_quantity: 200,
        available_quantity: 200,
        unit: 'units'
      },
      {
        resource_name: 'Laptop',
        category: 'ITC',
        total_quantity: 50,
        available_quantity: 50,
        unit: 'units'
      },
      {
        resource_name: 'Sound System',
        category: 'Equipment',
        total_quantity: 8,
        available_quantity: 8,
        unit: 'sets'
      },
      {
        resource_name: 'Catering Service',
        category: 'Food',
        total_quantity: 5000,
        available_quantity: 5000,
        unit: 'servings'
      },
      {
        resource_name: 'Coffee Break Kit',
        category: 'Food',
        total_quantity: 500,
        available_quantity: 500,
        unit: 'kits'
      },
      {
        resource_name: 'Banners',
        category: 'Facility',
        total_quantity: 30,
        available_quantity: 30,
        unit: 'units'
      },
      {
        resource_name: 'Extension Cords',
        category: 'ITC',
        total_quantity: 100,
        available_quantity: 100,
        unit: 'units'
      }
    ];
    
    await Resource.insertMany(resources);
    console.log('Seeded resources');
    
    console.log('\n=================================');
    console.log('Database seeded successfully!');
    console.log('=================================\n');
    console.log('Test Credentials:');
    console.log('Coordinator: coordinator@university.edu / password123');
    console.log('HOD: hod@university.edu / password123');
    console.log('Dean: dean@university.edu / password123');
    console.log('Head: head@university.edu / password123');
    console.log('Admin: admin@university.edu / password123\n');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Seeding error:', error);
    mongoose.connection.close();
  }
}

seedDatabase();
