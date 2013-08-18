var mongoose = require("mongoose"),
    http = require('request'),
    Browser = require('zombie'),
    browser = new (Browser),
    usuarios,
    url = 'http://localhost';

process.env.NODE_ENV = 'test';

describe("Frontend", function(){
  var currentUser = null;

  before(function(done){
    http.get(url, function(e,r,b){
      if (r.statusCode !== 200){
        require('../app.js');     
        done();
      } else {
        done();
      }
    });
  });

  beforeEach(function(done){
      usuarios = require("../helpers/db_helper").usuarios;
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
      done();
    });
  });

  describe('Login', function(){
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
      browser.visit(url).then(function(){
        browser.fill('sesion[email]', 'alejom.tv@gmail.com');
        browser.fill('sesion[password]', 'foobar');
      })
      .then(function(){
        return browser.pressButton("Ingresar");
      })
      .then(function(){
        browser.location.pathname.should.be.equal('/dashboard');
      })
      .then(done,done);
    }) ;
  });
});