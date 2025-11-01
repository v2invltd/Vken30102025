
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

function initChatSession(userId) {
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
        const summaryPrompt = `From this weather report: "${weatherText}", extract a very short, friendly description (e.g., 'Clear skies and pleasant at 25°C.') and suggest a single, appropriate emoji icon.`;

        const formatResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: summaryPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        description: {
                            type: Type.STRING,
                            description: "A very short, friendly description of the weather."
                        },
                        icon: {
                            type: Type.STRING,
                            description: "A single, appropriate emoji icon for the weather."
                        }
                    },
                    required: ['description', 'icon']
                }
            }
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
        const prompt = `Find the top 2-3 latest news headlines for ${location}, Kenya. For each headline, provide the title, a direct URL to the article, and the source's name.`;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING, description: "The news headline." },
                            url: { type: Type.STRING, description: "The URL to the news article." },
                            sourceName: { type: Type.STRING, description: "The name of the news source (e.g., 'The Standard', 'Citizen TV')." }
                        },
                        required: ["title", "url", "sourceName"]
                    }
                }
            }
        });

        const newsItems = robustJsonParse(response.text);
        // Map the result to the format expected by the frontend
        return newsItems.map(item => ({
            title: item.title,
            url: item.url,
            source: { name: item.sourceName || getHostname(item.url) }
        }));

    } catch (e) {
        console.error(`Error getting Gemini news for ${location}:`, e);
        return [];
    }
}

async function getLocalEvents(location) {
  try {
    const prompt = `List 2-3 upcoming public events in ${location}, Kenya (like concerts, markets, festivals). For each event, provide the event title, a URL for more information if available, and a simple date description (e.g., 'This Weekend', 'July 25th').`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "The name of the event." },
                        url: { type: Type.STRING, description: "A URL for more information." },
                        date: { type: Type.STRING, description: "A simple date description." }
                    },
                    required: ["title", "date"]
                }
            }
        }
    });
    return robustJsonParse(response.text);
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

async function parseServiceRequest(query, coordinates, image) {
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
    Analyze the user's query and the provided image (if any) and call the findServices function to extract the service category and location. The user is in Kenya. ${locationHint}
    If the image shows a problem (e.g., a broken pipe, a dirty room, a wall that needs painting), use it as the primary clue for the service category. Use the text query for additional context or location.
    If the text and image seem to conflict, prioritize the image for the service category.
  `;
  
  // Prepare content for Gemini API
  const contents = {
    parts: [{ text: prompt }]
  };
  
  if (image) {
    // Image is a data URL: "data:image/jpeg;base64,..."
    // We need to extract the mimeType and base64 data
    const match = image.match(/^data:(image\/.+);base64,(.+)$/);
    if (!match) {
        throw new Error("Invalid image data URL format provided.");
    }
    const mimeType = match[1];
    const data = match[2];
    
    contents.parts.push({
      inlineData: {
        mimeType: mimeType,
        data: data
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents, // Use the new multi-part contents
      config: {
        tools: [{ functionDeclarations: [findServicesFunctionDeclaration] }],
      },
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      const functionCall = response.functionCalls[0];
      if (functionCall.name === 'findServices') {
        // Add grounding chunks to the successful response if they exist
        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
        return {
          serviceCategory: functionCall.args.serviceCategory,
          location: functionCall.args.location,
          groundingChunks: groundingMetadata?.groundingChunks || null,
        };
      }
    }

    // Fallback if function calling fails: attempt to parse text response
    const textResponse = response.text;
    console.warn("AI function calling did not trigger, falling back to text analysis.", textResponse);

    // Create a regex to find category and location from text
    const categoryRegex = new RegExp(`(${SERVICE_CATEGORIES.join('|')})`, 'i');
    const locationRegex = new RegExp(`(${LOCATIONS.join('|')})`, 'i');
    
    const categoryMatch = textResponse.match(categoryRegex);
    const locationMatch = textResponse.match(locationRegex);

    if (categoryMatch && locationMatch) {
        return {
            serviceCategory: categoryMatch[0],
            location: locationMatch[0],
        };
    } else {
        throw new Error("Could not determine both a service and location from your request.");
    }

  } catch (error) {
    console.error("Error calling Gemini in parseServiceRequest:", error);
    throw new Error("The AI assistant could not understand your request. Please try rephrasing.");
  }
}

async function generateProviderProfile(businessName, category) {
  const model = "gemini-2.5-flash";
  const prompt = `
    Generate a professional and appealing service provider profile for a business in Kenya.
    Business Name: "${businessName}"
    Service Category: "${category}"

    Your response must be a JSON object matching the provided schema.

    - The description should be 1-2 engaging sentences.
    - The expertise should be an array of 3-5 specific, relevant skills.
    - Generate a descriptive prompt for an AI image generator to create a high-quality, professional cover image. The image should be relevant to the service and have a Kenyan context if appropriate.
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
              description: "A short, professional description of the service provider."
            },
            expertise: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of specific skills or services offered."
            },
            coverImagePrompt: {
              type: Type.STRING,
              description: "A prompt for an AI image generator to create a cover photo."
            }
          },
          required: ['description', 'expertise', 'coverImagePrompt'],
        },
      },
    });
    
    const parsedResponse = robustJsonParse(response.text);

    // Now, generate the image using the prompt we just created
    const coverImageUrl = "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=800&h=400&fit=crop"; // Fallback
    try {
        // This is a placeholder for a real image generation call
        // const imageResponse = await someImageGenerationApi(parsedResponse.coverImagePrompt);
        // For this app, we will use a static image to avoid costs/complexity of another API.
        // In a real scenario, you'd replace the fallback URL with the result.
        console.log(`Image prompt that would be used: ${parsedResponse.coverImagePrompt}`);
    } catch(imgError) {
        console.error("Image generation failed, using fallback.", imgError);
    }
    
    return {
        description: parsedResponse.description,
        expertise: parsedResponse.expertise,
        coverImageUrl: coverImageUrl
    };

  } catch (error) {
    console.error("Error generating provider profile with Gemini:", error);
    throw new Error("AI could not generate profile details.");
  }
}


