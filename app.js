
/**
 * Module dependencies.
 */

var express = require('express')
  , paginasEstaticas = require('./routes/paginasEstaticas')
  , sesiones = require('./routes/sesiones')
  , sesion_helper = require('./routes/helpers/sesion_helper')
  , user = require('./routes/user')
  , http = require('http')
  , engine = require('ejs-locals')
  , path = require('path');

var app = express();

// all environments
app.engine('ejs', engine);

app.set('port', process.env.PORT || 30602);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
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
      console.err(err);
      res.clearCookie('remember_token');
      next();
    } else {
      next();
    }
  });
});
// Agrega las url para las que no se necesita estar autenticado
app.use(sesion_helper.autorizacion(['/', '/olvide_password', '/sesiones']));
app.use(app.router);
app.use(require('less-middleware')({ src: __dirname + '/public' }));


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Routes:
// Paginas estaticas:
app.get('/', paginasEstaticas.index);
app.get('/olvide_password', paginasEstaticas.olvidePassword);
app.get('/dashboard', paginasEstaticas.dashboard);
app.post('/olvide_password', paginasEstaticas.enviarCorreo);

// Sesiones
app.post('/sesiones', sesiones.create);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
