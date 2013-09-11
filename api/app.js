/* API server */

/**
 * Module dependencies.
 */
var express = require('express')
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

app.use(function(req, res, next){
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With, X-Identificar");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header("Content-Type", "application/json");
  if (req.method !== 'OPTIONS'){
    // Logea al usuario si existe la cookie
    sesion_helper.identificar_con_header(req, function(err){
      if (err){
        console.log(err);      
        next();
      } else {
        next();
      }
    });
  } else {
    next();
  }
});

// Agrega las url para las que no se necesita estar autenticado
var urlsQueNoRequirenAutenticacion = [
  '/',
  '/olvide_password',
  '/sesiones',
  '/recuperar_password'
];
app.use(sesion_helper.autorizacion(urlsQueNoRequirenAutenticacion, '/'));

// El middleware referente a peticiones tiene que ir antes de esta
// instruccion
app.use(app.router);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.options('*', function(req, res) {
  res.send({});
});

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

http.createServer(app).listen(app.get('port'), function(){
  console.log('API server listening on port ' + app.get('port'));
});
