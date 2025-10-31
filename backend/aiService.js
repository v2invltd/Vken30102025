const { GoogleGenAI, Type } = require('@google/genai');
const { SERVICE_CATEGORIES, LOCATIONS } = require('./constants');

// Ensure API_KEY is loaded from environment variables
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set in the backend.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to robustly parse JSON from AI responses that might include markdown, leading/trailing text, etc.
function robustJsonParse(text) {
    // This new function is much more robust. It finds the first "{" or "["
    // and then properly scans for the matching closing character, ignoring any
    // other text or brackets outside of this main JSON structure.
    const jsonStartMatch = text.match(/(\[|\{)/);
    if (!jsonStartMatch) {
        // Fallback for simple values like "true", "null", or string literals.
        try {
            return JSON.parse(text.trim());
        } catch (e) {
            console.error("Could not parse as simple JSON value:", text.trim());
            throw new Error("AI response did not contain a valid JSON structure.");
        }
    }

    const startIndex = jsonStartMatch.index;
    const openChar = jsonStartMatch[0];
    const closeChar = openChar === '{' ? '}' : ']';
    
    let depth = 0;
    let endIndex = -1;

    // Iterate through the string to find the matching closing character.
    for (let i = startIndex; i < text.length; i++) {
        if (text[i] === openChar) {
            depth++;
        } else if (text[i] === closeChar) {
            depth--;
        }

        if (depth === 0) {
            endIndex = i;
            break;
        }
    }

    if (endIndex === -1) {
        throw new Error("AI response had an unbalanced JSON structure.");
    }

    const jsonString = text.substring(startIndex, endIndex + 1);

    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Final JSON Parsing Error:", e.message);
        console.error("--- Original AI Text ---");
        console.error(text);
        console.error("--- Extracted String Attempted to Parse ---");
        console.error(jsonString);
        throw new Error("AI returned a response that could not be parsed as JSON, even after extraction.");
    }
}


// --- Chatbot Session Management ---
const chatSessions = new Map(); // Stores active Chat objects by sessionId

function initChatSession(userId, initialMessage) {
    const sessionId = `chat-${userId}-${Date.now()}`;
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: "You are V-Ken Serve's friendly AI assistant. Help users find services, answer questions about our platform, and guide them through the booking process. Keep your answers concise and helpful.",
        },
    });
    chatSessions.set(sessionId, chat);
    console.log(`Chat session ${sessionId} initialized for user ${userId}`);
    return sessionId;
}

async function sendMessageStream(sessionId, userMessage) {
    const chat = chatSessions.get(sessionId);
    if (!chat) {
        throw new Error(`No active chat session found for ID: ${sessionId}`);
    }
    return await chat.sendMessageStream({ message: userMessage });
}

function closeChatSession(sessionId) {
    if (chatSessions.delete(sessionId)) {
        console.log(`Chat session ${sessionId} closed.`);
    } else {
        console.warn(`Attempted to close non-existent chat session ${sessionId}.`);
    }
}


// --- Helper Functions for AI Models ---

const fileToGenerativePart = async (file) => {
    // For backend, `file` should already be in the structure { mimeType, data }
    // `data` is the base64 encoded string
    return {
        inlineData: { data: file.data, mimeType: file.mimeType },
    };
};

// Function declarations for tool use
const findServicesFunctionDeclaration = {
  name: 'findServices',
  description: 'Extracts the service category and location from a user\'s query for a Kenyan services app.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      serviceCategory: {
        type: Type.STRING,
        description: 'The specific service the user is looking for.',
        enum: SERVICE_CATEGORIES,
      },
      location: {
        type: Type.STRING,
        description: 'The city in Kenya where the user needs the service.',
        enum: LOCATIONS,
      },
    },
    required: ['serviceCategory', 'location'],
  },
};

// --- Local Hub AI Functions ---

