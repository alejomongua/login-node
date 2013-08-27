/* API server */

/**
 * Module dependencies.
 */
var express = require('express')
  , namespace = require('express-namespace')
  , paginasEstaticasController = require('./controllers/paginasEstaticasController')
  , sesionesController = require('./controllers/sesionesController')
  , usuariosController = require('./controllers/usuariosController')
  , sesion_helper = require('./helpers/sesion_helper')
  , http = require('http')
  , path = require('path')

var app = express();

// all environments
app.set('port', process.env.PORT || 30601);
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('TY2axQh43LnwAgkH'));
app.use(express.session({key: 'connect.sid_api'}));

app.use(function(req, res, next){
  // Logea al usuario si existe la cookie
  sesion_helper.identificar_con_cookie(req, function(err){
    if (err){
      console.log(err);
      res.clearCookie('remember_token');
      next();
    } else {
      next();
    }
  });
});

// Agrega las url para las que no se necesita estar autenticado
var urlsQueNoRequirenAutenticacion = [
  '/',
  '/olvide_password',
  '/sesiones',
  '/recuperar_password'
];
app.use(sesion_helper.autorizacion(urlsQueNoRequirenAutenticacion, '/', '/api'));

// El middleware referente a peticiones tiene que ir antes de esta
// instruccion
app.use(app.router);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Routes:
app.namespace('/api', function(){
  // Paginas estaticas:
  app.get('/', paginasEstaticasController.index);
  app.get('/olvide_password', paginasEstaticasController.olvidePassword);
  app.get('/dashboard', paginasEstaticasController.dashboard);
  app.post('/olvide_password', paginasEstaticasController.enviarCorreo);

  // Sesiones
  app.post('/sesiones', sesionesController.create);
  app.delete('/sesiones', sesionesController.destroy);
  app.get('/sesiones', sesionesController.show);

  // Usuarios
  app.get('/recuperar_password', usuariosController.recuperarPassword);
  app.get('/usuarios/:id/modificar_password', usuariosController.modificarPassword);
  app.get('/usuarios', usuariosController.index);
  app.get('/usuarios/new', usuariosController.new);
  app.get('/usuarios/:id', usuariosController.show);
  app.get('/usuarios/:id/edit', usuariosController.edit);
  app.put('/usuarios/:id', usuariosController.update);
  app.post('/usuarios', usuariosController.create);
  app.delete('/usuarios/:id', usuariosController.destroy);
  app.get('/usuarios/:id/gravatar', usuariosController.gravatar);
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('API server listening on port ' + app.get('port'));
});
