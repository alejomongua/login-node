var capitalizeFirstLetter = function(string)
{
  if (typeof string === 'string'){
    return string.charAt(0).toUpperCase() + string.slice(1);
  } else {
    return '';
  }
}

function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

var formularios = {};
/* 
 * 
 * 
 * 
 */
formularios.campo = function(recurso, nombreDelCampo, tipo, valores, errores, options){
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
  var stringAMostrar = capitalizeFirstLetter(nombreDelCampo);
  var data = '';
  var multiple = '';
  var opciones = '';
  var clase = '';
  var input_class = '';
  var valor, output, seleccionado;

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

  var label = '<label class="control-label text-right" for="' + recurso + '_' + nombreDelCampo + '">' + 
                stringAMostrar + '</label>';
  var input;
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
    case 'checkbox':
      input = '<input id="' + recurso + '_' + nombreDelCampo + '"' +
                    ' class="form-control' + input_class + '"' +
                    ' name="' + recurso + '[' + nombreDelCampo + ']"' +
                    ' size="30" type="checkbox"' + valor + data + '>';
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

  return output;
};

formularios.errores = function(flash, errores, options){
  var mensaje, stringAMostrar;

  if (!isEmpty(errores)){
    mensaje = 'Hay errores en el formulario' +
              '<ul>';
    for(error in errores){
      stringAMostrar = capitalizeFirstLetter(error);
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

module.exports = formularios;