async function getLocalWeather(location) {
    const defaultWeather = { description: "Weather data unavailable.", icon: "❓" };
    try {
        // Step 1: Get raw weather data using Google Search grounding
        const searchResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `What is the current weather forecast for ${location}, Kenya? Include temperature in Celsius, conditions (e.g., sunny, cloudy), and wind speed.`,
            config: { tools: [{ googleSearch: {} }] }
        });

        const weatherText = searchResponse.text;
        if (!weatherText) {
            throw new Error("Google Search did not return weather information.");
        }

        // Step 2: Use the search result to generate a structured JSON output
        const summaryPrompt = `From this weather report: "${weatherText}", extract a very short, friendly description (e.g., 'Clear skies and pleasant at 25°C.') and suggest a single, appropriate emoji icon. Respond ONLY with a valid JSON object with "description" and "icon" keys.`;

        const formatResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: summaryPrompt,
            config: { responseMimeType: "application/json" }
        });

        return robustJsonParse(formatResponse.text);

    } catch (error) {
        console.error(`Error getting Gemini weather for ${location}:`, error);
        return defaultWeather;
    }
}

async function getLocalNews(location) {
    const getHostname = (url) => {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch (e) {
            return 'Unknown Source';
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Find the top 2-3 latest news headlines specifically for ${location}, Kenya.`,
            config: { tools: [{ googleSearch: {} }] }
        });
        
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        if (groundingChunks.length === 0) {
            console.warn(`Gemini Search found no news for ${location}.`);
            return [];
        }

        return groundingChunks
            .filter(chunk => chunk.web) // Only process chunks that have a 'web' property
            .map(chunk => ({
                title: chunk.web.title,
                url: chunk.web.uri,
                source: { name: getHostname(chunk.web.uri) }
            }))
            .slice(0, 3);
            
    } catch(e) {
        console.error(`Error getting Gemini news for ${location}:`, e);
        return [];
    }
}

async function getLocalEvents(location) {
  const model = "gemini-2.5-flash";
  const prompt = `List 2-3 upcoming events in ${location}, Kenya (like concerts, markets, festivals).`;
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] }
    });
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
     return groundingChunks
        .filter(chunk => chunk.web) // Only process chunks that have a 'web' property
        .map(chunk => ({
            title: chunk.web.title,
            url: chunk.web.uri,
            date: 'Upcoming', // Search grounding doesn't reliably provide dates, so we use a generic label
        })).slice(0, 3);
  } catch (error) {
    console.error(`Error getting events for ${location}:`, error);
    return [];
  }
}

async function getLocalHistoryFact(location) {
  const model = "gemini-2.5-flash";
  const prompt = `Tell me one interesting, little-known historical fact or piece of trivia about ${location}, Kenya. Keep it concise (1-2 sentences).`;
  try {
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text.trim();
  } catch (error) {
    console.error(`Error getting history fact for ${location}:`, error);
    return "Could not load a fun fact at this time.";
  }
}

async function getLocalHubData(location) {
    // Use Promise.allSettled to ensure that the failure of one service does not prevent others from loading.
    const results = await Promise.allSettled([
        getLocalWeather(location),
        getLocalNews(location),
        getLocalEvents(location),
        getLocalHistoryFact(location),
    ]);

    // Safely extract results, providing default values for any failed promises.
    const weather = results[0].status === 'fulfilled' ? results[0].value : { description: "Weather data unavailable.", icon: "❓" };
    const news = results[1].status === 'fulfilled' ? results[1].value : [];
    const events = results[2].status === 'fulfilled' ? results[2].value : [];
    const historyFact = results[3].status === 'fulfilled' ? results[3].value : "Could not load a fun fact at this time.";

    return { weather, news, events, historyFact };
}

// --- Exported AI Service Functions ---

async function getReadableLocation(lat, lon) {
  const model = "gemini-2.5-flash";
  const prompt = `
    Based on the coordinates latitude: ${lat} and longitude: ${lon}, what is the neighborhood or specific area in Kenya?
    Respond with a short, user-friendly location name. For example: "Westlands, Nairobi" or "Diani Beach".
    If you cannot determine a specific area, return an empty string. Respond ONLY with the location name as a plain string.
  `;
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    const locationName = response.text.trim();
    return locationName || null;
  } catch (error) {
    console.error("Error getting readable location from Gemini:", error);
    throw new Error("Failed to get readable location from AI.");
  }
}

async function getCityFromCoordinates(lat, lon) {
  const model = "gemini-2.5-flash";
  const prompt = `
    Based on the coordinates latitude: ${lat} and longitude: ${lon}, identify the closest major Kenyan city from this list.
    Allowed cities: ${LOCATIONS.join(', ')}.
    Respond ONLY with the name of the city as a plain string. For example: "Nairobi". If you cannot determine a close city from the list, respond with an empty string.
  `;
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    const city = response.text.trim();
    // Validate if the returned city is in our enum
    if (Object.values(LOCATIONS).includes(city)) { // Use LOCATIONS directly as it's an array of strings
      return city;
    }
    return null;
  } catch (error) {
    console.error("Error getting city from coordinates from Gemini:", error);
    throw new Error("Failed to get city from coordinates from AI.");
  }
}

async function verifyProviderImage(imageFile, imageType) {
  const model = "gemini-2.5-flash";
  const imagePart = await fileToGenerativePart(imageFile);

  const prompt = `
    Analyze this image. The user is a service provider in Kenya (e.g., plumber, tour guide) and wants to use it as their ${imageType}.

    Is this image suitable for a professional service provider profile? A suitable image should be professional, relevant to their service, and not contain any inappropriate content. A logo, a picture of the provider at work, or a high-quality picture of their equipment are all good examples. A selfie, a picture of an unrelated object, or a low-quality/blurry image are bad examples.

    Respond with a JSON object that matches the provided schema.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [ { text: prompt }, imagePart ] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suitable: {
              type: Type.BOOLEAN,
              description: "True if the image is suitable, false otherwise."
            },
            reason: {
              type: Type.STRING,
              description: "A brief, user-friendly explanation for why the image is suitable or not. (e.g., 'A professional-looking logo.', 'This appears to be a blurry selfie and may not be suitable.')."
            }
          },
          required: ['suitable', 'reason'],
        },
      },
    });

    const jsonText = response.text.trim();
    return robustJsonParse(jsonText);

  } catch (error) {
    console.error("Error calling Gemini Vision API:", error);
    throw new Error("Could not analyze the image via AI. Please try another one.");
  }
}

