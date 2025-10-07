import 'dotenv/config';
import nodemailer from 'nodemailer';
import fs from 'fs';

// Script gửi email cho tất cả token đã lấy được
const GMAIL_USER = "nhathungvs@gmail.com";
const GMAIL_PASS = "ntqvnubhyuisdxvt";
const EMAIL_TO = "nhathungvs@gmail.com";
const RAILWAY_URL = "https://token-webhook-server-production.up.railway.app";

console.log('📧 Sending all tokens via email...');

async function sendAllTokensEmail() {
    try {
        // Tạo transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: GMAIL_USER,
                pass: GMAIL_PASS
            },
            connectionTimeout: 30000,
            greetingTimeout: 30000,
            socketTimeout: 30000,
            pool: true,
            maxConnections: 1,
            maxMessages: 1,
            secure: true,
            tls: {
                rejectUnauthorized: false
            }
        });

        console.log('✅ Transporter created');

        // Lấy token hiện tại từ Railway
        console.log('🔄 Fetching current token from Railway...');
        const response = await fetch(`${RAILWAY_URL}/token`);
        const currentTokenData = await response.json();
        
        // Đọc backup tokens
        console.log('📖 Reading backup tokens...');
        let backupContent = '';
        try {
            backupContent = fs.readFileSync('tokens-backup.txt', 'utf8');
        } catch (error) {
            console.log('⚠️ No backup file found');
        }

        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN', { 
            timeZone: 'Asia/Ho_Chi_Minh',
            hour12: false 
        });
        const dateStr = now.toLocaleDateString('vi-VN');

        // Tạo bảng danh sách tất cả token
        let emailContent = `
            <h2>📋 Danh Sách Tất Cả Token (Từ Cũ Đến Mới)</h2>
            <p><strong>Thời gian gửi:</strong> ${timeStr} ${dateStr}</p>
            <p><strong>Tổng số token:</strong> <span style="color: blue; font-weight: bold;">${backupContent.split('=== TOKEN BACKUP').length} tokens</span></p>
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

        // Thêm token hiện tại (đầu tiên)
        if (currentTokenData.token) {
            emailContent += `
                    <tr style="background-color: #d4edda;">
                        <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold;">1</td>
                        <td style="border: 1px solid #ddd; padding: 10px; font-family: monospace; font-size: 11px; word-break: break-all;">${currentTokenData.token}</td>
                        <td style="border: 1px solid #ddd; padding: 10px;">${currentTokenData.info?.subject || 'N/A'}</td>
                        <td style="border: 1px solid #ddd; padding: 10px;">${currentTokenData.info?.expires || 'N/A'}</td>
                        <td style="border: 1px solid #ddd; padding: 10px;">${currentTokenData.info?.timeLeft || 'N/A'} phút</td>
                        <td style="border: 1px solid #ddd; padding: 10px;"><span style="color: green; font-weight: bold;">🔄 HIỆN TẠI</span></td>
                    </tr>
            `;
        }

        // Parse và thêm các token backup
        if (backupContent) {
            const backupSections = backupContent.split('=== TOKEN BACKUP').filter(section => section.trim());
            let rowNumber = currentTokenData.token ? 2 : 1;
            
            backupSections.forEach((section, index) => {
                const lines = section.trim().split('\n');
                let token = '';
                let subject = '';
                let expires = '';
                let timeLeft = '';
                
                lines.forEach(line => {
                    if (line.includes('Token:')) {
                        token = line.replace('Token:', '').trim();
                    } else if (line.includes('Subject:')) {
                        subject = line.replace('Subject:', '').trim();
                    } else if (line.includes('Expires:')) {
                        expires = line.replace('Expires:', '').trim();
                    } else if (line.includes('Time Left:')) {
                        timeLeft = line.replace('Time Left:', '').trim();
                    }
                });
                
                if (token) {
                    emailContent += `
                        <tr style="background-color: ${index % 2 === 0 ? '#f8f9fa' : '#ffffff'};">
                            <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold;">${rowNumber}</td>
                            <td style="border: 1px solid #ddd; padding: 10px; font-family: monospace; font-size: 11px; word-break: break-all;">${token}</td>
                            <td style="border: 1px solid #ddd; padding: 10px;">${subject || 'N/A'}</td>
                            <td style="border: 1px solid #ddd; padding: 10px;">${expires || 'N/A'}</td>
                            <td style="border: 1px solid #ddd; padding: 10px;">${timeLeft || 'N/A'}</td>
                            <td style="border: 1px solid #ddd; padding: 10px;"><span style="color: #6c757d;">📚 BACKUP</span></td>
                        </tr>
                    `;
                    rowNumber++;
                }
            });
        }

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
            <p><em>🤖 Server tự động lấy token và gửi email thông báo</em></p>
        `;

        const subject = `📧 Tất Cả Token - ${timeStr} ${dateStr}`;
        
        const mailOptions = {
            from: GMAIL_USER,
            to: EMAIL_TO,
            subject: subject,
            html: emailContent
        };

        console.log('📤 Sending email with all tokens...');
        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully!');
        console.log('📧 Message ID:', result.messageId);
        
        // Thống kê
        const tokenCount = backupContent.split('=== TOKEN BACKUP').length - 1;
        console.log(`📊 Sent ${tokenCount} backup tokens + 1 current token = ${tokenCount + 1} total tokens`);
        
    } catch (error) {
        console.log('❌ Email failed:', error.message);
        console.log('Code:', error.code);
    }
}

sendAllTokensEmail();
