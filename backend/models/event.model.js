import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: false
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  maxParticipants: {
    type: Number,
    default: 10
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Event = mongoose.model('Event', EventSchema);

export default Event;