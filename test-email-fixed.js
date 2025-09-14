import 'dotenv/config';
import nodemailer from 'nodemailer';

// Test với App Password thay vì mật khẩu thường
const GMAIL_USER = "nhathungvs@gmail.com";
const GMAIL_PASS = "YOUR_APP_PASSWORD_HERE"; // Thay bằng App Password 16 ký tự
const EMAIL_TO = "nhathungvs@gmail.com";

console.log('🧪 Testing Email with App Password...');
console.log('📧 Gmail User:', GMAIL_USER);
console.log('🔑 Using App Password:', GMAIL_PASS ? 'Yes' : 'No');
console.log('📬 Email To:', EMAIL_TO);

async function testEmailWithAppPassword() {
    try {
        console.log('\n🔧 Creating transporter with App Password...');
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: GMAIL_USER,
                pass: GMAIL_PASS // Phải là App Password, không phải mật khẩu thường
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
            <p><strong>Status:</strong> App Password working correctly</p>
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
            console.log('\n💡 Solution:');
            console.log('1. Go to https://myaccount.google.com/');
            console.log('2. Security → 2-Step Verification (enable if not)');
            console.log('3. App passwords → Generate new password');
            console.log('4. Select "Mail" and "Other (custom name)"');
            console.log('5. Use the 16-character App Password instead of regular password');
        }
    }
}

testEmailWithAppPassword();
