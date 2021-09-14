import express from 'express';
import fs from 'fs';

import FileType from 'file-type';
import MimeTypes from 'mime-types';

const server = express();

server.get('/stream', async (req, res) => {
	const file = req.query.file;
	const range = req.headers.range;

	if (typeof file !== 'string') {
		return res.send('No file');
	} else if (!range) {
		return res.send('No range');
	}

	const contentType = await getContentType(file);
	const size = await fs.promises.stat(file).then(stat => stat.size);
	const start = Number(range.replace(/\D/g, ''));
	const end = Math.min(start + 5 * 10 ** 5, size - 1);

	res.writeHead(206, {
		'Content-Range': `bytes ${start}-${end}/${size}`,
		'Accept-Range': 'bytes',
		'Content-Length': end - start + 1,
		'Content-Type': contentType
	});

	const stream = fs.createReadStream(file, { start, end });

	stream.pipe(res);
});

server.get('/video', async (req, res) => {
	const file = req.query.file;

	if (typeof file !== 'string') {
		return res.send('No file');
	}

	const contentType = await getContentType(file);
	const size = await fs.promises.stat(file).then(stat => stat.size);

	res.writeHead(206, {
		'Content-Length': size,
		'Content-Type': contentType
	});

	const stream = fs.createReadStream(file);

	stream.pipe(res);
});

async function getContentType(file: string) {
	const fileType = await FileType.fromFile(file);

	if (fileType) {
		return fileType.mime;
	}

	return MimeTypes.lookup(file) || 'application/octet-stream';
}

server.listen(8000, () => {
	console.log(`Listening on port 8000`);
});
