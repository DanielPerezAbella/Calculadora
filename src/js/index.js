// variables
const calculadora = document.getElementById('calculadora');
const resultado = document.getElementById('resultado');

// eventos
calculadora.addEventListener('click', añadirNumeros);

// operaciones
let operaciones = [];

// añadirNumeros
function añadirNumeros(e) {
    const target = e.target;

    if (target.getAttribute('type') === 'button') {
        const { id, className, innerText } = target;

        // Si el botón no es una operación, añadir el número al resultado
        if (className !== 'operacion') {
            resultado.value += innerText;
        }

        // Procesar las operaciones
        if (['sumar', 'restar', 'multiplicar', 'dividir'].includes(id)) {
            operaciones.push(resultado.value, id === 'sumar' ? '+' :
                id === 'restar' ? '-' :
                    id === 'multiplicar' ? '*' : '/');
            calculadora.reset();
        }

        // Operación de igual
        if (id === 'igual') {
            operaciones.push(resultado.value);
            calculadora.reset();
            const resultadoOperacion = eval(operaciones.join(''));
            resultado.value = resultadoOperacion;
            operaciones = [];
        }

        // Limpiar
        if (id === 'clear') {
            operaciones = [];
            calculadora.reset();
        }
    }
}
