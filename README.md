login-node
==========

Sistema de login con nodejs, express y mongoDB

Se necesita agregar el archivo smtpTransport_helper.js con la siguiente estructura:

```
var nodemailer = require("nodemailer");

exports.smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "your-gmail-username@gmail.com",
        pass: "your-gmail-password"
    }
});
```