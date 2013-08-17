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
    if(req.is('json')){
      res.send(404,{error: 'Ubicación no válida'});
    } else {
      req.session.messages['error'] = 'Ubicación no válida';
      res.redirect('/');
    }
  } else {
    usuarios.findById(req.query.id,function(doc){
      var usuario;
      if(doc && (doc.fecha_token > Date.now()) && (doc.token === req.query.t) ) {
        usuario = doc.toJSON();

        delete usuario['password_digest'];
        delete usuario['remember_token'];
        delete usuario['fecha_token'];
        delete usuario['token'];

        req.session.usuario_actual = usuario;

        if(req.is('json')){
          res.send({usuario: usuario, url: '/usuarios/' + usuario._id + '/modificar_password' });
        } else {
          req.session.messages['success'] = 'Asigne una nueva contraseña';
          res.redirect('/usuarios/' + usuario._id + '/modificar_password');
        }
      } else {
        if(req.is('json')){
          res.send(404,{error: 'No encontrado'});
        } else {
          req.session.messages['error'] = 'Enlace no válido, tal vez lo copió incompleto o ya expiró';
          res.redirect('/');
        }
      }
    },function(err){
      console.log(err);
      if(req.is('json')){
        res.send(500,{error: 'Hubo un error con la base de datos'});
      } else {
        req.session.messages['error'] = 'Hubo un error con la base de datos';
        res.redirect('/');
      }
    });
  }
};

/*
 * GET usuarios/:id/modificar_password
 */
exports.modificarPassword = function(req, res){
  res.render('usuariosModificarPassword',{
    titulo: "Modificar contraseña",
    id: req.params.id
  });
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
        if(req.is('json')){
          res.send(500,{error: 'Hubo un error en la base de datos'});
        } else {
          req.session.messages['error'] = 'Hubo un error en la base de datos';
          res.redirect('/dashboard');
        }
      } else {
        cantidad_usuarios = count;
        // Verifica que página están solicitando
        pagina_actual = req.query.pagina || 1;
        // Realiza el query
        usuarios.model.find({})
        .skip(USUARIOS_POR_PAGINA * (pagina_actual - 1))
        .limit(USUARIOS_POR_PAGINA)
        .exec(function(err,users){
          // Retorna con errores en caso de haber alguno
          if (err){
            console.log(err);
            if(req.is('json')){
              res.send(500,{error: 'Hubo un error en la base de datos'});
            } else {
              req.session.messages['error'] = 'Hubo un error en la base de datos';
              res.redirect('/dashboard');
            }
          } else {
            // Retorna con el dato solicitado
            if(req.is('json')){
              res.send({
                url: '/usuarios',
                usuarios: users,
                pagina: pagina_actual,
                total: cantidad_usuarios
              });
            } else {
              res.render('usuariosIndex', 
                {
                  titulo: 'Administrar usuarios',
                  usuarios: users,
                  total: cantidad_usuarios,
                  pagina_actual: pagina_actual,
              });
            }
          }
        });
      }
    });
  } else {
    // Redirige en caso de no tener autorización
    if(req.is('json')){
      res.send(403,{error: 'No autorizado'})
    } else {
      req.session.messages['error'] = 'No autorizado';
      res.redirect('/dashboard');
    }
  }
};

/*
 * GET usuarios/new
 */
exports.new = function(req, res){
  if (req.session.usuario_actual.permisos.indexOf('usuarios') > -1) {

    if(req.is('json')){
      res.send({url: '/usuarios/new'});
    } else {
      res.render('usuariosNew', {
          titulo: 'Crear nuevo usuario',
          error: {},
          usuario: {}
      });
    }
  } else {
    if(req.is('json')){
      res.send(403,{error: 'No autorizado'})
    } else {
      req.session.messages['error'] = 'No autorizado';
      res.redirect('/dashboard');
    }
  }
};

/*
 * GET usuarios/:id
 */
exports.show = function(req, res){
  if (req.session.usuario_actual.permisos.indexOf('usuarios') > -1 ||
      req.params.id == req.session.usuario_actual._id) {

    usuarios.findById(req.params.id, function(usuario){
      if (usuario) {
        if(req.is('json')){
          res.send({
            url: '/usuarios/' + req.params.id,
            usuario: usuario
          });
        } else {
          res.render('usuariosShow', 
            {
              titulo: usuario.nombres,
              usuario: usuario,
          });
        }
      } else {
        res.status(404).redirect('/404.html');
      }
    }, function(err){
      console.log(err);
      if(req.is('json')){
        res.send(500,{error: 'Hubo un error con la base de datos'});
      } else {
        req.session.messages['error'] = 'Hubo un error con la base de datos';
        res.redirect('/dashboard');
      }
    });
  } else {
    if(req.is('json')){
      res.send(403,{error: 'No autorizado'})
    } else {
      req.session.messages['error'] = 'No autorizado';
      res.redirect('/dashboard');
    }
  }
};

/*
 * GET usuarios/:id/edit
 */
