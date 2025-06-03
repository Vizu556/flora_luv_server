const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const app = express();

// Настройка CORS
app.use(
	cors({
		origin: ['http://localhost:3000', 'https://your-frontend.onrender.com'], // Обновите после деплоя
		methods: ['GET', 'POST', 'DELETE'],
		credentials: true,
	}),
);
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, path.join(__dirname, 'public/images'));
	},
	filename: (req, file, cb) => {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
		cb(null, uniqueSuffix + '-' + file.originalname);
	},
});
const upload = multer({ storage: storage });

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

// Получение JSON данных
app.get('/data/:file', async (req, res) => {
	try {
		const filePath = path.join(dataDir, req.params.file);
		const data = await fs.readFile(filePath, 'utf8');
		res.json(JSON.parse(data));
	} catch (err) {
		res.status(500).json({ error: 'Ошибка чтения файла' });
	}
});

// Обновление JSON данных
app.post('/data/:file', authMiddleware, async (req, res) => {
	try {
		const filePath = path.join(dataDir, req.params.file);
		await fs.writeFile(filePath, JSON.stringify(req.body, null, 2));
		res.json({ success: true });
	} catch (err) {
		res.status(500).json({ error: 'Ошибка записи файла' });
	}
});

// Загрузка изображений
app.post('/upload', authMiddleware, upload.array('images', 10), (req, res) => {
	try {
		const files = req.files;
		if (!files || files.length === 0) {
			return res.status(400).json({ error: 'Файлы не загружены' });
		}
		const fileNames = files.map(file => file.filename);
		res.json({ success: true, fileNames });
	} catch (err) {
		res.status(500).json({ error: 'Ошибка загрузки файлов' });
	}
});

// Удаление изображения
app.delete('/delete-image/:filename', authMiddleware, async (req, res) => {
	try {
		const filePath = path.join(__dirname, 'public/images', req.params.filename);
		await fs.unlink(filePath);
		res.json({ success: true });
	} catch (err) {
		res.status(500).json({ error: 'Ошибка удаления файла' });
	}
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
