const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const HOST = "192.168.130.69";
const PORT = 3002;

// Configuration de stockage pour les fichiers
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname)); // Nom unique
//   }
// });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uploadPath = path.join("uploads", file.originalname);

    // Vérifie si un fichier du même nom existe
    if (fs.existsSync(uploadPath)) {
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext);
      const uniqueName = `${baseName}-${Date.now()}${ext}`;
      cb(null, uniqueName);
    } else {
      cb(null, file.originalname);
    }
  },
});

const upload = multer({ storage });

app.use(express.static("uploads"));

app.post("/upload-multiple", upload.array("files", 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send("Aucun fichier sélectionné.");
  }
  res.redirect("/");
});

// Page d'accueil
app.get("/", (req, res) => {
  const fileList = fs
    .readdirSync("./uploads")
    .map(
      (file) =>
        `<li class="file-item"><a href="/download/${file}" class="file-link">${file}</a></li>`
    )
    .join("");
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Transfert de Fichiers</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f9f9f9;
          color: #333;
          padding: 20px;
        }
        h2 {
          color: #007bff;
        }
        form {
          margin-bottom: 20px;
        }
        input[type="file"] {
          margin-right: 10px;
        }
        button {
          background-color: #007bff;
          color: white;
          border: none;
          padding: 8px 15px;
          cursor: pointer;
          border-radius: 5px;
        }
        button:hover {
          background-color: #0056b3;
        }
        #progressBar {
          display: none;
          width: 100%;
          margin-top: 10px;
        }
        ul {
          list-style-type: none;
          padding: 0;
        }
        .file-item {
          background: #fff;
          margin: 5px 0;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        .file-link {
          text-decoration: none;
          color: #007bff;
        }
        .file-link:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
        <div class="form-container">
          <div>
            <h2>Transfert de Fichiers</h2>
            <form id="uploadForm">
              <input type="file" name="file" required />
              <button type="submit">Transférer</button>
              <progress id="progressBar" value="0" max="100"></progress>
            </form>
          </div>

          <div>
            <h2>Transfert de plusieurs fichiers</h2>
            <form id="multiUploadForm">
              <input type="file" name="files" multiple required />
              <button type="submit">Transférer plusieurs fichiers</button>
              <progress id="multiProgressBar" value="0" max="100"></progress>
            </form>
          </div>
        </div>

      <h3><u>Fichiers disponibles</u> :</h3>
      <ul>
        ${fileList}
      </ul>
      <script>
        document.getElementById('uploadForm').addEventListener('submit', function (event) {
          event.preventDefault();

          const fileInput = document.querySelector('input[type="file"]');
          const file = fileInput.files[0];
          if (!file) return alert('Veuillez sélectionner un fichier.');

          const progressBar = document.getElementById('progressBar');
          progressBar.style.display = 'block';

          const formData = new FormData();
          formData.append('file', file);

          const xhr = new XMLHttpRequest();

          xhr.open('POST', '/upload', true);

          // Suivre la progression de l'upload
          xhr.upload.onprogress = function (event) {
            if (event.lengthComputable) {
              const percentComplete = (event.loaded / event.total) * 100;
              progressBar.value = percentComplete;
            }
          };

          xhr.onload = function () {
            if (xhr.status === 200) {
              alert('Fichier transféré avec succès.');
              progressBar.style.display = 'none';
              window.location.reload();
            } else {
              alert('Erreur lors du transfert.');
            }
          };

          xhr.send(formData);
        });

  document.getElementById('multiUploadForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const fileInput = document.querySelector('input[name="files"]');
    if (!fileInput.files.length) return alert('Veuillez sélectionner des fichiers.');

    const progressBar = document.getElementById('multiProgressBar');
    progressBar.style.display = 'block'; // Affiche la barre uniquement au clic

    const formData = new FormData();
    for (const file of fileInput.files) {
      formData.append('files', file);
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/upload-multiple', true);

    xhr.upload.onprogress = function (event) {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        progressBar.value = percentComplete;
      }
    };

    xhr.onload = function () {
      if (xhr.status === 200) {
        alert('Fichiers transférés avec succès.');
        progressBar.style.display = 'none'; // Cache la barre après succès
        window.location.reload();
      } else {
        alert('Erreur lors du transfert.');
        progressBar.style.display = 'none'; // Cache aussi en cas d'erreur
      }
    };

    xhr.send(formData);
  });
      </script>
    </body>
    </html>
    <style>
        #multiProgressBar {
          display: none;
          width: 100%;
          margin-top: 10px;
        }

        .form-container {
          display: flex;
          gap: 20px; /* Espacement entre les formulaires */
        }

        .form-container form {
          display: flex;
          flex-direction: column;
          gap: 10px; /* Espacement entre les éléments du formulaire */
          background: #fff;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);
        }
    </style>
  `);
});

// Upload de fichier
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("Aucun fichier sélectionné.");
  }
  res.redirect("/");
});

// Téléchargement direct vers le navigateur du client
app.get("/download/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "uploads", filename);

  // Envoi du fichier pour téléchargement côté client
  res.download(filePath, filename, (err) => {
    if (err) {
      console.error("Erreur lors du téléchargement :", err);
      res.status(500).send("Erreur de téléchargement.");
    }
  });
});

app.listen(PORT, HOST, () => {
  console.log(`Serveur lancé sur http://${HOST}:${PORT}`);
});
