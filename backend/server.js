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
        console.error('Error fetching local hub data:', error);
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
  } catch (error) { 
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration.' }); 
  }
});

apiRouter.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email/password required.' });
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !await bcrypt.compare(password, user.passwordHash)) return res.status(401).json({ message: 'Invalid credentials.' });
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.status(200).json({ token, user: toFrontendUser(user) });
  } catch (error) { 
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' }); 
  }
});

apiRouter.post('/auth/forgot-password', (req, res) => {
    // In a real app, this would involve sending an email. For now, it's a mock.
    console.log(`Password reset requested for: ${req.body.email}`);
    res.status(200).json({ message: 'Reset link sent.' });
});


// User
apiRouter.get('/users/me', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
        res.json(toFrontendUser(user));
    } catch (error) {
        console.error('Error fetching current user:', error);
        res.status(500).json({ message: 'Failed to fetch user data.' });
    }
});

apiRouter.put('/users/me', authenticateToken, async (req, res) => {
    try {
        const updatedUser = await prisma.user.update({ where: { id: req.user.userId }, data: req.body });
        res.json({ user: toFrontendUser(updatedUser) });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Failed to update user data.' });
    }
});

// Providers
apiRouter.get('/providers', async (req, res) => {
    try {
        const providers = await prisma.serviceProvider.findMany({ include: { owner: true } });
        res.json(providers.map(toFrontendProvider));
    } catch (error) {
        console.error('Error fetching providers:', error);
        res.status(500).json({ message: 'Failed to fetch providers.' });
    }
});

apiRouter.get('/providers/search', async (req, res) => {
    const { category, location } = req.query;
    if (!category || !location) return res.status(400).json({ message: 'Category and location are required.' });
    try {
        const providers = await prisma.serviceProvider.findMany({
            where: { category: toPrismaEnum(category), locations: { has: toPrismaEnum(location) }, isBlacklisted: false },
            include: { owner: true },
        });
        res.json(providers.map(toFrontendProvider));
    } catch (error) {
        console.error('Provider search error:', error);
        res.status(500).json({ message: 'Failed to search for providers.' });
    }
});

apiRouter.post('/providers', authenticateToken, async (req, res) => {
    try {
        const { businessName, category, locations, ...rest } = req.body;
        const newProvider = await prisma.serviceProvider.create({
            data: { ...rest, name: businessName, ownerId: req.user.userId, category: toPrismaEnum(category), locations: locations.map(toPrismaEnum) }
        });
        res.status(201).json({ provider: toFrontendProvider(newProvider) });
    } catch (error) {
        console.error('Error creating provider:', error);
        res.status(500).json({ message: 'Failed to create provider profile.' });
    }
});

apiRouter.put('/providers/:id', authenticateToken, async (req, res) => {
    try {
        const { businessName, category, locations, ...rest } = req.body;
        const updatedProvider = await prisma.serviceProvider.update({ 
            where: { id: req.params.id }, 
            data: { ...rest, name: businessName, category: toPrismaEnum(category), locations: locations.map(toPrismaEnum) } 
        });
        res.json({ provider: toFrontendProvider(updatedProvider) });
    } catch (error) {
        console.error('Error updating provider:', error);
        res.status(500).json({ message: 'Failed to update provider profile.' });
    }
});


// Bookings
apiRouter.get('/bookings/my', authenticateToken, async (req, res) => {
    try {
        const bookings = await prisma.booking.findMany({ 
            where: { OR: [{ customerId: req.user.userId }, { provider: { ownerId: req.user.userId } }] }, 
            include: { provider: true, customer: true } 
        });
        res.json(bookings.map(toFrontendBooking));
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ message: 'Failed to fetch bookings.' });
    }
});

apiRouter.post('/bookings', authenticateToken, async (req, res) => {
    try {
        const { providerId, serviceDate, requestDetails, bookingType, status, otp } = req.body;
        const booking = await prisma.booking.create({ 
            data: { providerId, customerId: req.user.userId, serviceDate, requestDetails, bookingType: toPrismaEnum(bookingType), status: toPrismaEnum(status), otp } 
        });
        res.status(201).json({ booking: toFrontendBooking(booking) });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ message: 'Failed to create booking.' });
    }
});

