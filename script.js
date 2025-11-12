// ==============================================
// Utilidades de formatação
// ==============================================

// Formata número em moeda brasileira
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

// Formata número em percentual com 1 casa
function formatarPercentual(valor) {
    return valor.toLocaleString('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1
    }) + '%';
}

// ==============================================
// Estado e chaves do localStorage
// ==============================================

const LS_GASTOS_KEY = 'chileTripGastos';
const LS_META_KEY = 'chileTripMeta';
const LS_VALOR_JUNTADO_KEY = 'chileTripValorJuntado';

let gastos = [];        // Lista de gastos
let metaTotal = 0;      // Meta de economia
let valorJuntado = 0;   // Valor já economizado

// Modal de edição (Bootstrap)
let modalEditarGasto = null;

// ==============================================
// Inicialização
// ==============================================

document.addEventListener('DOMContentLoaded', () => {
    // Carrega dados do localStorage
    carregarGastosDoLocalStorage();
    carregarMetaDoLocalStorage();
    carregarValorJuntadoDoLocalStorage();

    // Inicializa modal de edição
    const modalEl = document.getElementById('modalEditarGasto');
    if (modalEl) {
        modalEditarGasto = new bootstrap.Modal(modalEl);
    }

    // Liga eventos do formulário de novo gasto
    inicializarFormularioGasto();

    // Liga eventos da meta e valor juntado
    inicializarMetaEconomia();

    // Renderiza tudo com os dados carregados
    renderizarTabelaGastos();
    atualizarResumoGastos();
    atualizarResumoMeta();
});

// ==============================================
// LocalStorage - carregar e salvar
// ==============================================

function carregarGastosDoLocalStorage() {
    try {
        const dados = localStorage.getItem(LS_GASTOS_KEY);
        gastos = dados ? JSON.parse(dados) : [];
    } catch (e) {
        console.error('Erro ao ler gastos do localStorage:', e);
        gastos = [];
    }
}

function salvarGastosNoLocalStorage() {
    localStorage.setItem(LS_GASTOS_KEY, JSON.stringify(gastos));
}

function carregarMetaDoLocalStorage() {
    const valor = localStorage.getItem(LS_META_KEY);
    metaTotal = valor ? parseFloat(valor) : 0;

    const inputMeta = document.getElementById('metaTotal');
    if (inputMeta) {
        inputMeta.value = metaTotal ? metaTotal : '';
    }
}

function salvarMetaNoLocalStorage() {
    localStorage.setItem(LS_META_KEY, metaTotal.toString());
}

function carregarValorJuntadoDoLocalStorage() {
    const valor = localStorage.getItem(LS_VALOR_JUNTADO_KEY);
    valorJuntado = valor ? parseFloat(valor) : 0;

    const inputJuntado = document.getElementById('valorJuntado');
    if (inputJuntado) {
        inputJuntado.value = valorJuntado ? valorJuntado : '';
    }
}

function salvarValorJuntadoNoLocalStorage() {
    localStorage.setItem(LS_VALOR_JUNTADO_KEY, valorJuntado.toString());
}

// ==============================================
// Formulário de novo gasto
// ==============================================

