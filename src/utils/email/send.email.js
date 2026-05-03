import nodemailer from 'nodemailer'

export async function sendEmail({
    from = process.env.APP_EMAIL,
    to="",
    cc="",
    bcc="",
    text="",
    html="",
    subject="Saraha App",
    attachments=[]
}={}) {
//create a test account replce with real credentials.
const transporter = nodemailer.createTransport({
service:"gmail",
  auth: {
    user: process.env.APP_EMAIL,
    pass: process.env.APP_PASSWORD,
  },
});

// Send an email using async/await

  const info = await transporter.sendMail({
    from: `"EL Haker 👨‍💻"  <${from}>`,
     to,subject,cc,bcc,text,html,attachments
  });
console.log(info.messageId)
}