// Starts the API and, once the pages have been built, serves them too.
//
// `npm run dev` opens the pages through Vite on port 5173 and forwards
// /api to this process. `npm start` serves the built files in dist/
// from this same port.

const fs = require("fs");
const path = require("path");
const express = require("express");
const routes = require("./routes");

const app = express();
const port = process.env.PORT || 3000;
const distDir = path.join(__dirname, "..", "dist");

// express.json() reads a JSON request body and puts the object on req.body.
app.use(express.json());
app.use("/api", routes);

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}

app.listen(port, () => {
  console.log(`Ciggi Counter API at http://localhost:${port}`);
});
