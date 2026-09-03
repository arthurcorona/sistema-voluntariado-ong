import { db } from './firebase-client.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const form = document.getElementById('volunteer-form');
const successMessage = document.getElementById('success-message');
const submitButton = form.querySelector('button[type="submit"]');

const addRefButton = document.getElementById('add-referencia-btn');
const referenciasContainer = document.getElementById('referencias-container');
let referenciaCount = 1;

function validarDataNascimento() {
    const inputData = document.getElementById('data_nascimento');
    const valorData = inputData.value;
    
    let errorMsg = document.getElementById('data-nascimento-error');
    if (!errorMsg) {
        errorMsg = document.createElement('div');
        errorMsg.id = 'data-nascimento-error';
        errorMsg.className = 'error-message';
        inputData.parentNode.insertBefore(errorMsg, inputData.nextSibling);
    }

    if (!valorData) {
        errorMsg.textContent = '';
        return true; 
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); 

    const partes = valorData.split('-'); 

    if (partes.length !== 3) {
        errorMsg.textContent = 'Formato de data inválido.';
        return false;
    }

    const ano = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10);
    const dia = parseInt(partes[2], 10);

    const dataNascimento = new Date(ano, mes - 1, dia);
    dataNascimento.setHours(0, 0, 0, 0); 

    if (dataNascimento.getFullYear() !== ano || 
        dataNascimento.getMonth() !== (mes - 1) || 
        dataNascimento.getDate() !== dia) {
        
        errorMsg.textContent = 'Data inválida. Verifique o dia e o mês.';
        return false;
    }

    if (dataNascimento > hoje) {
        errorMsg.textContent = 'A data de nascimento não pode ser uma data futura.';
        return false;
    }

    const dataLimite16Anos = new Date(hoje.getTime());
    dataLimite16Anos.setFullYear(hoje.getFullYear() - 16);

    if (dataNascimento > dataLimite16Anos) {
        errorMsg.textContent = 'Você deve ter pelo menos 16 anos para ser voluntário.';
        return false;
    }

    errorMsg.textContent = '';
    return true;
}

const inputDataNascimento = document.getElementById('data_nascimento');
if (inputDataNascimento) {
    inputDataNascimento.addEventListener('change', validarDataNascimento);
}

addRefButton.addEventListener('click', () => {
    referenciaCount++;

    const newRefGroup = document.createElement('div');
    newRefGroup.classList.add('referencia-group', 'form-group');

    newRefGroup.innerHTML = `
        <label for="ref${referenciaCount}_nome">Referência ${referenciaCount}: Nome</label>
        <input type="text" id="ref${referenciaCount}_nome" name="ref_nome"> 
        
        <label for="ref${referenciaCount}_telefone">Referência ${referenciaCount}: Telefone</label>
        <input type="tel" id="ref${referenciaCount}_telefone" name="ref_telefone" placeholder="(XX) XXXXX-XXXX">
    `;

    referenciasContainer.appendChild(newRefGroup);
});


form.addEventListener('submit', async (event) => {
    event.preventDefault();

    submitButton.disabled = true;
    submitButton.textContent = 'Enviando...';
    successMessage.style.display = 'none';

    try {
        const nomesRefs = form.querySelectorAll('input[name="ref_nome"]');
        const telefonesRefs = form.querySelectorAll('input[name="ref_telefone"]');
        const referenciasArray = [];

        for (let i = 0; i < nomesRefs.length; i++) {
            const nome = nomesRefs[i].value;
            const telefone = telefonesRefs[i].value;

            if (nome.trim() !== '' || telefone.trim() !== '') {
                referenciasArray.push({ 
                    nome: nome, 
                    telefone: telefone 
                });
            }
        }

        const dadosVoluntario = {
            nome: form.nome.value,
            data_nascimento: form.data_nascimento.value,
            sexo: form.sexo.value,
            endereco: form.endereco.value,
            email: form.email.value,
            telefone: form.tel_comercial.value, 
            como_soube: form.como_soube.value,
            projeto_interesse: form.projeto_interesse.value,
            horas_semanais: form.horas_semanais.value,
            tempo_atuacao: form.tempo_atuacao.value,
            horarios_disponiveis: form.horarios_disponiveis.value,

            referencias: referenciasArray,
            termo_lei_aceito: form.termo_lei.checked,
            termo_veracidade_aceito: form.termo_veracidade.checked,
            data_inscricao: new Date(),
            status: 'pendente'
        };

        const docRef = await addDoc(collection(db, "voluntarios"), dadosVoluntario);

        console.log("Documento salvo com ID: ", docRef.id);
        referenciasContainer.innerHTML = `
            <div class="referencia-group form-group">
                <label for="ref1_nome">Referência 1: Nome</label>
                <input type="text" id="ref1_nome" name="ref_nome"> 
                <label for="ref1_telefone">Referência 1: Telefone</label>
                <input type="tel" id="ref1_telefone" name="ref_telefone" placeholder="(XX) XXXXX-XXXX">
            </div>
        `;
        referenciaCount = 1;
        form.reset();
        successMessage.style.display = 'block';

    } catch (e) {
        console.error("Erro ao adicionar documento: ", e);
        alert("Ocorreu um erro ao enviar sua inscrição. Verifique se todos os campos obrigatórios estão preenchidos e tente novamente.");
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Enviar Inscrição';
    }
});