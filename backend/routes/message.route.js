import express from 'express';
import Message from '../models/message.model.js';

const router = express.Router();

// 1. YENİ MESAJ GÖNDER (POST /api/messages)
router.post('/', async (req, res, next) => {
  // --- AJAN DEVREDE (DEBUG BAŞLANGIÇ) ---
  console.log("------------------------------------------");
  console.log("📍 [POST] /api/messages İsteği Alındı");
  console.log("📦 Frontend'den Gelen Veri (req.body):", req.body);

  try {
    const { eventId, senderId, senderName, text } = req.body;

    // Verilerin dolu olup olmadığını kontrol edelim
    if (!eventId) console.log("❌ UYARI: eventId EKSİK!");
    if (!senderId) console.log("❌ UYARI: senderId EKSİK!");
    if (!text) console.log("❌ UYARI: text (mesaj içeriği) EKSİK!");

    const newMessage = new Message({
      eventId,
      senderId,
      senderName, // Opsiyonel
      text
    });

    const savedMessage = await newMessage.save();
    
    console.log("✅ Mesaj MongoDB'ye Kaydedildi:", savedMessage);
    console.log("------------------------------------------");
    
    res.status(201).json(savedMessage);
  } catch (error) {
    // Hatayı burada yakalayıp terminale basıyoruz
    console.error("🔥 HATA OLUŞTU (Message Save Error):", error.message);
    // Hatanın tam detayı (Validation error vb. görmek için)
    console.error("🔥 Hata Detayı:", error); 
    console.log("------------------------------------------");
    next(error);
  }
});

// 2. BİR ETKİNLİĞİN MESAJLARINI GETİR (GET /api/messages/:eventId)
router.get('/:eventId', async (req, res, next) => {
  try {
    // Buraya da ufak bir log koyalım, listeleme çalışıyor mu görelim
    console.log(`📍 [GET] Mesajlar isteniyor. Event ID: ${req.params.eventId}`);
    
    const messages = await Message.find({ eventId: req.params.eventId })
                              .sort({ createdAt: 1 }); 
    res.json(messages);
  } catch (error) {
    next(error);
  }
});

export default router;