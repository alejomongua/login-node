var usuarios = require('./db_helper').usuarios;
var crypt = require('./crypt_helper');

exports.identificar_con_cookie = function (req, callback) {
  if (typeof req.session.usuario_actual === 'undefined' &&
    typeof req.cookies.remember_token !== 'undefined'){
    usuarios.findByRememberToken(req.cookies.remember_token, function(err, u){
      if (err){
        callback(err)
      } else {
        req.session.usuario_actual = u;
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
              usuarios.model.findOneAndUpdate({_id: usuario._id}, {lastLogin: Date.now()})
                .select("-password_digest -remember_token -fecha_token -token")
                .exec(function(err, doc){

                u = doc.toJSON();

                if (typeof req.body.sesion.recordar !== "undefined"){
                  // Queda almacenada la cookie por aproximadamente 3 años
                  res.cookie('remember_token', remember_token, {expires: new Date(Date.now() + 1e11), signed: true});  
                } else {
                  res.cookie('remember_token', remember_token, {signed: true});
                }
                req.session.usuario_actual = u;

                callback(null,u);
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

exports.usuario_actual = function(req, res, next){
  if ((typeof req.session.usuario_actual === 'undefined') && (typeof req.cookies.remember_token !== 'undefined')){
    req.session.usuario_actual = identificar_con_cookie(req.cookies.remember_token);
  } else {
    next();
  }
};

// Restringe las urls, salvo las indicadas explicitamente
exports.autorizacion = function(allowedURLs, defaultURL, basename) {
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
    if (typeof basename === 'string'){
      if(req._parsedUrl.pathname === basename){
        requestedURL = '/';
      } else {
        requestedURL = req._parsedUrl.pathname.replace(basename, '');
      }
    }
    if (typeof req.session.usuario_actual === 'undefined' && allowedURLs.indexOf(requestedURL) < 0){
      res.send(302, {
        url: '/',
        template: 'paginasEstaticas/index',
        error: 'No autorizado'
      });
    } else {
      next();
    }
  }
};