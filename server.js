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

const hostKeys = HOST_KEYS.split(',').map((s) => s.trim());
if (hostKeys.length !== 4 || hostKeys.some((k) => !k)) {
  console.error('HOST_KEYS يجب أن يحتوي على 4 مفاتيح مفصولة بفاصلة');
  process.exit(1);
}

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