async function parseServiceRequest(query, coordinates) {
  const model = "gemini-2.5-flash";

  let locationHint = '';
  if (coordinates) {
    locationHint = `The user's geographical coordinates are latitude: ${coordinates.lat}, longitude: ${coordinates.lon}.`;
    if (query.toLowerCase().includes("nearby") || query.toLowerCase().includes("near me")) {
        const city = await getCityFromCoordinates(coordinates.lat, coordinates.lon);
        if (city) {
            locationHint += ` Based on these coordinates, the user is in or near the city of ${city}. You should use '${city}' as the location for the function call.`;
        }
    }
  }

  const prompt = `
    Analyze the user's query and call the findServices function with the extracted parameters.
    User query: "${query}"
    ${locationHint}
    If the user asks for services "nearby" or "near me", you MUST use the provided geographical information to determine the correct city from the function's available location options. Do not guess a location if coordinates are not provided for a "nearby" request.
  `;

  try {
    const config = {
      tools: [{ functionDeclarations: [findServicesFunctionDeclaration] }],
      toolConfig: { googleMaps: {} } // Always enable Google Maps grounding for location-based queries
    };

    if (coordinates) {
        config.toolConfig.retrievalConfig = {
            latLng: {
                latitude: coordinates.lat,
                longitude: coordinates.lon
            }
        };
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: config,
    });
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const functionCall = response.functionCalls?.[0];

    if (functionCall && functionCall.name === 'findServices') {
      const { serviceCategory, location } = functionCall.args;
      return {
        serviceCategory: serviceCategory || null,
        location: location || null,
        groundingChunks,
      };
    } else {
       return {
            serviceCategory: null,
            location: null,
            error: "Sorry, I couldn't determine the exact service or location. Could you please be more specific?",
            groundingChunks,
        };
    }
  } catch (error) {
    console.error("Error calling Gemini API for service parsing:", error);
    throw new Error("Failed to parse service request due to an AI API error.");
  }
}

