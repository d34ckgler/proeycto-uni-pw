class DataController {
    constructor() {
        this.Participantes = new Esquema('participantes');
        this.Eventos = new Esquema('eventos');
    }

    /**
     * Registra los participantes en el esquema (participantes)
     * y llama al renderizado por cada participante registrado
     * para mantener la tabla actualizada ante la vista del usuario
     */
    registro() {
        // Inicializando captura de formulario
        const formRegistro = document.getElementById('frm-registro');
        // Obteniendo data de formulario
        let data = new FormData(formRegistro);

        // validacion de campos
        if (data.get('nombre') === '') {
            return alert('El nombre es un campo obligatorio');
        } else if (data.get('cedula') === '') {
            return alert('El cedula es un campo obligatorio');
        } else if (data.get('municipio') === '') {
            return alert('El municipio es un campo obligatorio');
        } else if (data.get('edad') === '') {
            return alert('El edad es un campo obligatorio');
        } else if (data.get('hora_inicio') === '') {
            return alert('La hora inicio es un campo obligatorio');
        } else if (data.get('hora_fin') === '') {
            return alert('El hora fin es un campo obligatorio');
        }

        // Validacion de datos
        let siExiste = !!this.Participantes.buscar().find(item => item.cedula === data.get('cedula'));

        if (!siExiste) {
            let fueRegistrado = this.Participantes.insertar({
                nombre: data.get('nombre').toUpperCase(),
                cedula: data.get('cedula'),
                municipio: data.get('municipio').toUpperCase(),
                edad: data.get('edad'),
                hora_inicio: data.get('hora_inicio'),
                hora_fin: data.get('hora_fin'),
            });

            if (fueRegistrado) {
                this.renderizarParticipantes();
                alert('Registro exitoso!');
            } else {
                alert('Fallo al intentar registrar el participante');
            }
        } else {
            alert('El participante ya se encuentra registrado');
        }
    }

    /**
     * Renderiza la lista de participantes registrados
     * en la coleccion del esquema (participantes)
     */
    renderizarParticipantes() {
        let elemento = document.getElementById('data-participantes');
        let participantes = this.Participantes.buscar();

        if (elemento && participantes && participantes.length > 0) {
            let htmlParticipantes = '';
            participantes.forEach(participante => {
                htmlParticipantes += `
                    <tr>
                        <td>${participante.nombre}</td>
                        <td>${participante.cedula}</td>
                        <td>${participante.edad}</td>
                        <td>${participante.municipio}</td>
                        <td><button class="send-form">Participar</button></td>
                    </tr>
                `;
            });

            elemento.innerHTML = htmlParticipantes;
        }
    }

    // Eventos
    registrarEvento(evento) {
        const frmEventos = document.getElementById('frm-eventos');
        const data = new FormData(frmEventos);

        if (data.get(evento) && data.get(evento) !== '') {
            const evt = this.Eventos.buscar().find(evt => evt.nombre === evento);

            if (!evt) {
                let registroEvento = this.Eventos.insertar({
                    nombre: evento,
                    hora: data.get(evento)
                });
            } else {
                let eventoActualizado = this.Eventos.actualizar({
                    ...evt,
                    hora: data.get(evento)
                });
            }
        } else {
            alert('Debe ingresar una hora de culminacion para el evento.');
        }
    }
}


/**
 * Inicializa la clase con los metodos necesarios
 * para los eventos de los distintos botones del DOM
 */
const dataController = new DataController();