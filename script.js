// -------------------------------
// Configurações de LocalStorage
// -------------------------------
const LS_KEYS = {
  GASTOS: "chile_gastos_2026",
  META: "chile_meta_total_2026",
  JUNTADO: "chile_valor_juntado_2026"
};

// -------------------------------
// Estado em memória
// -------------------------------
let gastos = [];            // Lista de gastos
let gastoEmEdicaoId = null; // ID do gasto em edição (ou null)

// -------------------------------
// Utilidades
// -------------------------------

// Formata número como moeda BRL
function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

// Lê um número de um input com segurança
function lerNumeroDeInput(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  const raw = (el.value || "").toString().replace(",", ".");
  const num = parseFloat(raw);
  return isNaN(num) ? 0 : num;
}

// -------------------------------
// LocalStorage helpers
// -------------------------------
function carregarDoLocalStorage() {
  const gastosLS = localStorage.getItem(LS_KEYS.GASTOS);
  const metaLS = localStorage.getItem(LS_KEYS.META);
  const juntadoLS = localStorage.getItem(LS_KEYS.JUNTADO);

  gastos = gastosLS ? JSON.parse(gastosLS) : [];

  if (metaLS !== null) {
    document.getElementById("metaTotal").value = parseFloat(metaLS);
  }

  if (juntadoLS !== null) {
    document.getElementById("valorJuntado").value = parseFloat(juntadoLS);
  }
}

function salvarGastosNoLocalStorage() {
  localStorage.setItem(LS_KEYS.GASTOS, JSON.stringify(gastos));
}

function salvarMetaNoLocalStorage() {
  const meta = lerNumeroDeInput("metaTotal");
  localStorage.setItem(LS_KEYS.META, meta);
}

function salvarJuntadoNoLocalStorage() {
  const juntado = lerNumeroDeInput("valorJuntado");
  localStorage.setItem(LS_KEYS.JUNTADO, juntado);
}

// -------------------------------
// Gastos: renderização da tabela
// -------------------------------
function renderizarTabelaGastos() {
  const tbody = document.querySelector("#tabelaGastos tbody");
  tbody.innerHTML = "";

  gastos.forEach((gasto) => {
    const tr = document.createElement("tr");

    const tdDesc = document.createElement("td");
    tdDesc.textContent = gasto.descricao;

    const tdQtd = document.createElement("td");
    tdQtd.classList.add("text-center");
    tdQtd.textContent = gasto.quantidade;

    const tdUnit = document.createElement("td");
    tdUnit.classList.add("text-end");
    tdUnit.textContent = formatarMoeda(gasto.valorUnitario);

    const tdSubtotal = document.createElement("td");
    tdSubtotal.classList.add("text-end");
    tdSubtotal.textContent = formatarMoeda(gasto.subtotal);

    const tdAcoes = document.createElement("td");
    tdAcoes.classList.add("text-center");

    // Botão Editar
    const btnEditar = document.createElement("button");
    btnEditar.className = "btn btn-sm btn-outline-primary me-1";
    btnEditar.textContent = "Editar";
    btnEditar.addEventListener("click", () => iniciarEdicaoGasto(gasto.id));

    // Botão Remover
    const btnRemover = document.createElement("button");
    btnRemover.className = "btn btn-sm btn-outline-danger";
    btnRemover.textContent = "Remover";
    btnRemover.addEventListener("click", () => removerGasto(gasto.id));

    tdAcoes.appendChild(btnEditar);
    tdAcoes.appendChild(btnRemover);

    tr.appendChild(tdDesc);
    tr.appendChild(tdQtd);
    tr.appendChild(tdUnit);
    tr.appendChild(tdSubtotal);
    tr.appendChild(tdAcoes);

    tbody.appendChild(tr);
  });

  atualizarTotalGastos();
}

// -------------------------------
// Gastos: operações CRUD
// -------------------------------
function adicionarOuAtualizarGasto(event) {
  event.preventDefault();

  const descricaoInput = document.getElementById("descricaoGasto");
  const quantidadeInput = document.getElementById("quantidadeGasto");
  const valorUnitarioInput = document.getElementById("valorUnitarioGasto");

  const descricao = descricaoInput.value.trim();
  const quantidade = parseInt(quantidadeInput.value, 10) || 0;
  const valorUnitario = parseFloat(
    (valorUnitarioInput.value || "").toString().replace(",", ".")
  ) || 0;
  const subtotal = quantidade * valorUnitario;

  if (!descricao || quantidade <= 0 || valorUnitario < 0) {
    alert("Preencha a descrição, quantidade (>=1) e valor unitário corretamente.");
    return;
  }

  if (gastoEmEdicaoId) {
    // Atualizar gasto existente
    const index = gastos.findIndex((g) => g.id === gastoEmEdicaoId);
    if (index !== -1) {
      gastos[index].descricao = descricao;
      gastos[index].quantidade = quantidade;
      gastos[index].valorUnitario = valorUnitario;
      gastos[index].subtotal = subtotal;
    }
  } else {
    // Criar novo gasto
    const novoGasto = {
      id: Date.now(), // ID simples baseado em timestamp
      descricao,
      quantidade,
      valorUnitario,
      subtotal
    };
    gastos.push(novoGasto);
  }

  salvarGastosNoLocalStorage();
  renderizarTabelaGastos();
  resetarFormularioGastos();
}

