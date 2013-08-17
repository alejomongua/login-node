var mongoose = require('mongoose');
var crypto = require('crypto');
var dbHost = 'localhost';
var dbName;

if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
  dbName = 'cloudSiiT';
} else {
  dbName = 'cloudSiiTTest';
}

console.log(dbName);
console.log(process.env.NODE_ENV);

mongoose.connect(dbHost, dbName);

    var Usuarios = function (){
      var crypt = require('./crypt_helper'),
          _model,
          _findByEmail,
          _findById,
          _findByRememberToken,
          _schema,
          validadores = {};

      validadores.notBlank = function(val){
        return !(/^\s*$/.test(val));
      }

      validadores.email = function(val){
        return /^[\w+\-.]+@[a-z\d\-.]+\.[a-z]+$/i.test(val);
      }

      validadores.unique = function(field, message){
        _schema.path(field).validate(function(val, fn){
          var query = {}
          query[field] = val;
          _model.find(query).exec(function (err, vals) {
            fn(err || vals.length === 0);
          });
        }, message);
      };

      var _schema = new mongoose.Schema({
        nombres: {
          type : String,
          validate: [validadores.notBlank, 'no debe estar en blanco']
        },
        apellidos: {
          type : String,
          validate: [validadores.notBlank, 'no debe estar en blanco']
        },
        email: {
          type : String,
          index: {
            unique: true,
            required : true
          },
          //required: true,
          lowercase: true, trim: true,
          validate: [validadores.email, 'no es un correo electrónico válido']
        },
        password_digest: {
          type : String,
          required: true,
          validate: [validadores.notBlank, 'no debe estar en blanco']
        },
        remember_token: String,
        token: String,
        fecha_token: Date,
        permisos: [String],
        tipo_id: String,
        documento: {
          type : String,
        //  required: true,
          validate: [validadores.notBlank, 'no debe estar en blanco']
        }
      });

      _schema.virtual('password')
      .get(function() {
        return this._password;
      })
      .set(function(value) {
        this._password = value;
        this.password_digest = crypt.cryptPassword(value);
      });
       
      _schema.virtual('password_confirm')
      .get(function() {
        return this._password_confirm;
      })
      .set(function(value) {
        this._password_confirm = value;
      });
       
      _schema.path('password_digest').validate(function(v) {
        if (this._password) {
          if (this.password.toString().length < 6) {
            this.invalidate('password', 'debe tener por lo menos 6 caracteres.');
          }
        }
        if (this._password_confirm){
          if (this._password !== this._password_confirm) {
            this.invalidate('password_confirm', 'no coincide');
          }
        }

      }, null);

      _schema.virtual('avatar').get(function(){
        var gravatar_id = crypto.createHash('md5').update(this.email).digest('hex');
        return "https://secure.gravatar.com/avatar/" + gravatar_id + '?s=' + s
      });

      _schema.pre('save', function (next) {
        this.remember_token = crypt.token();
        next();
      });
      _model = mongoose.model('usuarios', _schema);
      
      validadores.unique('email', 'Correo electrónico ya registrado');
      validadores.unique('documento', 'Número de documento ya registrado');

      _findByEmail = function(email, success, fail) {
        _model.findOne({'email': email}).exec(function(err, doc) {
          if(err){
            fail(err);
          } else {
            success(doc);
          }
        });
      };

      _findByRememberToken = function (rt, success, fail) {
        _model.findOne({'remember_token': rt}).exec(function(err, doc) {
          if(err){
            fail(err);
          } else {
            if(doc) {
              var u = doc.toJSON();

              delete u['password_digest'];
              delete u['remember_token'];
              delete u['fecha_token'];
              delete u['token'];

              success(u);
            } else {
              success();
            }
          }
        });
      };

      // Encontrar por ID
      _findById = function (id, success, fail) {
        _model.findOne({'_id': id}).exec(function(err, doc) {
          if(err){
            fail(err);
          } else {
            if (doc){
              var u = doc.toJSON();

              delete u['password_digest'];
              delete u['remember_token'];
              delete u['fecha_token'];
              delete u['token'];

              success(u);
            } else {
              success();
            }
          }
        });
      };

      return {
        model: _model,
        schema: _schema,
        findById: _findById,
        findByEmail: _findByEmail,
        findByRememberToken: _findByRememberToken
      };
    }();

exports.usuarios = Usuarios;
