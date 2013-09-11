/*
 * GET home page.
 */
exports.index = function(req, res){
  if (req.usuario_actual) {
    res.send(302, {
      mensaje: {
        error: "Ya está logueado"
      },
      url: '/dashboard',
      template: 'paginasEstaticas/dashboard'
    });
  } else {
    res.send({
      template: 'paginasEstaticas/index'
    });
  }
};

/*
 * GET /olvide_password
 */
exports.olvidePassword = function(req, res){
  if (req.usuario_actual) {
    res.send(302, {
      mensaje: {
        error: "No autorizado"
      },
      url: '/dashboard',
      template: 'paginasEstaticas/dashboard'
    });
  } else {
    res.send({
      template: 'paginasEstaticas/olvidePassword',
      titulo: 'Recuperar contraseña'
    });
  }
};


/*
 * POST /olvide_password
 */
exports.enviarCorreo = function(req, res){
  var usuarios = require('../helpers/db_helper').usuarios;
  var host = process.env.HOST;
  
  if (typeof host === 'undefined'){
    if (typeof process.env.NODE_ENV === 'undefined' || process.env.NODE_ENV === 'prodction') {
      host = 'la url de produccion ***** Cambiar luego ******';
    } else {
      host = 'http://localhost';
    }
  }

  if (req.usuario_actual) {
    res.send(302, {
      mensaje: {
        error: "No permitido, el usuario está logueado"
      },
      url: '/dashboard',
      template: 'paginasEstaticas/dashboard'
    });
  } else {
    if (typeof req.body.email !== 'undefined') {
      usuarios.findByEmail(req.body.email,function(err, doc){ // Verifique que el correo exista
        if (err){
          console.log(err);
          res.send(302, {
            url: '/',
            template: 'paginasEstaticas/index',
            mensaje: {
              error: 'Hubo un error (2)'
            }
          });
        } else {
          var crypt = require('../helpers/crypt_helper'),
              smtpTransport = require('../helpers/smtpTransport_helper'),
              moment = require('moment');

          moment.lang('es');
          if (doc){
            doc.token = crypt.token(); // Establezca el token
            doc.fecha_token = Date.now() + 8.64e7; // Vigencia de un dia
            doc.save(function(err){
              if (err){              
                console.log(err);
                res.send(302, {
                  url: '/',
                  template: 'paginasEstaticas/index',
                  mensaje: {
                    error: 'Hubo un error (1)'
                  }
                });
              } else {
                // enviar correo
                var url = host + '/recuperar_password?id='+ doc._id + '&t=' + doc.token;
                var fecha = moment(doc.fecha_token).format('LLLL');
                var html =  '<!DOCTYPE html>' +
                            '<html>' +
                            '  <head>' +
                            '    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />' +
                            '  </head>' +
                            '  <body>' +
                            '    <h1>¿Ha olvidado su contraseña?</h1>' +
                            '    <p>' +
                            '      No se preocupe, se puede recuperar ingresando al siguiente link:' +
                            '    </p>' +
                            '    <p>' +
                            '      <a href="' + url + '">' + url + '</a>' +
                            '    </p>' +
                            '    <p>El vínculo expira el ' + fecha + '.</p>' +
                            '    <p>Si el enlace no funciona, copielo y pégelo en la barra de su navegador</p>' +
                            '    <p>Que tenga un feliz dia</p>' +
                            '  </body>' +
                            '</html>';

                var text =  '¿Ha olvidado su contraseña?\n' + 
                            '===========================\n\n' +
                            'No se preocupe, se puede recuperar ingresando al siguiente link:\n\n' + url + '\n' +
                            'El vínculo expira el ' + fecha + '\n\n' +
                            'Si el enlace no funciona, copielo y pégelo en la barra de su navegador\n' + 
                            'Que tenga un feliz dia';

                var mailOptions = {
                  from: "Aplicacion <aplicacion@example.com>", // sender address
                  to: doc.email, // list of receivers
                  subject: "Solicitud de recuperación de contraseña", // Subject line
                  text: text, // plaintext body
                  html: html // html body
                };

                smtpTransport.sendMail(mailOptions, function(error, response){
                  if(error){
                    console.log(error);
                    res.send(302, {
                      url: '/',
                      template: 'paginasEstaticas/index',
                      mensaje: {
                        error: "Hubo un error enviando el correo"
                      }
                    });
                  }else{
                    res.send({
                      url: '/',
                      template: 'paginasEstaticas/index',
                      mensaje: 'Correo enviado a ' + doc.email
                    });
                  }
                });
              }
            });
          } else {
            res.send(302, {
              url: '/',
              template: 'paginasEstaticas/index',
              mensaje: {
                error: 'No se encontró el correo ' + req.body.email
              }
            });
          }
        }
      });
    } else {
      res.send(302, {
        url: '/',
        template: 'paginasEstaticas/index',
        mensaje: {
          error: 'No se recibieron datos'
        }
      });
    };
  }
};


/*
 * GET /dashboard
 */
exports.dashboard = function(req, res){
  res.send({
    template: 'paginasEstaticas/dashboard',
    titulo: 'Bienvenido ' + req.usuario_actual.nombres,
  });
}
