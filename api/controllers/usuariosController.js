var usuarios = require('../helpers/db_helper').usuarios;
var crypt = require('../helpers/crypt_helper');
/*
 * GET recuperar_password
 */
var gravatar = function (email, size){
  var s = size || 100;
  var gravatar_id = crypt.md5Hex(email);
  return "https://secure.gravatar.com/avatar/" + gravatar_id + '?s=' + s
};

exports.recuperarPassword = function(req, res){
  if(!req.query.id || !req.query.t){
    res.send(404);
  } else {
    usuarios.findById(req.query.id,function(error, usuario){
      if (error){
        console.log(err);
        res.send(500,{
          mensaje: {
            error: 'Hubo un error con la base de datos'
          }
        });
      } else {
        var u;
        if(usuario && (usuario.fecha_token > Date.now()) && (usuario.token === req.query.t) ) {
          remember_token = usuario.remember_token;
          usuarios.model.findOneAndUpdate({_id: usuario._id}, {
            lastLogin: Date.now(),
            token: crypt.token(),
            fecha_token: 0
          })
          .select("-password_digest -fecha_token -token")
          .exec(function(err, doc){
            if (err){
              console.log(err);
              res.send(500);
            } else {
              u = doc.toJSON();

              res.cookie('remember_token', remember_token);
              req.usuario_actual = u;
              res.send({
                url: '/usuarios/' + usuario._id + '/modificar_password',
                template: 'usuarios/modificarPassword',
                login: usuario,
                mensaje: {
                  success: 'Asigne una nueva contraseña'
                }
              });
            }
          });

        } else {
          res.send(404);
        }
      }
    });
  }
};

/*
 * GET usuarios/:id/modificar_password
 */
exports.modificarPassword = function(req, res){
  var usuario = {};
  if (req.usuario_actual.permisos.indexOf('usuarios') > -1 ||
      req.params.id == req.usuario_actual._id) {


    usuarios.findById(req.params.id, function(err, usuario){
      if (err){
        console.log(err);
        res.send(500,{
          mensaje: {
            error: 'Hubo un error con la base de datos'
          }
        });
      } else {
        if (usuario) {
          res.send({
            titulo: 'Modificar contraseña',
            template: 'usuarios/modificarPassword', 
            usuario: usuario,
            error: {}
          });
        } else {
          res.send(404);
        }
      }
    });
  } else {
    res.send(403,{
      url: '/dashboard',
      template: 'paginasEstaticas/dashboard',
      mensaje: {
        error: 'No autorizado'
      }
    });
  }
};

/*
 * GET usuarios
 */
exports.index = function(req, res){
  var users,
      cantidad_usuarios,
      pagina_actual,
      por_pagina;
  debugger;

  // Verifica si tiene permiso para acceder a esta página
  if (req.usuario_actual.permisos.indexOf('usuarios') > -1) {
    // Cuenta el total de usuarios (para la paginación)
    usuarios.model.count({}, function(err, count){
      // Retorna con errores en caso de haber alguno
      if (err){
        console.log(err);
        res.send(500,{
          mensaje: {
            error: 'Hubo un error en la base de datos'
          }
        });
      } else {
        cantidad_usuarios = count;
        // Verifica que página están solicitando
        pagina_actual = req.query.pagina || 1;
        por_pagina = req.query.por_pagina || 10;
        // Realiza el query
        usuarios.model.find({})
        .skip(por_pagina * (pagina_actual - 1))
        .limit(por_pagina)
        .select("-password_digest -remember_token -fecha_token -token")
        .exec(function(err,users){
          // Retorna con errores en caso de haber alguno
          if (err){
            console.log(err);
            res.send(500,{
              mensaje: {
                error: 'Hubo un error en la base de datos'
              }  
            });
          } else {
            // Retorna con el dato solicitado
            if(req.query.vista) {
              res.send({
                template: 'usuarios/index',
                titulo: 'Administrar usuarios'
              });
            } else {
              res.send({
                template: 'usuarios/index',
                titulo: 'Administrar usuarios',
                pagina: pagina_actual,
                por_pagina: por_pagina,
                total: cantidad_usuarios,
                usuarios: users
              });
            }
          }
        });
      }
    });
  } else {
    // Redirige en caso de no tener autorización
    res.send(403, {
      url: '/dashboard',
      template: 'paginasEstaticas/dashboard',
      mensaje: {
        error: 'No autorizado'
      }
    });
  }
};

/*
 * GET usuarios/new
 */
exports.new = function(req, res){
  if (req.usuario_actual.permisos.indexOf('usuarios') > -1) {
    res.send({
      template: 'usuarios/New',
      titulo: 'Crear nuevo usuario',
      error: {}
    });
  } else {
    res.send(403, {
      url: '/dashboard',
      template: 'paginasEstaticas/dashboard',
      mensaje: {
        error: 'No autorizado'
      }
    });
  }
};

/*
 * GET usuarios/:id
 */
exports.show = function(req, res){
  if (req.usuario_actual.permisos.indexOf('usuarios') > -1 ||
      req.params.id == req.usuario_actual._id) {

    usuarios.findById(req.params.id, function(err, usuario){
      if (err){
        console.log(err);
        res.send(500,{
          mensaje: {
            error: 'Hubo un error con la base de datos'
          }
        });
      } else {
        if (usuario) {
          res.send({
            titulo: usuario.nombres,
            template: 'usuarios/show',
            usuario: usuario
          });
        } else {
          res.send(404)
        }
      }
    });
  } else {
    res.send(403,{
      url: '/dashboard',
      template: 'paginasEstaticas/dashboard',
      mensaje: {
        error: 'No autorizado'
      }
    });
  }
};