function inicializarFormularioGasto() {
    const form = document.getElementById('gastoForm');
    const inputDescricao = document.getElementById('descricaoGasto');
    const inputQtd = document.getElementById('quantidadeGasto');
    const inputValorUnitario = document.getElementById('valorUnitarioGasto');
    const inputSubtotal = document.getElementById('subtotalGasto');

    // Calcula subtotal conforme usuário digita
    const calcularSubtotalFormulario = () => {
        const qtd = parseInt(inputQtd.value) || 0;
        const valorUnitario = parseFloat(inputValorUnitario.value) || 0;
        const subtotal = qtd * valorUnitario;
        inputSubtotal.value = formatarMoeda(isFinite(subtotal) ? subtotal : 0);
    };

    inputQtd.addEventListener('input', calcularSubtotalFormulario);
    inputValorUnitario.addEventListener('input', calcularSubtotalFormulario);
    calcularSubtotalFormulario();

    // Ao enviar o formulário, adiciona o gasto
    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const descricao = (inputDescricao.value || '').trim();
        const qtd = parseInt(inputQtd.value);
        const valorUnitario = parseFloat(inputValorUnitario.value);

        if (!descricao || !qtd || isNaN(qtd) || isNaN(valorUnitario)) {
            alert('Preencha todos os campos corretamente para adicionar um gasto.');
            return;
        }

        const novoGasto = {
            id: Date.now(), // ID simples baseado no timestamp
            descricao,
            quantidade: qtd,
            valorUnitario,
        };
        novoGasto.subtotal = novoGasto.quantidade * novoGasto.valorUnitario;

        gastos.push(novoGasto);
        salvarGastosNoLocalStorage();
        renderizarTabelaGastos();
        atualizarResumoGastos();

        // Limpa o formulário
        form.reset();
        inputQtd.value = 1;
        inputValorUnitario.value = 0;
        calcularSubtotalFormulario();
        inputDescricao.focus();
    });
}

// ==============================================
// Renderização da tabela de gastos
// ==============================================

function renderizarTabelaGastos() {
    const tbody = document.getElementById('tabelaGastosBody');
    if (!tbody) return;

    // Limpa conteúdo anterior
    tbody.innerHTML = '';

    if (!gastos.length) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 5;
        td.className = 'text-center text-muted py-4';
        td.textContent = 'Nenhum gasto cadastrado ainda. Comece adicionando seu primeiro gasto da viagem!';
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    gastos.forEach((gasto) => {
        const tr = document.createElement('tr');

        const tdDescricao = document.createElement('td');
        tdDescricao.textContent = gasto.descricao;

        const tdQtd = document.createElement('td');
        tdQtd.className = 'text-center';
        tdQtd.textContent = gasto.quantidade;

        const tdValorUnitario = document.createElement('td');
        tdValorUnitario.className = 'text-end';
        tdValorUnitario.textContent = formatarMoeda(gasto.valorUnitario);

        const tdSubtotal = document.createElement('td');
        tdSubtotal.className = 'text-end fw-semibold';
        tdSubtotal.textContent = formatarMoeda(gasto.subtotal);

        const tdAcoes = document.createElement('td');
        tdAcoes.className = 'text-center';

        const btnEditar = document.createElement('button');
        btnEditar.className = 'btn btn-sm btn-outline-primary btn-acao me-1';
        btnEditar.textContent = 'Editar';
        btnEditar.addEventListener('click', () => abrirModalEdicaoGasto(gasto.id));

        const btnRemover = document.createElement('button');
        btnRemover.className = 'btn btn-sm btn-outline-danger btn-acao';
        btnRemover.textContent = 'Remover';
        btnRemover.addEventListener('click', () => removerGasto(gasto.id));

        tdAcoes.appendChild(btnEditar);
        tdAcoes.appendChild(btnRemover);

        tr.appendChild(tdDescricao);
        tr.appendChild(tdQtd);
        tr.appendChild(tdValorUnitario);
        tr.appendChild(tdSubtotal);
        tr.appendChild(tdAcoes);

        tbody.appendChild(tr);
    });
}

// ==============================================
// Resumo de gastos / custo total
// ==============================================

function atualizarResumoGastos() {
    const custoTotal = gastos.reduce((total, gasto) => total + (gasto.subtotal || 0), 0);

    const spanTopo = document.getElementById('custoTotalViagem');
    const spanTabela = document.getElementById('custoTotalViagemTabela');
    if (spanTopo) spanTopo.textContent = formatarMoeda(custoTotal);
    if (spanTabela) spanTabela.textContent = formatarMoeda(custoTotal);
}

// ==============================================
// Edição de gasto
// ==============================================

