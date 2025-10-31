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
  getLocalHubData, // Import the new function
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
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_please_change_this_in_production'; // Strongly recommend a robust secret

// VAPID keys for web push notifications
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails('mailto:support@vkenserve.com', vapidPublicKey, vapidPrivateKey);
  console.log("VAPID details set for web-push.");
} else {
  console.warn("VAPID keys not configured. Push notifications will be disabled.");
}

// --- Helper for Enum mapping ---
const toPrismaEnum = (str) => {
  if (!str) return undefined;
  // Replaces any sequence of non-alphanumeric characters with a single underscore,
  // trims leading/trailing underscores, and converts to uppercase.
  return str.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/[\s-]+/g, '_').toUpperCase();
};

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json({ limit: '10mb' })); // Parse JSON request bodies, increase limit for images


// --- Data Mapping Helpers (Backend -> Frontend) ---
const toFrontendUser = (user) => {
    if (!user) return null;
    const { passwordHash, pushSubscription, ...rest } = user; // Exclude sensitive data
    return {
        ...rest,
        role: UserRole[user.role] || user.role,
    };
};

const toFrontendProvider = (provider) => {
    if (!provider) return null;
    // Recursively map nested objects like 'owner'
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
    // Recursively map nested provider and customer
    const { provider, customer, quotationItems, ...rest } = booking;
    return {
        ...rest,
        status: BookingStatus[booking.status] || booking.status,
        quotationStatus: QuotationStatus[booking.quotationStatus] || booking.quotationStatus,
        bookingType: BookingType[booking.bookingType] || booking.bookingType,
        provider: provider ? toFrontendProvider(provider) : undefined,
        customer: customer ? toFrontendUser(customer) : undefined,
        quotationItems: quotationItems || [],
    };
};

// --- JWT Authentication Helpers ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401); // No token provided

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error("JWT verification error:", err);
      return res.sendStatus(403); // Token is not valid
    }
    req.user = user; // Attach user payload to request
    next();
  });
};

const optionalAuthenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        req.user = null; // No user, but continue
        return next();
    }
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            req.user = null; // Invalid token, treat as logged out
        } else {
            req.user = user; // Valid token, attach user
        }
        next();
    });
};


// --- Push Notification Helper ---
async function sendPushNotification(userId, payload) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.log("Push notifications disabled, skipping send.");
    return;
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushSubscription: true }
    });

    if (user && user.pushSubscription) {
      const subscription = user.pushSubscription;
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      console.log(`Push notification sent to user ${userId}`);
    }
  } catch (error) {
    console.error(`Error sending push notification to user ${userId}:`, error.body || error);
    if (error.statusCode === 404 || error.statusCode === 410) {
      console.log(`Subscription for user ${userId} is invalid. Removing from DB.`);
      await prisma.user.update({
        where: { id: userId },
        data: { pushSubscription: null }
      });
    }
  }
}

// --- API Router Setup ---
const apiRouter = express.Router();

// --- API Routes ---
// All API logic is now attached to `apiRouter`. The '/api' prefix is handled when mounting the router.

apiRouter.get('/', (req, res) => res.json({ message: 'Welcome to the V-Ken Serve API!' }));

apiRouter.get('/local-hub/:location', async (req, res) => {
    const { location } = req.params;
    try {
        const hubData = await getLocalHubData(location);
        res.status(200).json(hubData);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch local hub data.' });
    }
});

apiRouter.post('/auth/register', async (req, res) => {
  console.log("--- Received registration request ---");
  console.log("Body:", req.body);
  const { name, email, phone, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    if (await prisma.user.findUnique({ where: { email } })) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash: hashedPassword,
        role: toPrismaEnum(role),
        kycVerified: false,
      },
    });
    console.log("--- User created successfully in DB ---", newUser.id);
    const token = jwt.sign({ userId: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ message: 'User registered successfully', token, user: toFrontendUser(newUser) });
  } catch (error) {
    console.error('--- REGISTRATION ERROR ---');
    console.error(error); // Log the full error
    res.status(500).json({ message: 'Internal server error during registration.' });
  }
});

