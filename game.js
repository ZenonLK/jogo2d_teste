const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const faseTexto = document.getElementById("fase-texto");
const zumbisTexto = document.getElementById("zumbis-texto");

// Configurações do Mundo
const LARGURA_MUNDO = 2400; // Bem maior que os 900px da tela!
const CHAO_Y = 360;

let faseAtual = 1;
const MAX_FASES = 3;
let jogoFinalizado = false;
let cameraX = 0;

// Controles
const teclas = { a: false, d: false };

// Jogador (Boneco Preto)
const player = {
    x: 150,
    y: CHAO_Y,
    velocidade: 5,
    direcao: 1, // 1 = direita, -1 = esquerda
    atacando: false,
    tempoAtaque: 0
};

// Lista de Zumbis (Bonecos Azuis)
let zumbis = [];

// Elementos de cenário para dar sensação de movimento ao andar
const nuvens = [200, 550, 900, 1300, 1750, 2150];
const marcosChao = [100, 400, 700, 1000, 1300, 1600, 1900, 2200];

// Inicia ou reinicia uma fase
function iniciarFase(numeroFase) {
    faseAtual = numeroFase;
    player.x = 150;
    cameraX = 0;
    zumbis = [];

    // Cria exatamente a quantidade de zumbis da fase (1, 2 ou 3)
    for (let i = 0; i < numeroFase; i++) {
        zumbis.push({
            x: 650 + i * 450, // Espalha os zumbis pelo mapa
            y: CHAO_Y,
            velocidade: 1.5 + (numeroFase * 0.3),
            vivo: true
        });
    }
    atualizarHUD();
}

function atualizarHUD() {
    const vivos = zumbis.filter(z => z.vivo).length;
    faseTexto.textContent = `Fase: ${faseAtual} / ${MAX_FASES}`;
    zumbisTexto.textContent = `Zumbis restantes: ${vivos}`;
}

// Eventos de teclado e mouse
window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (k === "a" || e.key === "ArrowLeft") teclas.a = true;
    if (k === "d" || e.key === "ArrowRight") teclas.d = true;
    if (e.code === "Space") atacar();
});

window.addEventListener("keyup", (e) => {
    const k = e.key.toLowerCase();
    if (k === "a" || e.key === "ArrowLeft") teclas.a = false;
    if (k === "d" || e.key === "ArrowRight") teclas.d = false;
});

canvas.addEventListener("mousedown", atacar);

function atacar() {
    if (player.atacando || jogoFinalizado) return;
    player.atacando = true;
    player.tempoAtaque = 12; // Duração visual do golpe em frames

    // Verifica se algum zumbi está no alcance do ataque
    zumbis.forEach(zumbi => {
        if (!zumbi.vivo) return;
        const distancia = zumbi.x - player.x;
        
        // Acerta se estiver perto e na direção que o jogador está olhando
        if (Math.abs(distancia) < 85 && Math.sign(distancia) === player.direcao) {
            zumbi.vivo = false;
            atualizarHUD();
        }
    });
}

// Atualização da lógica (60 vezes por segundo)
function atualizar() {
    if (jogoFinalizado) return;

    // Movimento do jogador
    if (teclas.a) {
        player.x -= player.velocidade;
        player.direcao = -1;
    }
    if (teclas.d) {
        player.x += player.velocidade;
        player.direcao = 1;
    }

    // Limites do mundo
    if (player.x < 40) player.x = 40;
    if (player.x > LARGURA_MUNDO - 40) player.x = LARGURA_MUNDO - 40;

    // Temporizador do ataque
    if (player.atacando) {
        player.tempoAtaque--;
        if (player.tempoAtaque <= 0) player.atacando = false;
    }

    // Movimento dos Zumbis (andam na direção do jogador)
    zumbis.forEach(zumbi => {
        if (!zumbi.vivo) return;

        if (zumbi.x > player.x + 35) {
            zumbi.x -= zumbi.velocidade;
        } else if (zumbi.x < player.x - 35) {
            zumbi.x += zumbi.velocidade;
        } else {
            // Se o zumbi encostar no jogador, reinicia a fase atual
            alert("Um zumbi te pegou! Reiniciando a fase...");
            teclas.a = false;
            teclas.d = false;
            iniciarFase(faseAtual);
        }
    });

    // Atualiza a Câmera para seguir o jogador
    cameraX = player.x - canvas.width / 2;
    if (cameraX < 0) cameraX = 0;
    if (cameraX > LARGURA_MUNDO - canvas.width) {
        cameraX = LARGURA_MUNDO - canvas.width;
    }

    // Verifica se todos os zumbis da fase morreram
    const vivos = zumbis.filter(z => z.vivo).length;
    if (vivos === 0) {
        if (faseAtual < MAX_FASES) {
            iniciarFase(faseAtual + 1);
        } else {
            jogoFinalizado = true;
        }
    }
}

