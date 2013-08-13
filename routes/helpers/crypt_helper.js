var bcrypt = require('bcrypt');

exports.cryptPassword = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
};

exports.comparePassword = function(password, userPassword, callback) {
   bcrypt.compare(password, userPassword, function(err, isPasswordMatch) {
      if (err) return callback(err);
      else return callback(null, isPasswordMatch);
   });
};

exports.token = function () {
	// genera una cadena aleatoria alfanumerica
	// remplaza los caracteres no alfanumericos con L
	return (new Buffer(Date.now.toString() + Math.random().toString())).toString('base64').replace(/[^A-z0-9]/gi,'L');
}