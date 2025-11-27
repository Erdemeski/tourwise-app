import React, { useState, useEffect, useRef } from 'react';
import { FiCalendar, FiX, FiUsers, FiClock, FiArrowLeft, FiPlus, FiSend, FiCheck } from 'react-icons/fi';
import { motion } from 'motion/react';

const API_URL = 'http://localhost:3000/api/events';
const MSG_API_URL = 'http://localhost:3000/api/messages';

const RouteEventsModal = ({ isOpen, onClose, routeTitle, routeId, initialMode = 'list' }) => {
    const [view, setView] = useState(initialMode);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // --- KULLANICI STATE'İ (LocalStorage'dan gelecek) ---
    const [currentUser, setCurrentUser] = useState(null);

    // --- CHAT STATE'LERİ ---
    const [messages, setMessages] = useState([]);
    const [msgInput, setMsgInput] = useState('');
    const messagesEndRef = useRef(null);

    const [formData, setFormData] = useState({
        title: '',
        date: '',
        time: '',
        maxParticipants: 10
    });

    useEffect(() => {
        setView(initialMode);
    }, [initialMode]);

    // --- 1. KULLANICIYI LOCALSTORAGE'DAN ÇEKME ---
    useEffect(() => {
        try {
            const persistRoot = localStorage.getItem("persist:root");
            if (persistRoot) {
                const parsedRoot = JSON.parse(persistRoot);
                if (parsedRoot.user) {
                    const userState = JSON.parse(parsedRoot.user);
                    if (userState.currentUser) {
                        setCurrentUser(userState.currentUser);
                    }
                }
            }
        } catch (error) {
            console.error("Kullanıcı verisi okunurken hata:", error);
        }
    }, []);

    // --- 2. VERİ ÇEKME ---
    useEffect(() => {
        if (isOpen && view === 'list') {
            fetchEvents();
        }
    }, [isOpen, view, routeId]);

    // --- 3. CHAT MESAJLARI ---
    useEffect(() => {
        if (view === 'chat' && selectedEvent) {
            fetchMessages(selectedEvent._id);
        }
    }, [view, selectedEvent]);

    // Mesaj gelince kaydır
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchEvents = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`${API_URL}/${routeId}`);
            if (!res.ok) throw new Error('Veri çekilemedi');
            const data = await res.json();
            setEvents(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMessages = async (eventId) => {
        try {
            const res = await fetch(`${MSG_API_URL}/${eventId}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (error) {
            console.error("Mesajlar yüklenemedi:", error);
        }
    };

    // --- YENİ: ETKİNLİĞE KATILMA FONKSİYONU ---
    const handleJoinEvent = async (eventId) => {
        if (!currentUser) {
            alert("Etkinliğe katılmak için giriş yapmalısınız.");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/${eventId}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser._id })
            });

            if (res.ok) {
                // Başarılı olursa listeyi yenile (Katılımcı sayısı artsın diye)
                fetchEvents(); 
                alert("Etkinliğe başarıyla katıldınız! 🎉");
            } else {
                const errData = await res.json();
                alert(errData.message || "Hata oluştu");
            }
        } catch (error) {
            console.error("Katılma hatası:", error);
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, routeId })
            });

            if (res.ok) {
                setView('list');
                fetchEvents();
            } else {
                alert("Hata oluştu");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!msgInput.trim()) return;
        if (!currentUser) {
            alert("Giriş yapmalısınız.");
            return;
        }

        try {
            const payload = {
                eventId: selectedEvent._id,
                senderId: currentUser._id,
                senderName: currentUser.username || currentUser.name || "Kullanıcı",
                text: msgInput
            };

            const res = await fetch(MSG_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const savedMsg = await res.json();
                setMessages([...messages, savedMsg]);
                setMsgInput('');
            }
        } catch (error) {
            console.error("Mesaj gönderilemedi:", error);
        }
    };

    const handleOpenChat = (evt) => {
        setSelectedEvent(evt);
        setView('chat');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[85vh]"
            >
                {/* --- 1. LİSTE GÖRÜNÜMÜ --- */}
                {view === 'list' && (
                    <>
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Etkinlikler</h3>
                                <p className="text-xs text-slate-500 truncate max-w-[200px]">{routeTitle}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setView('create')} className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition"><FiPlus className="w-5 h-5" /></button>
                                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><FiX className="w-5 h-5" /></button>
                            </div>
                        </div>

                        <div className="overflow-y-auto p-4 space-y-3 flex-1">
                            {isLoading ? (
                                <p className="text-center text-slate-500 mt-10">Yükleniyor...</p>
                            ) : events.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                    <FiCalendar className="w-10 h-10 mb-2 opacity-20" />
                                    <p>Henüz etkinlik yok.</p>
                                    <button onClick={() => setView('create')} className="mt-2 text-indigo-600 font-medium text-sm">İlk sen oluştur</button>
                                </div>
                            ) : events.map(evt => {
                                // Kullanıcı katılmış mı?
                                const isJoined = currentUser && evt.participants?.includes(currentUser._id);
                                // Kontenjan dolu mu?
                                const isFull = (evt.participants?.length || 0) >= evt.maxParticipants;

                                return (
                                    <div key={evt._id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
                                        <div className="flex justify-between">
                                            <h4 className="font-medium text-slate-800 dark:text-white">{evt.title}</h4>
                                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{evt.time}</span>
                                        </div>
                                        <div className="flex gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                                            <span className="flex items-center gap-1"><FiCalendar className="w-3.5 h-3.5"/> {evt.date}</span>
                                            <span className="flex items-center gap-1"><FiUsers className="w-3.5 h-3.5"/> {evt.participants?.length || 0}/{evt.maxParticipants}</span>
                                        </div>

                                        {/* --- BUTON GRUBU --- */}
                                        <div className="mt-3 flex gap-2">
                                            {/* SOHBET BUTONU */}
                                            <button 
                                                onClick={() => handleOpenChat(evt)} 
                                                className="flex-1 py-2 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-600 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-50 transition"
                                            >
                                                Sohbet
                                            </button>

                                            {/* KATIL BUTONU (Mantıksal Durumlar) */}
                                            {isJoined ? (
                                                <button 
                                                    disabled 
                                                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-semibold"
                                                >
                                                    <FiCheck className="w-3.5 h-3.5" /> Katıldınız
                                                </button>
                                            ) : isFull ? (
                                                <button 
                                                    disabled 
                                                    className="flex-1 py-2 bg-slate-100 text-slate-400 border border-slate-200 rounded-lg text-xs font-semibold cursor-not-allowed"
                                                >
                                                    Dolu
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => handleJoinEvent(evt._id)}
                                                    className="flex-1 py-2 bg-indigo-600 text-white border border-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-700 transition shadow-sm"
                                                >
                                                    Katıl
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* --- 2. OLUŞTURMA FORMU --- */}
                {view === 'create' && (
                    <>
                        <div className="flex items-center gap-3 p-4 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                            <button onClick={() => setView('list')} className="p-1 rounded-full hover:bg-slate-100 text-slate-600">
                                <FiArrowLeft className="w-5 h-5" />
                            </button>
                            <h3 className="font-semibold text-slate-900 dark:text-white">Yeni Etkinlik Planla</h3>
                        </div>
                        
                        <form onSubmit={handleCreateEvent} className="p-5 space-y-4 overflow-y-auto flex-1 bg-white dark:bg-slate-800">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Etkinlik Başlığı</label>
                                <input required type="text" className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 p-2.5 text-sm"
                                    onChange={e => setFormData({...formData, title: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Tarih</label>
                                    <input required type="date" className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 p-2.5 text-sm"
                                        onChange={e => setFormData({...formData, date: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Saat</label>
                                    <input required type="time" className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 p-2.5 text-sm"
                                        onChange={e => setFormData({...formData, time: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Maksimum Katılımcı</label>
                                <input type="number" min="2" max="50" defaultValue={10} className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 p-2.5 text-sm"
                                    onChange={e => setFormData({...formData, maxParticipants: e.target.value})} />
                            </div>
                            <div className="pt-4 mt-auto">
                                <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
                                    Etkinliği Yayınla
                                </button>
                            </div>
                        </form>
                    </>
                )}

                {/* --- 3. CHAT SİSTEMİ --- */}
                {view === 'chat' && selectedEvent && (
                    <>
                        <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-indigo-50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-2">
                                <button onClick={() => setView('list')} className="p-1.5 rounded-full hover:bg-white/50 text-indigo-700 dark:text-indigo-300">
                                    <FiArrowLeft className="w-5 h-5" />
                                </button>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{selectedEvent.title}</h3>
                                    <p className="text-[10px] text-slate-500">Sohbet Odası</p>
                                </div>
                            </div>
                            <button onClick={onClose}><FiX className="w-5 h-5 text-slate-400"/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-900/20">
                            {messages.length === 0 ? (
                                <p className="text-center text-xs text-slate-400 mt-4">Henüz mesaj yok. İlk mesajı sen yaz!</p>
                            ) : (
                                messages.map((msg, index) => {
                                    const isMe = currentUser && msg.senderId === currentUser._id;
                                    return (
                                        <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                                                isMe 
                                                ? 'bg-indigo-600 text-white rounded-br-none' 
                                                : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-bl-none shadow-sm'
                                            }`}>
                                                {!isMe && <p className="text-[10px] font-bold opacity-70 mb-0.5 text-indigo-500">{msg.senderName || 'Misafir'}</p>}
                                                <p>{msg.text}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex gap-2">
                            <input 
                                type="text" 
                                value={msgInput}
                                onChange={(e) => setMsgInput(e.target.value)}
                                placeholder={currentUser ? "Mesaj yaz..." : "Giriş yapmalısınız..."}
                                disabled={!currentUser}
                                className="flex-1 bg-slate-100 dark:bg-slate-900 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white outline-none disabled:opacity-50"
                            />
                            <button type="submit" disabled={!msgInput.trim() || !currentUser} className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                                <FiSend className="w-4 h-4 translate-x-0.5" />
                            </button>
                        </form>
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default RouteEventsModal;