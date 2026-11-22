import 'dotenv/config';
import express from 'express';
import { AccessToken } from 'livekit-server-sdk';
import { randomUUID } from 'crypto';

const {
  LIVEKIT_URL,
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET,
  ROOM_NAME = 'main-live',
  HOST_KEYS = '',
  PORT = 3000,
} = process.env;

if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  console.error('ناقص: LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET في ملف .env');
  process.exit(1);
}

// يقبل أي فاصل: , ، ; ؛ | مسافة أو سطر جديد
// مفتاح واحد = نفس المفتاح لكل المقدمين الأربعة، أو 4 مفاتيح = مفتاح لكل مقدم
let hostKeys = HOST_KEYS.split(/[\s,،;؛|]+/).map((s) => s.trim()).filter(Boolean);
if (hostKeys.length === 1) hostKeys = Array(4).fill(hostKeys[0]);
if (hostKeys.length !== 4) {
  console.error(`HOST_KEYS يجب أن يحتوي على مفتاح واحد أو 4 مفاتيح (الموجود الآن: ${hostKeys.length})`);
  process.exit(1);
}
if (hostKeys.includes('PASTE_HERE')) {
  console.warn('تنبيه: HOST_KEYS ما زال PASTE_HERE، غيّره من إعدادات Render');
}
console.log(`مفاتيح المقدمين: ${new Set(hostKeys).size === 1 ? 'مفتاح واحد مشترك' : '4 مفاتيح منفصلة'}`);

const app = express();
app.use(express.json());
app.use(express.static('public'));

// إصدار رمز الدخول
// body: { role: 'host' | 'viewer', name, slot?: 1-4, key?: string }
app.post('/api/token', async (req, res) => {
  try {
    const { role, name, slot, key } = req.body || {};
    const displayName = String(name || '').trim().slice(0, 40) || 'زائر';

    let identity;
    let canPublish = false;

    if (role === 'host') {
      const n = Number(slot);
      if (![1, 2, 3, 4].includes(n)) return res.status(400).json({ error: 'رقم المقدم غير صحيح' });
      if (hostKeys[n - 1] === 'PASTE_HERE') return res.status(503).json({ error: 'لم يُضبط مفتاح المقدمين بعد في إعدادات الخادم' });
      if (key !== hostKeys[n - 1]) return res.status(401).json({ error: 'المفتاح السري غير صحيح' });
      identity = `host-${n}`;
      canPublish = true;
    } else if (role === 'viewer') {
      identity = `viewer-${randomUUID()}`;
    } else {
      return res.status(400).json({ error: 'دور غير معروف' });
    }

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity,
      name: displayName,
      ttl: '6h',
    });
    at.addGrant({
      room: ROOM_NAME,
      roomJoin: true,
      canPublish,
      canPublishData: false,
      canSubscribe: true,
    });

    res.json({ token: await at.toJwt(), url: LIVEKIT_URL });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'تعذر إنشاء الرمز' });
  }
});

app.listen(PORT, () => console.log(`الموقع يعمل على http://localhost:${PORT}`));
