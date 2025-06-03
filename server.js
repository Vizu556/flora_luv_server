const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const app = express();

// Разрешаем запросы только с вашего фронтенда (позже обновим домен)
app.use(
	cors({
		origin: ['http://localhost:3000', 'https://your-frontend.onrender.com'], // Обновите после деплоя
		methods: ['GET', 'POST'],
		credentials: true,
	}),
);
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'public/images'))); // Для раздачи изображений

const dataDir = path.join(__dirname, 'data');

const authMiddleware = (req, res, next) => {
	const authHeader = req.headers.authorization;
	const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin123';
	if (authHeader === `Bearer ${ADMIN_TOKEN}`) {
		next();
	} else {
		res.status(401).json({ error: 'Неверный токен авторизации' });
	}
};

app.get('/data/:file', async (req, res) => {
	try {
		const filePath = path.join(dataDir, req.params.file);
		const data = await fs.readFile(filePath, 'utf8');
		res.json(JSON.parse(data));
	} catch (err) {
		res.status(500).json({ error: 'Ошибка чтения файла' });
	}
});

app.post('/data/:file', authMiddleware, async (req, res) => {
	try {
		const filePath = path.join(dataDir, req.params.file);
		await fs.writeFile(filePath, JSON.stringify(req.body, null, 2));
		res.json({ success: true });
	} catch (err) {
		res.status(500).json({ error: 'Ошибка записи файла' });
	}
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
