login-node
==========

Sistema de login con nodejs, express y mongoDB

Primero se deben instalar los requerimientos con el comando:

```
npm install
```

Se necesita agregar el archivo smtpTransport_helper.js en api/helpers/ con la siguiente estructura:

```
var nodemailer = require("nodemailer");

module.exports = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "your-gmail-username@gmail.com",
        pass: "your-gmail-password"
    }
});
```

Tambien cambiar la ruta del proyecto en el archivo nginx.conf, luego agregar el archivo nginx.conf a los 'sites-enabled' de nginx y reiniciar el servidor.

Al ejecutar servicio se debe establecer el ambiente de desarrollo o de produccion con:

```
NODE_ENV=development node app
```

