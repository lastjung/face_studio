import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Recommended for GCM
const AUTH_TAG_LENGTH = 16;

// If key is not set, we should probably throw in production, but handled carefully here.
// Key must be 32 bytes hex.

export function encrypt(text: string): string {
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || ''; // Read at runtime
    if (!ENCRYPTION_KEY) {
        console.error("Critical: ENCRYPTION_KEY is missing.");
        throw new Error("Server configuration error: Encryption key missing.");
    }

    // Ensure key is buffer
    const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex');
    if (keyBuffer.length !== 32) {
        throw new Error("Invalid encryption key length. Key must be 32 bytes hex string.");
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv) as crypto.CipherGCM;

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(text: string): string {
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';
    if (!ENCRYPTION_KEY) {
        throw new Error("Server configuration error: Encryption key missing.");
    }

    // Handle plain text fallback for migration (Optional, but safe)
    // If text doesn't look like our format (colons), return as is?
    // User requested "Encrypted... thorough implementation". 
    // But if we encounter plain text, failing is better than leaking?
    // Let's strict decrypt. 
    // Format check:
    const parts = text.split(':');
    if (parts.length !== 3) {
        // Assume it's plain text if migration hasn't happened yet? 
        // Or throw error?
        // Let's Try-Catch: if it fails, maybe it's plain text?
        // But for security, we should treat unexpected format as error or legacy.
        // Let's assume STRICT encryption for now.
        // Wait, "check if plain text" was in plan.
        return text; // Return as-is if not in format (Legacy compatibility)
    }

    const [ivHex, authTagHex, encryptedHex] = parts;

    const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv) as crypto.DecipherGCM;
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}
