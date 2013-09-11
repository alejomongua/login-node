(function($) {
  return $.fn.serializeObject = function() {
    var json, patterns, push_counters,
      _this = this;
    json = {};
    push_counters = {};
    patterns = {
      validate: /^[a-zA-Z][a-zA-Z0-9_]*(?:\[(?:\d*|[a-zA-Z0-9_]+)\])*$/,
      key: /[a-zA-Z0-9_]+|(?=\[\])/g,
      push: /^$/,
      fixed: /^\d+$/,
      named: /^[a-zA-Z0-9_]+$/
    };
    this.build = function(base, key, value) {
      base[key] = value;
      return base;
    };
    this.push_counter = function(key) {
      if (push_counters[key] === void 0) {
        push_counters[key] = 0;
      }
      return push_counters[key]++;
    };
    $.each($(this).serializeArray(), function(i, elem) {
      var k, keys, merge, re, reverse_key;
      if (!patterns.validate.test(elem.name)) {
        return;
      }
      keys = elem.name.match(patterns.key);
      merge = elem.value;
      reverse_key = elem.name;
      while ((k = keys.pop()) !== void 0) {
        if (patterns.push.test(k)) {
          re = new RegExp("\\[" + k + "\\]$");
          reverse_key = reverse_key.replace(re, '');
          merge = _this.build([], _this.push_counter(reverse_key), merge);
        } else if (patterns.fixed.test(k)) {
          merge = _this.build([], k, merge);
        } else if (patterns.named.test(k)) {
          merge = _this.build({}, k, merge);
        }
      }
      return json = $.extend(true, json, merge);
    });
    return json;
  };
})(jQuery);

var myApplication = {};

/* utilidades */
myApplication.capitalizeFirstLetter = function(string)
{
  if (typeof string === 'string'){
    return string.charAt(0).toUpperCase() + string.slice(1);
  } else {
    return '';
  }
};

myApplication.isEmpty = function(obj) {
  return Object.keys(obj).length === 0;
};

/* sesion */
myApplication.login = function(usuario){
  myApplication.usuario_actual = usuario;
  myApplication.renderTemplate('common/menu_usuario', $('#menu-usuario'), {usuario_actual: myApplication.usuario_actual});
  myApplication.navegarA('/dashboard', {operacion: 'replace'});
  $.cookie("identificar", usuario.remember_token, {path: '/'});
};

myApplication.logout = function(){
  myApplication.renderTemplate('common/menu_usuario', $('#menu-usuario'), {usuario_actual: false});
  delete myApplication.usuario_actual;
  $.removeCookie("identificar", {path: '/'});
  $.removeCookie("connect.sid", {path: '/'});
};

/* plantillas */

/* Carga la vista desde la ruta 'template' y la pone
 * en 'dest' (jQuery instance).
 * Utiliza el contexto 'context' para llenar la plantilla
 * opciones: position:
 *    replace: Pone el resultado dentro de 'dest', remplazando
 *             lo que hubiera allì, opcion por defecto
 *    append: añade el resultado al contenido de 'dest'
 *    prepend: pone el resultado antes del contenido de 'dest'
 */
myApplication.renderTemplate = function(template, dest, context, options){
  var posicion = 'replace';
  var url = '/_views/' + template + '.html';
  if (options){
    if(options.position){
      posicion = options.position;
    }
  }
  $.ajax({
    url: url,
    type: 'GET',
    dataType: 'html',
    success: function(data, b, c){
      var result = _.template(data, context);
      switch(posicion){
        case 'append':
          dest.append(result);
          break;
        case 'prepend':
          dest.prepend(result);
          break;
        default:
          dest.html(result);
          break;
      }
    }
  });
};

