/*
 * Ember Chat – live server
 * Express serves the page, Socket.IO delivers letters in real time,
 * MySQL keeps the history. Without DB settings it falls back to memory.
 */
require("dotenv").config();

const path = require("path");
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const mysql = require("mysql2/promise");

const PORT = Number(process.env.PORT) || 3000;
const MAX_NAME = 40;
const MAX_BODY = 500;
const HISTORY_LIMIT = 50;

/* ---------- Storage ---------- */

function createMemoryStore() {
  const rows = [];
  let nextId = 1;
  return {
    kind: "memory",
    async recent(limit) {
      return rows.slice(-limit);
    },
    async add(author, body) {
      const row = { id: nextId++, author, body, createdAt: new Date().toISOString() };
      rows.push(row);
      if (rows.length > 500) rows.shift();
      return row;
    },
  };
}

async function createMysqlStore() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 5,
  });

  await pool.query(
    `CREATE TABLE IF NOT EXISTS messages (
       id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
       author     VARCHAR(40)  NOT NULL,
       body       VARCHAR(500) NOT NULL,
       created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
       PRIMARY KEY (id),
       KEY idx_created_at (created_at)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );

  const toMessage = (row) => ({
    id: row.id,
    author: row.author,
    body: row.body,
    createdAt: new Date(row.created_at).toISOString(),
  });

  return {
    kind: "mysql",
    async recent(limit) {
      // Placeholders (?) keep user input out of the SQL text.
      const [rows] = await pool.query(
        "SELECT id, author, body, created_at FROM messages ORDER BY id DESC LIMIT ?",
        [limit]
      );
      return rows.reverse().map(toMessage);
    },
    async add(author, body) {
      const [result] = await pool.execute(
        "INSERT INTO messages (author, body) VALUES (?, ?)",
        [author, body]
      );
      const [rows] = await pool.execute(
        "SELECT id, author, body, created_at FROM messages WHERE id = ?",
        [result.insertId]
      );
      return toMessage(rows[0]);
    },
  };
}

async function createStore() {
  if (!process.env.DB_HOST) {
    console.log("No DB_HOST set – keeping messages in memory.");
    return createMemoryStore();
  }
  try {
    const store = await createMysqlStore();
    console.log(`Connected to MySQL database "${process.env.DB_DATABASE}".`);
    return store;
  } catch (error) {
    console.warn(`MySQL unavailable (${error.code || error.message}) – using memory instead.`);
    return createMemoryStore();
  }
}

/* ---------- Validation ---------- */

function clean(value, max) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

/* ---------- App ---------- */

async function start() {
  const store = await createStore();
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server);

  app.disable("x-powered-by");

  // The browser asks for this file to learn which mode it is in.
  app.get("/js/runtime-config.js", (req, res) => {
    res.type("application/javascript").send(
      `window.EMBER_CONFIG = ${JSON.stringify({ mode: "live", storage: store.kind })};`
    );
  });

  // Only public folders are served – never server.js, .env or package files.
  for (const dir of ["css", "js", "images", "docs"]) {
    app.use(`/${dir}`, express.static(path.join(__dirname, dir)));
  }
  app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

  app.get("/api/messages", async (req, res) => {
    try {
      res.json(await store.recent(HISTORY_LIMIT));
    } catch (error) {
      console.error("Could not load messages:", error);
      res.status(500).json({ error: "Could not load messages." });
    }
  });

  const broadcastPresence = () => io.emit("presence", io.engine.clientsCount);

  io.on("connection", (socket) => {
    broadcastPresence();

    socket.on("message:send", async (payload, ack) => {
      const reply = typeof ack === "function" ? ack : () => {};
      const author = clean(payload && payload.author, MAX_NAME);
      const body = clean(payload && payload.body, MAX_BODY);

      if (!author || !body) {
        reply({ ok: false, error: "Name and message are required." });
        return;
      }

      try {
        const message = await store.add(author, body);
        io.emit("message:new", message);
        reply({ ok: true, id: message.id });
      } catch (error) {
        console.error("Could not save message:", error);
        reply({ ok: false, error: "Could not save the message." });
      }
    });

    socket.on("disconnect", broadcastPresence);
  });

  server.listen(PORT, () => {
    console.log(`Ember Chat is running at http://localhost:${PORT}`);
  });
}

start();
