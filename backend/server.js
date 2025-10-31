
require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const webpush = require('web-push');
const {
  parseServiceRequest,
  generateProviderProfile,
  generateLogoImage,
  generateDetailedServices,
  decideBookingAction,
  verifyProviderImage,
  getReadableLocation,
  getCityFromCoordinates,
  initChatSession,
  sendMessageStream,
  closeChatSession,
  generateQuotationItems,
  generateSearchSuggestions,
  getLocalHubData,
} = require('./aiService'); // Import AI service functions
const { 
  UserRole,
  ServiceCategory,
  Location,
  BookingStatus,
  QuotationStatus,
  BookingType,
} = require('./constants');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_please_change_this_in_production';

// VAPID keys for web push notifications
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails('mailto:support@vkenserve.com', vapidPublicKey, vapidPrivateKey);
  console.log("VAPID details set for web-push.");
} else {
  console.warn("VAPID keys not configured. Push notifications will be disabled.");
}

// --- Helper for Enum mapping (Frontend String -> Backend Enum Key) ---
const toPrismaEnum = (str) => {
  if (!str) return undefined;
  return str.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/[\s-]+/g, '_').toUpperCase();
};

// --- Data Mapping Helpers (Backend -> Frontend) ---
const toFrontendUser = (user) => {
    if (!user) return null;
    const { passwordHash, pushSubscription, ...rest } = user; // Exclude sensitive data
    return { ...rest, role: UserRole[user.role] || user.role };
};

const toFrontendProvider = (provider) => {
    if (!provider) return null;
    const { owner, ...rest } = provider;
    return {
        ...rest,
        category: ServiceCategory[provider.category] || provider.category,
        locations: provider.locations.map(l => Location[l] || l),
        owner: owner ? toFrontendUser(owner) : undefined,
    };
};

const toFrontendBooking = (booking) => {
    if (!booking) return null;
    const { provider, customer, ...rest } = booking;
    return {
        ...rest,
        status: BookingStatus[booking.status] || booking.status,
        quotationStatus: QuotationStatus[booking.quotationStatus] || booking.quotationStatus,
        bookingType: BookingType[booking.bookingType] || booking.bookingType,
        provider: provider ? toFrontendProvider(provider) : undefined,
        customer: customer ? toFrontendUser(customer) : undefined,
    };
};

// --- JWT Authentication Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- API Router Setup ---
const apiRouter = express.Router();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- API Routes ---

// Local Hub
apiRouter.get('/local-hub/:location', async (req, res) => {
    try {
        const hubData = await getLocalHubData(req.params.location);
        res.json(hubData);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch local hub data.' });
    }
});

// Auth
apiRouter.post('/auth/register', async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ message: 'Missing fields.' });
  try {
    if (await prisma.user.findUnique({ where: { email } })) return res.status(409).json({ message: 'Email already exists.' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({ data: { name, email, phone, passwordHash: hashedPassword, role: toPrismaEnum(role), kycVerified: false } });
    const token = jwt.sign({ userId: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ token, user: toFrontendUser(newUser) });
  } catch (error) { res.status(500).json({ message: 'Server error during registration.' }); }
});

apiRouter.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email/password required.' });
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !await bcrypt.compare(password, user.passwordHash)) return res.status(401).json({ message: 'Invalid credentials.' });
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.status(200).json({ token, user: toFrontendUser(user) });
  } catch (error) { res.status(500).json({ message: 'Server error during login.' }); }
});

apiRouter.post('/auth/forgot-password', (req, res) => res.status(200).json({ message: 'Reset link sent.' }));

// User
apiRouter.get('/users/me', authenticateToken, async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    res.json(toFrontendUser(user));
});
apiRouter.put('/users/me', authenticateToken, async (req, res) => {
    const updatedUser = await prisma.user.update({ where: { id: req.user.userId }, data: req.body });
    res.json({ user: toFrontendUser(updatedUser) });
});

// Providers
apiRouter.get('/providers', async (req, res) => {
    const providers = await prisma.serviceProvider.findMany({ include: { owner: true } });
    res.json(providers.map(toFrontendProvider));
});
apiRouter.post('/providers', authenticateToken, async (req, res) => {
    const { businessName, category, locations, detailedServices, ...rest } = req.body;
    const newProvider = await prisma.serviceProvider.create({
        data: { ...rest, name: businessName, ownerId: req.user.userId, category: toPrismaEnum(category), locations: locations.map(toPrismaEnum) }
    });
    res.status(201).json({ provider: toFrontendProvider(newProvider) });
});
apiRouter.put('/providers/:id', authenticateToken, async (req, res) => {
    const { businessName, category, locations, detailedServices, ...rest } = req.body;
    const updatedProvider = await prisma.serviceProvider.update({ where: { id: req.params.id }, data: { ...rest, name: businessName, category: toPrismaEnum(category), locations: locations.map(toPrismaEnum) } });
    res.json({ provider: toFrontendProvider(updatedProvider) });
});


