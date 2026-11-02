
"use strict";

// ========================================
// ELEMENTOS DO HTML
// ========================================

const elementoNumeroQuestao = document.getElementById("numero-questao");
const elementoAcertos = document.getElementById("contador-acertos");
const elementoErros = document.getElementById("contador-erros");
const elementoEnunciado = document.getElementById("enunciado");
const elementoAlternativas = document.getElementById("alternativas");
const elementoFeedback = document.getElementById("feedback");
const elementoBarraProgresso = document.getElementById("barra-progresso");

const botaoConfirmar = document.getElementById("botao-confirmar");
const botaoProxima = document.getElementById("botao-proxima");
const botaoReiniciar = document.getElementById("botao-reiniciar");

const areaQuestionario = document.getElementById("area-questionario");
const resultadoFinal = document.getElementById("resultado-final");
const mensagemFinal = document.getElementById("mensagem-final");
const totalFinal = document.getElementById("total-final");
const acertosFinal = document.getElementById("acertos-final");
const errosFinal = document.getElementById("erros-final");
const aproveitamentoFinal = document.getElementById("aproveitamento-final");
const mensagemErro = document.getElementById("mensagem-erro");

// ========================================
// ESTADO DO QUESTIONÁRIO
// ========================================

// As perguntas serão carregadas do arquivo JSON.
let questoes = [];

// Índice da pergunta que está sendo exibida.
let indiceAtual = 0;

// Contadores de respostas.
let acertos = 0;
let erros = 0;

// Índice da alternativa selecionada pelo usuário.
let alternativaSelecionada = null;

// Indica se a pergunta atual já foi respondida.
let perguntaRespondida = false;

// ========================================
// CARREGAMENTO DO ARQUIVO JSON
// ========================================

async function carregarQuestoes() {
    try {
        // Busca o arquivo JSON na raiz do projeto.
        const resposta = await fetch("questoes.json");

        // Verifica se o arquivo foi encontrado.
        if (!resposta.ok) {
            throw new Error(
                "Não foi possível carregar o arquivo questoes.json."
            );
        }

        // Converte o conteúdo JSON em um objeto JavaScript.
        const dados = await resposta.json();

        // Transforma as perguntas em uma lista.
        // Object.values preserva a ordem de inserção
        // das chaves "0001", "0002", "0003" etc.
        questoes = Object.values(dados);

        // Verifica se existem perguntas.
        if (questoes.length === 0) {
            throw new Error("O arquivo JSON não contém perguntas.");
        }

        // Confere se cada pergunta possui quatro alternativas
        // e exatamente uma resposta correta.
        const estruturaValida = questoes.every(questao =>
            typeof questao.pergunta === "string" &&
            Array.isArray(questao.opcoes) &&
            questao.opcoes.length === 4 &&
            questao.opcoes.every(opcao =>
                typeof opcao.texto === "string" &&
                typeof opcao.correta === "boolean"
            ) &&
            questao.opcoes.filter(opcao => opcao.correta).length === 1
        );

        if (!estruturaValida) {
            throw new Error(
                "Uma ou mais perguntas possuem estrutura inválida. " +
                "Cada pergunta deve ter quatro alternativas e " +
                "exatamente uma resposta correta."
            );
        }

        // Exibe a primeira pergunta.
        mostrarQuestao();

    } catch (erro) {
        // Apresenta uma mensagem caso ocorra algum problema.
        areaQuestionario.hidden = true;
        mensagemErro.hidden = false;

        mensagemErro.textContent =
            erro.message +
            " Verifique o arquivo JSON e execute o site " +
            "por meio de um servidor local, como o Live Server.";

        console.error("Erro ao carregar o questionário:", erro);
    }
}

// ========================================
// EXIBIR A PERGUNTA ATUAL
// ========================================

