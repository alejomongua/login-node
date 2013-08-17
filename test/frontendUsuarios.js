var usuarios = require("../helpers/db_helper").usuarios,
    http = require('request'),
    Browser = require('zombie'),
    browser,
    url = 'http://localhost',
    currentUser = null,
    admin = null,
    anotherUser = null;

describe('Usuarios', function(){

  before(function(done){
    // Verifique si el servidor está corriendo
    http.get(url, function(e,r,b){
      // Si no está corriendo
      if (r.statusCode !== 200){
        // Ejecútelo
        require('../app.js');
        done();
      } else {
        done();
      }
    });
  });

  beforeEach(function(done){
    browser = new Browser();
    //add some test data    
    usuarios.model.create({
      email:'another@example.com',
      nombres: 'Jaimito',
      apellidos: 'Gomez',
      password: 'foobar',
      documento: '900399908'
    }, function(err, usuario){
      anotherUser = usuario;
      done();
    });
  });

  beforeEach(function(done){
    //add some test data    
    usuarios.model.create({
      email:'alejom.tv@gmail.com',
      nombres: 'Luis Alejandro',
      apellidos: 'Mongua Lopez',
      password: 'foobar',
      documento: '1032369640'
    }, function(err, usuario){
      currentUser = usuario;
      done();
    });
  });

  afterEach(function(done){
    usuarios.model.remove({}, function() {
      // Elimine los usuarios de la base de datos
      done();
    });
  });

  describe('sin permisos', function(){

    this.timeout(5000);
    
    it('should not have access to the usuarios list', function(done){
      browser.visit(url).then(function(){
        browser.fill('sesion[email]', currentUser.email);
        browser.fill('sesion[password]', 'foobar');
      })
      .then(function(){
        return browser.pressButton("Ingresar");
      })
      .then(function(){
        return browser.clickLink(currentUser.nombres)
      })
      .then(function(){
        browser.text('a').should.not.include('Administrar');
        return browser.visit(url + '/usuarios');
      })
      .then(function(){
        browser.location.pathname.should.be.equal('/dashboard');
      })
      .then(done,done);
    });

    it('should be able to see its profile', function(done){
      browser.visit(url).then(function(){
        browser.fill('sesion[email]', currentUser.email);
        browser.fill('sesion[password]', 'foobar');
      })
      .then(function(){
        return browser.pressButton("Ingresar");
      })
      .then(function(){
        return browser.clickLink(currentUser.nombres)
      })
      .then(function(){
        return browser.clickLink('Ver mi perfil');
      })
      .then(function(){
        browser.location.pathname.should.include(currentUser._id);
        browser.html().should.include(currentUser.apellidos);
        browser.html().should.include(currentUser.documento);
        browser.html().should.not.include('Permisos');
      })
      .then(done,done);
    });

    it('should be able to edit its profile', function(done){
      browser.visit(url).then(function(){
        browser.fill('sesion[email]', currentUser.email);
        browser.fill('sesion[password]', 'foobar');
      })
      .then(function(){
        return browser.pressButton("Ingresar");
      })
      .then(function(){
        return browser.clickLink(currentUser.nombres)
      })
      .then(function(){
        return browser.clickLink('Editar mi perfil');
      })
      .then(function(){
        browser.location.pathname.should.include('/edit');
        browser.html().should.include('Apellidos');
        browser.html().should.include('Documento');
        browser.html().should.not.include('Permisos');
        browser.html().should.include('Contraseña');
        browser.html().should.include('input');
        browser.html().should.include('form');
      })
      .then(done,done);
    });

    it('should not be able to see another one\'s profile', function(done){
      browser.visit(url).then(function(){
        browser.fill('sesion[email]', currentUser.email);
        browser.fill('sesion[password]', 'foobar');
      })
      .then(function(){
        return browser.pressButton("Ingresar");
      })
      .then(function(){
        return browser.visit(url + '/usuarios/' + anotherUser._id)
      })
      .then(function(){
        browser.location.pathname.should.be.equal('/dashboard');
      })
      .then(done,done);
    });

    it('should be able to edit another one\'s profile', function(done){
      browser.visit(url).then(function(){
        browser.fill('sesion[email]', currentUser.email);
        browser.fill('sesion[password]', 'foobar');
      })
      .then(function(){
        return browser.pressButton("Ingresar");
      })
      .then(function(){
        return browser.visit(url + '/usuarios/' + anotherUser._id + '/edit')
      })
      .then(function(){
        browser.location.pathname.should.be.equal('/dashboard');
      })
      .then(done,done);
    });
  });

  describe('con permisos', function(){

    this.timeout(5000);


    beforeEach(function(done){
      browser = new Browser();
      //add some test data    
      usuarios.model.create({
        email:'admin@example.com',
        nombres: 'Pepito',
        apellidos: 'Perez',
        password: 'foobar',
        documento: '1023863935',
        permisos: ['usuarios']
      }, function(err, usuario){
        admin = usuario;
        done();
      });
    });

    it('should be able to see its profile', function(done){
      browser.visit(url).then(function(){
        browser.fill('sesion[email]', admin.email);
        browser.fill('sesion[password]', 'foobar');
      })
      .then(function(){
        return browser.pressButton("Ingresar");
      })
      .then(function(){
        return browser.clickLink(admin.nombres)
      })
      .then(function(){
        return browser.clickLink('Ver mi perfil');
      })
      .then(function(){
        browser.location.pathname.should.include(admin._id);
        browser.html().should.include('Apellidos');
        browser.html().should.include('Documento');
        browser.html().should.include('Permisos');
      })
      .then(done,done);
    });

    it('should be able to edit its profile', function(done){
      browser.visit(url).then(function(){
        browser.fill('sesion[email]', admin.email);
        browser.fill('sesion[password]', 'foobar');
      })
      .then(function(){
        return browser.pressButton("Ingresar");
      })
      .then(function(){
        return browser.clickLink(admin.nombres)
      })
      .then(function(){
        return browser.clickLink('Editar mi perfil');
      })
      .then(function(){
        browser.location.pathname.should.include('/edit');
      })
      .then(done,done);
    });

    it('should be able to see another one\'s profile', function(done){
      browser.visit(url).then(function(){
        browser.fill('sesion[email]', admin.email);
        browser.fill('sesion[password]', 'foobar');
      })
      .then(function(){
        return browser.pressButton("Ingresar");
      })
      .then(function(){
        return browser.visit(url + '/usuarios/' + anotherUser._id)
      })
      .then(function(){
        browser.location.pathname.should.include(anotherUser._id);
        browser.html().should.include('Apellidos');
        browser.html().should.include('Documento');
        browser.html().should.include('Permisos');
        browser.html().should.include('Contraseña');
        browser.html().should.include('input');
        browser.html().should.include('form');
      })
      .then(done,done);
    });

    it('should be able to edit another one\'s profile', function(done){
      browser.visit(url).then(function(){
        browser.fill('sesion[email]', admin.email);
        browser.fill('sesion[password]', 'foobar');
      })
      .then(function(){
        return browser.pressButton("Ingresar");
      })
      .then(function(){
        return  browser.visit(url + '/usuarios/' + anotherUser._id + '/edit')
      })
      .then(function(){
        browser.location.pathname.should.include('/edit');
        browser.html().should.include('Apellidos');
        browser.html().should.include('Documento');
        browser.html().should.include('Permisos');
        browser.html().should.include('Contraseña');
        browser.html().should.include('input');
        browser.html().should.include('form');
      })
      .then(done,done);
    });

    describe('paginacion', function(){
      this.timeout(10000);
      // Agregamos varios datos
      for(var i = 0; i < 50; i++){
        beforeEach(function(done){
          //add some test data    
          usuarios.model.create({
            email:'another' + i + '@example.com',
            nombres: 'Prueba ' + i,
            apellidos: 'Prueba',
            password: 'foobar',
            documento: 90039990 + i
          }, function(err, usuario){
            done();
          });
        });
      }

      afterEach(function(done){
        usuarios.model.remove({}, function() {
          // Elimine los usuarios de la base de datos
          done();
        });
      });
            
      it('should have access to the usuarios list', function(done){
        browser.visit(url).then(function(){
          browser.fill('sesion[email]', admin.email);
          browser.fill('sesion[password]', 'foobar');
        })
        .then(function(){
          return browser.pressButton("Ingresar");
        })
        .then(function(){
         return browser.clickLink(admin.nombres)
        })
        .then(function(){
          browser.text('a').should.include('Administrar');
        })
        .then(function(){
          return browser.visit(url + '/usuarios');
        })
        .then(function(){
          browser.location.pathname.should.be.equal('/usuarios');
          browser.text('h1').should.include('Administrar');
          browser.text('body').should.include(currentUser.nombres);
        })
        .then(done,done);
      });

      it('should have pagination', function(done){
        browser.visit(url).then(function(){
          browser.fill('sesion[email]', admin.email);
          browser.fill('sesion[password]', 'foobar');
        })
        .then(function(){
          return browser.pressButton("Ingresar");
        })
        .then(function(){
          return browser.visit(url + '/usuarios');
        })
        .then(function(){
          // 10 usuarios por página
          browser.queryAll(".item-lista-usuario").length.should.be.equal(10);
          // deben existir los enlaces de paginacion
          browser.query('#paginacion').length.should.be.equal(1);
        })
        .then(done,done);
      })
    });
  });

});