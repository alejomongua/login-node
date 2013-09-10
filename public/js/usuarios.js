if(typeof myApplication === 'undefined'){
  myApplication = {};
}

var myApplication.Usuario = Backbone.Model.extend({});
var myApplication.usuarios = Backbone.Collection.extend({
  initialize: function() {
    _.bindAll(this, 'parse', 'url', 'pageInfo', 'nextPage', 'previousPage');
    typeof(options) != 'undefined' || (options = {});
    this.page = 1;
    this.perPage = 10;
  },
  fetch: function(options) {w
    typeof(options) != 'undefined' || (options = {});
    this.trigger("fetching");
    var self = this;
    var success = options.success;
    options.success = function(resp) {
      self.trigger("fetched");
      if(success) { success(self, resp); }
    };
    return Backbone.Collection.prototype.fetch.call(this, options);
  },
  parse: function(resp) {
    this.page = resp.page;
    this.total = resp.total;
    return resp.models;
  },
  url: function() {
     return this.baseUrl + '?' + $.param({pagina: this.page});
  },
  pageInfo: function() {
    var info = {
      total: this.total,
      page: this.page,
      perPage: this.perPage,
      pages: Math.ceil(this.total / this.perPage),
      prev: false,
      next: false
    };
 
    var max = Math.min(this.total, this.page * this.perPage);
 
    if (this.total == this.pages * this.perPage) {
      max = this.total;
    }
 
    info.range = [(this.page - 1) * this.perPage + 1, max];
 
    if (this.page > 1) {
      info.prev = this.page - 1;
    }
 
    if (this.page < info.pages) {
      info.next = this.page + 1;
    }
 
    return info;
  },
  nextPage: function() {
    if (!this.pageInfo().next) {
      return false;
    }
    this.page = this.page + 1;
    return this.fetch();
  },
  previousPage: function() {
    if (!this.pageInfo().prev) {
      return false;
    }
    this.page = this.page - 1;
    return this.fetch();
  }
 
});

myApplication.usuariosView = Backbone.View.extend({
  initialize: function() {
    _.bindAll(this, 'previous', 'next', 'render');
    this.collection.bind('refresh', this.render);
  },
  events: {
    'click a.prev': 'previous',
    'click a.next': 'next'
  },
  render: function() {
    this.el.html(app.templates.pagination(this.collection.pageInfo()));
  },
 
  previous: function() {
    this.collection.previousPage();
    return false;
  },
 
  next: function() {
    this.collection.nextPage();
    return false;
  }
});