exports.edit = function(req, res){
  var usuario = {};
  if (req.session.usuario_actual.permisos.indexOf('usuarios') > -1 ||
      req.params.id == req.session.usuario_actual._id) {


    usuarios.findById(req.params.id, function(usuario){
      if (usuario) {
        if(req.is('json')){
          res.send({
            url: '/usuarios/' + req.params.id + '/edit',
            usuario: usuario
          });
        } else {
          res.render('usuariosEdit', 
            {
              titulo: 'Editar ' + usuario.nombres,
              usuario: usuario,
              error: {}
          });
        }
      } else {
        res.status(404).redirect('/404.html');
      }
    }, function(err){
      console.log(err);
      if(req.is('json')){
        res.send(500,{error: 'Hubo un error con la base de datos'});
      } else {
        req.session.messages['error'] = 'Hubo un error con la base de datos';
        res.redirect('/dashboard');
      }
    });

  } else {
    if(req.is('json')){
      res.send(403,{error: 'No autorizado'})
    } else {
      req.session.messages['error'] = 'No autorizado';
      res.redirect('/dashboard');
    }
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
        if (err.errors.password_digest){
          err.errors.password = err.errors.password_digest
        }
        if(req.is('json')){
          res.send(400,{
            error: err,
            usuario: req.body.usuario
          });
        } else {
          res.render('usuariosNew', {
            titulo: 'Crear nuevo usuario',
            error: err.errors,
            usuario: req.body.usuario
          });
        }
      } else {
        var usuario = doc.toJSON();

        delete usuario['password_digest'];
        delete usuario['remember_token'];
        delete usuario['fecha_token'];
        delete usuario['token'];

        if(req.is('json')){
          res.send({
            usuario: usuario
          });
        } else {
          res.redirect('/usuarios/' + usuario._id);
        }        
      }
    });
    
  } else {
    if(req.is('json')){
      res.send(403,{error: 'No autorizado'})
    } else {
      req.session.messages['error'] = 'No autorizado';
      res.redirect('/dashboard');
    }
  }
};

/*
 * PUT usuarios/:id
 */
exports.update = function(req, res){
  // Verifique que se hallan recibido datos
  if (req.body.usuario && req.params.id) {
    // Verifique que: Sea administrador, o que sea el mismo usuario y no
    // se esté intentando modificar los permisos
    if (req.session.usuario_actual.permisos.indexOf('usuarios') > -1 ||
        (req.params.id == req.session.usuario_actual._id &&
          !(req.body.usuario.permisos))) {

      usuarios.model.findByIdAndUpdate(req.params.id, req.body.usuario, function(err, doc){
        if (err) {
          if(req.is('json')){
            res.send(400,{
              error: err,
              usuario: req.body.usuario
            });
          } else {
            res.render('usuariosEdit', {
              titulo: 'Crear nuevo usuario',
              error: err.errors,
              usuario: req.body.usuario
            });
          }
        } else {
          if (doc){
            var usuario = doc.toJSON();

            delete usuario['password_digest'];
            delete usuario['remember_token'];
            delete usuario['fecha_token'];
            delete usuario['token'];

            if(req.is('json')){
              res.send({
                usuario: usuario
              });
            } else {
              res.redirect('/usuarios/' + usuario._id);
            }
          } else {
            res.status(404).redirect('/404.html');
          }
        }
      });
    } else {
      if(req.is('json')){
        res.send(403,{error: 'No autorizado'})
      } else {
        req.session.messages['error'] = 'No autorizado';
        res.redirect('/dashboard');
      }
    }
  } else {
    if(req.is('json')){
      res.send(400,{error: 'No se recibieron datos'})
    } else {
      req.session.messages['error'] = 'No se recibieron datos';
      res.redirect('/dashboard');
    }
  }
};

/*
 * DELETE usuarios/:id
 */
exports.destroy = function(req, res){
  if (req.params.id) {  
    if ((req.session.usuario_actual.permisos.indexOf('usuarios') > -1) &&
      (req.session.usuario_actual._id != req.params.id)) {
      
      usuarios.model.findByIdAndRemove(req.params.id, function (err, doc) {
        if (err) {
          if(req.is('json')){
            res.send(500,{
              error: err,
            });
          } else {
            req.session.messages['error'] = 'Error interno';
            res.redirect('/dashboard');
          }          
        } else {
          if (doc) {
            var usuario = doc.toJSON();

            delete usuario['password_digest'];
            delete usuario['remember_token'];
            delete usuario['fecha_token'];
            delete usuario['token'];

            if(req.is('json')){
              res.send({
                usuario: usuario
              });
            } else {
              req.session.messages['success'] = 'Usuario eliminado';
              res.redirect('/usuarios');
            }
          } else {
            res.status(404).redirect('/404.html');
          }
        }
      });
    } else {
      if(req.is('json')){
        res.send(403,{error: 'No autorizado'})
      } else {
        req.session.messages['error'] = 'No autorizado';
        res.redirect('/dashboard');
      }
    }
  }  else {
    if(req.is('json')){
      res.send(400,{error: 'No se recibieron datos'})
    } else {
      req.session.messages['error'] = 'No se recibieron datos';
      res.redirect('/dashboard');
    }
  }
};

exports.gravatar = function (req, res){
  usuarios.findById(req.params.id,function(doc){
    if (doc) {
      res.redirect(301,gravatar(doc.email,req.query.size));
    } else {
      res.status(404).redirect('/404.html');
    }
  },function(err){
    res.send(500,{error: 'Hubo un error con la base de datos'});
  });
};