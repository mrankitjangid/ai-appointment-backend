const express = require('express');
const appointmentRoutes = require('./routes/appointment.routes');

const app = express();

const jsonParser = express.json({ limit: '5mb' });
const urlencParser = express.urlencoded({ extended: true });

// Skip JSON/urlencoded parsing for multipart requests (multer will handle those)
const isMultipart = (ct) => {
	if (!ct || typeof ct !== 'string') return false;
	return /multipart\/(form-data|mixed)/i.test(ct);
};

app.use((req, res, next) => {
	const ct = req.headers['content-type'];
	if (isMultipart(ct)) return next();
	return jsonParser(req, res, next);
});
app.use((req, res, next) => {
	const ct = req.headers['content-type'];
	if (isMultipart(ct)) return next();
	return urlencParser(req, res, next);
});

app.use('/api/appointments', appointmentRoutes);

app.use((err, req, res, next) => {
	console.error(err);
	res.status(500).json({ status: 'error', message: 'Internal server error' });
});

// If run directly (node server.js), start the server. Otherwise export the app for wrappers.
if (require.main === module) {
	const PORT = process.env.PORT || 3000;
	app.listen(PORT, () => {
		console.log(`Server listening on port ${PORT}`);
	});
}

module.exports = app;
