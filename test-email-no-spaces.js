import 'dotenv/config';
import nodemailer from 'nodemailer';

// Test với App Password không có khoảng trống
const GMAIL_USER = "nhathungvs@gmail.com";
const GMAIL_PASS = "ntqvnubhyuisdxvt"; // App Password 16 ký tự KHÔNG CÓ KHOẢNG TRỐNG
// ✅ App Password đã được điền: ntqv nubh yuis dxvt → ntqvnubhyuisdxvt
const EMAIL_TO = "nhathungvs@gmail.com";

console.log('🧪 Testing Email with App Password (no spaces)...');
console.log('📧 Gmail User:', GMAIL_USER);
console.log('🔑 App Password length:', GMAIL_PASS.length);
console.log('📬 Email To:', EMAIL_TO);

async function testEmailNoSpaces() {
    try {
        console.log('\n🔧 Creating transporter...');
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: GMAIL_USER,
                pass: GMAIL_PASS.replace(/\s/g, '') // Loại bỏ tất cả khoảng trống
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000
        });

        console.log('✅ Transporter created');

        console.log('\n🔍 Verifying connection...');
        await transporter.verify();
        console.log('✅ Connection verified - App Password works!');

        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN', { 
            timeZone: 'Asia/Ho_Chi_Minh',
            hour12: false 
        });
        const dateStr = now.toLocaleDateString('vi-VN');

        const subject = `✅ Email Test Success ${timeStr} ${dateStr}`;
        
        const htmlContent = `
            <h2>🎉 Email Test Successful!</h2>
            <p><strong>Time:</strong> ${timeStr} ${dateStr}</p>
            <p><strong>Status:</strong> App Password working correctly (no spaces)</p>
            <p><strong>Server:</strong> Railway Auto Token Server</p>
            <p><em>Email functionality is now working properly!</em></p>
        `;

        const mailOptions = {
            from: GMAIL_USER,
            to: EMAIL_TO,
            subject: subject,
            html: htmlContent
        };

        console.log('\n📤 Sending test email...');
        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully!');
        console.log('📧 Message ID:', result.messageId);
        console.log('\n🎉 Email test completed successfully!');
        
    } catch (error) {
        console.log('❌ Email test failed:');
        console.log('Error:', error.message);
        console.log('Code:', error.code);
        
        if (error.code === 'EAUTH') {
            console.log('\n💡 Solutions:');
            console.log('1. Make sure you have 2-Step Verification enabled');
            console.log('2. Generate App Password: https://myaccount.google.com/apppasswords');
            console.log('3. Use 16-character password WITHOUT spaces');
            console.log('4. Example: "abcd efgh ijkl mnop" → "abcdefghijklmnop"');
        }
    }
}

testEmailNoSpaces();