apiRouter.put('/bookings/:id', authenticateToken, async (req, res) => {
    const { id: bookingId } = req.params;
    const { status, ...restData } = req.body;
    const newStatus = toPrismaEnum(status);

    try {
        const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { provider: true } });
        if (!booking) return res.status(404).json({ message: 'Booking not found.' });

        // Blacklisting logic for provider rejections
        if (req.user.userId === booking.provider.ownerId && newStatus === 'CANCELLED' && booking.status === 'PENDING_PROVIDER_CONFIRMATION') {
            const provider = await prisma.serviceProvider.findUnique({ where: { id: booking.providerId } });
            if (provider) {
                const now = new Date();
                const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                
                const recentRejections = (provider.rejectionHistory || []).filter(rej => new Date(rej.date) > thirtyDaysAgo);
                const newRejectionHistory = [...recentRejections, { bookingId: booking.id, date: now.toISOString() }];

                let providerUpdates = { rejectionHistory: newRejectionHistory };

                if (newRejectionHistory.length >= 3) {
                    const threeMonthsFromNow = new Date();
                    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
                    providerUpdates.isBlacklisted = true;
                    providerUpdates.blacklistEndDate = threeMonthsFromNow;

                    await prisma.serviceProvider.update({ where: { id: provider.id }, data: providerUpdates });
                    
                    await prisma.notification.create({
                        data: {
                            userId: provider.ownerId,
                            message: `Your account has been suspended for 3 months due to multiple job rejections. You will not receive new jobs until ${threeMonthsFromNow.toLocaleDateString()}.`,
                            read: false
                        }
                    });
                } else {
                    await prisma.serviceProvider.update({ where: { id: provider.id }, data: providerUpdates });
                }
            }
        }

        const dataToUpdate = { ...restData };
        if (newStatus) dataToUpdate.status = newStatus;

        const updatedBooking = await prisma.booking.update({ where: { id: bookingId }, data: dataToUpdate });
        res.json({ booking: toFrontendBooking(updatedBooking) });

    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ message: 'Failed to update booking.' });
    }
});

apiRouter.post('/bookings/:id/messages', authenticateToken, async (req, res) => {
    const { id: bookingId } = req.params;
    const { text } = req.body;
    const senderId = req.user.userId;

    if (!text) return res.status(400).json({ message: 'Message text is required.' });

    try {
        const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { provider: { include: { owner: true } }, customer: true }});
        if (!booking) return res.status(404).json({ message: 'Booking not found.' });
        if (senderId !== booking.customerId && senderId !== booking.provider.ownerId) return res.status(403).json({ message: 'Unauthorized.' });

        const sender = booking.customer.id === senderId ? booking.customer : booking.provider.owner;
        const recipientId = senderId === booking.customerId ? booking.provider.ownerId : booking.customerId;
        if (!recipientId) return res.status(400).json({ message: 'Could not determine recipient.' });
        
        const newMessage = { senderId, text, timestamp: new Date() };

        const updatedBooking = await prisma.booking.update({
            where: { id: bookingId },
            data: { chatHistory: { push: newMessage } },
            include: { provider: true, customer: true }
        });
        
        await prisma.notification.create({
            data: { userId: recipientId, message: `New message from ${sender.name} for your ${booking.provider.category} booking.`, bookingId: booking.id, read: false }
        });
        
        res.status(201).json({ booking: toFrontendBooking(updatedBooking) });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Failed to send message.' });
    }
});


// AI Proxies
const aiProxyHandler = async (req, res, aiFunction, args) => {
    try {
        const result = await aiFunction(...args);
        res.json(result);
    } catch (error) {
        console.error(`AI Proxy Error in ${aiFunction.name}:`, error);
        res.status(500).json({ message: error.message || 'An AI service error occurred.' });
    }
};