function abrirModalEdicaoGasto(idGasto) {
    const gasto = gastos.find((g) => g.id === idGasto);
    if (!gasto) return;

    const inputId = document.getElementById('editarIdGasto');
    const inputDescricao = document.getElementById('editarDescricaoGasto');
    const inputQtd = document.getElementById('editarQuantidadeGasto');
    const inputValorUnitario = document.getElementById('editarValorUnitarioGasto');
    const inputSubtotal = document.getElementById('editarSubtotalGasto');

    inputId.value = gasto.id;
    inputDescricao.value = gasto.descricao;
    inputQtd.value = gasto.quantidade;
    inputValorUnitario.value = gasto.valorUnitario;
    inputSubtotal.value = formatarMoeda(gasto.subtotal);

    const atualizarSubtotalEdicao = () => {
        const qtd = parseInt(inputQtd.value) || 0;
        const valorUnitario = parseFloat(inputValorUnitario.value) || 0;
        const subtotal = qtd * valorUnitario;
        inputSubtotal.value = formatarMoeda(isFinite(subtotal) ? subtotal : 0);
    };

    inputQtd.oninput = atualizarSubtotalEdicao;
    inputValorUnitario.oninput = atualizarSubtotalEdicao;

    atualizarSubtotalEdicao();

    if (modalEditarGasto) {
        modalEditarGasto.show();
    }
}

// Botão de salvar dentro do modal
const btnSalvarEdicao = document.getElementById('btnSalvarEdicaoGasto');
if (btnSalvarEdicao) {
    btnSalvarEdicao.addEventListener('click', () => {
        const inputId = document.getElementById('editarIdGasto');
        const inputDescricao = document.getElementById('editarDescricaoGasto');
        const inputQtd = document.getElementById('editarQuantidadeGasto');
        const inputValorUnitario = document.getElementById('editarValorUnitarioGasto');

        const id = parseInt(inputId.value);
        const descricao = (inputDescricao.value || '').trim();
        const qtd = parseInt(inputQtd.value);
        const valorUnitario = parseFloat(inputValorUnitario.value);

        if (!descricao || !qtd || isNaN(qtd) || isNaN(valorUnitario)) {
            alert('Preencha todos os campos corretamente para salvar a edição.');
            return;
        }

        const index = gastos.findIndex((g) => g.id === id);
        if (index === -1) return;

        gastos[index].descricao = descricao;
        gastos[index].quantidade = qtd;
        gastos[index].valorUnitario = valorUnitario;
        gastos[index].subtotal = qtd * valorUnitario;

        salvarGastosNoLocalStorage();
        renderizarTabelaGastos();
        atualizarResumoGastos();

        if (modalEditarGasto) {
            modalEditarGasto.hide();
        }
    });
}

// ==============================================
// Remoção de gasto
// ==============================================

function removerGasto(idGasto) {
    const confirmar = window.confirm('Tem certeza de que deseja remover este gasto?');
    if (!confirmar) return;

    gastos = gastos.filter((g) => g.id !== idGasto);
    salvarGastosNoLocalStorage();
    renderizarTabelaGastos();
    atualizarResumoGastos();
}

// ==============================================
// Meta de economia
// ==============================================

function inicializarMetaEconomia() {
    const btnSalvarMeta = document.getElementById('btnSalvarMeta');
    const btnSalvarValorJuntado = document.getElementById('btnSalvarValorJuntado');

    if (btnSalvarMeta) {
        btnSalvarMeta.addEventListener('click', () => {
            const inputMeta = document.getElementById('metaTotal');
            const valor = parseFloat(inputMeta.value);
            metaTotal = !isNaN(valor) && valor >= 0 ? valor : 0;
            salvarMetaNoLocalStorage();
            atualizarResumoMeta();
        });
    }

    if (btnSalvarValorJuntado) {
        btnSalvarValorJuntado.addEventListener('click', () => {
            const inputJuntado = document.getElementById('valorJuntado');
            const valor = parseFloat(inputJuntado.value);
            valorJuntado = !isNaN(valor) && valor >= 0 ? valor : 0;
            salvarValorJuntadoNoLocalStorage();
            atualizarResumoMeta();
        });
    }
}

