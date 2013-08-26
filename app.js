
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
  if(!req.session.usuario_actual){
    request.get(protocol + '://' + host + '/api/sesiones', function(error, response, body){
      try{
        req.session.usuario_actual = JSON.parse(body);
      } catch (e) {
        req.session.usuario_actual = null;
      } finally {
        app.locals.usuario_actual = req.session.usuario_actual;
        console.log(req.session.usuario_actual)
        next();
      }
    });
  } else {
    console.log('no hay usuario')
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
  // El replace es para quitar el slash al final si lo hay
  var url = protocol + '://' +  host + '/api' + req._parsedUrl.pathname.replace(/\/$/,'');
  var options = {
    method: req.method,
    url: url
  };
  if(!isEmpty(req.body)){
    options.body =  JSON.stringify(req.body);
  }
  console.log(options)
  request(options, function(error, response, body){
    if(error){
      res.render('common/500'); // Mostrar página de error 500
    } else {
      if(response.statusCode == 404){
        res.render('common/404'); // Cambiar por mostrar pagina de 404
      } else if(response.statusCode >= 500){
        res.render('common/500', {error: 'Se recibio error'}); // Mostrar página de error 500
      } else {
        if (body){
          try{
            var cuerpo =JSON.parse(body);
          } catch (e){
            res.render('common/500', {error: 'Formato de body incorrecto'}); // Mostrar página de error 500
          }
          if (cuerpo.url){
            res.redirect(cuerpo.url);
          } else if (cuerpo.template){
            res.render(cuerpo.template, cuerpo);
          } else {
            res.render('common/500', {error: 'No hay template ni url'}); // Mostrar página de error 500
          }
        } else {
          res.render('common/500', {error: 'No hay body'}); // Mostrar página de error 500
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
