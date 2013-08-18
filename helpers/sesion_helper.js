var usuarios = require('./db_helper').usuarios;
var crypt = require('./crypt_helper');
//var _ = require('cloneextend');

exports.identificar_con_cookie = function (req, callback) {
  if (typeof req.session.usuario_actual === 'undefined' &&
    typeof req.cookies.remember_token !== 'undefined'){
    usuarios.findByRememberToken(req.cookies.remember_token, function(u){
      req.session.usuario_actual = u;
      callback();
    }, function(err){
      callback(err);
    });
  } else {
    callback();
  }
};

exports.identificar = function (req, res, success, fail) {
  var remember_token = null;
  var u;

  if (req.body.sesion && req.body.sesion.email && req.body.sesion.password ) {
    usuarios.findByEmail(req.body.sesion.email,function(usuario){
      if (usuario) {
        crypt.comparePassword(req.body.sesion.password, usuario.password_digest, function(err, resp) {
          if (err) {
            fail('Hubo un error de encripción');
            console.log(err);
          } else if (resp) {
            remember_token = usuario.remember_token;
            usuarios.model.findOneAndUpdate({_id: usuario._id}, {lastLogin: Date.now()}, function(err, doc){
              u = doc.toJSON();

              delete u['password_digest'];
              delete u['remember_token'];
              delete u['fecha_token'];
              delete u['token'];

              if (typeof req.body.sesion.recordar !== "undefined"){
                // Queda almacenada la cookie por aproximadamente 3 años
                res.cookie('remember_token', remember_token, {expires: new Date(Date.now() + 1e11)});  
              } else {
                res.cookie('remember_token', remember_token);
              }
              req.session.usuario_actual = u;

              success(u);
            });
          } else {
            fail('Contraseña incorrecta');
          }
        });
      } else {
        fail('Usuario no encontrado');
      }
    },function(err){
      fail(err);
    });
  } else {
    fail('Datos insuficientes');
  }
};

exports.usuario_actual = function(req, res, next){
  if ((typeof req.session.usuario_actual === 'undefined') && (typeof req.cookies.remember_token !== 'undefined')){
    req.session.usuario_actual = identificar_con_cookie(req.cookies.remember_token);
  } else {
    next();
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
    if (typeof req.session.usuario_actual === 'undefined' && allowedURLs.indexOf(req._parsedUrl.pathname) < 0){
      req.session.messages['error'] = 'No autorizado';
      res.redirect('/');
    } else {
      next();
    }
  }
};