apiRouter.post('/auth/login', async (req, res) => {
  console.log("--- Received login request ---");
  console.log("Body:", { email: req.body.email, password: '[REDACTED]' });
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      console.warn(`Login failed for email: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    console.log("--- User logged in successfully ---", user.id);
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.status(200).json({ message: 'Logged in successfully', token, user: toFrontendUser(user) });
  } catch (error) {
    console.error('--- LOGIN ERROR ---');
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

apiRouter.post('/auth/forgot-password', (req, res) => {
    console.log(`Password reset requested for email: ${req.body.email}.`);
    res.status(200).json({ message: 'If an account exists, a reset link has been sent.' });
});

apiRouter.get('/users/me', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
        if (!user) return res.status(404).json({ message: 'User not found.' });
        res.status(200).json(toFrontendUser(user));
    } catch (error) {
        res.status(500).json({ message: 'Internal server error.' });
    }
});

apiRouter.put('/users/me', authenticateToken, async (req, res) => {
    try {
        const updatedUser = await prisma.user.update({
            where: { id: req.user.userId },
            data: req.body,
        });
        res.status(200).json({ message: 'Profile updated', user: toFrontendUser(updatedUser) });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error.' });
    }
});

apiRouter.get('/providers', optionalAuthenticateToken, async (req, res) => {
  try {
    await prisma.serviceProvider.updateMany({
        where: { isBlacklisted: true, blacklistEndDate: { lte: new Date() } },
        data: { isBlacklisted: false, blacklistEndDate: null }
    });
    
    let whereClause = { isBlacklisted: false };
    if (req.user?.userId) {
        whereClause = { OR: [{ isBlacklisted: false }, { ownerId: req.user.userId }] };
    }

    const providers = await prisma.serviceProvider.findMany({ where: whereClause, include: { owner: true, detailedServices: true } });
    res.status(200).json(providers.map(toFrontendProvider));
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

apiRouter.get('/providers/:id', async (req, res) => {
    try {
        const provider = await prisma.serviceProvider.findUnique({ where: { id: req.params.id }, include: { owner: true, detailedServices: true } });
        if (!provider) return res.status(404).json({ message: 'Provider not found.' });
        res.status(200).json(toFrontendProvider(provider));
    } catch (error) {
        res.status(500).json({ message: 'Internal server error.' });
    }
});

apiRouter.get('/providers/search', async (req, res) => {
    const { category, location } = req.query;
    try {
        const results = await prisma.serviceProvider.findMany({
            where: { category: toPrismaEnum(category), locations: { has: toPrismaEnum(location) }, isBlacklisted: false },
            include: { owner: true, detailedServices: true },
        });
        res.status(200).json(results.map(toFrontendProvider));
    } catch (error) {
        res.status(500).json({ message: 'Internal server error.' });
    }
});

apiRouter.post('/providers', authenticateToken, async (req, res) => {
  const { businessName, category, locations, ...rest } = req.body;
  try {
    if (await prisma.serviceProvider.findUnique({ where: { ownerId: req.user.userId } })) {
        return res.status(409).json({ message: 'User already owns a provider profile.' });
    }

    const newProvider = await prisma.serviceProvider.create({
      data: {
        ...rest,
        name: businessName,
        ownerId: req.user.userId,
        category: toPrismaEnum(category),
        locations: { set: locations.map(toPrismaEnum) },
        rating: 5.0,
        detailedServices: { createMany: { data: rest.detailedServices || [] } }
      },
      include: { owner: true, detailedServices: true }
    });
    
    await prisma.user.update({
        where: { id: req.user.userId },
        data: { role: 'PROVIDER', businessName, kraPin: rest.kraPin }
    });

    res.status(201).json({ message: 'Provider created', provider: toFrontendProvider(newProvider) });
  } catch (error) {
    console.error('Error creating provider:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

apiRouter.put('/providers/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { businessName, category, locations, detailedServices, ...rest } = req.body;
    try {
        const provider = await prisma.serviceProvider.findUnique({ where: { id } });
        if (!provider || provider.ownerId !== req.user.userId) {
            return res.status(403).json({ message: 'Unauthorized.' });
        }

        const updatedProvider = await prisma.serviceProvider.update({
            where: { id },
            data: {
                ...rest,
                name: businessName,
                category: category ? toPrismaEnum(category) : undefined,
                locations: locations ? { set: locations.map(toPrismaEnum) } : undefined,
            },
            include: { owner: true, detailedServices: true }
        });

        if (detailedServices) {
            await prisma.detailedService.deleteMany({ where: { providerId: id } });
            await prisma.detailedService.createMany({ data: detailedServices.map(ds => ({ ...ds, providerId: id })) });
        }

        const finalProvider = await prisma.serviceProvider.findUnique({ where: { id }, include: { owner: true, detailedServices: true } });
        res.status(200).json({ message: 'Provider updated', provider: toFrontendProvider(finalProvider) });
    } catch (error) {
        console.error('Error updating provider:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

apiRouter.get('/alerts/my', authenticateToken, async (req, res) => {
    try {
        const alerts = await prisma.jobAlert.findMany({ where: { userId: req.user.userId }, orderBy: { createdAt: 'desc' } });
        res.status(200).json(alerts.map(a => ({...a, serviceCategory: ServiceCategory[a.serviceCategory], location: Location[a.location]})));
    } catch (error) {
        res.status(500).json({ message: 'Internal server error.' });
    }
});

apiRouter.post('/alerts', authenticateToken, async (req, res) => {
    const { serviceCategory, location } = req.body;
    try {
        const newAlert = await prisma.jobAlert.create({
            data: { userId: req.user.userId, serviceCategory: toPrismaEnum(serviceCategory), location: toPrismaEnum(location) },
        });
        res.status(201).json({ message: 'Alert created', alert: {...newAlert, serviceCategory: ServiceCategory[newAlert.serviceCategory], location: Location[newAlert.location]} });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error.' });
    }
});

apiRouter.delete('/alerts/:id', authenticateToken, async (req, res) => {
    try {
        await prisma.jobAlert.deleteMany({ where: { id: req.params.id, userId: req.user.userId } });
        res.status(200).json({ message: 'Alert deleted.' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// AI Service proxy endpoints
apiRouter.post('/ai/:endpoint', authenticateToken, async (req, res) => {
    const { endpoint } = req.params;
    const aiFunctions = {
        'parse-service-request': parseServiceRequest,
        'generate-provider-profile': generateProviderProfile,
        'generate-logo-image': async (prompt) => ({ logoUrl: await generateLogoImage(prompt) }),
        'generate-detailed-services': generateDetailedServices,
        'generate-search-suggestions': generateSearchSuggestions,
        'decide-booking-action': decideBookingAction,
        'verify-provider-image': verifyProviderImage,
        'generate-quotation-items': generateQuotationItems,
    };

    if (aiFunctions[endpoint]) {
        try {
            const result = await aiFunctions[endpoint](...Object.values(req.body));
            res.json(result);
        } catch (error) {
            console.error(`Error in AI endpoint /api/ai/${endpoint}:`, error);
            res.status(500).json({ message: `AI service request failed: ${error.message}` });
        }
    } else {
        res.status(404).json({ message: 'AI endpoint not found.' });
    }
});

apiRouter.get('/ai/get-readable-location', authenticateToken, (req, res) => getReadableLocation(req.query.lat, req.query.lon).then(name => res.json({ locationName: name })).catch(err => res.status(500).json({message: err.message})));
apiRouter.get('/ai/get-city-from-coordinates', authenticateToken, (req, res) => getCityFromCoordinates(req.query.lat, req.query.lon).then(city => res.json({ city })).catch(err => res.status(500).json({message: err.message})));

apiRouter.post('/ai/chatbot/init', authenticateToken, (req, res) => res.json({ sessionId: initChatSession(req.body.userId, req.body.initialMessage) }));
apiRouter.post('/ai/chatbot/close', authenticateToken, (req, res) => { closeChatSession(req.body.sessionId); res.json({ message: 'Session closed.' }); });
apiRouter.post('/ai/chatbot/message', authenticateToken, async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream').setHeader('Cache-Control', 'no-cache').setHeader('Connection', 'keep-alive').flushHeaders();
    try {
        const stream = await sendMessageStream(req.body.sessionId, req.body.message);
        for await (const chunk of stream) { res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`); }
        res.end();
    } catch (error) {
        res.write(`data: ${JSON.stringify({ error: 'AI Error' })}\n\n`);
        res.end();
    }
});

