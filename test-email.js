import 'dotenv/config';
import nodemailer from 'nodemailer';

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;
const EMAIL_TO = process.env.EMAIL_TO;

console.log('🧪 Testing Email Function...');
console.log('📧 Gmail User:', GMAIL_USER ? 'Set' : 'Not set');
console.log('🔑 Gmail Pass:', GMAIL_PASS ? 'Set' : 'Not set');
console.log('📬 Email To:', EMAIL_TO ? 'Set' : 'Not set');

if (!GMAIL_USER || !GMAIL_PASS || !EMAIL_TO) {
    console.log('❌ Missing email credentials');
    process.exit(1);
}

async function testEmail() {
    try {
        console.log('\n🔧 Creating transporter...');
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: GMAIL_USER,
                pass: GMAIL_PASS
            },
            // Add timeout and connection settings
            connectionTimeout: 10000, // 10 seconds
            greetingTimeout: 10000,   // 10 seconds
            socketTimeout: 10000,     // 10 seconds
            pool: true,
            maxConnections: 1,
            maxMessages: 1
        });

        console.log('✅ Transporter created');

        console.log('\n🔍 Verifying connection...');
        await transporter.verify();
        console.log('✅ Connection verified');

        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN', { 
            timeZone: 'Asia/Ho_Chi_Minh',
            hour12: false 
        });
        const dateStr = now.toLocaleDateString('vi-VN');

        const subject = `Test Email ${timeStr} ${dateStr}`;
        
        const htmlContent = `
            <h2>🧪 Email Test</h2>
            <p><strong>Time:</strong> ${timeStr} ${dateStr}</p>
            <p><strong>Test Token:</strong></p>
            <div style="background: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all; font-family: monospace;">
                TEST_TOKEN_123456789
            </div>
            <h3>Test Information:</h3>
            <ul>
                <li><strong>Subject:</strong> Test User</li>
                <li><strong>Expires:</strong> Test Expiry</li>
                <li><strong>Type:</strong> test</li>
                <li><strong>Issuer:</strong> Test Server</li>
                <li><strong>Time Left:</strong> 999 hours</li>
            </ul>
            <p><em>This is a test email from the Railway server.</em></p>
        `;

        const mailOptions = {
            from: GMAIL_USER,
            to: EMAIL_TO,
            subject: subject,
            html: htmlContent
        };

        console.log('\n📤 Sending email...');
        console.log('From:', GMAIL_USER);
        console.log('To:', EMAIL_TO);
        console.log('Subject:', subject);

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully!');
        console.log('📧 Message ID:', result.messageId);
        
    } catch (error) {
        console.log('❌ Email test failed:');
        console.log('Error:', error.message);
        console.log('Code:', error.code);
        console.log('Response:', error.response);
        console.log('Stack:', error.stack);
    }
}

testEmail();
