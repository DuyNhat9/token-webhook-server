import 'dotenv/config';
import nodemailer from 'nodemailer';

// Script tự động test email với App Password
const GMAIL_USER = "nhathungvs@gmail.com";
const EMAIL_TO = "nhathungvs@gmail.com";

// Danh sách App Password để test (bạn cần thay thế bằng App Password thật)
const APP_PASSWORDS = [
    "YOUR_APP_PASSWORD_1", // Thay bằng App Password 16 ký tự đầu tiên
    "YOUR_APP_PASSWORD_2", // Thay bằng App Password 16 ký tự thứ hai
    "YOUR_APP_PASSWORD_3"  // Thay bằng App Password 16 ký tự thứ ba
];

console.log('🧪 Auto Testing Email with Multiple App Passwords...');
console.log('📧 Gmail User:', GMAIL_USER);
console.log('📬 Email To:', EMAIL_TO);
console.log('🔑 Testing', APP_PASSWORDS.length, 'App Passwords...\n');

async function testEmailWithPassword(appPassword, index) {
    try {
        console.log(`\n🔧 Testing App Password ${index + 1}...`);
        console.log(`🔑 Password length: ${appPassword.length}`);
        
        if (appPassword.length !== 16) {
            console.log(`❌ Invalid length: ${appPassword.length} (should be 16)`);
            return false;
        }
        
        const transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: GMAIL_USER,
                pass: appPassword.replace(/\s/g, '') // Loại bỏ khoảng trống
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000
        });

        console.log('✅ Transporter created');

        console.log('🔍 Verifying connection...');
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
            <p><strong>Status:</strong> App Password ${index + 1} working correctly</p>
            <p><strong>Server:</strong> Railway Auto Token Server</p>
            <p><em>Email functionality is now working properly!</em></p>
        `;

        const mailOptions = {
            from: GMAIL_USER,
            to: EMAIL_TO,
            subject: subject,
            html: htmlContent
        };

        console.log('📤 Sending test email...');
        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully!');
        console.log('📧 Message ID:', result.messageId);
        
        return true;
        
    } catch (error) {
        console.log(`❌ App Password ${index + 1} failed:`);
        console.log('Error:', error.message);
        console.log('Code:', error.code);
        
        if (error.code === 'EAUTH') {
            console.log('💡 This App Password is invalid or expired');
        }
        
        return false;
    }
}

async function testAllPasswords() {
    let successCount = 0;
    
    for (let i = 0; i < APP_PASSWORDS.length; i++) {
        const success = await testEmailWithPassword(APP_PASSWORDS[i], i);
        if (success) {
            successCount++;
            console.log(`\n🎉 App Password ${i + 1} works! Use this for Railway.`);
            break; // Dừng khi tìm thấy App Password hoạt động
        }
    }
    
    console.log(`\n📊 Results: ${successCount}/${APP_PASSWORDS.length} App Passwords working`);
    
    if (successCount === 0) {
        console.log('\n💡 Solutions:');
        console.log('1. Make sure you have 2-Step Verification enabled');
        console.log('2. Generate App Password: https://myaccount.google.com/apppasswords');
        console.log('3. Use 16-character password WITHOUT spaces');
        console.log('4. Replace YOUR_APP_PASSWORD_1, YOUR_APP_PASSWORD_2, etc. with real App Passwords');
    }
}

testAllPasswords();