async function generateLogoImage(prompt) {
    // This is a placeholder. A real implementation would call an image generation model.
    // For this app, we return a dynamic avatar URL instead to simulate logo generation.
    const encodedPrompt = encodeURIComponent(prompt);
    return `https://ui-avatars.com/api/?name=${encodedPrompt}&background=007A33&color=fff&size=256&bold=true`;
}

async function generateDetailedServices(category, description) {
  const model = "gemini-2.5-flash";
  const prompt = `
    Based on the following service provider profile, suggest a list of 3 to 5 specific, detailed services they might offer.
    Service Category: "${category}"
    Provider Description: "${description}"
    
    For each service, provide a name, a brief one-sentence description, and a plausible price in Kenyan Shillings (KES) as a string (e.g., "KES 1,500" or "Starting from KES 5,000").
    
    Respond with a JSON array that matches the provided schema.
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
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              price: { type: Type.STRING }
            },
            required: ['name', 'description', 'price']
          }
        }
      }
    });
    return robustJsonParse(response.text);
  } catch(error) {
    console.error("Error generating detailed services with Gemini:", error);
    throw new Error("AI could not generate detailed services.");
  }
}

async function generateQuotationItems(provider, requestDetails) {
    const model = "gemini-2.5-flash";
    const prompt = `
        A customer needs the following service: "${requestDetails}".
        The service provider is a "${provider.category}" professional in Kenya. Their hourly rate is ${provider.hourlyRate} KES.
        
        Based on the request, create a list of 2-4 line items for a price quotation. For each item, provide a clear description, a quantity, and a reasonable unit price in Kenyan Shillings.
        The prices should be plausible for the Kenyan market.
        
        Respond ONLY with a JSON array that matches the provided schema.
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
                            description: { type: Type.STRING },
                            quantity: { type: Type.INTEGER },
                            unitPrice: { type: Type.NUMBER }
                        },
                        required: ['description', 'quantity', 'unitPrice']
                    }
                }
            }
        });
        return robustJsonParse(response.text);
    } catch(error) {
        console.error("Error generating quotation items with Gemini:", error);
        throw new Error("AI could not generate quotation items.");
    }
}


async function generateSearchSuggestions(category, providers) {
    const model = "gemini-2.5-flash";
    // Create a summary of available expertise to give the model context.
    const expertiseSample = providers
        .flatMap(p => p.expertise || [])
        .slice(0, 20) // Limit context size
        .join(', ');

    const prompt = `
        A user is searching for "${category}" services.
        Some of the available specializations from providers include: ${expertiseSample}.
        
        Based on this, suggest 3-4 short, specific, and relevant search terms a user might type to refine their search. For example, if the category is 'Plumbing', suggestions could be 'Leaky tap repair', 'Blocked drain', 'Geyser installation'.
        
        Return a JSON array of strings.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
        });
        return robustJsonParse(response.text);
    } catch(error) {
        console.error("Error generating search suggestions with Gemini:", error);
        throw new Error("AI could not generate search suggestions.");
    }
}


module.exports = {
  parseServiceRequest,
  generateProviderProfile,
  generateLogoImage,
  generateDetailedServices,
  verifyProviderImage,
  getReadableLocation,
  getCityFromCoordinates,
  initChatSession,
  sendMessageStream,
  closeChatSession,
  generateQuotationItems,
  generateSearchSuggestions,
  getLocalHubData
};