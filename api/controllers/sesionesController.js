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
  usuarios = require('../helpers/db_helper').usuarios;
  usuarios.resetRememberToken(req.usuario_actual._id, function(err){
    delete req.usuario_actual;

    res.send({
      url: '/',
      template: 'paginasEstaticas/index',
      mensaje: {
        success: "Sesion terminada"
      },
      logout: true
    });
  });  
};

/*
 * GET sesiones
 */
exports.show = function(req, res){
  res.send(req.usuario_actual);
} 