// Atualiza todos os elementos relacionados à meta
function atualizarResumoMeta() {
    const metaTexto = document.getElementById('metaTotalTexto');
    const juntadoTexto = document.getElementById('valorJuntadoTexto');
    const faltaTexto = document.getElementById('faltaMetaTexto');
    const textoPercentual = document.getElementById('textoPercentualMeta');
    const badgePercentual = document.getElementById('percentualMetaBadge');
    const barraProgresso = document.getElementById('barraProgresso');
    const mensagemMeta = document.getElementById('mensagemMetaMotivacional');

    const percentualTopo = document.getElementById('percentualMetaTopo');
    const faltaTopo = document.getElementById('faltaMetaTopo');
    const barraTopo = document.getElementById('barraProgressoTopo');

    // Atualiza valores numéricos
    if (metaTexto) metaTexto.textContent = formatarMoeda(metaTotal || 0);
    if (juntadoTexto) juntadoTexto.textContent = formatarMoeda(valorJuntado || 0);

    let percentual = 0;
    let falta = 0;

    if (metaTotal > 0) {
        percentual = (valorJuntado / metaTotal) * 100;
        if (!isFinite(percentual)) percentual = 0;
        if (percentual < 0) percentual = 0;
        if (percentual > 999) percentual = 999;

        falta = metaTotal - valorJuntado;
        if (falta < 0) falta = 0;
    } else {
        percentual = 0;
        falta = 0;
    }

    if (faltaTexto) faltaTexto.textContent = formatarMoeda(falta);
    if (faltaTopo) faltaTopo.textContent = formatarMoeda(falta);

    const percentualFormatado = formatarPercentual(percentual);

    if (textoPercentual) {
        textoPercentual.textContent = `Você já alcançou ${percentualFormatado} da meta.`;
    }

    if (badgePercentual) {
        badgePercentual.textContent = percentualFormatado;
    }

    if (percentualTopo) {
        percentualTopo.textContent = percentualFormatado;
    }

    // Barras de progresso
    const larguraBarra = Math.min(percentual, 100);

    if (barraProgresso) {
        barraProgresso.style.width = `${larguraBarra}%`;
        barraProgresso.setAttribute('aria-valuenow', larguraBarra.toString());
    }

    if (barraTopo) {
        barraTopo.style.width = `${larguraBarra}%`;
        barraTopo.setAttribute('aria-valuenow', larguraBarra.toString());
    }

    // Mensagem motivacional
    if (mensagemMeta) {
        if (metaTotal <= 0) {
            mensagemMeta.className = 'alert alert-light border mt-auto mb-0';
            mensagemMeta.textContent = 'Defina uma meta e um valor já juntado para ver sua barra de progresso.';
        } else if (valorJuntado <= 0) {
            mensagemMeta.className = 'alert alert-info mt-auto mb-0';
            mensagemMeta.textContent = 'Meta definida! Comece a reservar um valor para a viagem ao Chile.';
        } else if (percentual >= 100) {
            mensagemMeta.className = 'alert alert-success mt-auto mb-0';
            mensagemMeta.textContent = 'Parabéns! Você alcançou (ou até ultrapassou) a sua meta de economia para a viagem! 🇨🇱';
        } else if (percentual >= 50) {
            mensagemMeta.className = 'alert alert-success mt-auto mb-0';
            mensagemMeta.textContent = 'Você já passou da metade da meta, continue assim que o Chile está logo ali!';
        } else {
            mensagemMeta.className = 'alert alert-primary mt-auto mb-0';
            mensagemMeta.textContent = 'Boa! Você já começou a juntar. Mantenha o ritmo que você chega na meta a tempo.';
        }
    }
}
