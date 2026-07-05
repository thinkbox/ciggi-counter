const express = require("express");
const path = require("path");
const routes = require("./routes");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use("/api", routes);
app.use(express.static(path.join(__dirname, "..")));

app.listen(port, () => {
  console.log(`Ciggi Counter running at http://localhost:${port}`);
});