myApplication.navegarA = function(destination, options, data){
  var operacion = 'push';
  var method = 'get';
  var contenedorPrincipal = $('#main-content');
  var navegarAjax = function(context){
    var t;
    var d = destination;
    var tit = 'Aplicacion';
    if(context){
      if(context.mensaje){
        myApplication.flash(context.mensaje);
      }
      if(context.logout){
        myApplication.logout();
      } else if(context.login){
        myApplication.login(context.login);
      }
      if (context.template) {
        t = context.template;
      }
      if (context.url) {
        d = context.url;
      }
      if (context.titulo){
        tit = context.titulo + ' | ' + tit;
      }
    }
    $('title').html(tit);
    myApplication.renderTemplate(t, contenedorPrincipal, context, options)
    if (operacion === 'replace'){
      history.replaceState({
        url: d,
        template: t
      }, null, d);
    }else if (operacion === 'push'){
      history.pushState({
        url: d,
        template: t
      }, null, d);
      $("body").addClass("historypushed");
    }
  }
  
  contenedorPrincipal.html('<div class="text-center"><img src="/images/ajax-loader.gif" title="cargando" alt="cargando" /></div>');
  
  if (options){
    if(options.operacion){
      operacion = options.operacion;
    }
    if(options.method){
      method = options.method;
    }
  }
  myApplication.flash(); // Borra los mensajes en el flash
  $.ajax({
    url: destination,
    type: method,
    data: data,
    dataType: 'json',
    beforeSend: function(req){
      if(myApplication.usuario_actual && myApplication.usuario_actual.remember_token) {
        req.setRequestHeader("X-Identificar", myApplication.usuario_actual.remember_token);
      }
    },
    success: function(context){
      navegarAjax(context);
    },
    error: function(err){
      var context = err.responseJSON;      
      if(err.status === 404){
        myApplication.renderTemplate('common/404', contenedorPrincipal);
      } else if (context) {
        navegarAjax(context);
      } else {
        myApplication.renderTemplate('common/500', contenedorPrincipal);
      }
      console.log(err);
    }
  });
};

myApplication.flash = function(mensaje){
  var flashTemplate = 'common/flash';
  var flashDiv = $('#flash');
  if (typeof mensaje !== 'object' || myApplication.isEmpty(mensaje)){
    flashDiv.html('');
  } else {
    myApplication.renderTemplate(flashTemplate, flashDiv, {flash: mensaje});
  }
}

/* formularios */
myApplication.formularios = {};

myApplication.formularios.campo = function(recurso, nombreDelCampo, tipo, valores, errores, options){
/*
<div class="row">
  <div class="col-xs-6 col-sm-6 col-md-5 col-lg-4">
    <%-label%>
  </div>
  <div class="col-xs-6 col-sm-6 col-md-5 col-lg-4">
    <%-input%>
  </div>
</div>
*/
  if (typeof valores === 'undefined') valores = {}
  if (typeof errores === 'undefined') errores = {}
  var stringAMostrar = myApplication.capitalizeFirstLetter(nombreDelCampo);
  var data = '';
  var multiple = '';
  var opciones = '';
  var clase = '';
  var input_class = '';
  var valor, output, seleccionado, label, input;

  clase = errores[nombreDelCampo] ? 'row form-group has-error' : 'row form-group';
  if (options){
    if (options.label) {
      stringAMostrar = options.label;
    }
    if (options.data){
      for(dato in options.data){
        data = data + ' data-' + dato + '="' + options.data[dato] + '"';
      }
    }
    if (options.clase) {
      clase = ' ' + options.clase;
    }
    if (options.input_class) {
      input_class = ' ' + options.input_class;
    }
    if (options.opciones){ // Opciones para los select
      for(opcion in options.opciones){
        seleccionado = ''; // Verifica si la opción estaba previamente seleccionada
        if(valores[nombreDelCampo]){
          if((valores[nombreDelCampo] instanceof Array && valores[nombreDelCampo].indexOf(opcion) > -1) || // Si es un array
            (valores[nombreDelCampo] == opcion)) { // Si es un valor sencillo
            seleccionado = ' selected';
          }
        }
        opciones = opciones + '<option value="' + opcion + '"'+ seleccionado +'>' + options.opciones[opcion] + '</option>';
      }
    }
    if (options.multiple){
      multiple = ' multiple';
    }
  }
  valor = valores[nombreDelCampo] ? ' value="' + valores[nombreDelCampo] + '"' : '';

  if (tipo !== 'checkbox') {
    label = '<label class="control-label text-right" for="' + recurso + '_' + nombreDelCampo + '">' + 
                stringAMostrar + '</label>';
    switch(tipo){
      case 'texto':
        input = '<input id="' + recurso + '_' + nombreDelCampo + '"' +
                      ' class="form-control' + input_class + '"' +
                      ' name="' + recurso + '[' + nombreDelCampo + ']"' +
                      ' size="30" type="text"' + valor + data + '>';
        break;
      case 'password':
        input = '<input id="' + recurso + '_' + nombreDelCampo + '"' +
                      ' class="form-control' + input_class + '"' +
                      ' name="' + recurso + '[' + nombreDelCampo + ']"' +
                      ' size="30" type="password"' + valor + data + '>';
        break;
      case 'seleccion':
        input = '<select id="' + recurso + '_' + nombreDelCampo + '"' +
                ' class="form_control' + input_class + '"' + multiple + data +
                ' name="' + recurso + '[' + nombreDelCampo + ']"' + '>' +
                opciones + '</select>';
        break;
      default:
        input = '';
        break;
    }

    output = '<div class="' + clase + '">' +
             '  <div class="col-xs-6 col-sm-6 col-md-5 col-lg-4">' +
             label +
             '  </div>' +
             '  <div class="col-xs-6 col-sm-6 col-md-5 col-lg-4">' +
             input +
             '  </div>' +
             '</div>';
  } else {
    input = '<input id="' + recurso + '_' + nombreDelCampo + '"' +
                      ' class="form-control' + input_class + '"' +
                      ' name="' + recurso + '[' + nombreDelCampo + ']"' +
                      ' size="30" type="checkbox"' + valor + data + '>';

    output = '<div class="row' + clase + '">' +
             '  <div class="col-xs-6 col-sm-6 col-md-5 col-lg-4 text-right">' +
             input +
             '  </div>' +
             '  <div class="col-xs-6 col-sm-6 col-md-5 col-lg-4">' +
             stringAMostrar +
             '  </div>' +
             '</div>';
  }
  

  return output;
};

