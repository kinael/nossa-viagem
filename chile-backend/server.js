const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Cria/abre o banco SQLite
const dbPath = path.join(__dirname, "chile.db");
const db = new sqlite3.Database(dbPath);

// Cria tabelas se não existirem
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS gastos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao TEXT NOT NULL,
      quantidade INTEGER NOT NULL,
      valorUnitario REAL NOT NULL,
      subtotal REAL NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS meta (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      metaTotal REAL DEFAULT 0,
      valorJuntado REAL DEFAULT 0
    )
  `);

  // Garante uma linha na tabela meta
  db.run(`
    INSERT OR IGNORE INTO meta (id, metaTotal, valorJuntado)
    VALUES (1, 0, 0)
  `);
});

// ---------------------------
//   ROTAS PARA GASTOS
// ---------------------------

// GET /gastos - lista todos os gastos
app.get("/gastos", (req, res) => {
  db.all("SELECT * FROM gastos ORDER BY id ASC", [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro ao buscar gastos" });
    }
    res.json(rows);
  });
});

// POST /gastos - adiciona um gasto
app.post("/gastos", (req, res) => {
  const { descricao, quantidade, valorUnitario, subtotal } = req.body;

  if (!descricao || !quantidade || valorUnitario == null || subtotal == null) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  const sql = `
    INSERT INTO gastos (descricao, quantidade, valorUnitario, subtotal)
    VALUES (?, ?, ?, ?)
  `;
  db.run(sql, [descricao, quantidade, valorUnitario, subtotal], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro ao inserir gasto" });
    }
    res.status(201).json({
      id: this.lastID,
      descricao,
      quantidade,
      valorUnitario,
      subtotal
    });
  });
});

// PUT /gastos/:id - edita um gasto
app.put("/gastos/:id", (req, res) => {
  const id = req.params.id;
  const { descricao, quantidade, valorUnitario, subtotal } = req.body;

  const sql = `
    UPDATE gastos
    SET descricao = ?, quantidade = ?, valorUnitario = ?, subtotal = ?
    WHERE id = ?
  `;
  db.run(
    sql,
    [descricao, quantidade, valorUnitario, subtotal, id],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Erro ao atualizar gasto" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Gasto não encontrado" });
      }
      res.json({ id, descricao, quantidade, valorUnitario, subtotal });
    }
  );
});

// DELETE /gastos/:id - remove um gasto
app.delete("/gastos/:id", (req, res) => {
  const id = req.params.id;

  db.run("DELETE FROM gastos WHERE id = ?", [id], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro ao remover gasto" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Gasto não encontrado" });
    }
    res.status(204).send();
  });
});

// ---------------------------
//   ROTAS PARA META
// ---------------------------

// GET /meta - retorna metaTotal e valorJuntado
app.get("/meta", (req, res) => {
  db.get("SELECT metaTotal, valorJuntado FROM meta WHERE id = 1", [], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro ao buscar meta" });
    }
    if (!row) {
      return res.json({ metaTotal: 0, valorJuntado: 0 });
    }
    res.json(row);
  });
});

// POST /meta - atualiza metaTotal e/ou valorJuntado
app.post("/meta", (req, res) => {
  const { metaTotal, valorJuntado } = req.body;

  const sql = `
    UPDATE meta
    SET metaTotal = ?, valorJuntado = ?
    WHERE id = 1
  `;
  db.run(
    sql,
    [metaTotal ?? 0, valorJuntado ?? 0],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Erro ao atualizar meta" });
      }
      res.json({ metaTotal: metaTotal ?? 0, valorJuntado: valorJuntado ?? 0 });
    }
  );
});

// Inicia servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

//TESTE