/*
 * GET usuarios/:id/edit
 */
exports.edit = function(req, res){
  var usuario = {};
  if (req.usuario_actual.permisos.indexOf('usuarios') > -1 ||
      req.params.id == req.usuario_actual._id) {

    usuarios.findById(req.params.id, function(err, usuario){
      if (err){
        console.log(err);
        res.send(500,{
          mensaje: {
            error: 'Hubo un error en la base de datos'
          }
        });
      } else {
        if (usuario) {
          res.send({
            titulo: 'Editar ' + usuario.nombres,
            template: 'usuarios/edit',
            usuario: usuario,
            error: {}
          });
        } else {
          res.send(404)
        }
      }
    });

  } else {
    res.send(403, {
      url: '/dashboard',
      template: 'paginasEstaticas/dashboard',
      mensaje: {
        error: 'No autorizado'
      }
    });
  }
};

/*
 * POST usuarios
 */
exports.create = function(req, res){
  if (req.usuario_actual.permisos.indexOf('usuarios') > -1) {
    user = new usuarios.model(req.body.usuario);

    user.save(function(err, doc){
      if (err){
        if(err.errors){
          res.send(302, {
            url: '/usuarios/new',
            template: 'usuarios/new',
            error: err.errors,
            usuario: req.body.usuario
          });
        } else {
          res.send(500,{
          mensaje: {
            error: 'Hubo un error en la base de datos'
          }
        });
        }
      } else {
        var usuario = doc.toJSON();

        delete usuario['password_digest'];
        delete usuario['remember_token'];
        delete usuario['fecha_token'];
        delete usuario['token'];

        res.send({
          url: '/usuarios/' + usuario._id,
          template: 'usuarios/show',
          usuario: usuario
        });
      }
    });
  } else {
    res.send(403, {
      url: '/dashboard',
      template: 'paginasEstaticas/dashboard',
      mensaje: {
        error: 'No autorizado'
      }
    });
  }
};

/*
 * PUT usuarios/:id
 */
exports.update = function(req, res){
  // Verifique que se hallan recibido datos
  if (req.body.usuario && req.params.id && req.usuario_actual) {
    // Verifique que: Sea administrador, o que sea el mismo usuario y no
    // se esté intentando modificar los permisos
    if (req.usuario_actual.permisos.indexOf('usuarios') > -1 ||
        (req.params.id == req.usuario_actual._id &&
          !(req.body.usuario.permisos))) {
      usuarios.update(req.params.id, req.body.usuario, function(err, usuario){
        if(err){
          if(err.errors){
            res.send(302, {
              template: 'usuarios/edit',
              error: err.errors,
              usuario: req.body.usuario
            });
          } else {
            res.send(500,{
              mensaje: {
                error: 'Hubo un error en la base de datos'
              }
            });
          }
        } else {
          if (usuario){
            if (usuario._id == req.usuario_actual._id){
              req.usuario_actual = usuario;              
              res.send({
                url: '/usuarios/' + usuario._id,
                template: 'usuarios/show',
                login: usuario
              });
            } else {
              delete usuario['remember_token'];
              res.send({
                url: '/usuarios/' + usuario._id,
                template: 'usuarios/show',
                usuario: usuario
              });
            }
          } else {
            res.send(404);
          }
        }
      });
    } else {
      res.send(403, {
        url: '/dashboard',
        template: 'paginasEstaticas/dashboard',
        mensaje: {
          error: 'No autorizado'
        }
      });
    }
  } else {
    res.send(400,{
      mensaje: {
        error: 'No se recibieron datos'
      }
    });
  }
};

/*
 * DELETE usuarios/:id
 */
exports.destroy = function(req, res){
  if (req.params.id) {  
    if ((req.usuario_actual.permisos.indexOf('usuarios') > -1) &&
      (req.usuario_actual._id != req.params.id)) {
      
      usuarios.model.findByIdAndRemove(req.params.id)
        .select("-password_digest -remember_token -fecha_token -token")
        .exec(function (err, doc) {
        if (err) {
          console.log(err);
          res.send(500,{
            mensaje: {
              error: 'Hubo un error en la base de datos'
            }
          });
        } else {
          if (doc) {
            var usuario = doc.toJSON();

            res.send({
              usuario: usuario
            });
          } else {
            res.send(404)
          }
        }
      });
    } else {
      res.send(403, {
        url: '/dashboard',
        template: 'paginasEstaticas/dashboard',
        mensaje: {
          error: 'No autorizado'
        }
      });
    }
  }  else {
    res.send(400,{
      mensaje: {
        error: 'No se recibieron datos'
      }
    });
  }
};

exports.gravatar = function (req, res){
  usuarios.findById(req.params.id,function(err, doc){
    if(err) {
      res.send(500,{
        mensaje: {
          error: 'Hubo un error en la base de datos'
        }
      });
    } else {
      if (doc) {
        res.send(301,{url:gravatar(doc.email,req.query.size)});
      } else {
        res.send(404)
      }
    }
  });
};