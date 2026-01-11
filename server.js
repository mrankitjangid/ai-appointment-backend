const express = require('express');
const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const appointmentRoutes = require('./routes/appointment.routes');

const app = express();

app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/appointments', appointmentRoutes);

app.use((err, req, res, next) => {
	console.error(err);
	res.status(500).json({ status: 'error', message: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'vercel') {
	module.exports = serverless(app);
} else {
	app.listen(PORT, () => {
		console.log(`Server listening on port ${PORT}`);
	});
}