// Bookings
apiRouter.post('/bookings', authenticateToken, async (req, res) => {
    try {
        const newBooking = await prisma.booking.create({
            data: { ...req.body, customerId: req.user.userId, bookingType: toPrismaEnum(req.body.bookingType), status: toPrismaEnum(req.body.status) },
            include: { provider: { include: { owner: true } }, customer: true, quotationItems: true }
        });
        await sendPushNotification(newBooking.provider.ownerId, { title: 'New Booking Request!', body: `From ${newBooking.customer.name}` });
        res.status(201).json({ message: 'Booking created', booking: toFrontendBooking(newBooking) });
    } catch (error) {
        console.error("Booking creation error:", error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

apiRouter.get('/bookings/my', authenticateToken, async (req, res) => {
    try {
        const bookings = await prisma.booking.findMany({
            where: { OR: [{ customerId: req.user.userId }, { provider: { ownerId: req.user.userId } }] },
            include: { provider: { include: { owner: true } }, customer: true, quotationItems: true, review: true },
            orderBy: { serviceDate: 'desc' },
        });
        res.status(200).json(bookings.map(toFrontendBooking));
    } catch (error) {
        console.error("Fetching bookings error:", error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

apiRouter.put('/bookings/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { status, quotationItems, ...rest } = req.body;
    try {
        const booking = await prisma.booking.findUnique({ where: { id }, include: { provider: true, customer: true } });
        if (!booking || (booking.customerId !== req.user.userId && booking.provider.ownerId !== req.user.userId)) {
            return res.status(403).json({ message: 'Unauthorized.' });
        }
        const updatedBooking = await prisma.booking.update({ where: { id }, data: { ...rest, status: status ? toPrismaEnum(status) : undefined }, include: { provider: { include: { owner: true } }, customer: true, quotationItems: true, review: true } });
        res.status(200).json({ message: 'Booking updated', booking: toFrontendBooking(updatedBooking) });
    } catch (error) {
        console.error("Booking update error:", error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});


// Notifications
apiRouter.get('/notifications/vapid-public-key', (req, res) => res.json({ publicKey: vapidPublicKey }));
apiRouter.post('/notifications/subscribe', authenticateToken, (req, res) => prisma.user.update({ where: { id: req.user.userId }, data: { pushSubscription: req.body } }).then(() => res.sendStatus(201)).catch(() => res.sendStatus(500)));
apiRouter.post('/notifications', authenticateToken, (req, res) => prisma.notification.create({ data: req.body }).then(n => res.status(201).json({ notification: n })).catch(() => res.sendStatus(500)));
apiRouter.get('/notifications/my', authenticateToken, (req, res) => prisma.notification.findMany({ where: { userId: req.user.userId }, orderBy: { timestamp: 'desc' } }).then(n => res.json(n)).catch(() => res.sendStatus(500)));
apiRouter.put('/notifications/mark-read', authenticateToken, (req, res) => prisma.notification.updateMany({ where: { userId: req.user.userId, read: false }, data: { read: true } }).then(() => res.sendStatus(200)).catch(() => res.sendStatus(500)));


// --- Mount Router and Define Fallbacks ---

// Mount the API router at /api
app.use('/api', apiRouter);

// API 404 Handler - This MUST be after the API router
app.use('/api', (req, res, next) => {
    console.warn(`404 - API Route Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ message: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Serve static assets from the root directory of the project.
const frontendPath = path.resolve(__dirname, '..');
app.use(express.static(frontendPath));

// For all other GET requests that aren't for files, send the SPA's index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
        if (err) {
            console.error("Error sending SPA fallback file:", err);
            res.status(500).send(err);
        }
    });
});


app.listen(PORT, () => console.log(`V-Ken Serve Backend running on port ${PORT}`));