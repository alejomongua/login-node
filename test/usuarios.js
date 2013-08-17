var mongoose = require("mongoose"),
    http = require('request'),
    usuarios,
    url = 'http://localhost';

process.env.NODE_ENV = 'test';

describe("Usuarios", function(){
  var currentUser = null,
      admin = null;

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
      email:'admin@example.com',
      nombres: 'Admin',
      apellidos: 'Mongua Lopez',
      password: 'foobar',
      documento: '1023863935',
      permisos: ['usuarios']
    }, function(err, usuario){
      admin = usuario;
      done();
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

  describe('Update', function (){
    it('updates a user', function(done){
      var cookieJar = http.jar();
      cookieJar.add(http.cookie('remember_token=' + currentUser.remember_token));
      http.put({
        url: url + '/usuarios/' + currentUser._id,
        jar: cookieJar,
        json: true,
        body: {
          usuario: {
            nombres: 'Pepito perez'
          }
        }
      }, function (err, res, body) {
        if (err) throw("This shouldn't happen");
        res.statusCode.should.be.equal(200);
        Object.keys(body).should.include('usuario');
        done();
      });
    });

    it('should not update a user without permisions', function(done){
      var cookieJar = http.jar();
      cookieJar.add(http.cookie('remember_token=' + currentUser.remember_token));
      http.put({
        url: url + '/usuarios/' + currentUser._id,
        jar: cookieJar,
        json: true,
        body: {
          usuario: {
            permisos: ['usuarios']
          }
        }
      }, function (err, res, body) {
        if (err) throw("This shouldn't happen");
        res.statusCode.should.not.be.equal(200);
        Object.keys(body).should.include('error');
        done();
      });
    });

    it('should not update another user without permisions', function(done){
      var cookieJar = http.jar();
      cookieJar.add(http.cookie('remember_token=' + currentUser.remember_token));
      http.put({
        url: url + '/usuarios/' + admin._id,
        jar: cookieJar,
        json: true,
        body: {
          usuario: {
            nombres: 'Pepito perez'
          }
        }
      }, function (err, res, body) {
        if (err) throw("This shouldn't happen");
        res.statusCode.should.not.be.equal(200);
        Object.keys(body).should.include('error');
        done();
      });
    });


    it('updates another user', function(done){
      var cookieJar = http.jar();
      cookieJar.add(http.cookie('remember_token=' + admin.remember_token));
      http.put({
        url: url + '/usuarios/' + currentUser._id,
        jar: cookieJar,
        json: true,
        body: {
          usuario: {
            nombres: 'Pepito perez'
          }
        }
      }, function (err, res, body) {
        if (err) throw("This shouldn't happen");
        res.statusCode.should.be.equal(200);
        Object.keys(body).should.include('usuario');
        done();
      });
    });

    it('updates another user\'s permisions', function(done){
      var cookieJar = http.jar();
      cookieJar.add(http.cookie('remember_token=' + admin.remember_token));
      http.put({
        url: url + '/usuarios/' + currentUser._id,
        jar: cookieJar,
        json: true,
        body: {
          usuario: {
            permisos: ['usuarios']
          }
        }
      }, function (err, res, body) {
        if (err) throw("This shouldn't happen");
        res.statusCode.should.be.equal(200);
        Object.keys(body).should.include('usuario');
        done();
      });
    });

  });
  
  describe('Create', function (){


    it('should not create a user without permisions', function(done){
      var cookieJar = http.jar();
      cookieJar.add(http.cookie('remember_token=' + currentUser.remember_token));
      http.post({
        url: url + '/usuarios',
        jar: cookieJar,
        json: true,
        body: {
          usuario: {
            email:'another@example.com',
            nombres: 'Jaimito',
            apellidos: 'Gomez',
            password: 'foobar',
            documento: '900399908'
          }
        }
      }, function (err, res, body) {
        if (err) throw("This shouldn't happen");
        res.statusCode.should.not.be.equal(200);
        Object.keys(body).should.include('error');
        done();
      });
    });

    it('creates user', function(done){
      var cookieJar = http.jar();
      cookieJar.add(http.cookie('remember_token=' + admin.remember_token));
      http.post({
        url: url + '/usuarios',
        jar: cookieJar,
        json: true,
        body: {
          usuario: {
            email:'another@example.com',
            nombres: 'Jaimito',
            apellidos: 'Gomez',
            password: 'foobar',
            documento: '900399908'
          }
        }
      }, function (err, res, body) {
        if (err) throw("This shouldn't happen");
        res.statusCode.should.be.equal(200);
        Object.keys(body).should.include('usuario');
        done();
      });
    });

    it('should not create a user with an used email', function(done){
      var cookieJar = http.jar();
      cookieJar.add(http.cookie('remember_token=' + admin.remember_token));
      http.post({
        url: url + '/usuarios',
        jar: cookieJar,
        json: true,
        body: {
          usuario: {
            email: currentUser.email,
            nombres: 'Jaimito',
            apellidos: 'Gomez',
            password: 'foobar',
            documento: '900399908'
          }
        }
      }, function (err, res, body) {
        if (err) throw("This shouldn't happen");
        res.statusCode.should.not.be.equal(200);
        Object.keys(body).should.include('error');
        done();
      });
    });

    it('should not create a user with an used document', function(done){
      var cookieJar = http.jar();
      cookieJar.add(http.cookie('remember_token=' + admin.remember_token));
      http.post({
        url: url + '/usuarios',
        jar: cookieJar,
        json: true,
        body: {
          usuario: {
            email:'another@example.com',
            nombres: 'Jaimito',
            apellidos: 'Gomez',
            password: 'foobar',
            documento: currentUser.documento
          }
        }
      }, function (err, res, body) {
        if (err) throw("This shouldn't happen");
        res.statusCode.should.be.not.equal(200);
        done();
      });
    });
  });

  describe('Delete', function (){


    it('should not delete a user without permisions', function(done){
      var cookieJar = http.jar();
      cookieJar.add(http.cookie('remember_token=' + currentUser.remember_token));
      http.del({
        url: url + '/usuarios/' + admin._id,
        jar: cookieJar,
        json: true,
        body: {}
      }, function (err, res, body) {
        if (err) throw("This shouldn't happen");
        res.statusCode.should.not.be.equal(200);
        Object.keys(body).should.include('error');
        done();
      });
    });

    it('deletes a user', function(done){
      var cookieJar = http.jar();
      cookieJar.add(http.cookie('remember_token=' + admin.remember_token));
      http.del({
        url: url + '/usuarios/' + currentUser._id,
        jar: cookieJar,
        json: true,
        body: {}
      }, function (err, res, body) {
        if (err) throw("This shouldn't happen");
        res.statusCode.should.be.equal(200);
        Object.keys(body).should.include('usuario');
        done();
      });
    });

    it('should not delete itself', function(done){
      var cookieJar = http.jar();
      cookieJar.add(http.cookie('remember_token=' + admin.remember_token));
      http.del({
        url: url + '/usuarios/' + admin._id,
        jar: cookieJar,
        json: true,
        body: {}
      }, function (err, res, body) {
        if (err) throw("This shouldn't happen");
        res.statusCode.should.be.not.equal(200);
        done();
      });
    });
  });
});