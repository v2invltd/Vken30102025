require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_please_change_this_in_production'; // Strongly recommend a robust secret

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies

// --- Helper for JWT authentication ---
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

// --- API Routes ---

// General API status
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the V-Ken Serve API! Database connected.' });
});

// New Local Hub Endpoint - Made public by removing authenticateToken
app.get('/api/local-hub/:location', async (req, res) => {
    const { location } = req.params;
    if (!location) {
        return res.status(400).json({ message: 'Location parameter is required.' });
    }
    try {
        const hubData = await getLocalHubData(location);
        res.status(200).json(hubData);
    } catch (error) {
        console.error(`Error fetching local hub data for ${location}:`, error);
        res.status(500).json({ message: 'Failed to fetch local hub data.' });
    }
});


// User registration endpoint
app.post('/api/auth/register', async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Please provide name, email, password, and role.' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash: hashedPassword,
        role,
        kycVerified: false, // Default to false
      },
      select: { id: true, name: true, email: true, phone: true, role: true, kycVerified: true } // Don't return password hash
    });

    // Generate JWT token for the newly registered user for immediate login
    const token = jwt.sign(
        { userId: newUser.id, email: newUser.email, role: newUser.role },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    res.status(201).json({ message: 'User registered successfully', token, user: newUser });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Internal server error during registration.' });
  }
});

// User login endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    res.status(200).json({
      message: 'Logged in successfully',
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, kycVerified: user.kycVerified, businessName: user.businessName, businessRegNo: user.businessRegNo, kraPin: user.kraPin, nationalId: user.nationalId } // Return basic user info
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error during login.' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }
    // In a real app, you would generate a unique token, save it to the DB with an expiry,
    // and email a reset link to the user.
    console.log(`Password reset requested for email: ${email}. (This is a mock response)`);
    res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
});

// Mock endpoint for sending WhatsApp OTP
app.post('/api/auth/send-whatsapp-otp', (req, res) => {
    const { phone } = req.body;
    if (!phone) {
        return res.status(400).json({ message: 'Phone number is required.' });
    }
    // In a real application, this is where you would integrate with a service like Twilio's WhatsApp API.
    // For this demo, we just log it and return success.
    console.log(`--- MOCK WHATSAPP OTP ---`);
    console.log(`Sending OTP '1234' to WhatsApp number: ${phone}`);
    console.log(`-------------------------`);
    res.status(200).json({ message: `OTP has been sent to ${phone} via WhatsApp.` });
});


