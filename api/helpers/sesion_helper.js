var usuarios = require('./db_helper').usuarios;
var crypt = require('./crypt_helper');

exports.identificar_con_header = function (req, callback) {
  if (typeof req.headers['x-identificar'] !== 'undefined'){
    usuarios.findByRememberToken(req.headers['x-identificar'], function(err, u){
      if (err){
        callback(err)
      } else {
        req.usuario_actual = u;
        callback();
      }
    }, function(err){
      callback(err);
    });
  } else {
    callback();
  }
};

exports.identificar = function (req, res, callback) {
  var remember_token = null;
  var u;

  if (req.body.sesion && req.body.sesion.email && req.body.sesion.password ) {
    usuarios.findByEmail(req.body.sesion.email,function(err, usuario){
      if (err){
        callback(err);
      } else {
        if (usuario) {
          crypt.comparePassword(req.body.sesion.password, usuario.password_digest, function(err, resp) {
            if (err) {
              callback('Hubo un error de encripción');
              console.log(err);
            } else if (resp) {
              remember_token = usuario.remember_token;
              usuarios.updateLastLogin(usuario._id, function(err, doc){
                req.usuario_actual = doc;
                callback(null,doc);
              });
            } else {
              callback('Contraseña incorrecta');
            }
          });
        } else {
          callback('Usuario no encontrado');
        }
      }
    });
  } else {
    callback('Datos insuficientes');
  }
};

// Restringe las urls, salvo las indicadas explicitamente
exports.autorizacion = function(allowedURLs, defaultURL) {
  if (typeof defaultURL !== 'string'){
    defaultURL = '/';
  }
  if (typeof allowedURLs === 'undefined' || !(allowedURLs instanceof Array)){
    allowedURLs = [defaultURL];
  }
  if (allowedURLs.indexOf(defaultURL) < 0){
    allowedURLs.push(defaultURL);
  }
  return function(req, res, next){
    var requestedURL = req._parsedUrl.pathname;
    if (req.method !== 'OPTIONS' && typeof req.usuario_actual === 'undefined' && allowedURLs.indexOf(requestedURL) < 0){
      res.send(302, {
        url: '/',
        template: 'paginasEstaticas/index',
        mensaje: {
          error: 'No autorizado'
        }
      });
    } else {
      next();
    }
  }
};