apiRouter.post('/ai/parse-service-request', authenticateToken, (req, res) => aiProxyHandler(req, res, parseServiceRequest, [req.body.query, req.body.coordinates, req.body.image]));
apiRouter.post('/ai/generate-provider-profile', authenticateToken, (req, res) => aiProxyHandler(req, res, generateProviderProfile, [req.body.businessName, req.body.category]));
apiRouter.post('/ai/generate-logo-image', authenticateToken, (req, res) => aiProxyHandler(req, res, generateLogoImage, [req.body.prompt]).then(logoUrl => res.json({ logoUrl })));
apiRouter.post('/ai/generate-detailed-services', authenticateToken, (req, res) => aiProxyHandler(req, res, generateDetailedServices, [req.body.category, req.body.description]));
apiRouter.post('/ai/generate-search-suggestions', authenticateToken, (req, res) => aiProxyHandler(req, res, generateSearchSuggestions, [req.body.category, req.body.providers]));
apiRouter.get('/ai/get-readable-location', authenticateToken, (req, res) => aiProxyHandler(req, res, getReadableLocation, [req.query.lat, req.query.lon]).then(locationName => res.json({ locationName })));
apiRouter.get('/ai/get-city-from-coordinates', authenticateToken, (req, res) => aiProxyHandler(req, res, getCityFromCoordinates, [req.query.lat, req.query.lon]).then(city => res.json({ city })));
apiRouter.post('/ai/generate-quotation-items', authenticateToken, (req, res) => aiProxyHandler(req, res, generateQuotationItems, [req.body.provider, req.body.requestDetails]));


// Chatbot Routes
apiRouter.post('/ai/chatbot/init', authenticateToken, (req, res) => {
    try {
        const sessionId = initChatSession(req.body.userId);
        res.json({ sessionId });
    } catch (error) { res.status(500).json({ message: 'Failed to initialize chat session.' }); }
});
apiRouter.post('/ai/chatbot/message', authenticateToken, async (req, res) => {
    try {
        const { sessionId, message } = req.body;
        const stream = await sendMessageStream(sessionId, message);
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();
        for await (const chunk of stream) {
            if (chunk && chunk.text) res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
        res.end();
    } catch (error) { res.status(500).end(JSON.stringify({ message: 'Failed to stream chat message.' })); }
});
apiRouter.post('/ai/chatbot/close', authenticateToken, (req, res) => {
    try {
        closeChatSession(req.body.sessionId);
        res.json({ message: 'Session closed.' });
    } catch (error) { res.status(500).json({ message: 'Failed to close chat session.' }); }
});


// Notifications & Alerts
apiRouter.get('/notifications/my', authenticateToken, async (req, res) => {
    try {
        res.json(await prisma.notification.findMany({ where: { userId: req.user.userId }, orderBy: { timestamp: 'desc' }}));
    } catch(e) { res.status(500).json({ message: 'Failed to fetch notifications.' }); }
});
apiRouter.put('/notifications/mark-read', authenticateToken, async (req, res) => { 
    try {
        await prisma.notification.updateMany({ where: { userId: req.user.userId }, data: { read: true }}); 
        res.sendStatus(200); 
    } catch(e) { res.status(500).json({ message: 'Failed to mark notifications as read.' }); }
});
apiRouter.get('/alerts/my', authenticateToken, async (req, res) => {
    try {
        res.json(await prisma.jobAlert.findMany({ where: { userId: req.user.userId }, orderBy: { createdAt: 'desc' } }));
    } catch(e) { res.status(500).json({ message: 'Failed to fetch job alerts.' }); }
});
apiRouter.post('/alerts', authenticateToken, async (req, res) => {
    try {
        const data = { ...req.body, userId: req.user.userId, serviceCategory: toPrismaEnum(req.body.serviceCategory), location: toPrismaEnum(req.body.location) };
        res.status(201).json({ alert: await prisma.jobAlert.create({ data }) });
    } catch(e) { res.status(500).json({ message: 'Failed to create job alert.' }); }
});
apiRouter.delete('/alerts/:id', authenticateToken, async (req, res) => { 
    try {
        await prisma.jobAlert.delete({ where: { id: req.params.id, userId: req.user.userId } }); 
        res.sendStatus(200); 
    } catch(e) { res.status(500).json({ message: 'Failed to delete job alert.' }); }
});


// --- Mount Router and Define Fallbacks ---

// FIX: Mount the API router *before* the static file server and catch-all route.
// This is critical to ensure API calls are not treated as file requests.
app.use('/api', apiRouter);

const frontendPath = path.resolve(__dirname, '..');
app.use(express.static(frontendPath));

app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
        if (err) {
            // If index.html itself is not found, it's a more serious server misconfiguration
            if (err.status === 404) {
                res.status(404).send("Application entry point (index.html) not found. Check server configuration.");
            } else {
                res.status(500).send("Error serving the application.");
            }
        }
    });
});

app.listen(PORT, () => console.log(`V-Ken Serve Backend running on port ${PORT}`));
