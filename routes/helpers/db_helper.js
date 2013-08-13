var mongoose = require('mongoose');
var dbHost = 'localhost';
var dbName;

if (typeof process.env.NODE_ENV === 'undefined' || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
	dbName = 'cloudSiiT';
} else if (typeof process.env.NODE_ENV === 'undefined' || process.env.NODE_ENV === 'test') {
    dbName = 'cloudSiiTTest';
}

mongoose.connect(dbHost, dbName);

var Usuarios = function (){
	var crypt = require('./crypt_helper');

	var _schema = new mongoose.Schema({
		nombres: String,
		apellidos: String,
		email: {type : String, index: { unique: true, required : true } },
		password_digest: String,
		remember_token: String,
		token: String,
		fecha_token: Date,
		permisos: [String],
		tipo_id: String,
		documento: {type : String, index: { unique: true, required : true } }
	});
	_schema.virtual('password').set(function(pw){
		this.password_digest = crypt.cryptPassword(pw);
	});

	_schema.pre('save', function (next) {
	  this.remember_token = crypt.token();
	  next();
	});
	var _model = mongoose.model('usuarios', _schema);
	var _findByEmail = function(email, success, fail) {
	_model.findOne({'email': email}).exec(function(err, doc) {
	  if(err){
	    fail(err);
	  } else {
	    success(doc);
	  }
	});
	};

	var _findByRememberToken = function (rt, success, fail) {
	_model.findOne({'remember_token': rt}).exec(function(err, doc) {
	  if(err){
	    fail(err);
	  } else {
	    success(doc);
	  }
	});
	};
	
	return {
		model: _model,
		schema: _schema,
		findByEmail: _findByEmail,
		findByRememberToken: _findByRememberToken
	};
}();

exports.usuarios = Usuarios;
