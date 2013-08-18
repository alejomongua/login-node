var http = require('request'),
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
      password_confirm: 'foobar',
      documento: '1023863935',
      permisos: ['usuarios']
    }, function(err, usuario){
      if(err){
        console.log('Error: ' + err);
        return
      }
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
      password_confirm: 'foobar',
      documento: '1032369640'
    }, function(err, usuario){
      if(err){
        console.log('Error: ' + err);
        return
      }
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

    it('should not update a its permisions', function(done){
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

    it('run validations on update', function(done){
      var cookieJar = http.jar();
      cookieJar.add(http.cookie('remember_token=' + admin.remember_token));
      http.put({
        url: url + '/usuarios/' + currentUser._id,
        jar: cookieJar,
        json: true,
        body: {
          usuario: {
            email: ''
          }
        }
      }, function (err, res, body) {
        if (err) throw("This shouldn't happen");
        res.statusCode.should.not.be.equal(200);
        Object.keys(body).should.include('error');
        done();
      });
    });

    it('run validations on update (email uniqueness)', function(done){
      var cookieJar = http.jar();
      cookieJar.add(http.cookie('remember_token=' + admin.remember_token));
      http.put({
        url: url + '/usuarios/' + currentUser._id,
        jar: cookieJar,
        json: true,
        body: {
          usuario: {
            email: admin.email
          }
        }
      }, function (err, res, body) {
        if (err) throw("This shouldn't happen");
        res.statusCode.should.not.be.equal(200);
        Object.keys(body).should.include('error');
        done();
      });
    });

    it('run validations on update (password)', function(done){
      var cookieJar = http.jar();
      cookieJar.add(http.cookie('remember_token=' + admin.remember_token));
      http.put({
        url: url + '/usuarios/' + currentUser._id,
        jar: cookieJar,
        json: true,
        body: {
          usuario: {
            password: 'holatu',
            password_confirm: 'chaotu'
          }
        }
      }, function (err, res, body) {
        if (err) throw("This shouldn't happen");
        res.statusCode.should.not.be.equal(200);
        Object.keys(body).should.include('error');
        done();
      });
    });

    it('run validations on update (password 2)', function(done){
      var cookieJar = http.jar();
      cookieJar.add(http.cookie('remember_token=' + admin.remember_token));
      http.put({
        url: url + '/usuarios/' + currentUser._id,
        jar: cookieJar,
        json: true,
        body: {
          usuario: {
            password: 'holatu'
          }
        }
      }, function (err, res, body) {
        if (err) throw("This shouldn't happen");
        res.statusCode.should.not.be.equal(200);
        Object.keys(body).should.include('error');
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
            password_confirm: 'foobar',
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
            password_confirm: 'foobar',
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
            password_confirm: 'foobar',
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
            password_confirm: 'foobar',
            documento: currentUser.documento
          }
        }
      }, function (err, res, body) {
        if (err) throw("This shouldn't happen");
        res.statusCode.should.be.not.equal(200);
        done();
      });
    });

    it('run validations', function(done){
      var cookieJar = http.jar();
      cookieJar.add(http.cookie('remember_token=' + admin.remember_token));
      http.post({
        url: url + '/usuarios',
        jar: cookieJar,
        json: true,
        body: {
          usuario: {
            email:'admin@example.com',
            nombres: 'Jaimito',
            apellidos: 'Gomez',
            password: 'foobar',
            password_confirm: 'foobar',
            documento: '12345'
          }
        }
      }, function (err, res, body) {
        if (err) throw("This shouldn't happen");
        res.statusCode.should.not.be.equal(200);
        Object.keys(body).should.include('error');
        done();
      });
    });

    it('run validations (password)', function(done){
      var cookieJar = http.jar();
      cookieJar.add(http.cookie('remember_token=' + admin.remember_token));
      http.post({
        url: url + '/usuarios',
        jar: cookieJar,
        json: true,
        body: {
          usuario: {
            email:'another23@example.com',
            nombres: 'Jaimito',
            apellidos: 'Gomez',
            password: 'foobar',
            password_confirm: 'foovar',
            documento: '123456'
          }
        }
      }, function (err, res, body) {
        if (err) throw("This shouldn't happen");
        res.statusCode.should.not.be.equal(200);
        Object.keys(body).should.include('error');
        done();
      });
    });
    
    it('run validations (no password confirm)', function(done){
      var cookieJar = http.jar();
      cookieJar.add(http.cookie('remember_token=' + admin.remember_token));
      http.post({
        url: url + '/usuarios',
        jar: cookieJar,
        json: true,
        body: {
          usuario: {
            email:'another23@example.com',
            nombres: 'Jaimito',
            apellidos: 'Gomez',
            password: 'foobar',
            documento: '123456'
          }
        }
      }, function (err, res, body) {
        if (err) throw("This shouldn't happen");
        res.statusCode.should.not.be.equal(200);
        Object.keys(body).should.include('error');
        done();
      });
    });

    it('run validations (password too short)', function(done){
      var cookieJar = http.jar();
      cookieJar.add(http.cookie('remember_token=' + admin.remember_token));
      http.post({
        url: url + '/usuarios',
        jar: cookieJar,
        json: true,
        body: {
          usuario: {
            email:'another23@example.com',
            nombres: 'Jaimito',
            apellidos: 'Gomez',
            password: 'toosh',
            password: 'toosh',
            documento: '123456'
          }
        }
      }, function (err, res, body) {
        if (err) throw("This shouldn't happen");
        res.statusCode.should.not.be.equal(200);
        Object.keys(body).should.include('error');
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