// Bookings
apiRouter.get('/bookings/my', authenticateToken, async (req, res) => {
    const bookings = await prisma.booking.findMany({ where: { OR: [{ customerId: req.user.userId }, { provider: { ownerId: req.user.userId } }] }, include: { provider: true, customer: true } });
    res.json(bookings.map(toFrontendBooking));
});
apiRouter.post('/bookings', authenticateToken, async (req, res) => {
    const { providerId, serviceDate, requestDetails, bookingType, status, otp } = req.body;
    const booking = await prisma.booking.create({ data: { providerId, customerId: req.user.userId, serviceDate, requestDetails, bookingType: toPrismaEnum(bookingType), status: toPrismaEnum(status), otp } });
    res.status(201).json({ booking: toFrontendBooking(booking) });
});
apiRouter.put('/bookings/:id', authenticateToken, async (req, res) => {
    const { status, ...rest } = req.body;
    const updatedBooking = await prisma.booking.update({ where: { id: req.params.id }, data: { ...rest, status: toPrismaEnum(status) } });
    res.json({ booking: toFrontendBooking(updatedBooking) });
});

// AI Proxies
const aiProxyHandler = async (req, res, aiFunction) => {
    try {
        const result = await aiFunction(...Object.values(req.body));
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
apiRouter.post('/ai/parse-service-request', authenticateToken, (req, res) => aiProxyHandler(req, res, parseServiceRequest));
apiRouter.post('/ai/generate-provider-profile', authenticateToken, (req, res) => aiProxyHandler(req, res, generateProviderProfile));
apiRouter.post('/ai/generate-logo-image', authenticateToken, async (req, res) => res.json({ logoUrl: await generateLogoImage(req.body.prompt) }));
apiRouter.post('/ai/generate-detailed-services', authenticateToken, (req, res) => aiProxyHandler(req, res, generateDetailedServices));
apiRouter.post('/ai/generate-search-suggestions', authenticateToken, (req, res) => aiProxyHandler(req, res, generateSearchSuggestions));
apiRouter.get('/ai/get-readable-location', authenticateToken, async (req, res) => res.json({ locationName: await getReadableLocation(req.query.lat, req.query.lon) }));
apiRouter.get('/ai/get-city-from-coordinates', authenticateToken, async (req, res) => res.json({ city: await getCityFromCoordinates(req.query.lat, req.query.lon) }));
apiRouter.post('/ai/generate-quotation-items', authenticateToken, (req, res) => aiProxyHandler(req, res, generateQuotationItems));

// Notifications & Alerts
apiRouter.get('/notifications/my', authenticateToken, async (req, res) => res.json(await prisma.notification.findMany({ where: { userId: req.user.userId } })));
apiRouter.post('/notifications', authenticateToken, async (req, res) => res.status(201).json(await prisma.notification.create({ data: req.body })));
apiRouter.put('/notifications/mark-read', authenticateToken, async (req, res) => { await prisma.notification.updateMany({ where: { userId: req.user.userId }, data: { read: true }}); res.sendStatus(200); });
apiRouter.get('/alerts/my', authenticateToken, async (req, res) => res.json(await prisma.jobAlert.findMany({ where: { userId: req.user.userId } })));
apiRouter.post('/alerts', authenticateToken, async (req, res) => res.status(201).json({ alert: await prisma.jobAlert.create({ data: { ...req.body, userId: req.user.userId, serviceCategory: toPrismaEnum(req.body.serviceCategory), location: toPrismaEnum(req.body.location) } }) }));
apiRouter.delete('/alerts/:id', authenticateToken, async (req, res) => { await prisma.jobAlert.delete({ where: { id: req.params.id } }); res.sendStatus(200); });

// --- Mount Router and Define Fallbacks ---
// CRITICAL ORDER: API routes must be registered before static file serving to prevent conflicts.
// 1. Mount the API router. Any request starting with /api will be handled here.
app.use('/api', apiRouter);

// 2. Serve static frontend files from the root directory.
const frontendPath = path.resolve(__dirname, '..');
app.use(express.static(frontendPath));

// 3. SPA Fallback: For any GET request that doesn't match an API route or a static file,
//    serve the main index.html file. This is essential for client-side routing.
app.get('*', (req, res) => {
    // This safeguard prevents an API call from accidentally being served the HTML file.
    // If a request for /api/... reaches this point, it means no API route was matched.
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            error: 'API Endpoint Not Found',
            message: `The path ${req.path} was not handled by the API router.`
        });
    }
    // For all other requests, serve the main application file.
    res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
        if (err) {
            res.status(500).send("Error serving the application.");
        }
    });
});

app.listen(PORT, () => console.log(`V-Ken Serve Backend running on port ${PORT}`));