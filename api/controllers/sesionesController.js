var sesion = require('../helpers/sesion_helper');

/*
 * POST sesiones
 */
exports.create = function(req, res){
  if (typeof req.body.sesion === 'undefined') {
    res.send(400,{
      mensaje: {
        error: 'No se recibieron datos'
      },
      template: 'paginasEstaticas/index',
      url: '/'
    });
  } else {
    sesion.identificar(req, res, function(err, u){ 
      if (err){                        // fail
        res.send(400, {
          mensaje: {
            error: err
          },
          template: 'paginasEstaticas/index',
          url: '/'
        });
      } else {                          // success
        res.send({
          url: '/dashboard',
          template: 'paginasEstaticas/dashboard',
          login: u
        });
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
  
  res.send({
    url: '/',
    template: 'paginasEstaticas/index',
    mensaje: {
      success: "Sesion terminada"
    },
    logout: true
  });
};

/*
 * GET sesiones
 */
exports.show = function(req, res){
  res.send(req.session.usuario_actual);
} 