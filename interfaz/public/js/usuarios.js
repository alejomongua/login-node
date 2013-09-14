myApplication.oldBackboneSync = Backbone.sync;

Backbone.sync = function( method, model, options ) {
  var beforeSend = options.beforeSend;
  var that = this
  options.beforeSend = function(req) {        
    myApplication.addAuthHeader(req);
    if (beforeSend) {
      beforeSend.call(that, req);
    }
  };
  return myApplication.oldBackboneSync.apply(this, [method, model, options]);
}

myApplication.Usuario = Backbone.Model.extend({
  urlRoot: myApplication.api + '/usuarios',
  idAttribute: "_id"
});

myApplication.Usuarios = Backbone.Collection.extend({
  model: myApplication.Usuario,
  initialize: function() {
    _.bindAll(this, 'parse', 'url', 'pageInfo', 'nextPage', 'previousPage');
    this.pagina = 1;
    typeof(this.por_pagina) !== 'undefined' || (this.por_pagina = 10);
    this.mensaje = null;
    // Trae los datos iniciales de la página
  },
  fetch: function(options) {
    typeof(options) !== 'undefined' || (options = {});
    this.trigger("fetching");
    var self = this;
    var success = options.success;
    options.success = function(resp) {
      self.trigger("fetched");
      if(success) { success.call(self, resp); }
    };
    return Backbone.Collection.prototype.fetch.call(this, options);
  },
  parse: function(resp) {
    this.pagina = resp.pagina;
    this.total = resp.total;
    this.por_pagina = resp.por_pagina;
    this.mensaje = resp.mensaje;
    return resp.usuarios;
  },
  url: function() {
    return myApplication.api + '/usuarios?' + $.param({pagina: this.pagina, por_pagina: this.por_pagina});
  },
  pageInfo: function() {
    var pagina = Number(this.pagina),
        total = Number(this.total),
        por_pagina = Number(this.por_pagina);

    var info = {
      total: total,
      pagina: pagina,
      por_pagina: por_pagina,
      paginas: Math.ceil(total / por_pagina),
      ruta: '/usuarios',
      prev: false,
      next: false
    };
 
    var max = Math.min(total, pagina * por_pagina);
 
    if (total == info.paginas * por_pagina) {
      max = total;
    }
 
    info.range = [(pagina - 1) * por_pagina + 1, max];
 
    if (pagina > 1) {
      info.prev = pagina - 1;
    }
 
    if (pagina < info.paginas) {
      info.next = pagina + 1;
    }
 
    return info;
  },
  nextPage: function() {
    if (!this.pageInfo().next) {
      return false;
    }    
    this.pagina = Number(this.pagina) + 1;
    return this.pagina;
  },
  lastPage: function() {
    var info = this.pageInfo();
    if (!info.next) {
      return false;
    }    
    this.pagina = info.paginas;
    return this.pagina;
  },
  previousPage: function() {
    if (!this.pageInfo().prev) {
      return false;
    }
    this.pagina = Number(this.pagina) - 1;
    return this.pagina;
  },
  firstPage: function() {
    if (!this.pageInfo().prev) {
      return false;
    }
    this.pagina = 1;
    return this.pagina;
  }
});

myApplication.UsuariosView = Backbone.View.extend({
  el: '#main-content',
  initialize: function() {
    _.bindAll(this, 'previous', 'next', 'first', 'last', 'detalles', 'borrar', 'render');
    this.collection.bind('refresh', this.render);
  },
  events: {
    'click a.usuarios-first': 'first',
    'click a.usuarios-prev': 'previous',
    'click a.usuarios-next': 'next',
    'click a.usuarios-last': 'last',
    'click a.usuarios-detalles' : 'detalles',
    'click a.usuarios-borrar': 'borrar'
  },
  render: function() {
    var that = this;
    var elemento = $('#lista-usuarios');
    this.collection.fetch({
      beforeSend: function(req) {
        elemento.html('<div class="text-center"><img src="/images/ajax-loader.gif" title="cargando" alt="cargando" /></div>');
      },
      success: function(data){
        myApplication.renderTemplate('common/_paginacion', $('.paginacion'), that.collection.pageInfo());
        myApplication.flash(data.mensaje);
        if (data.models){
          myApplication.renderTemplate('usuarios/lista', elemento, {usuarios: data.models});
        }
        history.pushState({
          url: '/usuarios?' + $.param({pagina: that.collection.pagina, por_pagina: that.collection.por_pagina}),
          template: 'usuarios/index'
        }, null, '/usuarios?' + $.param({pagina: that.collection.pagina, por_pagina: that.collection.por_pagina}))
      }
    });
  },
 
  first: function() {
    if(this.collection.firstPage()){
      this.render();
    }
    return false;
  },

  previous: function() {
    if(this.collection.previousPage()){
      this.render();
    }
    return false;
  },
 
  next: function() {
    if(this.collection.nextPage()){
      this.render();
    }
    return false;
  },

  last: function() {
    if(this.collection.lastPage()) {
      this.render();
    }
    return false;
  },

  detalles: function(e) {
    // Borra los detalles de los otros usuarios (si hay)
    $('.usuarios-mostrar-detalles').remove();
    // Encuentra el elemento clickeado
    var elemento = $(e.currentTarget);
    // Determina el elemento dentro de la coleccion
    var usuario = this.collection.get(elemento.attr('data-id'));
    // Agrega el div para mostrar los detalles
    elemento.parent().append('<div class="usuarios-mostrar-detalles"></div>');
    // muestra los detalles
    myApplication.renderTemplate('usuarios/show', $('.usuarios-mostrar-detalles'),{usuario: usuario.toJSON()})
    return false;
  },

  borrar: function(e) {
    if(!confirm("Este cambio no se puede deshacer\n¿Está seguro?")){
      return false;
    }
    var that = this;
    // Encuentra el elemento clickeado
    var elemento = $(e.currentTarget);
    // Determina el elemento dentro de la coleccion
    var usuario = this.collection.get(elemento.attr('data-id'));
    // Elimina el elemento
    this.collection.remove(usuario);
    usuario.destroy({      
      success: function(data){
        // Realiza el efecto de eliminacion
        elemento.parent().parent().html('<div class="alert alert-error">Usuario eliminado</div>');
        setTimeout(function(){
          that.render()
        },1000);
      }
    });
    return false;
  }
});

myApplication.usuarios = new myApplication.Usuarios();

myApplication.usuariosView = new myApplication.UsuariosView({
  collection: myApplication.usuarios
});

myApplication.Router = Backbone.Router.extend({
  routes: {
    "usuarios": "index",
    "usuarios?*query" : "index"
  }
});

myApplication.router = new myApplication.Router();

myApplication.router.on('route:index', function() {
  var pagina = myApplication.getQueryVariable('pagina');
  var por_pagina = myApplication.getQueryVariable('por_pagina');
  if (pagina){
    myApplication.usuarios.pagina = pagina;
  }
  if (por_pagina){
    myApplication.usuarios.por_pagina = por_pagina;
  }
  // render user list
  myApplication.usuariosView.render();
})

Backbone.history.start({pushState: true});