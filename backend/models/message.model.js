import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event', // Hangi etkinliğe ait?
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Mesajı kim attı?
    required: true
  },
  // Frontend'de ismi kolay göstermek için senderName de tutabiliriz
  // (Normalde sadece ID tutup populate yapılır ama şimdilik pratik olsun)
  senderName: {
    type: String,
    required: false
  },
  text: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Message = mongoose.model('Message', MessageSchema);

export default Message;