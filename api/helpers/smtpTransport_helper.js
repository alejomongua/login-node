var nodemailer = require("nodemailer");

module.exports = nodemailer.createTransport("SMTP",{
  service: "Gmail",
  auth: {
    user: "alejandro.mongua@gmail.com",
    pass: "Pa$$w0rD"
  }
});