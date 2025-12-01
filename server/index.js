import path from "path";
import { fileURLToPath } from "url";
import express from "express";

const listenPort = process.env.PORT || 3000;

const app = express();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.static(path.resolve(__dirname, "../build"), { index: false }));

app.route("*").all((req, res) => {
  res.sendFile(path.join(__dirname, "../build", "index.html"));
});

app.listen(listenPort, () => console.log(`Listning at: ${listenPort}.`));