async function generateProviderProfile(businessName, category) {
  const model = "gemini-2.5-flash";
  const prompt = `
    A new service provider in Kenya named "${businessName}" is signing up for the "${category}" category.
    1.  Generate a compelling, professional, and short service description for their profile (25-40 words).
    2.  Suggest a list of 5-7 relevant expertise keywords as a JSON array of strings.
    3.  Suggest a high-quality, professional, and relevant cover image URL from a stock photo site like Pexels or Unsplash. The image should be suitable for a business in the "${category}" category. For example, for 'Plumbing', a good image would be of modern tools or a clean bathroom. For 'Wildlife Tours', an image of a Kenyan landscape with animals. The URL must be a direct link to an image file (e.g., ending in .jpg or .jpeg) and have a resolution suitable for a banner, like 800x400.
    
    The final output must be a single JSON object that matches the provided schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: {
              type: Type.STRING,
              description: "The generated service description."
            },
            expertise: {
              type: Type.ARRAY,
              description: "A list of expertise keywords.",
              items: { type: Type.STRING }
            },
            coverImageUrl: {
                type: Type.STRING,
                description: "A URL for a suggested stock photo cover image."
            }
          },
          required: ['description', 'expertise', 'coverImageUrl']
        }
      }
    });
    const jsonText = response.text.trim();
    return robustJsonParse(jsonText);
  } catch (error) {
    console.error("Error generating provider profile from Gemini:", error);
    throw new Error("Failed to generate AI-powered profile details.");
  }
}

async function generateQuotationItems(provider, requestDetails) {
  const model = "gemini-2.5-flash";
  const { category, name: providerName, expertise, detailedServices } = provider;

  const providerContext = `
    You are generating a quotation for a service provider in Kenya named "${providerName}".
    Their category is "${category}".
    Their listed expertise includes: ${expertise?.join(', ') || 'Not specified'}.
    They offer the following detailed services: 
    ${detailedServices?.map(s => `- ${s.name}: ${s.description} (Price: ${s.price})`).join('\n') || 'Not specified'}.
  `;

  const prompt = `
    ${providerContext}

    A customer has sent the following request: "${requestDetails}".

    Based on the customer's request AND the provider's specific services and expertise, generate a list of likely quotation items.
    - The "description" for each item should be a clear, concise line item that aligns with the services offered by this specific provider.
    - The "quantity" should be a reasonable starting number (usually 1).
    - The "unitPrice" should be a typical, realistic price in Kenyan Shillings (KES) for that item, informed by the provider's listed prices if available. Do not include currency symbols.
    
    The response must be a JSON array of objects, matching the provided schema. If the customer's request seems completely unrelated to the provider's services, return an "empty array.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: {
                type: Type.STRING,
                description: "Line item description."
              },
              quantity: {
                type: Type.INTEGER,
                description: "Default quantity for the item."
              },
              unitPrice: {
                type: Type.NUMBER,
                description: "Suggested price in KES."
              }
            },
            required: ['description', 'quantity', 'unitPrice']
          }
        }
      }
    });
    const jsonText = response.text.trim();
    return robustJsonParse(jsonText);
  } catch (error) {
    console.error("Error generating quotation items from Gemini:", error);
    throw new Error("Failed to generate AI-powered quotation.");
  }
}

async function generateLogoImage(prompt) {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `${prompt}, simple, modern, vector logo, on a white background`,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
              aspectRatio: '1:1',
            },
        });

        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        return `data:image/png;base64,${base64ImageBytes}`;
    } catch (error) {
        console.error("Error generating logo from Imagen:", error);
        throw new Error("Failed to generate AI-powered logo.");
    }
}

