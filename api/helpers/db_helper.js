var mongoose = require('mongoose');
var dbHost = 'localhost';
var dbName;

if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
  dbName = 'developmentDB';
} else {
  dbName = 'testDB';
}

console.log(dbName);
console.log(process.env.NODE_ENV);

mongoose.connect(dbHost, dbName);

    var Usuarios = function (){
      var crypt = require('./crypt_helper'),
          _model,
          _update,
          _findByEmail,
          _findById,
          _findByRememberToken,
          _resetRememberToken,
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
          var query = {};
          var id = this._id.toString();
          query[field] = val;
          _model.find(query).exec(function (err, vals) {
            if (err){
              fn(false);
            } else if (vals.length === 0) {
              fn(true);
            } else {
              fn(vals[0]._id.toString() === id);
            }
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
        },
        createdAt: Date,
        lastLogin: Date
      });

      // Validacion de password
      _schema.virtual('password')
      .get(function() {
        return this._password; // Variable temporal
      })
      .set(function(value) {
        this._password = value;
        // Calcule el digest y almacenelo
        this.password_digest = crypt.cryptPassword(value);
      });
      
      // Confirmacion de password
      _schema.virtual('password_confirm')
      .get(function() {
        return this._password_confirm;
      })
      .set(function(value) {
        this._password_confirm = value;
      });
      
      _schema.path('password_digest').validate(function(v) {
        // Si se envia un password
        if (this._password) {
          // Verifique que tenga al menos seis caracteres
          if (this.password.toString().length < 6) {
            this.invalidate('password', 'debe tener por lo menos 6 caracteres.');
          }
        }
        // Verifique que el password coincida con la confirmacion
        if (this._password !== this._password_confirm) {
          this.invalidate('password_confirm', 'no coincide');
        }

      }, null);

      // Genera el avatar desde gravatar
      _schema.virtual('avatar').get(function(){
        var gravatar_id = crypt.md5Hex(this.email);
        return "https://secure.gravatar.com/avatar/" + gravatar_id + '?s=' + s
      });

      // Antes de guardar, genera un token aleatorio
      _schema.pre('save', function (next) {
        if(!this.createdAt){
          this.createdAt = Date.now();
        }
        this.remember_token = crypt.token();
        next();
      });

      _model = mongoose.model('usuarios', _schema);
      
      validadores.unique('email', 'Correo electrónico ya registrado');
      validadores.unique('documento', 'Número de documento ya registrado');

      _findByEmail = function(email, callback) {
        _model.findOne({'email': email}).exec(callback);
      };

      _update = function(id, usuario, callback){
        _findById(id, function(err, doc){
          if(doc){
            for(key in usuario){
              doc[key] = usuario[key];
            }
            doc.save(function(error){
              if(error){
                callback(error,doc);
              } else {
                var usu = doc.toJSON();

                delete usu['password_digest'];
                delete usu['fecha_token'];
                delete usu['token'];
                callback(null,usu);
              }
            });
          } else {
            callback(err);
          }
        });
      };

      _findByRememberToken = function (rt, callback) {
        _model.findOne({'remember_token': rt})
        .select("-password_digest -remember_token -fecha_token -token")
        .exec(function(err, doc) {

          if(err){
            callback(err);
          } else {
            if(doc) {
              var u = doc.toJSON();
              callback(null, u);
            } else {
              callback();
            }
          }
        });
      };

      // Encontrar por ID
      _findById = function (id, callback) {
        _model.findOne({'_id': id}).exec(callback);
      };

      _resetRememberToken = function(id, callback){
        var newRT = crypt.token();
        _model.findOneAndUpdate({'_id': id}, {remember_token: newRT}, function(err, usuario){
          callback(err, usuario.remember_token);
        });
      };

      return {
        model: _model,
        schema: _schema,
        update: _update,
        findById: _findById,
        findByEmail: _findByEmail,
        findByRememberToken: _findByRememberToken,
        resetRememberToken: _resetRememberToken
      };
    }();

exports.usuarios = Usuarios;
