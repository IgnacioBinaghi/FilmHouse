const nodemailer = require('nodemailer');

module.exports.sendEmail = async function sendEmail(userEmail, link) {
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587, // SMTP port (587 for unencrypted/TLS, 465 for SSL)
        secure: false, // true for 465, false for other ports
        auth: {
            user: "filmi6174@gmail.com",
            pass: "ohpu ibpz mjak caef" 
        }
    });

    const htmlContent = `
    <div style="font-family: 'Arial', sans-serif; background-color: #f0f0f0; text-align: center; padding: 20px;">
        <div style="background-color: #fff; border-radius: 10px; padding: 20px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); display: inline-block;">
            <div style="font-size: 20px; color: #333; margin: 20px 0;">You've been tagged on a new post!</div>
            <a href="${link}" style="display: inline-block; text-decoration: none; background-color: #007bff; color: #fff; padding: 10px 20px; border-radius: 5px; transition: background-color 0.3s;">Click here to check it out :)</a>
            <img src="https://media.giphy.com/media/M0l3KOk8KXOOk/giphy.gif?cid=790b7611se6q7yjqdvvc7m7pbjntjkxtgjnstwa0zaoj3vpl&ep=v1_gifs_search&rid=giphy.gif&ct=g" alt="Film" style="max-width: 100%; height: auto; border-radius: 10px;">
        </div>
    </div>
    `;

    // Setup email data
    let mailOptions = {
        from: '"Filmi" filmi6174@gmail.com', // Sender address
        to: userEmail, // receiver
        subject: "You've been tagged in a video, check it out!", // Subject line
        html: htmlContent  // HTML body
    };

    // Send mail with defined transport object
    try {
        let info = await transporter.sendMail(mailOptions);
        console.log("Email sent: %s", info.messageId);
    } catch (error) {
        console.error("Error sending email: %s", error);
    }
}