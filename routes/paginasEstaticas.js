
/*
 * GET home page.
 */

exports.index = function(req, res){
	if (req.session.usuario) {
		res.redirect('/dashboard');
	} else {
		res.render('paginasEstaticasIndex', { titulo: 'Identifíquese', flash: req.session.messages });
	}
};

exports.olvidePassword = function(req, res){
	if (req.session.usuario) {
		res.redirect('/dashboard');
	} else {
		res.render('paginasEstaticasOlvidePassword', { titulo: 'Recuperar contraseña' });
	}
};

exports.enviarCorreo = function(req, res){
	if (req.session.usuario) {
		res.redirect('/dashboard');
	} else {
		if (typeof req.body.email !== 'undefined') {
			// Enviar correo
			res.render('paginasEstaticasIndex', { titulo: 'Identifíquese', flash: {success: 'Correo enviado a ' + req.body.email} });
		}
	}
};

exports.dashboard = function(req, res){
	if (!req.session.usuario) {
		req.session.messages['error'] = 'No autorizado'
		res.redirect('/');
	} else {
		res.render('paginasEstaticasDashboard', { titulo: 'Dashboard', usuario: req.session.usuario.nombres, flash: req.session.messages });
	}
}
