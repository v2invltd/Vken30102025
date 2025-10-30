import { test, expect, Page, BrowserContext } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { Booking, User, UserRole, ServiceProvider } from '../types';

// FIX: Define __dirname for ES Modules to resolve path to test fixtures.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Test Data ---
const now = Date.now();
const providerUser = {
    name: 'Pius Plumber',
    email: `pius.plumber.${now}@test.com`,
    phone: '712345678', // No leading 0
    password: 'Password123!',
    businessName: 'Pius Premium Plumbing',
    kraPin: 'A012345678B', // Mock valid KRA PIN
};

const customerUser = {
    name: 'Charles Customer',
    email: `charles.customer.${now}@test.com`,
    phone: '787654321', // No leading 0
    password: 'Password123!',
    nationalId: '12345678',
};

test.describe('V-Ken Serve Full E2E User Journey', () => {
    
    // Use a single test to maintain state between customer and provider actions
    test('should allow a provider to register, get booked by a customer, and receive a review', async ({ page, browser }) => {
        let otp: string;
        let bookingForOtp: Booking;
        
        // --- 1. Provider Registration ---
        await test.step('Provider Registration', async () => {
            await page.goto('/');
            // Handle initial location selector
            await page.getByRole('heading', { name: 'First, please select your city' }).waitFor();
            await page.getByRole('heading', { name: 'Nairobi' }).click();

            // Start registration
            await page.getByRole('button', { name: 'Login / Register' }).click();
            await page.getByRole('button', { name: 'Register' }).click();
            await page.getByRole('button', { name: "I'm a Provider" }).click();

            // Fill form
            await page.getByPlaceholder('Full Name').fill(providerUser.name);
            await page.getByPlaceholder('Email Address').fill(providerUser.email);
            await page.getByPlaceholder('712345678').fill(providerUser.phone);
            await page.getByPlaceholder('Password').fill(providerUser.password);
            await page.getByLabel('I agree to the Terms of Service and Privacy Policy.').check();
            await page.getByRole('button', { name: 'Register as Provider' }).click();

            // On successful registration, the provider registration modal should open
            await expect(page.getByRole('heading', { name: 'Become a V-Ken Serve Provider' })).toBeVisible();

            // --- Step 1: Business & Legal ---
            await page.getByPlaceholder('e.g., Nairobi Best Plumbers').fill(providerUser.businessName);
            await page.getByPlaceholder('A000000000B').fill(providerUser.kraPin);
            await page.getByRole('button', { name: 'Verify' }).click();
            await expect(page.getByText('PIN Verified Successfully.')).toBeVisible();

            // Upload dummy files
            const kraFilePath = path.join(__dirname, 'fixtures/dummy_doc.pdf');
            const clearanceFilePath = path.join(__dirname, 'fixtures/dummy_doc.pdf');
            await page.locator('input[type="file"]').first().setInputFiles(kraFilePath);
            await page.locator('input[type="file"]').last().setInputFiles(clearanceFilePath);

            await page.getByRole('button', { name: 'Next' }).click();

            // --- Step 2: Service Details ---
            await expect(page.getByText('Generate Profile with AI')).toBeVisible();

            // Select category and location
            await page.getByRole('combobox').selectOption('Plumbing');
            await page.getByRole('button', { name: 'Select locations' }).click();
            await page.getByText('Nairobi').click();
            
            // Use AI to generate profile
            await page.getByRole('button', { name: 'Generate Profile with AI' }).click();
            await expect(page.locator('textarea[name="description"]')).not.toBeEmpty({ timeout: 15000 });
            await expect(page.locator('input[type="text"][value*="Leak repair"]')).toBeVisible({ timeout: 15000 });

            // Fill remaining details
            await page.getByPlaceholder('e.g., 1500').fill('2000');
            
            // Generate logo
            await page.getByPlaceholder('Describe a logo...').fill('A simple logo for a plumbing company with a wrench and a water drop');
            await page.getByRole('button', { name: 'Sparkles Icon' }).last().click();
            await expect(page.locator('img[alt="Logo"]')).toBeVisible({ timeout: 20000 });
            
            // Finalize registration
            await page.getByLabel('I have read and agree to the Provider Agreement and Privacy Policy.').check();
            await page.getByRole('button', { name: 'Complete Registration' }).click();

            // After registration, KYC modal appears
            await expect(page.getByRole('heading', { name: 'Complete Your Profile (KYC)' })).toBeVisible();
            await page.getByPlaceholder('National ID / Passport Number').fill('12345678');
            await page.getByRole('button', { name: 'Verify' }).click(); // Verify phone
            await expect(page.getByText('Verify Your Phone')).toBeVisible();
            await page.getByPlaceholder('Enter 4-digit OTP').fill('1234'); // Use demo OTP
            await page.getByRole('button', { name: 'Verify' }).last().click();
            await expect(page.getByText('Verified')).toBeVisible();

            await page.getByRole('button', { name: 'Submit for Verification' }).click();

            // Should land on Provider Dashboard
            await expect(page.getByRole('heading', { name: 'Provider Dashboard' })).toBeVisible({ timeout: 10000 });
        });
        
        // --- 2. Create a new context for the Customer ---
        const customerContext: BrowserContext = await browser.newContext();
        const customerPage: Page = await customerContext.newPage();

        await test.step('Customer Registration & Booking', async () => {
            await customerPage.goto('/');
            // Handle initial location selector
            await customerPage.getByRole('heading', { name: 'First, please select your city' }).waitFor();
            await customerPage.getByRole('heading', { name: 'Nairobi' }).click();

            // Register as customer
            await customerPage.getByRole('button', { name: 'Login / Register' }).click();
            await customerPage.getByRole('button', { name: 'Register' }).click();
            await customerPage.getByRole('button', { name: "I'm a Customer" }).click();
            
            await customerPage.getByPlaceholder('Full Name').fill(customerUser.name);
            await customerPage.getByPlaceholder('Email Address').fill(customerUser.email);
            await customerPage.getByPlaceholder('712345678').fill(customerUser.phone);
            await customerPage.getByPlaceholder('Password').fill(customerUser.password);
            await customerPage.getByLabel('I agree to the Terms of Service and Privacy Policy.').check();
            await customerPage.getByRole('button', { name: 'Register' }).click();

            // OTP verification for registration
            await expect(customerPage.getByRole('heading', { name: 'Verify Your WhatsApp Number' })).toBeVisible();
            await customerPage.getByPlaceholder('Enter 4-digit OTP').fill('1234');
            await customerPage.getByRole('button', { name: 'Verify' }).click();
            
            // Complete KYC
            await expect(customerPage.getByRole('heading', { name: 'Complete Your Profile (KYC)' })).toBeVisible();
            await customerPage.getByPlaceholder('National ID Number').fill(customerUser.nationalId);
            await customerPage.getByRole('button', { name: 'Verify' }).click();
            await expect(customerPage.getByText('Verify Your Phone')).toBeVisible();
            await customerPage.getByPlaceholder('Enter 4-digit OTP').fill('1234');
            await customerPage.getByRole('button', { name: 'Verify' }).last().click();
            await expect(customerPage.getByText('Verified')).toBeVisible();
            await customerPage.getByRole('button', { name: 'Submit for Verification' }).click();
            
            // Use AI assistant to find the provider
            await customerPage.getByLabel('Open AI Assistant').click();
            await customerPage.getByPlaceholder('Tell us what you need...').fill('I need a plumber in Nairobi to fix a kitchen sink');
            await customerPage.getByRole('button', { name: 'Find Providers' }).click();
            
            // Verify search results
            await expect(customerPage.getByRole('heading', { name: `Providers for Plumbing` })).toBeVisible({ timeout: 10000 });
            await expect(customerPage.getByText(providerUser.businessName)).toBeVisible();
            
            // View details and book
            await customerPage.getByRole('button', { name: 'Request Quote' }).first().click();
            
            // Fill booking modal
            await customerPage.locator('textarea[id="requestDetails"]').fill('My kitchen sink has a persistent drip.');
            await customerPage.getByText('24').click(); // Click a date
            await customerPage.getByRole('button', { name: '8:00 AM' }).click();
            await customerPage.getByRole('button', { name: 'Send Booking Request' }).click();

            // Assert confirmation
            await expect(customerPage.getByRole('heading', { name: 'Request Sent!' })).toBeVisible();

            // Get the booking object for the next step
            otp = await customerPage.locator('.font-mono.tracking-widest').innerText();
            
            await customerPage.getByRole('button', { name: 'Done' }).click();
        });

        // --- 3. Provider Accepts and Creates Quote ---
        await test.step('Provider Accepts and Quotes', async () => {
            await page.reload(); // Refresh provider dashboard to see new booking
            await expect(page.getByText('New Requests')).toBeVisible();
            
            // Find the new booking
            await expect(page.getByText(`Customer: ${customerUser.name}`)).toBeVisible();
            
            // Accept the booking
            await page.getByLabel('Accept Booking').click();
            await expect(page.getByText('Accept Booking Request')).toBeVisible();
            await page.getByRole('button', { name: 'Yes, Accept' }).click();
            
            // Navigate to upcoming, find booking, and create quote
            await page.getByRole('button', { name: 'Upcoming' }).click();
            await expect(page.getByText('Awaiting Customer')).toBeVisible();
            
            await page.getByRole('button', { name: 'Create Quote' }).click();
            await expect(page.getByRole('heading', { name: 'Create Quotation' })).toBeVisible();
            
            // Use AI to generate quote
            await page.getByRole('button', { name: 'Generate with AI' }).click();
            await expect(page.locator('input[value*="Labor"]')).toBeVisible({timeout: 15000});
            
            await page.getByRole('button', { name: 'Send Quotation' }).click();
        });
        
        // --- 4. Customer Accepts Quote and Starts Service ---
        await test.step('Customer Accepts Quote and Confirms', async () => {
            await customerPage.getByRole('button', { name: 'My Bookings' }).click();
            await expect(customerPage.getByText('Awaiting Customer Confirmation')).toBeVisible();

            // Find OTP and store it
            const otpElement = customerPage.locator('strong.font-mono');
            await expect(otpElement).toBeVisible();
            otp = await otpElement.innerText();
            expect(otp).toHaveLength(4);

            await customerPage.getByRole('button', { name: 'View & Respond to Quotation' }).click();
            await expect(customerPage.getByRole('heading', { name: 'View Quotation' })).toBeVisible();
            await customerPage.getByRole('button', { name: 'Accept Quotation' }).click();
            
            // Now confirm and pay fee
            await customerPage.getByRole('button', { name: 'Confirm & Pay Fee' }).click();
            await expect(customerPage.getByRole('heading', { name: 'Choose Payment Method' })).toBeVisible();
            await customerPage.getByRole('button', { name: 'I Have Paid, Confirm Booking' }).click();
            await expect(customerPage.getByRole('heading', { name: 'Booking Confirmed!' })).toBeVisible();
            
            // Construct mock booking for OTP step
             bookingForOtp = {
                id: 'test-booking-id',
                otp: otp,
                quotationStatus: 'Accepted',
                totalAmount: 5000,
                provider: { id: 'prov-1', name: providerUser.businessName } as unknown as ServiceProvider,
                customer: { id: 'cust-1', name: customerUser.name } as unknown as User,
                status: 'Confirmed',
                bookingDate: new Date().toISOString(),
                serviceDate: new Date().toISOString(),
                bookingType: 'quote',
            };

            await customerPage.getByRole('button', { name: 'Done' }).click();

            // Check status updated
            await expect(customerPage.getByText('Confirmed').first()).toBeVisible();
        });
        
        // --- 5. Provider Starts and Completes Job ---
        await test.step('Provider Completes Job', async () => {
            await page.reload();
            await page.getByRole('button', { name: 'Upcoming' }).click();
            await expect(page.getByText('Confirmed').first()).toBeVisible();
            
            // Simulate opening OTP modal as provider would need to
            await dispatch(page, 'OPEN_MODAL', { type: 'otp', props: { booking: bookingForOtp } });
            
            await expect(page.getByRole('heading', { name: 'Confirm Service Start' })).toBeVisible();
            await page.getByPlaceholder('Enter 4-digit OTP').fill(otp);
            await page.getByRole('button', { name: 'Verify & Start Service' }).click();

            // Status should update to InProgress
            await expect(page.getByText('In Progress')).toBeVisible();
            
            // Mark as complete
            await page.getByRole('button', { name: 'Mark as Complete' }).click();
        });

        // --- 6. Customer Pays and Leaves Review ---
        await test.step('Customer Pays and Reviews', async () => {
            await customerPage.reload();
            await expect(customerPage.getByText('Completed')).toBeVisible();
            
            // Pay invoice
            await customerPage.getByRole('button', { name: 'Pay Invoice Now' }).click();
            await expect(customerPage.getByRole('heading', { name: 'Pay Invoice' })).toBeVisible();
            await customerPage.getByRole('button', { name: /I Have Paid KES .* Confirm/ }).click();
            
            // Wait for payment success animation to finish and modal to close
            await expect(customerPage.getByText('Payment Successful!')).toBeVisible({ timeout: 5000 });
            await expect(customerPage.getByRole('heading', { name: 'Pay Invoice' })).not.toBeVisible({ timeout: 5000 });

            // Leave review
            await customerPage.getByRole('button', { name: 'Leave a Review' }).click();
            await expect(customerPage.getByRole('heading', { name: 'Leave a Review' })).toBeVisible();
            
            // Click the 5th star
            await customerPage.locator('button > svg.text-gray-300').nth(4).click();
            await customerPage.getByPlaceholder(/Share details/).fill('Pius was fantastic! Very professional and fixed the leak quickly. Highly recommended.');
            await customerPage.getByRole('button', { name: 'Submit Review' }).click();
            
            // Final check
            await expect(customerPage.getByText('Your Review:')).toBeVisible();
            await expect(customerPage.locator('svg.text-yellow-400')).toHaveCount(5);
        });
        
    });
});

// Helper function to dispatch actions from Playwright for testing purposes
async function dispatch(page: Page, type: string, payload: any) {
    await page.evaluate(({ type, payload }) => {
        const appRoot = document.getElementById('root');
        // This is a brittle method and relies on the exact component tree structure.
        // It's used here for demonstration purposes to directly interact with app state from a test.
        if (appRoot && (appRoot as any)._reactRootContainer) {
            try {
                // Simplified traversal to find the context provider
                const fiberNode = (appRoot as any)._reactRootContainer._internalRoot.current;
                let providerNode = fiberNode.child?.child?.child?.child?.memoizedProps; // App -> AppProvider -> ToastProvider -> StrictMode
                 if (providerNode && providerNode.value && providerNode.value.dispatch) {
                    providerNode.value.dispatch({ type, payload });
                } else {
                    console.error("Could not find AppContext dispatcher in test helper.");
                }
            } catch (e) {
                console.error("Error dispatching from test:", e);
            }
        }
    }, { type, payload });
}