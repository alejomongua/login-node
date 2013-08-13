var sesion = require('./helpers/sesion_helper');
//var _ = require('cloneextend');

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
 * DELETE sesiones/:id
 */
exports.destroy = function(req, res){
  res.send(req.body);
};