usuarios = require('../helpers/db_helper').usuarios;
/*
 * GET recuperar_password
 */
var gravatar = function (email, size){
  var crypto = require('crypto');
  var s = size || 100;
  var gravatar_id = crypto.createHash('md5').update(email).digest('hex');
  return "https://secure.gravatar.com/avatar/" + gravatar_id + '?s=' + s
};

exports.recuperarPassword = function(req, res){
  if(!req.query.id || !req.query.t){
    res.send(404);
  } else {
    usuarios.findById(req.query.id,function(error, usuario){
      if (error){
        console.log(err);
        res.send(500,{error: 'Hubo un error con la base de datos'});
      } else {
        var u;
        var crypt = require('../helpers/crypt_helper');
        console.log(usuario)
        if(usuario && (usuario.fecha_token > Date.now()) && (usuario.token === req.query.t) ) {
          remember_token = usuario.remember_token;
          usuarios.model.findOneAndUpdate({_id: usuario._id}, {
            lastLogin: Date.now(),
            token: crypt.token(),
            fecha_token: 0
          })
          .select("-password_digest -remember_token -fecha_token -token")
          .exec(function(err, doc){
            if (err){
              console.log(err);
              res.send(500);
            } else {
              u = doc.toJSON();

              res.cookie('remember_token', remember_token);
              req.session.usuario_actual = u;
              res.send({
                url: '/usuarios/' + usuario._id + '/modificar_password',
                mensaje: 'Asigne una nueva contraseña'
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
  if (req.session.usuario_actual.permisos.indexOf('usuarios') > -1 ||
      req.params.id == req.session.usuario_actual._id) {


    usuarios.findById(req.params.id, function(err, usuario){
      if (err){
        console.log(err);
        res.send(500,{
          error: 'Hubo un error con la base de datos'
        });
      } else {
        if (usuario) {
          res.send({
            url: '/usuarios/' + req.params.id + '/modificar_password',
            titulo: 'Modificar contraseña',
            template: 'usuariosModificar/Password', 
            usuario: usuario
          });
        } else {
          res.send(404);
        }
      }
    });
  } else {
    res.send(403,{
      url: '/dashboard',
      error: 'No autorizado'
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
      USUARIOS_POR_PAGINA = 10;
  // Verifica si tiene permiso para acceder a esta página
  if (req.session.usuario_actual.permisos.indexOf('usuarios') > -1) {
    // Cuenta el total de usuarios (para la paginación)
    usuarios.model.count({}, function(err, count){
      // Retorna con errores en caso de haber alguno
      if (err){
        console.log(err);
        res.send(500,{error: 'Hubo un error en la base de datos'});
      } else {
        cantidad_usuarios = count;
        // Verifica que página están solicitando
        pagina_actual = req.query.pagina || 1;
        // Realiza el query
        usuarios.model.find({})
        .skip(USUARIOS_POR_PAGINA * (pagina_actual - 1))
        .limit(USUARIOS_POR_PAGINA)
        .select("-password_digest -remember_token -fecha_token -token")
        .exec(function(err,users){
          // Retorna con errores en caso de haber alguno
          if (err){
            console.log(err);
            res.send(500,{error: 'Hubo un error en la base de datos'});
          } else {
            // Retorna con el dato solicitado
            res.send({
              url: '/usuarios',
              template: 'usuarios/index',
              titulo: 'Administrar usuarios',
              usuarios: users,
              pagina: pagina_actual,
              total: cantidad_usuarios
            });
          }
        });
      }
    });
  } else {
    // Redirige en caso de no tener autorización
    res.send(403, {
      url: '/dashboard',
      error: 'No autorizado'
    });
  }
};

/*
 * GET usuarios/new
 */
exports.new = function(req, res){
  if (req.session.usuario_actual.permisos.indexOf('usuarios') > -1) {
    res.send({
      template: 'usuarios/New',
      titulo: 'Crear nuevo usuario'
    });
  } else {
    res.send(403, {
      url: '/dashboard',
      error: 'No autorizado'
    });
  }
};

/*
 * GET usuarios/:id
 */
exports.show = function(req, res){
  if (req.session.usuario_actual.permisos.indexOf('usuarios') > -1 ||
      req.params.id == req.session.usuario_actual._id) {

    usuarios.findById(req.params.id, function(err, usuario){
      if (err){
        console.log(err);
        res.send(500,{error: 'Hubo un error con la base de datos'});
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
      error: 'No autorizado'
    });
  }
};

/*
 * GET usuarios/:id/edit
 */
exports.edit = function(req, res){
  var usuario = {};
  if (req.session.usuario_actual.permisos.indexOf('usuarios') > -1 ||
      req.params.id == req.session.usuario_actual._id) {


    usuarios.findById(req.params.id, function(err, usuario){
      if (err){
        console.log(err);
        res.send(500,{error: 'Hubo un error con la base de datos'});
      } else {
        if (usuario) {
          res.send({
            url: '/usuarios/' + req.params.id + '/edit',
            titulo: 'Editar ' + usuario.nombres,
            template: 'usuarios/edit',
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
      error: 'No autorizado'
    });
  }
};

/*
 * POST usuarios
 */
exports.create = function(req, res){
  if (req.session.usuario_actual.permisos.indexOf('usuarios') > -1) {
    user = new usuarios.model(req.body.usuario);

    user.save(function(err, doc){
      if (err){
        if(err.errors){
          res.send(302, {
            url: '/usuarios/new',
            error: err.errors,
            usuario: req.body.usuario
          });
        } else {
          res.send(500,{error: 'Hubo un error con la base de datos'});
        }
      } else {
        var usuario = doc.toJSON();

        delete usuario['password_digest'];
        delete usuario['remember_token'];
        delete usuario['fecha_token'];
        delete usuario['token'];

        res.send({
          url: '/usuarios/' + usuario._id,
          usuario: usuario
        });
      }
    });
  } else {
    res.send(403, {
      url: '/dashboard',
      error: 'No autorizado'
    });
  }
};

/*
 * PUT usuarios/:id
 */
exports.update = function(req, res){
  // Verifique que se hallan recibido datos
  if (req.body.usuario && req.params.id && req.session.usuario_actual) {
    // Verifique que: Sea administrador, o que sea el mismo usuario y no
    // se esté intentando modificar los permisos
    if (req.session.usuario_actual.permisos.indexOf('usuarios') > -1 ||
        (req.params.id == req.session.usuario_actual._id &&
          !(req.body.usuario.permisos))) {
      usuarios.update(req.params.id, req.body.usuario, function(err, usuario){
        if(err){
          if(err.errors){
            res.send(302, {
              url: '/usuarios/' + req.params.id + '/edit',
              error: err.errors,
              usuario: req.body.usuario
            });
          } else {
            res.send(500,{error: 'Hubo un error con la base de datos'});
          }
        } else {
          if (usuario){
            if (usuario._id == req.session.usuario_actual._id){
              req.session.usuario_actual = usuario;
              res.send({
                url: '/usuarios/' + usuario._id,
                usuario: usuario,
                usuario_actual: usuario
              });
            } else {
              res.send({
                url: '/usuarios/' + usuario._id,
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
        error: 'No autorizado'
      });
    }
  } else {
    res.send(400,{error: 'No se recibieron datos'});
  }
};

/*
 * DELETE usuarios/:id
 */
exports.destroy = function(req, res){
  if (req.params.id) {  
    if ((req.session.usuario_actual.permisos.indexOf('usuarios') > -1) &&
      (req.session.usuario_actual._id != req.params.id)) {
      
      usuarios.model.findByIdAndRemove(req.params.id)
        .select("-password_digest -remember_token -fecha_token -token")
        .exec(function (err, doc) {
        if (err) {
          console.log(err);
          res.send(500,{error: 'Hubo un error en la base de datos'});
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
        error: 'No autorizado'
      });
    }
  }  else {
    res.send(400,{error: 'No se recibieron datos'});
  }
};

exports.gravatar = function (req, res){
  usuarios.findById(req.params.id,function(err, doc){
    if(err) {
      res.send(500,{error: 'Hubo un error con la base de datos'});
    } else {
      if (doc) {
        res.redirect(301,gravatar(doc.email,req.query.size));
      } else {
        res.send(404)
      }
    }
  });
};