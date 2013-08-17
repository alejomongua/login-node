
/**
 * Module dependencies.
 */

var express = require('express')
  , paginasEstaticasController = require('./controllers/paginasEstaticasController')
  , sesionesController = require('./controllers/sesionesController')
  , usuariosController = require('./controllers/usuariosController')
  , sesion_helper = require('./helpers/sesion_helper')
  , http = require('http')
  , engine = require('ejs-locals')
  , path = require('path')
  , formularios = require('./helpers/formularios_helper');

var app = express();

// all environments
app.engine('ejs', engine);

app.locals.formularios = formularios;
app.set('port', process.env.PORT || 30602);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(function (req, res, next) {
  var key = '_method';
  if (req.originalMethod != req.method) {
    // already overridden => do not override again
    next();
    return;
  }

  req.originalMethod = req.method;
  if (req.query && key in req.query) {
    req.method = req.query[key].toUpperCase();
    delete req.query[key];
  }
  next();
});
app.use(express.cookieParser('TY2axQh43LnwAgkH'));
app.use(express.session());


app.use(function(req, res, next){
  if (!req.is('json')){
    //Verifique que la variable de mensajes exista
    if (typeof req.session.messages === 'undefined') req.session.messages = {};
  }
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
app.use(sesion_helper.autorizacion(urlsQueNoRequirenAutenticacion));

// Agrege siempre el flash y el usuario actual
app.use(function(req, res, next) {
  res.locals.flash = req.session.messages;
  res.locals.usuario_actual = req.session.usuario_actual;
  next();
});

// El middleware referente a peticiones tiene que ir antes de esta
// instruccion
app.use(app.router);
app.use(require('less-middleware')({ src: __dirname + '/public' }));

// development only
if ('development' == app.get('env')) {
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';
  app.use(express.errorHandler());
}

// Routes:
// Paginas estaticas:
app.get('/', paginasEstaticasController.index);
app.get('/olvide_password', paginasEstaticasController.olvidePassword);
app.get('/dashboard', paginasEstaticasController.dashboard);
app.post('/olvide_password', paginasEstaticasController.enviarCorreo);

// Sesiones
app.post('/sesiones', sesionesController.create);
app.delete('/sesiones', sesionesController.destroy);

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

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
