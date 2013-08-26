var sesion = require('../helpers/sesion_helper');

/*
 * POST sesiones
 */
exports.create = function(req, res){
  if (typeof req.body.sesion === 'undefined') {
    res.send(400,{'error': 'No se recibieron datos'});
  } else {
    sesion.identificar(req, res, function(err, u){ // success
      if (err){                        // fail
        res.send(400, {error: err});
      } else {
        res.send({'usuario': u, 'url': '/dashboard'});
      }
    });
  }
};

/*
 * DELETE sesiones
 */
exports.destroy = function(req, res){
  delete req.session.usuario_actual;
  res.clearCookie('remember_token');
  
  res.send({mensaje: "Sesion terminada"});
};

/*
 * GET sesiones
 */
exports.show = function(req, res){
  res.send(req.session.usuario_actual);
} 