// This is a mock service to simulate KRA PIN verification.
// In a real application, this would make an API call to a KRA service.

export interface KraPinVerificationResult {
  success: boolean;
  message: string;
  details?: {
    taxpayerName: string;
    pin: string;
  };
}

// A simple regex for a KRA PIN (A + 9 digits + Z)
const KRA_PIN_REGEX = /^[A-Z][0-9]{9}[A-Z]$/i;
// A mock valid PIN for demonstration purposes
const DEMO_VALID_PIN = 'A012345678B';
const DEMO_TAXPAYER_NAME = 'V-KEN SERVE DEMO PROVIDER';

export const verifyKraPin = async (pin: string): Promise<KraPinVerificationResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (pin.toUpperCase() === DEMO_VALID_PIN) {
        resolve({
          success: true,
          message: 'PIN Verified Successfully.',
          details: {
            taxpayerName: DEMO_TAXPAYER_NAME,
            pin: pin.toUpperCase(),
          },
        });
      } else if (KRA_PIN_REGEX.test(pin)) {
          resolve({
          success: false,
          message: 'PIN format is correct, but the number is not registered.',
        });
      }
      else {
        resolve({
          success: false,
          message: 'Invalid KRA PIN format. It should be like A123456789B.',
        });
      }
    }, 1500); // Simulate network delay
  });
};