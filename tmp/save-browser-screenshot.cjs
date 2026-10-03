const http = require("node:http");
const { createWriteStream } = require("node:fs");
const { resolve } = require("node:path");

const output = resolve(__dirname, "employees-added.jpg");
const server = http.createServer((request, response) => {
  if (request.method !== "POST") {
    response.writeHead(405).end();
    return;
  }
  const file = createWriteStream(output);
  request.pipe(file);
  request.on("end", () => {
    file.end(() => {
      response.writeHead(204).end();
      server.close();
    });
  });
});

server.listen(3199, "127.0.0.1");
