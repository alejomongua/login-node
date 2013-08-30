var asp = {};

/* utilidades */
asp.capitalizeFirstLetter = function(string)
{
  if (typeof string === 'string'){
    return string.charAt(0).toUpperCase() + string.slice(1);
  } else {
    return '';
  }
};

asp.isEmpty = function(obj) {
  return Object.keys(obj).length === 0;
};

/* sesion */
asp.login = function(usuario){
  asp.usuario_actual = usuario;
  asp.renderTemplate('sesiones/menu_usuario', $('#menu-usuario'), {usuario_actual: asp.usuario_actual});
  asp.navegarA('/dashboard', {operacion: 'replace'});
};

asp.logout = function(){
  $.ajax({
    url: '/sesiones',
    type: 'DELETE',
    contentType: 'application/json',
    success: function(data){
      /*$.pnotify({
        title: 'Sesión finalizada'
      });*/
      asp.renderTemplate('sesiones/menu_usuario', $('#menu-usuario'), {usuario_actual: false});
      asp.navegarA('/', {operacion: 'replace'});
      delete asp.usuario_actual;
    },
    error: function(err, resp){
      /*$.pnotify({
        title: 'Error',
        text: resp.responseText,
        type: 'error'
      });*/
    }
  });
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
asp.renderTemplate = function(template, dest, context, options){
  var posicion = 'replace';
  if (options){
    if(options.position){
      posicion = options.position;
    }
  }
  $.ajax({
    url: '/_views/' + template + '.html',
    success: function(data){
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

asp.navegarA = function(destination, options){
  var operacion = 'push';
  var method = 'get';
  
  $('#main-content').html('<div class="text-center"><img src="/images/ajax-loader.gif" title="cargando" alt="cargando" /></div>');
  
  if (options){
    if(options.operacion){
      operacion = options.operacion;
    }
    if(options.method){
      method = options.method;
    }
  }
  $('#flash').html('');
  $.ajax({
    url: '/api' + destination,
    type: method,
    contentType: 'application/json',
    success: function(context){
      var t;
      var d = destination;
      var tit = 'A Su Puerta';
      if(context){
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
      asp.renderTemplate(t, $('#main-content'), context, options)
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
    },
    error: function(err, resp){
      console.log(err);
    }
  });
};

/* formularios */

asp.formularios = {};

asp.formularios.campo = function(recurso, nombreDelCampo, tipo, valores, errores, options){
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
  var stringAMostrar = asp.capitalizeFirstLetter(nombreDelCampo);
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

asp.formularios.errores = function(flash, errores, options){
  var mensaje, stringAMostrar;
  if(typeof errores === 'string'){
    flash['error'] = errores;
  } else if (!asp.isEmpty(errores)){
    mensaje = 'Hay errores en el formulario' +
              '<ul>';
    for(error in errores){
      stringAMostrar = asp.capitalizeFirstLetter(error);
      if (options && options[error]){
        if (options[error].label){
          stringAMostrar = options[error].label;
        }
      }
      mensaje = mensaje + '<li>' + stringAMostrar + ' ' + errores[error].type + '</li>'
    }
    mensaje = mensaje + '</ul>';
    flash['error'] =  mensaje;
  }  
};

/* Inicializacion */ 
asp.inicializar = function($){
  if(history && history.pushState){
    $(document).on('click', 'a', function(){
      if(!$(this).hasClass('dropdown-toggle')){
        $('.dropdown.open .dropdown-toggle').dropdown('toggle');
      }
      if(!$(this).hasClass('active')){
        $('a').removeClass('active');
        $(this).addClass('active');
        var opciones = {}
        opciones.method = $(this).attr('data-method')
        if($(this).attr('data-accion') === 'cerrar-sesion'){
          asp.logout();
          return false;
        } else if($(this).attr('data-remote')){
          asp.navegarA($(this).attr('href'), opciones);
          return false;
        }
      } else {
        return false;
      }
    });
  }
  // Cargue el usuario actual
  $.ajax({
    url: '/api/sesiones',
    success: function(u){
      asp.usuario_actual = u;
    }
  });
  // Ligar eventos a elementos
  $(document).on('click', '.eliminar-elemento', function(){
      if(!confirm("Este cambio no se puede deshacer\n¿Está seguro?")){
          return false;
      }
  });
  $(".chosen-select").chosen();
};

jQuery(document).ready(asp.inicializar);

window.onpopstate = function(e){
  if(e.state && e.state.url){
    asp.navegarA(e.state.url, {operacion: 'pop'});
    $("body").addClass("historypushed");
  } else {
    if ($("body").hasClass("historypushed")){
      document.location.reload(true); 
    }
  }
}