function iniciarEdicaoGasto(id) {
  const gasto = gastos.find((g) => g.id === id);
  if (!gasto) return;

  gastoEmEdicaoId = id;

  // Preenche o formulário com os dados do gasto
  document.getElementById("descricaoGasto").value = gasto.descricao;
  document.getElementById("quantidadeGasto").value = gasto.quantidade;
  document.getElementById("valorUnitarioGasto").value = gasto.valorUnitario;

  atualizarSubtotalPreview();

  // Alterar texto do botão
  document.getElementById("btnSalvarGasto").textContent = "Salvar edição";
  document.getElementById("btnCancelarEdicao").classList.remove("d-none");
}

function resetarFormularioGastos() {
  document.getElementById("gastoForm").reset();
  document.getElementById("quantidadeGasto").value = 1;
  document.getElementById("subtotalPreview").value = "";
  gastoEmEdicaoId = null;
  document.getElementById("btnSalvarGasto").textContent = "Adicionar gasto";
  document.getElementById("btnCancelarEdicao").classList.add("d-none");
}

function removerGasto(id) {
  if (!confirm("Deseja realmente remover este gasto?")) return;

  gastos = gastos.filter((g) => g.id !== id);
  salvarGastosNoLocalStorage();
  renderizarTabelaGastos();
}

// Atualiza o total geral dos gastos
function atualizarTotalGastos() {
  const total = gastos.reduce((soma, g) => soma + g.subtotal, 0);
  document.getElementById("totalGastos").textContent = formatarMoeda(total);
}

// Atualiza o preview de subtotal no formulário de gasto
function atualizarSubtotalPreview() {
  const qtd = parseInt(document.getElementById("quantidadeGasto").value, 10) || 0;
  const valorUnit = parseFloat(
    (document.getElementById("valorUnitarioGasto").value || "")
      .toString()
      .replace(",", ".")
  ) || 0;
  const subtotal = qtd * valorUnit;

  document.getElementById("subtotalPreview").value =
    subtotal > 0 ? formatarMoeda(subtotal) : "";
}

// -------------------------------
// Meta de economia
// -------------------------------
function atualizarResumoMeta() {
  const meta = lerNumeroDeInput("metaTotal");
  const juntado = lerNumeroDeInput("valorJuntado");

  // pega os elementos da seção de meta
  const percentualMetaEl = document.getElementById("percentualMeta");
  const barra = document.getElementById("barraProgresso");
  const mensagemEl = document.getElementById("mensagemMeta");
  const quantoFaltaEl = document.getElementById("quantoFalta");

  // se algum não existir, não quebra o JS
  if (!percentualMetaEl || !barra || !mensagemEl || !quantoFaltaEl) {
    console.warn("Elementos da seção Meta não encontrados no HTML.");
    return;
  }

  const percentual = meta > 0 ? Math.min((juntado / meta) * 100, 999) : 0;
  const percentualFormatado = isNaN(percentual) ? 0 : percentual;

  // Atualiza texto de percentual
  percentualMetaEl.textContent = `${percentualFormatado.toFixed(1)}%`;

  // Atualiza barra de progresso (limite visual até 100)
  const valorBarra = Math.min(percentualFormatado, 100);
  barra.style.width = `${valorBarra}%`;
  barra.setAttribute("aria-valuenow", valorBarra.toFixed(1));

  if (meta <= 0) {
    mensagemEl.textContent =
      "Defina um valor de meta para começar a acompanhar.";
    quantoFaltaEl.textContent =
      "Ainda faltam R$ 0,00 para alcançar a meta!";
    return;
  }

  if (juntado <= 0) {
    mensagemEl.textContent =
      "Ainda não começamos a juntar :(";
  } else if (juntado < meta) {
    mensagemEl.textContent =
      "Começamos!! foguete não tem ré";
  } else if (juntado === meta) {
    mensagemEl.textContent =
      "BATEU A META CARAI!!!!!!!!!!!!!!! VAMOOOOOO";
  } else if (juntado > meta) {
    mensagemEl.textContent =
      "PQP A GENTE SUPEROU A META, SOMOS FODAS";
  }

  const falta = meta - juntado;
  const faltaFormatado = falta > 0 ? falta : 0;

  if (falta > 0) {
    quantoFaltaEl.textContent = `Ainda faltam ${formatarMoeda(
      faltaFormatado
    )} para alcançar a meta.`;
  } else {
    quantoFaltaEl.textContent =
      "Meta alcançada!!!!!!!";
  }
}


// -------------------------------
// Eventos da meta
// -------------------------------
function configurarEventosMeta() {
  const btnMeta = document.getElementById("btnSalvarMeta");
  const btnJuntado = document.getElementById("btnSalvarJuntado");

  btnMeta.addEventListener("click", () => {
    salvarMetaNoLocalStorage();
    atualizarResumoMeta();
  });

  btnJuntado.addEventListener("click", () => {
    salvarJuntadoNoLocalStorage();
    atualizarResumoMeta();
  });
}

// -------------------------------
// Inicialização
// -------------------------------
document.addEventListener("DOMContentLoaded", () => {
  console.log("Chile 2026 – painel carregado ✅");

  // Carrega dados salvos
  carregarDoLocalStorage();

  // Renderiza tabela de gastos e total
  renderizarTabelaGastos();

  // Atualiza resumo da meta
  atualizarResumoMeta();

  // Eventos do formulário de gasto
  const formGasto = document.getElementById("gastoForm");
  formGasto.addEventListener("submit", adicionarOuAtualizarGasto);

  document
    .getElementById("quantidadeGasto")
    .addEventListener("input", atualizarSubtotalPreview);
  document
    .getElementById("valorUnitarioGasto")
    .addEventListener("input", atualizarSubtotalPreview);

  // Botão cancelar edição
  document
    .getElementById("btnCancelarEdicao")
    .addEventListener("click", resetarFormularioGastos);

  // Eventos da meta
  configurarEventosMeta();
});
