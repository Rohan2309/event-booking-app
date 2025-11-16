const nodemailer = require('nodemailer');
const transport = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT||587),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
module.exports = {
  sendMail: async (opts) => {
    const info = await transport.sendMail(opts);
    return info;
  }
};