function mostrarQuestao() {
    // Recupera a pergunta atual.
    const questao = questoes[indiceAtual];

    // Limpa a seleção e o estado da pergunta.
    alternativaSelecionada = null;
    perguntaRespondida = false;

    // Atualiza o enunciado.
    elementoEnunciado.textContent = questao.pergunta;

    // Atualiza o contador de questões.
    elementoNumeroQuestao.textContent =
        `${indiceAtual + 1}/${questoes.length}`;

    // Atualiza os contadores de acertos e erros.
    atualizarContadores();

    // Atualiza a barra de progresso.
    const progresso = (indiceAtual / questoes.length) * 100;

    elementoBarraProgresso.style.width = `${progresso}%`;

    // Limpa as alternativas da pergunta anterior.
    elementoAlternativas.replaceChildren();

    // Limpa a mensagem de feedback.
    elementoFeedback.textContent = "";
    elementoFeedback.className = "feedback";

    // Cria as quatro alternativas.
    questao.opcoes.forEach((opcao, indice) => {
        // Cria o botão da alternativa.
        const botao = document.createElement("button");

        botao.type = "button";
        botao.className = "alternativa";

        // Cria a letra da alternativa: A, B, C ou D.
        const letra = document.createElement("span");

        letra.className = "letra-alternativa";
        letra.textContent = String.fromCharCode(65 + indice);

        // Cria o texto da alternativa.
        const texto = document.createElement("span");

        texto.textContent = opcao.texto;

        // Adiciona a letra e o texto ao botão.
        botao.append(letra, texto);

        // Registra a seleção feita pelo usuário.
        botao.addEventListener("click", () => {
            selecionarAlternativa(indice);
        });

        // Adiciona o botão à página.
        elementoAlternativas.appendChild(botao);
    });

    // Prepara os botões de ação.
    botaoConfirmar.disabled = true;
    botaoConfirmar.hidden = false;
    botaoProxima.hidden = true;
}

// ========================================
// SELECIONAR UMA ALTERNATIVA
// ========================================

function selecionarAlternativa(indice) {
    // Não permite alterar a resposta depois da confirmação.
    if (perguntaRespondida) {
        return;
    }

    // Guarda o índice da alternativa escolhida.
    alternativaSelecionada = indice;

    // Recupera todos os botões de alternativas.
    const botoes = elementoAlternativas.querySelectorAll(
        ".alternativa"
    );

    // Remove a seleção anterior.
    botoes.forEach(botao => {
        botao.classList.remove("selecionada");
    });

    // Destaca a alternativa escolhida.
    botoes[indice].classList.add("selecionada");

    // Libera o botão de confirmação.
    botaoConfirmar.disabled = false;
}

// ========================================
// VERIFICAR A RESPOSTA
// ========================================

function verificarResposta() {
    // Impede confirmar sem selecionar uma alternativa.
    if (alternativaSelecionada === null) {
        return;
    }

    // Impede que a mesma pergunta seja contabilizada duas vezes.
    if (perguntaRespondida) {
        return;
    }

    perguntaRespondida = true;

    // Recupera a pergunta e a alternativa escolhida.
    const questao = questoes[indiceAtual];

    const opcaoEscolhida =
        questao.opcoes[alternativaSelecionada];

    // Recupera o índice da alternativa correta.
    const indiceCorreto = questao.opcoes.findIndex(
        opcao => opcao.correta === true
    );

    // Recupera os botões de alternativas.
    const botoes = elementoAlternativas.querySelectorAll(
        ".alternativa"
    );

    // Bloqueia todas as alternativas após a resposta.
    botoes.forEach(botao => {
        botao.disabled = true;
    });

    // Verifica se a alternativa escolhida está correta.
    if (opcaoEscolhida.correta) {
        acertos++;

        elementoFeedback.textContent =
            "Parabéns! Você acertou a questão.";

        elementoFeedback.className = "feedback certa";

    } else {
        erros++;

        elementoFeedback.textContent =
            "Resposta incorreta. A alternativa correta é: " +
            questao.opcoes[indiceCorreto].texto;

        elementoFeedback.className = "feedback errada";
    }

    // Destaca visualmente a resposta correta.
    botoes[indiceCorreto].classList.add("correta");

    // Destaca a alternativa escolhida incorretamente, se houver.
    if (!opcaoEscolhida.correta) {
        botoes[alternativaSelecionada].classList.add("incorreta");
    }

    // Atualiza os contadores.
    atualizarContadores();

    // Atualiza o progresso incluindo a questão respondida.
    const progresso =
        ((indiceAtual + 1) / questoes.length) * 100;

    elementoBarraProgresso.style.width = `${progresso}%`;

    // Esconde a confirmação após responder.
    botaoConfirmar.hidden = true;

    // Se houver mais perguntas, mostra o botão para avançar.
    if (indiceAtual < questoes.length - 1) {
        botaoProxima.textContent = "Próxima questão";
    } else {
        botaoProxima.textContent = "Ver resultado final";
    }

    botaoProxima.hidden = false;
}

