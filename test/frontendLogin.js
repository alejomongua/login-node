var usuarios = require("../helpers/db_helper").usuarios,
    http = require('request'),
    Browser = require('zombie'),
    browser,
    url = 'http://localhost',
    currentUser = null,
    admin = null,
    anotherUser = null;

describe("Login", function(){

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
    browser = new Browser()

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

  it('should not login with correct username and password', function(done){
    browser.visit(url).then(function(){
      browser.fill('sesion[email]', 'alejom.tv@gmail.com');
      browser.fill('sesion[password]', 'another');
    })
    .then(function(){
      return browser.pressButton("Ingresar");
    })
    .then(function(){
      browser.location.pathname.should.not.be.equal('/dashboard');
    })
    .then(done,done);
  }) ;
  
  it('should login with correct username and password', function(done){
    this.timeout(10000);
    browser.visit(url).then(function(){
      browser.fill('sesion[email]', 'alejom.tv@gmail.com');
      browser.fill('sesion[password]', 'foobar');
    })
    .then(function(){
      return browser.pressButton("Ingresar");
    })
    .then(function(){
      browser.location.pathname.should.be.equal('/dashboard');
      browser.text('.navbar').should.include('Luis Alejandro');
    })
    .then(function(){
      return browser.clickLink('Luis Alejandro');
    })
    .then(function(){
      return browser.clickLink('Cerrar sesión');
    })
    .then(function(){
      browser.location.pathname.should.be.equal('/');
      browser.text('h1').should.include('Identifíquese');
    })
    .then(done,done);
  }) ;

  describe.skip('Recuperar contraseña', function(){
    this.timeout(5000);
    it('should return an error in flash with an incorrect email', function(done){
      browser.visit(url + '/olvide_password').then(function(){
        browser.fill('email', 'no_existe@gmail.com');
      })
      .then(function(){
        return browser.pressButton("Enviar correo electrónico");
      })
      .then(function(){
        browser.location.pathname.should.be.equal('/');
        browser.text('#flash').should.include('No se encontró');
      })
      .then(done,done);
    });

    it.skip('should return a message in flash with a correct email', function(done){
      browser.visit(url + '/olvide_password').then(function(){
        browser.fill('email', 'alejom.tv@gmail.com');
      })
      .then(function(){
        return browser.pressButton("Enviar correo electrónico");
      })
      .then(function(){
        browser.location.pathname.should.be.equal('/');
        browser.text('#flash').should.include('Correo enviado a');
      })
      .then(done,done);
    });
  });
});
