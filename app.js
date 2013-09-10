
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , request = require('request')
  , engine = require('ejs-locals')
  , path = require('path')
  , formularios = require('./helpers/formularios_helper');

var app = express();
var host = process.env.HOST || 'localhost';
var protocol = process.env.PROTOCOL || 'http';
var isEmpty = function(obj) {
  return Object.keys(obj).length === 0;
};
// all environments
app.engine('ejs', engine);

app.locals.formularios = formularios;
app.locals.moment = require('moment');
app.locals.moment.lang('es');
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

// Verificar si es usuario logueado
app.use(function (req, res, next) {
  if(typeof req.session.mensajes === 'undefined') {
    req.session.mensajes = {};
  }
  app.locals.flash = req.session.mensajes;
  if(!req.session.usuario_actual){
    // Inicializa en blanco para no tener un error en la plantilla
    app.locals.usuario_actual = null;
    // Lee la cookie para el servidor de apis
    var COOKIE_SES_API_REGEX = /connect\.sid_api=([^;]*)/;
    var cookieJar = request.jar();
    if (COOKIE_SES_API_REGEX.test(req.headers.cookie)){
      var cookie = 'connect.sid_api=' + COOKIE_SES_API_REGEX.exec(req.headers.cookie)[1];
      cookieJar.add(request.cookie(cookie));
      request.get({
        url: 'http://localhost:30601/api/sesiones',
        json: true,
        jar: cookieJar,
      }, function(error, response, body){
        if(body){
          req.session.usuario_actual = body;
          app.locals.usuario_actual = req.session.usuario_actual;
          next();
        } else {
          req.session.usuario_actual = null;
          next();
        }
      });
    } else {
      req.session.usuario_actual = null;
      next();
    }    
  } else {
    app.locals.usuario_actual = req.session.usuario_actual;
    next();
  }
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
app.all('*', function(req,res){
  // Lee la cookie para el servidor de apis
  var COOKIE_SES_API_REGEX = /connect\.sid_api=([^;]*)/;
  var cookieJar = request.jar();
  if (COOKIE_SES_API_REGEX.test(req.headers.cookie)){
    var cookie = 'connect.sid_api=' + COOKIE_SES_API_REGEX.exec(req.headers.cookie)[1];
    cookieJar.add(request.cookie(cookie));
  }
  // El replace es para quitar el slash al final si lo hay
  var url = 'http://localhost:30601/api' + req._parsedUrl.pathname.replace(/\/$/,'');
  var options = {
    jar: cookieJar,
    method: req.method,
    url: url,
    json: true
  };
  if(!isEmpty(req.body)){
    options.body =  req.body;
  }
  request(options, function(error, response, body){
     if(error){
      req.session.mensajes.error = error;
      res.status(500).render('common/500'); // Mostrar página de error 500
    } else {
      if(response.statusCode == 404){
        res.status(404).render('common/404'); // Cambiar por mostrar pagina de 404
      } else if(response.statusCode >= 500){
        req.session.mensajes.error = 'Ocurrió un error en el servidor';
        res.status(response.statusCode).render('common/500'); // Mostrar página de error 500
      } else {
        if (body){
          if (body.error){
            if(typeof body.error === 'string'){
              req.session.mensajes.error = body.error;
            }
          }
          if (body.url){
            if(Math.floor(response.statusCode / 100) == 3){
              res.redirect(response.statusCode, body.url);
            } else {
              res.redirect(body.url);
            }
          } else if (body.template){
            res.render(body.template, body);
          } else {
            req.session.mensajes.error = 'No se pudo resolver la petición';
            res.status(500).render('common/500'); // Mostrar página de error 500
          }
        } else {
          req.session.mensajes['error'] = 'Respuesta vacia';
          res.status(500).render('common/500'); // Mostrar página de error 500
          return;
        }
          
      }
    }
  });
});

// ejecute el servidor de apis
var api = require('./api/app');
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
