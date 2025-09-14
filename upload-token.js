import 'dotenv/config';
import fetch from 'node-fetch';
import fs from 'fs';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || 'your-secret-api-key-123';

async function uploadToken() {
    try {
        // Read token from token.txt file
        const token = fs.readFileSync('token.txt', 'utf8').trim();
        
        if (!token || !token.startsWith('eyJ')) {
            console.log('❌ No valid token found in token.txt');
            return;
        }

        console.log('📤 Uploading token to server...');
        
        const response = await fetch(`${SERVER_URL}/upload-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: token,
                apiKey: API_KEY
            })
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ Token uploaded successfully!');
            console.log('📄 Token Info:', JSON.stringify(result.info, null, 2));
        } else {
            console.log('❌ Upload failed:', result.error || result.message);
        }

    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

uploadToken();