// Get/Update current user profile (protected route example)
app.get('/api/users/me', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { id: true, name: true, email: true, phone: true, nationalId: true, role: true, businessName: true, businessRegNo: true, kraPin: true, kycVerified: true }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

app.put('/api/users/me', authenticateToken, async (req, res) => {
    const { phone, nationalId, businessName, businessRegNo, kraPin, kycVerified, name } = req.body;
    try {
        const updatedUser = await prisma.user.update({
            where: { id: req.user.userId },
            data: {
                name,
                phone,
                nationalId,
                businessName,
                businessRegNo,
                kraPin,
                kycVerified, // This should ideally be set by an admin after document review, but for demo it's allowed here
            },
            select: { id: true, name: true, email: true, phone: true, nationalId: true, role: true, businessName: true, businessRegNo: true, kraPin: true, kycVerified: true }
        });
        res.status(200).json({ message: 'User profile updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});


// Service providers endpoints
app.get('/api/providers', authenticateToken, async (req, res) => {
  try {
    // Check for and lift expired blacklistings
    const expiredBlacklists = await prisma.serviceProvider.findMany({
        where: { isBlacklisted: true, blacklistEndDate: { lte: new Date() } }
    });
    if (expiredBlacklists.length > 0) {
        await prisma.serviceProvider.updateMany({
            where: { id: { in: expiredBlacklists.map(p => p.id) } },
            data: { isBlacklisted: false, blacklistEndDate: null }
        });
        console.log(`Reinstated ${expiredBlacklists.length} providers from blacklist.`);
    }

    // Fetch providers, filtering out blacklisted ones unless it's the current user's profile
    const providers = await prisma.serviceProvider.findMany({
      where: {
        OR: [
          { isBlacklisted: false },
          { ownerId: req.user.userId } // Always include the current user's own profile
        ]
      },
      include: {
        owner: {
            select: { id: true, name: true, email: true }
        },
        detailedServices: true,
      }
    });
    res.status(200).json(providers);
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Get a single provider by ID
app.get('/api/providers/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const provider = await prisma.serviceProvider.findUnique({
            where: { id },
            include: {
                owner: { select: { id: true, name: true, email: true } },
                detailedServices: true,
            },
        });
        if (!provider) {
            return res.status(404).json({ message: 'Provider not found.' });
        }
        res.status(200).json(provider);
    } catch (error) {
        console.error('Error fetching provider by ID:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Search providers (filtered by category and location)
app.get('/api/providers/search', authenticateToken, async (req, res) => {
    const { category, location } = req.query;

    if (!category || !location) {
        return res.status(400).json({ message: 'Category and location are required for search.' });
    }

    try {
        const searchResults = await prisma.serviceProvider.findMany({
            where: {
                category: category,
                locations: {
                    has: location, // Checks if the 'locations' array contains the specified location
                },
                isBlacklisted: false, // Do not show blacklisted providers in public search
            },
            include: {
                owner: { select: { id: true, name: true, email: true } },
                detailedServices: true,
            },
        });
        res.status(200).json(searchResults);
    } catch (error) {
        console.error('Error searching providers:', error);
        res.status(500).json({ message: 'Internal server error during provider search.' });
    }
});


app.post('/api/providers', authenticateToken, async (req, res) => {
  const {
    name, category, locations, description,
    hourlyRate, logoUrl, coverImageUrl, expertise, detailedServices,
    aiAutoAcceptEnabled, latitude, longitude, allowsInstantBooking
  } = req.body;

  if (!name || !category || !locations || !description || !hourlyRate) {
    return res.status(400).json({ message: 'Missing required provider fields.' });
  }

  try {
    const existingProvider = await prisma.serviceProvider.findUnique({
        where: { ownerId: req.user.userId }
    });
    if (existingProvider) {
        return res.status(409).json({ message: 'User already owns a provider profile.' });
    }

    const newProvider = await prisma.serviceProvider.create({
      data: {
        ownerId: req.user.userId,
        name,
        category,
        locations: { set: locations },
        rating: 5.0,
        reviewsCount: 0,
        description,
        hourlyRate,
        logoUrl,
        coverImageUrl,
        expertise: { set: expertise || [] },
        availability: {},
        aiAutoAcceptEnabled: aiAutoAcceptEnabled || false,
        kycVerified: false,
        latitude,
        longitude,
        allowsInstantBooking: allowsInstantBooking || false,
        isBlacklisted: false,
        detailedServices: {
          createMany: {
            data: detailedServices || [],
          }
        }
      },
      include: { detailedServices: true }
    });

    const { category: newCategory, locations: newLocations, name: providerName } = newProvider;
    if (newCategory && newLocations && newLocations.length > 0) {
        const matchingAlerts = await prisma.jobAlert.findMany({
            where: {
                serviceCategory: newCategory,
                location: { in: newLocations },
            },
            select: { userId: true, location: true }
        });
        
        if (matchingAlerts.length > 0) {
            const userNotifications = new Map();
            matchingAlerts.forEach(alert => {
                if (!userNotifications.has(alert.userId)) {
                    userNotifications.set(alert.userId, {
                        userId: alert.userId,
                        message: `A new ${newCategory} provider, '${providerName}', is now available in ${alert.location}!`,
                        bookingId: null,
                        read: false,
                        timestamp: new Date()
                    });
                }
            });

            await prisma.notification.createMany({
                data: Array.from(userNotifications.values()),
                skipDuplicates: true,
            });
            console.log(`Created ${userNotifications.size} notifications for new provider.`);
        }
    }

    await prisma.user.update({
        where: { id: req.user.userId },
        data: {
            role: 'PROVIDER',
            businessName: name,
        }
    });

    res.status(201).json({ message: 'Provider created successfully', provider: newProvider });
  } catch (error) {
    console.error('Error creating provider:', error);
    res.status(500).json({ message: 'Internal server error during provider creation.' });
  }
});

app.put('/api/providers/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const {
        name, category, locations, description,
        hourlyRate, logoUrl, coverImageUrl, expertise, gallery, detailedServices,
        availability, aiAutoAcceptEnabled, kycVerified, latitude, longitude, allowsInstantBooking
    } = req.body;

    try {
        const existingProvider = await prisma.serviceProvider.findUnique({ where: { id } });
        if (!existingProvider) {
            return res.status(404).json({ message: 'Provider not found.' });
        }

        if (existingProvider.ownerId !== req.user.userId) {
            return res.status(403).json({ message: 'Unauthorized to update this provider profile.' });
        }

        const updatedProvider = await prisma.serviceProvider.update({
            where: { id },
            data: {
                name,
                category,
                locations: locations ? { set: locations } : undefined,
                description,
                hourlyRate,
                logoUrl,
                coverImageUrl,
                expertise: expertise ? { set: expertise } : undefined,
                gallery: gallery ? { set: gallery } : undefined,
                availability: availability,
                aiAutoAcceptEnabled,
                kycVerified,
                latitude,
                longitude,
                allowsInstantBooking,
            },
            include: { detailedServices: true }
        });

        if (detailedServices) {
            await prisma.detailedService.deleteMany({ where: { providerId: id } });
            await prisma.detailedService.createMany({
                data: detailedServices.map(ds => ({ ...ds, providerId: id })),
            });
            const finalProvider = await prisma.serviceProvider.findUnique({
                where: { id },
                include: { detailedServices: true }
            });
            return res.status(200).json({ message: 'Provider updated successfully', provider: finalProvider });
        }
        
        res.status(200).json({ message: 'Provider updated successfully', provider: updatedProvider });
    } catch (error) {
        console.error('Error updating provider:', error);
        res.status(500).json({ message: 'Internal server error during provider update.' });
    }
});

// --- Job Alerts Endpoints ---
app.get('/api/alerts/my', authenticateToken, async (req, res) => {
    try {
        const alerts = await prisma.jobAlert.findMany({
            where: { userId: req.user.userId },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json(alerts);
    } catch (error) {
        console.error('Error fetching job alerts:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

app.post('/api/alerts', authenticateToken, async (req, res) => {
    const { serviceCategory, location } = req.body;
    if (!serviceCategory || !location) {
        return res.status(400).json({ message: 'Service category and location are required.' });
    }

    try {
        const newAlert = await prisma.jobAlert.create({
            data: {
                userId: req.user.userId,
                serviceCategory,
                location,
            },
        });
        res.status(201).json({ message: 'Job alert created successfully', alert: newAlert });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'An alert for this category and location already exists.' });
        }
        console.error('Error creating job alert:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

app.delete('/api/alerts/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const alert = await prisma.jobAlert.findUnique({ where: { id } });
        if (!alert) {
            return res.status(404).json({ message: 'Job alert not found.' });
        }
        if (alert.userId !== req.user.userId) {
            return res.status(403).json({ message: 'Unauthorized to delete this alert.' });
        }
        await prisma.jobAlert.delete({ where: { id } });
        res.status(200).json({ message: 'Job alert deleted successfully.' });
    } catch (error) {
        console.error('Error deleting job alert:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});


// --- AI Service Endpoints (Protected by authentication) ---

app.post('/api/ai/parse-service-request', authenticateToken, async (req, res) => {
    const { query, coordinates } = req.body;
    try {
        const result = await parseServiceRequest(query, coordinates);
        res.json(result);
    } catch (error) {
        console.error('Error in AI parse-service-request:', error);
        res.status(500).json({ message: 'AI service request failed.' });
    }
});

app.post('/api/ai/generate-provider-profile', authenticateToken, async (req, res) => {
    const { businessName, category } = req.body;
    try {
        const result = await generateProviderProfile(businessName, category);
        res.json(result);
    } catch (error) {
        console.error('Error in AI generate-provider-profile:', error);
        res.status(500).json({ message: 'AI profile generation failed.' });
    }
});

app.post('/api/ai/generate-logo-image', authenticateToken, async (req, res) => {
    const { prompt } = req.body;
    try {
        const result = await generateLogoImage(prompt);
        res.json({ logoUrl: result });
    } catch (error) {
        console.error('Error in AI generate-logo-image:', error);
        res.status(500).json({ message: 'AI logo generation failed.' });
    }
});

app.post('/api/ai/generate-detailed-services', authenticateToken, async (req, res) => {
    const { category, description } = req.body;
    try {
        const result = await generateDetailedServices(category, description);
        res.json(result);
    } catch (error) {
        console.error('Error in AI generate-detailed-services:', error);
        res.status(500).json({ message: 'AI detailed services generation failed.' });
    }
});

app.post('/api/ai/generate-search-suggestions', authenticateToken, async (req, res) => {
    const { category, providers } = req.body;
    if (!category || !providers) {
        return res.status(400).json({ message: 'Category and providers list are required.' });
    }
    try {
        const result = await generateSearchSuggestions(category, providers);
        res.json(result);
    } catch (error) {
        console.error('Error in AI generate-search-suggestions:', error);
        res.status(500).json({ message: 'AI search suggestions failed.' });
    }
});

app.post('/api/ai/decide-booking-action', authenticateToken, async (req, res) => {
    const { booking } = req.body; // Expects a Booking object
    try {
        const result = await decideBookingAction(booking);
        res.json(result);
    } catch (error) {
        console.error('Error in AI decide-booking-action:', error);
        res.status(500).json({ message: 'AI booking decision failed.' });
    }
});

app.post('/api/ai/verify-provider-image', authenticateToken, async (req, res) => {
    const { imageData, imageType } = req.body; // imageData should be a File object structure { mimeType, data }
    try {
        const result = await verifyProviderImage(imageData, imageType);
        res.json(result);
    } catch (error) {
        console.error('Error in AI verify-provider-image:', error);
        res.status(500).json({ message: 'AI image verification failed.' });
    }
});

app.get('/api/ai/get-readable-location', authenticateToken, async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
        return res.status(400).json({ message: 'Latitude and longitude are required.' });
    }
    try {
        const locationName = await getReadableLocation(parseFloat(lat), parseFloat(lon));
        res.json({ locationName });
    } catch (error) {
        console.error('Error in AI get-readable-location:', error);
        res.status(500).json({ message: 'AI readable location retrieval failed.' });
    }
});

app.get('/api/ai/get-city-from-coordinates', authenticateToken, async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
        return res.status(400).json({ message: 'Latitude and longitude are required.' });
    }
    try {
        const city = await getCityFromCoordinates(parseFloat(lat), parseFloat(lon));
        res.json({ city });
    } catch (error) {
        console.error('Error in AI get-city-from-coordinates:', error);
        res.status(500).json({ message: 'AI city from coordinates retrieval failed.' });
    }
});

app.post('/api/ai/generate-quotation-items', authenticateToken, async (req, res) => {
    const { provider, requestDetails } = req.body;
    try {
        const result = await generateQuotationItems(provider, requestDetails);
        res.json(result);
    } catch (error) {
        console.error('Error in AI generate-quotation-items:', error);
        res.status(500).json({ message: 'AI quotation generation failed.' });
    }
});


// Chatbot Streaming Endpoint
app.post('/api/ai/chatbot/init', authenticateToken, async (req, res) => {
    const { userId, initialMessage } = req.body;
    try {
        const sessionId = initChatSession(userId, initialMessage);
        res.status(200).json({ sessionId });
    } catch (error) {
        console.error('Error initializing chatbot session:', error);
        res.status(500).json({ message: 'Failed to initialize chatbot session.' });
    }
});

app.post('/api/ai/chatbot/message', authenticateToken, async (req, res) => {
    const { sessionId, message } = req.body;
    if (!sessionId || !message) {
        return res.status(400).json({ message: 'Session ID and message are required.' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
        const stream = await sendMessageStream(sessionId, message);
        for await (const chunk of stream) {
            res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
        res.end();
    } catch (error) {
        console.error('Error during chatbot message stream:', error);
        res.write(`data: ${JSON.stringify({ error: 'Failed to get response from AI.' })}\n\n`);
        res.end();
    }
});

app.post('/api/ai/chatbot/close', authenticateToken, async (req, res) => {
    const { sessionId } = req.body;
    try {
        closeChatSession(sessionId);
        res.status(200).json({ message: 'Chat session closed.' });
    } catch (error) {
        console.error('Error closing chatbot session:', error);
        res.status(500).json({ message: 'Failed to close chatbot session.' });
    }
});


// Bookings Endpoints
app.post('/api/bookings', authenticateToken, async (req, res) => {
    const { providerId, serviceDate, requestDetails, bookingType, otp, totalAmount, quotationItems, quotationStatus, dueDate, paymentDate, status } = req.body;

    if (!providerId || !serviceDate || !bookingType) {
        return res.status(400).json({ message: 'Missing required booking fields.' });
    }

    try {
        const newBooking = await prisma.booking.create({
            data: {
                providerId: providerId,
                customerId: req.user.userId,
                bookingDate: new Date(),
                serviceDate: new Date(serviceDate),
                requestDetails,
                bookingType,
                otp,
                totalAmount,
                quotationStatus,
                dueDate: dueDate ? new Date(dueDate) : null,
                paymentDate: paymentDate ? new Date(paymentDate) : null,
                status: status || (bookingType === 'instant' ? 'Pending Provider Confirmation' : 'Pending Provider Confirmation'),
                quotationItems: quotationItems ? {
                    createMany: {
                        data: quotationItems.map(item => ({
                            description: item.description,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                        }))
                    }
                } : undefined,
            },
            include: {
                provider: {
                    include: { owner: { select: { id: true, name: true, email: true } } }
                },
                customer: {
                    select: { id: true, name: true, email: true }
                },
                quotationItems: true,
            }
        });
        res.status(201).json({ message: 'Booking created successfully', booking: newBooking });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ message: 'Internal server error during booking creation.' });
    }
});

app.get('/api/bookings/my', authenticateToken, async (req, res) => {
    try {
        const bookings = await prisma.booking.findMany({
            where: {
                OR: [
                    { customerId: req.user.userId },
                    { provider: { ownerId: req.user.userId } }
                ]
            },
            include: {
                provider: {
                    include: { owner: { select: { id: true, name: true, email: true } } }
                },
                customer: {
                    select: { id: true, name: true, email: true }
                },
                quotationItems: true,
            },
            orderBy: {
                serviceDate: 'desc',
            },
        });
        res.status(200).json(bookings);
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

app.put('/api/bookings/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { status, review, chatHistory, quotationItems, quotationStatus, totalAmount, paymentDate, dueDate } = req.body;

    try {
        const existingBooking = await prisma.booking.findUnique({
            where: { id },
            include: { provider: { select: { ownerId: true, id: true } } }
        });

        if (!existingBooking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }
        
        // Authorization: ensure user is involved in the booking
        const isProvider = existingBooking.provider.ownerId === req.user.userId;
        const isCustomer = existingBooking.customerId === req.user.userId;

        if (!isProvider && !isCustomer) {
            return res.status(403).json({ message: 'Unauthorized to update this booking.' });
        }
        
        // --- Blacklisting Logic for Provider Rejection ---
        if (isProvider && status === 'Cancelled' && existingBooking.status === 'Pending Provider Confirmation') {
            const provider = await prisma.serviceProvider.findUnique({
                where: { id: existingBooking.providerId },
            });

            if (provider) {
                const now = new Date();
                const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
                const history = Array.isArray(provider.rejectionHistory) ? provider.rejectionHistory : [];
                
                const recentRejections = [...history, now.toISOString()].filter(
                    timestamp => new Date(timestamp) > thirtyDaysAgo
                );

                let providerUpdateData = { rejectionHistory: recentRejections };

                if (recentRejections.length >= 3) {
                    const blacklistEndDate = new Date();
                    blacklistEndDate.setMonth(blacklistEndDate.getMonth() + 3);
                    
                    providerUpdateData.isBlacklisted = true;
                    providerUpdateData.blacklistEndDate = blacklistEndDate;
                    providerUpdateData.rejectionHistory = []; // Reset history

                    await prisma.notification.create({
                        data: {
                            userId: provider.ownerId,
                            message: `Your account has been suspended until ${blacklistEndDate.toLocaleDateString()} due to frequent job rejections.`,
                        }
                    });
                }
                
                await prisma.serviceProvider.update({
                    where: { id: provider.id },
                    data: providerUpdateData,
                });
            }
        }

        const updatedBooking = await prisma.booking.update({
            where: { id },
            data: {
                status,
                review: review ? {
                    upsert: {
                        create: {
                            rating: review.rating,
                            reviewText: review.reviewText,
                            authorId: req.user.userId,
                            providerId: existingBooking.providerId,
                            date: new Date(review.date),
                        },
                        update: {
                            rating: review.rating,
                            reviewText: review.reviewText,
                            date: new Date(review.date),
                        },
                    }
                } : undefined,
                chatHistory,
                quotationStatus,
                totalAmount,
                paymentDate: paymentDate ? new Date(paymentDate) : undefined,
                dueDate: dueDate ? new Date(dueDate) : undefined,
            },
            include: {
                provider: {
                    include: { owner: { select: { id: true, name: true, email: true } } }
                },
                customer: {
                    select: { id: true, name: true, email: true }
                },
                review: true,
                quotationItems: true,
            }
        });

        if (quotationItems) {
            await prisma.quotationItem.deleteMany({ where: { bookingId: id } });
            await prisma.quotationItem.createMany({
                data: quotationItems.map(item => ({ ...item, bookingId: id })),
            });
            const finalBooking = await prisma.booking.findUnique({
                where: { id },
                include: {
                    provider: {
                        include: { owner: { select: { id: true, name: true, email: true } } }
                    },
                    customer: {
                        select: { id: true, name: true, email: true }
                    },
                    review: true,
                    quotationItems: true,
                }
            });
            return res.status(200).json({ message: 'Booking updated successfully', booking: finalBooking });
        }


        res.status(200).json({ message: 'Booking updated successfully', booking: updatedBooking });
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ message: 'Internal server error during booking update.' });
    }
});


// Notifications Endpoints
app.post('/api/notifications', authenticateToken, async (req, res) => {
    const { userId, message, bookingId } = req.body;
    try {
        const newNotification = await prisma.notification.create({
            data: {
                userId,
                message,
                bookingId,
                timestamp: new Date(),
                read: false,
            },
        });
        res.status(201).json({ message: 'Notification created', notification: newNotification });
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

app.get('/api/notifications/my', authenticateToken, async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user.userId },
            orderBy: { timestamp: 'desc' },
        });
        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error fetching user notifications:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

app.put('/api/notifications/mark-read', authenticateToken, async (req, res) => {
    try {
        await prisma.notification.updateMany({
            where: { userId: req.user.userId, read: false },
            data: { read: true },
        });
        res.status(200).json({ message: 'All notifications marked as read.' });
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// --- End of API Routes ---

// Serve static files from the React app's root directory
app.use(express.static(path.join(__dirname, '..')));

// Fallback for any other route - serve the React app's index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`V-Ken Serve Backend running on port ${PORT}`);
});