var mongoose = require("mongoose"),
    http = require('request'),
    usuarios,
    url = 'http://localhost';

process.env.NODE_ENV = 'test';

describe("Usuarios", function(){
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
        password_confirm: 'foobar',
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

  it("retrieves by email", function(done){
    usuarios.findByEmail(currentUser.email, function(doc){
      doc.email.should.equal('alejom.tv@gmail.com');
      done();
    });
  });

  it("retrieves by token", function(done){
    usuarios.findByRememberToken(currentUser.remember_token, function(doc){
      doc.email.should.equal('alejom.tv@gmail.com');
      done();
    });
  });

  it("authenticates and returns usuarios with valid login", function(done){
    http.post({'url': url + '/sesiones', json: {sesion:{email: currentUser.email, password: 'foobar'}}}, function(err,res,body){
      body.usuario.email.should.equal(currentUser.email);
      body.usuario.nombres.should.equal(currentUser.nombres);
      body.url.should.equal('/dashboard');
      body.usuario.should.not.have.property('password_digest');
      done();
    });
  });

  it("authenticates and returns fail with invalid login", function(done){
    http.post({'url': url + '/sesiones', json: {sesion:{email: currentUser.email, password: 'failing'}}}, function(err,res,body){
      body.should.not.have.property('usuario');
      body.should.have.property('error');
      done();
    });
  });

  it('authenticates with cookie', function(done){
    var j = http.jar();
    var cookie = http.cookie('remember_token=' + currentUser.remember_token)
    j.add(cookie);
    http({url: url + '/dashboard', jar: j}, function (err, res, body) {
      if (err) throw("This shouldn't happen");
      body.should.not.include('Identifíquese');
      done();
    });
  });
});