myApplication.formularios.errores = function(flash, errores, options){
  var mensaje, stringAMostrar;
  if(typeof errores === 'string'){
    myApplication.flash({error: errores});
  } else if (!myApplication.isEmpty(errores)){
    mensaje = 'Hay errores en el formulario' +
              '<ul>';
    for(error in errores){
      stringAMostrar = myApplication.capitalizeFirstLetter(error);
      if (options && options[error]){
        if (options[error].label){
          stringAMostrar = options[error].label;
        }
      }
      mensaje = mensaje + '<li>' + stringAMostrar + ' ' + errores[error].type + '</li>'
    }
    mensaje = mensaje + '</ul>';
    myApplication.flash({error: mensaje});
  }  
};

/* Inicializacion */ 
myApplication.inicializar = function($){
  if(history && history.pushState){
    // Navegacion ajax
    $(document).on('click', 'a', function(){
      var vinculo = $(this);
      if(!vinculo.hasClass('dropdown-toggle')){
        $('.dropdown.open .dropdown-toggle').dropdown('toggle');
      }
      if(!vinculo.hasClass('active')){
        if(vinculo.attr('data-remote')){
          $('a').removeClass('active');
          vinculo.addClass('active');
          var opciones = {}
          opciones.method = vinculo.attr('data-method') || 'GET';
          myApplication.navegarA(vinculo.attr('href'), opciones);
          return false;
        }
      } else {
        return false;
      }
    });

    // Enviar formularios ajax
    $(document).on('click', 'button', function(){
      if($(this).attr('data-remote') && $(this).attr('data-formulario')){
        var boton = $(this),
            idForm = boton.attr('data-formulario'),
            formulario = $('#' + idForm),
            method, destination;
        if(formulario.length > 0){
          boton.attr('disabled','disabled');
          destination = formulario.attr('action');
          datos = formulario.serializeObject();
          method = formulario.attr('data-method') || 'POST';
          myApplication.navegarA(destination, {method: method}, datos);
          return false;
        }
      }
    });
  }
  // Cargue el usuario actual si existe la cookie
  if($.cookie('identificar')) {
    $.ajax({
      url: '/sesiones',
      type: 'GET',
      dataType: 'json',
      beforeSend: function(req){      
        req.setRequestHeader("X-Identificar", $.cookie('identificar'));
      },
      success: function(u){
        // si el valor no es válido, borre la cookie
        if (!u) { 
          $.cookie('identificar', null);
        }
        myApplication.usuario_actual = u;
        myApplication.usuario_actual.remember_token = $.cookie('identificar');
      }
    });
  }
  // Ligar eventos a elementos
  $(document).on('click', '.eliminar-elemento', function(){
      if(!confirm("Este cambio no se puede deshacer\n¿Está seguro?")){
          return false;
      }
  });
  $(".chosen-select").chosen();
};

$.ajaxPrefilter("json", function( options, originalOptions, jqXHR ) {
  options.url = 'http://api.localhost' + options.url;
});

jQuery(document).ready(myApplication.inicializar);

window.onpopstate = function(e){
  if(e.state && e.state.url){
    myApplication.navegarA(e.state.url, {operacion: 'pop'});
    $("body").addClass("historypushed");
  } else {
    if ($("body").hasClass("historypushed")){
      document.location.reload(true); 
    }
  }
}