// Função auxiliar para desenhar boneco palito (estilo o esboço do Paint)
function desenharBoneco(xTela, y, cor, isZumbi, direcao, atacando) {
    ctx.strokeStyle = cor;
    ctx.lineWidth = 3;

    // Cabeça
    ctx.beginPath();
    ctx.arc(xTela, y - 85, 18, 0, Math.PI * 2);
    ctx.stroke();

    // Tronco
    ctx.beginPath();
    ctx.moveTo(xTela, y - 67);
    ctx.lineTo(xTela, y - 25);
    ctx.stroke();

    // Pernas
    ctx.beginPath();
    ctx.moveTo(xTela, y - 25);
    ctx.lineTo(xTela - 15, y);
    ctx.moveTo(xTela, y - 25);
    ctx.lineTo(xTela + 15, y);
    ctx.stroke();

    // Braços
    ctx.beginPath();
    if (isZumbi) {
        // Braços esticados de zumbi
        const dirZumbi = player.x < (xTela + cameraX) ? -1 : 1;
        ctx.moveTo(xTela, y - 55);
        ctx.lineTo(xTela + (25 * dirZumbi), y - 58);
        ctx.moveTo(xTela, y - 50);
        ctx.lineTo(xTela + (25 * dirZumbi), y - 48);
    } else if (atacando) {
        // Braço esticado dando golpe
        ctx.moveTo(xTela, y - 55);
        ctx.lineTo(xTela + (45 * direcao), y - 55);
    } else {
        // Braços normais
        ctx.moveTo(xTela - 18, y - 50);
        ctx.lineTo(xTela + 18, y - 50);
    }
    ctx.stroke();

    // Detalhe vermelho do seu esboço no zumbi
    if (isZumbi) {
        ctx.strokeStyle = "#991b1b";
        ctx.beginPath();
        ctx.moveTo(xTela - 8, y - 80);
        ctx.lineTo(xTela - 14, y - 55);
        ctx.moveTo(xTela + 8, y - 80);
        ctx.lineTo(xTela + 14, y - 55);
        ctx.stroke();
    }
}

// Desenho na tela
function desenhar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Nuvens/Detalhes no céu (aplicando - cameraX)
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    nuvens.forEach(nx => {
        const posX = nx - cameraX;
        ctx.beginPath();
        ctx.moveTo(posX, 60);
        ctx.lineTo(posX + 50, 60);
        ctx.lineTo(posX + 40, 40);
        ctx.lineTo(posX + 70, 50);
        ctx.stroke();
    });

    // 2. Chão verde
    ctx.fillStyle = "#22c55e";
    ctx.fillRect(0, CHAO_Y, canvas.width, canvas.height - CHAO_Y);
    ctx.strokeStyle = "#15803d";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, CHAO_Y);
    ctx.lineTo(canvas.width, CHAO_Y);
    ctx.stroke();

    // Arbustos/pedras no chão para dar referência de movimento
    ctx.fillStyle = "#15803d";
    marcosChao.forEach(mx => {
        const posX = mx - cameraX;
        ctx.fillRect(posX, CHAO_Y + 15, 30, 8);
    });

    // 3. Desenha o Jogador (Preto)
    desenharBoneco(player.x - cameraX, player.y, "#000000", false, player.direcao, player.atacando);

    // 4. Desenha os Zumbis Vivos (Azuis)
    zumbis.forEach(zumbi => {
        if (zumbi.vivo) {
            desenharBoneco(zumbi.x - cameraX, zumbi.y, "#0284c7", true, -1, false);
        }
    });

    // Tela de Vitória
    if (jogoFinalizado) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 36px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("VOCÊ VENCEU AS 3 FASES!", canvas.width / 2, canvas.height / 2);
    }
}

// Loop Principal
function gameLoop() {
    atualizar();
    desenhar();
    requestAnimationFrame(gameLoop);
}

// Começa na Fase 1
iniciarFase(1);
gameLoop();