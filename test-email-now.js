const nodemailer = require('nodemailer');
const fs = require('fs');

// Environment variables
const GMAIL_USER = process.env.GMAIL_USER || 'your-email@gmail.com';
const GMAIL_PASS = process.env.GMAIL_PASS || 'ntqvnubhyuisdxvt';
const EMAIL_TO = process.env.EMAIL_TO || 'your-email@gmail.com';
const RAILWAY_URL = 'https://token-webhook-server-production.up.railway.app';

// Function to get current token from Railway
async function getCurrentToken() {
    try {
        const response = await fetch(`${RAILWAY_URL}/token`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('❌ Error getting current token:', error.message);
        return null;
    }
}

// Function to parse backup tokens
function parseBackupTokens(backupContent) {
    const tokens = [];
    const sections = backupContent.split('=== TOKEN BACKUP');
    
    for (let i = 1; i < sections.length; i++) {
        const section = sections[i].trim();
        if (section) {
            const lines = section.split('\n');
            const token = lines[0].replace('Token: ', '').trim();
            const subject = lines[1].replace('Subject: ', '').trim();
            const expires = lines[2].replace('Expires: ', '').trim();
            const timeLeft = lines[3].replace('Time Left: ', '').replace(' seconds', '').trim();
            const timestamp = lines[4].replace('Timestamp: ', '').trim();
            
            tokens.push({
                token,
                subject,
                expires,
                timeLeft: parseInt(timeLeft),
                timestamp
            });
        }
    }
    
    return tokens;
}

// Function to send email with all tokens
async function sendAllTokensEmail() {
    if (!GMAIL_USER || !GMAIL_PASS || !EMAIL_TO) {
        console.log('⚠️ Email credentials not configured');
        return;
    }

    try {
        // Get current token from Railway
        console.log(' Getting current token from Railway...');
        const currentTokenData = await getCurrentToken();
        
        if (!currentTokenData || !currentTokenData.token) {
            console.log('❌ No current token available');
            return;
        }

        // Read backup tokens
        console.log('📖 Reading backup tokens...');
        let backupContent = '';
        try {
            backupContent = fs.readFileSync('tokens-backup.txt', 'utf8');
        } catch (error) {
            console.log('⚠️ No backup tokens file found');
        }

        // Parse backup tokens
        const backupTokens = parseBackupTokens(backupContent);
        
        // Get current time
        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN', { hour12: false });
        const dateStr = now.toLocaleDateString('vi-VN');

        // Create email content
        let emailContent = `
            <h2> Danh Sách Tất Cả Token (Từ Cũ Đến Mới)</h2>
            <p><strong>Thời gian gửi:</strong> ${timeStr} ${dateStr}</p>
            <p><strong>Tổng số token:</strong> <span style="color: blue; font-weight: bold;">${backupTokens.length + 1} tokens</span></p>
            <hr>
            
            <h3>📊 Bảng Danh Sách Token</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-family: Arial, sans-serif;">
                <thead>
                    <tr style="background-color: #f8f9fa;">
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: left; background-color: #e9ecef;">#</th>
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: left; background-color: #e9ecef;">Token</th>
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: left; background-color: #e9ecef;">Subject</th>
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: left; background-color: #e9ecef;">Expires</th>
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: left; background-color: #e9ecef;">Time Left</th>
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: left; background-color: #e9ecef;">Status</th>
                    </tr>
                </thead>
                <tbody>
        `;

        // Add current token first
        const currentToken = currentTokenData.token;
        const currentInfo = currentTokenData.tokenInfo || {};
        const currentTimeLeft = currentInfo.timeLeft || 0;
        const currentExpires = currentInfo.expires || 'Unknown';
        const currentSubject = currentInfo.subject || 'Unknown';
        
        emailContent += `
            <tr style="background-color: #d4edda;">
                <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">1</td>
                <td style="border: 1px solid #ddd; padding: 12px; font-family: monospace; font-size: 12px;">${currentToken.substring(0, 50)}...</td>
                <td style="border: 1px solid #ddd; padding: 12px;">${currentSubject}</td>
                <td style="border: 1px solid #ddd; padding: 12px;">${currentExpires}</td>
                <td style="border: 1px solid #ddd; padding: 12px; color: ${currentTimeLeft > 3600 ? 'green' : 'orange'};">
                    ${Math.floor(currentTimeLeft / 3600)}h ${Math.floor((currentTimeLeft % 3600) / 60)}m
                </td>
                <td style="border: 1px solid #ddd; padding: 12px; color: green; font-weight: bold;">✅ CURRENT</td>
            </tr>
        `;

        // Add backup tokens
        backupTokens.forEach((token, index) => {
            const timeLeftHours = Math.floor(token.timeLeft / 3600);
            const timeLeftMinutes = Math.floor((token.timeLeft % 3600) / 60);
            const isExpired = token.timeLeft <= 0;
            const statusColor = isExpired ? 'red' : (token.timeLeft > 3600 ? 'green' : 'orange');
            const statusText = isExpired ? '❌ EXPIRED' : '✅ ACTIVE';
            
            emailContent += `
                <tr style="background-color: ${isExpired ? '#f8d7da' : '#f8f9fa'};">
                    <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">${index + 2}</td>
                    <td style="border: 1px solid #ddd; padding: 12px; font-family: monospace; font-size: 12px;">${token.token.substring(0, 50)}...</td>
                    <td style="border: 1px solid #ddd; padding: 12px;">${token.subject}</td>
                    <td style="border: 1px solid #ddd; padding: 12px;">${token.expires}</td>
                    <td style="border: 1px solid #ddd; padding: 12px; color: ${statusColor};">
                        ${isExpired ? 'EXPIRED' : `${timeLeftHours}h ${timeLeftMinutes}m`}
                    </td>
                    <td style="border: 1px solid #ddd; padding: 12px; color: ${statusColor}; font-weight: bold;">${statusText}</td>
                </tr>
            `;
        });

        emailContent += `
                </tbody>
            </table>
            
            <h3>🔗 Thông Tin API</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #007bff;">
                <p><strong>📡 API Endpoints:</strong></p>
                <ul>
                    <li><strong>Lấy Token:</strong> <code>GET ${RAILWAY_URL}/token</code></li>
                    <li><strong>Health Check:</strong> <code>GET ${RAILWAY_URL}/health</code></li>
                    <li><strong>Server Status:</strong> <code>GET ${RAILWAY_URL}/status</code></li>
                    <li><strong>Force Refresh:</strong> <code>POST ${RAILWAY_URL}/refresh</code></li>
                </ul>
            </div>
            
            <hr>
            <p><em>📧 Email được gửi tự động từ Railway Token Server</em></p>
            <p><em>🔗 Server URL: ${RAILWAY_URL}</em></p>
        `;

        const subject = ` Test Email - Danh Sách Token ${timeStr} ${dateStr}`;
        
        const mailOptions = {
            from: GMAIL_USER,
            to: EMAIL_TO,
            subject: subject,
            html: emailContent
        };

        // Create transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: GMAIL_USER,
                pass: GMAIL_PASS
            },
            connectionTimeout: 60000,
            greetingTimeout: 60000,
            socketTimeout: 60000,
            pool: true,
            maxConnections: 1,
            maxMessages: 1,
            secure: true,
            tls: {
                rejectUnauthorized: false,
                ciphers: 'SSLv3'
            }
        });

        console.log('📤 Sending test email...');
        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully!');
        console.log('📧 Message ID:', result.messageId);
        
    } catch (error) {
        console.error('❌ Email failed:', error.message);
        console.error('Code:', error.code);
        console.error('Stack:', error.stack);
    }
}

// Run the test
console.log('🚀 Starting email test...');
sendAllTokensEmail().then(() => {
    console.log('✅ Test completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});