// ========================================
// ATUALIZAR OS CONTADORES
// ========================================

function atualizarContadores() {
    elementoAcertos.textContent = acertos;
    elementoErros.textContent = erros;
}

// ========================================
// AVANÇAR PARA A PRÓXIMA PERGUNTA
// ========================================

function proximaQuestao() {
    // Só permite avançar depois de responder.
    if (!perguntaRespondida) {
        return;
    }

    // Verifica se ainda existem perguntas.
    if (indiceAtual < questoes.length - 1) {
        indiceAtual++;

        mostrarQuestao();

    } else {
        // Todas as perguntas foram respondidas.
        mostrarResultadoFinal();
    }
}

// ========================================
// MOSTRAR O RESULTADO FINAL
// ========================================

function mostrarResultadoFinal() {
    // Calcula o aproveitamento em porcentagem.
    const aproveitamento = Math.round(
        (acertos / questoes.length) * 100
    );

    // Preenche os dados do resultado final.
    totalFinal.textContent = questoes.length;
    acertosFinal.textContent = acertos;
    errosFinal.textContent = erros;

    aproveitamentoFinal.textContent = `${aproveitamento}%`;

    // Define uma mensagem de acordo com o desempenho.
    if (aproveitamento === 100) {
        mensagemFinal.textContent =
            "Excelente! Você acertou todas as questões.";

    } else if (aproveitamento >= 70) {
        mensagemFinal.textContent =
            "Muito bem! Você demonstrou um bom conhecimento do assunto.";

    } else if (aproveitamento >= 50) {
        mensagemFinal.textContent =
            "Bom esforço! Revise as questões em que teve dificuldade.";

    } else {
        mensagemFinal.textContent =
            "Continue estudando! Revise as boas práticas de manipulação de alimentos.";
    }

    // Oculta o questionário e mostra o resultado.
    areaQuestionario.hidden = true;
    resultadoFinal.hidden = false;

    // Completa a barra de progresso.
    elementoBarraProgresso.style.width = "100%";

    // Atualiza o número da última questão.
    elementoNumeroQuestao.textContent =
        `${questoes.length}/${questoes.length}`;
}

// ========================================
// REINICIAR O QUESTIONÁRIO
// ========================================

function reiniciarQuestionario() {
    // Volta os valores para o início.
    indiceAtual = 0;
    acertos = 0;
    erros = 0;
    alternativaSelecionada = null;
    perguntaRespondida = false;

    // Exibe novamente a área do questionário.
    resultadoFinal.hidden = true;
    areaQuestionario.hidden = false;

    // Exibe a primeira pergunta novamente.
    mostrarQuestao();
}

// ========================================
// EVENTOS DOS BOTÕES
// ========================================

botaoConfirmar.addEventListener(
    "click",
    verificarResposta
);

botaoProxima.addEventListener(
    "click",
    proximaQuestao
);

botaoReiniciar.addEventListener(
    "click",
    reiniciarQuestionario
);

// ========================================
// INICIAR O QUESTIONÁRIO
// ========================================

carregarQuestoes();
