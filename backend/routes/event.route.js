import express from 'express';
import Event from '../models/event.model.js'; // Senin çalışan import yapın

const router = express.Router();

// 1. YENİ ETKİNLİK OLUŞTUR (POST /api/events)
router.post('/', async (req, res, next) => {
  // AJAN 1: İstek geldi mi?
  console.log("📢 [POST] İstek Geldi!"); 
  console.log("📦 Gelen Veri:", req.body);

  try {
    const { routeId, title, date, time, maxParticipants } = req.body;

    // Basit doğrulama: routeId boş mu geliyor?
    if (!routeId) {
        console.log("❌ HATA: routeId boş geldi!");
    }

    const newEvent = new Event({
      routeId,
      title,
      date,
      time,
      maxParticipants,
    });

    const savedEvent = await newEvent.save();
    
    // AJAN 2: Kayıt başarılı mı?
    console.log("✅ [POST] Başarılı! Kaydedilen ID:", savedEvent._id);
    
    res.status(201).json(savedEvent);
  } catch (error) {
    console.error("🔥 [POST] Hata:", error.message);
    next(error); 
  }
});

// 2. BİR ROTAYA AİT ETKİNLİKLERİ GETİR (GET /api/events/:routeId)
router.get('/:routeId', async (req, res, next) => {
  const gelenRouteId = req.params.routeId;
  
  // AJAN 3: GET isteği ve ID kontrolü
  console.log(`📢 [GET] İstek Geldi. Aranan Route ID: ${gelenRouteId}`);

  try {
    const events = await Event.find({ routeId: gelenRouteId })
                              .sort({ date: 1 });
    
    // AJAN 4: Kaç tane bulundu?
    console.log(`✅ [GET] Sonuç: ${events.length} adet etkinlik bulundu.`);
    console.log("📄 Bulunanlar:", events);

    res.json(events);
  } catch (error) {
    console.error("🔥 [GET] Hata:", error.message);
    next(error);
  }
});

router.post('/:id/join', async (req, res, next) => {
  try {
    const { userId } = req.body; // Frontend'den user ID gelecek
    const eventId = req.params.id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Etkinlik bulunamadı" });

    // Kontenjan kontrolü
    if (event.participants.length >= event.maxParticipants) {
        return res.status(400).json({ message: "Kontenjan dolu!" });
    }

    // Zaten katılmış mı kontrolü?
    if (event.participants.includes(userId)) {
        return res.status(400).json({ message: "Zaten katılımcısınız." });
    }

    // Katılımcıyı ekle
    event.participants.push(userId);
    await event.save();

    res.status(200).json(event); // Güncel etkinliği dön
  } catch (error) {
    next(error);
  }
});

export default router;