async function decideBookingAction(booking) {
    const model = "gemini-2.5-flash";
    const prompt = `
      You are an AI assistant for a service provider named "${booking.provider.name}" in the "${booking.provider.category}" business.
      A new booking request has come in from a customer named "${booking.customer.name}".
      
      Request Details: "${booking.requestDetails || 'No specific details provided.'}"
      Requested Date: ${new Date(booking.serviceDate).toLocaleString()}
      
      Your task is to decide whether to ACCEPT or DECLINE this request based on a simulated analysis.
      - Acknowledge reasonable requests.
      - Be cautious about vague, unusual, or last-minute requests.
      
      Respond with a JSON object matching this schema:
      {
        "action": "'accept' or 'decline'",
        "reason": "A brief, 1-sentence reason for your decision. e.g., 'The customer's request is clear and falls within our service hours.' or 'The request is too last-minute and we may not have availability.'"
      }
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        const jsonText = response.text.trim();
        return robustJsonParse(jsonText);
    } catch (error) {
        console.error("Error with AI booking decision:", error);
        // Fallback in case of AI error
        return { action: 'accept', reason: 'Default acceptance due to AI analysis error.' };
    }
}

async function generateDetailedServices(category, description) {
  const model = "gemini-2.5-flash";
  const prompt = `
    A service provider in Kenya in the "${category}" category has this business description: "${description}".
    
    Generate a list of 3 to 5 specific, detailed services they might offer. For each service, provide a unique string 'id', a name, a short description (10-15 words), and a realistic price or price range in Kenyan Shillings (KES).
    
    The response must be a JSON array of objects, matching the provided schema. For example, for a plumber, a service could be "Faucet Repair" with a price of "KES 1,500 - 2,500".
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: {
                type: Type.STRING,
                description: "A unique identifier string, e.g., 'service-123'."
              },
              name: {
                type: Type.STRING,
                description: "The name of the specific service."
              },
              description: {
                type: Type.STRING,
                description: "A short description of the service."
              },
              price: {
                type: Type.STRING,
                description: "The price or price range in KES, e.g., 'KES 5,000' or 'Starting from KES 1,200'."
              }
            },
            required: ['id', 'name', 'description', 'price']
          }
        }
      }
    });
    const jsonText = response.text.trim();
    return robustJsonParse(jsonText);
  } catch (error) {
    console.error("Error generating detailed services:", error);
    throw new Error("Failed to generate AI-powered service suggestions.");
  }
}

async function generateSearchSuggestions(category, providers) {
  const model = "gemini-2.5-flash";
  const expertiseList = providers
    .flatMap(p => [...(p.expertise || []), ...(p.detailedServices?.map(s => s.name) || [])])
    .filter((value, index, self) => self.indexOf(value) === index) // Unique values
    .slice(0, 20) // Limit context size
    .join(', ');

  if (!expertiseList) {
      return []; // Return empty if no expertise context is available
  }

  const prompt = `A user searched for the category "${category}" in Kenya. The search found providers with the following skills and services: ${expertiseList}.
  Based on the user's search and this context, suggest 3 to 5 very specific and relevant sub-categories or related services.
  For example, if the category is "Cleaning" and expertise includes "Office Cleaning, Carpet Shampooing", you could suggest "Carpet Cleaning", "Commercial Cleaning", "Upholstery Cleaning".
  If the category is "Plumbing", suggestions could be "Geyser Installation", "Blocked Drain", "Leak Detection".
  The suggestions should be short, actionable phrases.
  Return the suggestions as a JSON array of strings.`;

  try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      const jsonText = response.text.trim();
      return robustJsonParse(jsonText);
  } catch(error) {
      console.error("Error generating search suggestions from Gemini:", error);
      throw new Error("Failed to generate AI-powered search suggestions.");
  }
}


module.exports = {
  getReadableLocation,
  getCityFromCoordinates,
  verifyProviderImage,
  parseServiceRequest,
  generateProviderProfile,
  generateQuotationItems,
  generateLogoImage,
  decideBookingAction,
  generateDetailedServices,
  initChatSession,
  sendMessageStream,
  closeChatSession,
  generateSearchSuggestions,
  getLocalHubData,
};