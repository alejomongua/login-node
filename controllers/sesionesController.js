var sesion = require('../helpers/sesion_helper');

/*
 * POST sesiones
 */
exports.create = function(req, res){
  if (typeof req.body.sesion === 'undefined') {
    if (req.is('json')){
      res.send({'error': 'No se recibieron datos'});
    } else {
      req.session.messages['error'] = 'No se recibieron datos';
      res.redirect('/');
    }
  } else {
    sesion.identificar(req, res, function(u){ // success
      if (req.is('json')){
        res.send({'usuario': u, 'url': '/dashboard'});
      } else {
        res.redirect('/dashboard');
      }
    }, function(err){                        // fail
      if (req.is('json')){
        res.send({error: err});
      } else {
        req.session.messages['error'] = err;
        res.redirect('/');
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
  
  if (req.is('json')){
    res.send({});
  } else {
    res.redirect('/');
  }
};