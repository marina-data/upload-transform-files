const RELATIVE_PATH_TO_PYTHON_SCRIPT = './../python/example.py';
const express = require('express');
const fs = require('fs');
const path = require('path');

const { spawn } = require('child_process');

const app = express();
const port = 3030;

const myLibraryEndpoint = '/api/library';

// Require the upload middleware
const upload = require('./fileUpload');

// Set up a route for file uploads
app.post(`${myLibraryEndpoint}/upload/:checksum`, upload.any(), (req, res) => {
  // Handle the uploaded file
  res.json({
    id: req.params.checksum,
    file_name: req.files[0].originalname,
    size: req.files[0].size,
    status: 'COMPLETE',
  });

  // Fire the python scriptt
  const python = spawn('python', [
    path.join(__dirname, RELATIVE_PATH_TO_PYTHON_SCRIPT),
    req.files[0],
  ]);
  // collect data from script
  python.stdout.on('data', function (data) {
    console.log('Output from python script ...', data.toString());
  });
});

app.get(`${myLibraryEndpoint}/files`, (req, res) => {
  const { searchKeyword, sort, page = 1, size = 10, direction } = req.query;
  const fullPath = process.cwd() + '/uploads';
  const dir = fs.opendirSync(fullPath);
  let entity;
  let allFiles = [];
  while ((entity = dir.readSync()) !== null) {
    if (entity.isFile()) {
      const stats = fs.statSync(fullPath + '/' + entity.name);
      allFiles.push({
        id: stats.uid,
        file_name: entity.name,
        bytes: stats.size,
        created_at: stats.birthtime,
        download_url: `${myLibraryEndpoint}/file/${entity.name}`,
      });
    }
  }
  dir.closeSync();

  const files = allFiles
    .filter(
      (file) =>
        !searchKeyword ||
        file.file_name.toLowerCase().includes(searchKeyword.toLowerCase())
    )
    .sort((fileA, fileB) => {
      if (!sort || !fileA[sort] || !fileB[sort]) return 0;

      if (isNaN(fileA[sort])) {
        return (
          fileA[sort].localeCompare(fileB[sort]) *
          (direction === 'ASC' ? 1 : -1)
        );
      }

      return (fileA[sort] - fileB[sort]) * (direction === 'ASC' ? 1 : -1);
    })
    .slice((page - 1) * size, page * size);
  res.json({
    page: parseInt(page, 10),
    size: parseInt(size, 10),
    total: allFiles.length,
    files: files,
  });
});

app.get(`${myLibraryEndpoint}/file/:id`, function (req, res, next) {
  const fullPath = process.cwd() + '/uploads';
  res.download(`${fullPath}/${req.params.id}`);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
