class DataController {
    constructor() {
        // Variables limites
        this.VELOCIDAD_MAXIMA = {
            caminata: 7,
            ciclismo: 45,
            natacion: 1.72
        };

        // Tiempo carrera en curso
        this.intervaloCarrera = null;
        this.horalCulminacion = 0;

        // Instanciacion de esquemas
        this.Participantes = new Esquema('participantes');
        this.Eventos = new Esquema('eventos');
        this.Seguimiento = new Esquema('seguimiento');
    }

    obtenerHora(fecha = new Date()) {
        fecha.setHours(24);
        return `${fecha.getHours()}:${fecha.getMinutes()}:${fecha.getSeconds()}`;
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
                participa: false
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
                        <td>${participante.cedula}</td>
                        <td>${participante.nombre}</td>
                        <td>${participante.edad}</td>
                        <td>${participante.municipio}</td>
                        ${!participante.participa ? `<td><button onclick="dataController.participar(${participante.id})" class="send-form">Participar</button></td>` : ''}
                    </tr>`;
            });

            elemento.innerHTML = htmlParticipantes;
        }
    }

    /**
     * Renderiza la lista de participantes en evento en curso
     * en la coleccion del esquema (seguimiento)
     */
    renderizarSeguimiento(evento, seguimientos) {
        let elemento = document.getElementById('data-seguimiento-' + evento.nombre);
        // let seguimientos = this.Seguimiento.buscar();

        if (elemento && seguimientos && seguimientos.length > 0) {
            let htmlseguimientos = '';
            seguimientos.forEach(seguimiento => {
                htmlseguimientos += `
                    <tr class="${seguimiento.distancia >= evento.distancia ? 'llegada' : !seguimiento.descalificado ? 'corriendo' : 'descalificado' }">
                        <td>${seguimiento.cedula}</td>
                        <td>${seguimiento.nombre}</td>
                        <td>${seguimiento.edad}</td>
                        <td>${seguimiento.municipio}</td>
                        <td>${seguimiento.distancia}</td>
                        <td>${seguimiento.tiempo}</td>
                        <td>${seguimiento.hora_llegada || '--:--:--'}</td>
                    </tr>`;
            });

            elemento.innerHTML = htmlseguimientos;
        }
    }

    /**
     * Marca el atleta como participando en los eventos
     * mediente un id de registro
     * @param {number} participanteId
     */
    participar(participanteId) {
        let participante = this.Participantes.buscar().find(part => part.id === participanteId);

        if (participante) {
            this.Participantes.actualizar({
                ...participante,
                participa: true
            });
            this.renderizarParticipantes();
        }
    }

    /**
     * Crear o Actualiza un evento en conjunto con la hora
     * estipulada en el campo de texto tipeado
     * @param {string} evento => nombre de evento
     */
    registrarEvento(evento, hora = null) {
        const frmEventos = document.getElementById('frm-eventos');
        const data = new FormData(frmEventos);
        let dataEvento = null;

        if ((data.get(evento) && data.get(evento) !== '') || hora) {
            const evt = this.Eventos.buscar().find(evt => evt.nombre === evento);

            if (!evt) {
                dataEvento = this.Eventos.insertar({
                    nombre: evento,
                    hora: data.get(evento) || hora,
                    distancia: 400
                });

                console.log(dataEvento);
            } else {
                dataEvento = this.Eventos.actualizar({
                    ...evt,
                    hora: data.get(evento) || hora,
                    distancia: 400
                });
                console.info(dataEvento);

                // Iniciar evento
                this.intervaloCarrera = null;
                this.iniciarEvento(dataEvento.id);
            }
        } else {
            alert('Debe ingresar una hora de culminacion para el evento.');
        }
    }

    iniciarEvento(eventoId) {
        let evento = this.Eventos.buscar().find(item => item.id === eventoId);
        let participantes = this.Participantes.buscar().filter(participante => participante.participa);

        if (evento) {
            if (participantes.length > 0) {
                let seguimientos = [];
                // Ajustando data para evento
                participantes.forEach(({ ...participante }) => {
                    /**
                     * Se eliminar el id del participante para reemplazar
                     * por id de seguimiento y se agrega el id del participante
                     * en otra propiedad (participante_id)
                     */
                    let participante_id = participante.id;
                    delete participante['id'];

                    // Validar si el participante existe para el mismo evento en curso
                    let part = this.Seguimiento.buscar().find(item => item.participante_id === participante_id && item.eventoId === eventoId);

                    if (part) {
                        return;
                    }

                    // Registrando participante en evento en curso
                    seguimientos.push(this.Seguimiento.insertar({
                        ...participante,
                        participante_id,
                        eventoId,
                        distancia: 0,
                        tiempo: 0
                    }));
                });

                // Se llama al renderizado para la tabla de seguimiento
                this.renderizarSeguimiento(evento, seguimientos);
                this.actualizaSeguimiento(evento);

            }
        } else {
            alert('El evento seleccionado no existe!')
        }
    }

    distanciaRandom(evento) {
        return parseFloat((Math.random() * this.VELOCIDAD_MAXIMA[evento] + 1).toFixed(
            evento === 'natacion' ? 2 : 0
        ));
    }

    async actualizaSeguimiento(evento) {
        this.intervaloCarrera = setInterval(() => {
            let seguimientos = this.Seguimiento.buscar().filter(seguimiento => seguimiento.eventoId === evento.id);

            // Actualizar informacion de participantes en seguimiento
            seguimientos.forEach(seguimiento => {
                // Si el participante culmina el evento no sigue contando
                if (seguimiento.distancia >= evento.distancia || seguimiento.descalificado) {
                    // seguimiento.distancia = evento.distancia;
                    return;
                }

                let distancia = this.distanciaRandom(evento.nombre);
                this.Seguimiento.actualizar({
                    ...seguimiento,
                    distancia: seguimiento.distancia + distancia,
                    tiempo: seguimiento.tiempo + 1,
                    descalificado: (distancia < 1) // retorna true si se cumple
                });
            });

            seguimientos = this.Seguimiento.buscar().filter(seguimiento => seguimiento.eventoId === evento.id).sort((a, b) => {
                if (a.distancia > b.distancia) {
                    return -1;
                }
            });

            this.renderizarSeguimiento(evento, seguimientos);

            // Validamos si todos los participantes culminaron el evento para detener y reiniciar todo
            if(!seguimientos.some(seguimiento.distancia < evento.distancia)) {
                reiniciarEvento();
            }
        }, 1000);
    }

    reiniciarEvento() {
        clearInterval(this.intervaloCarrera);
        this.horalCulminacion = this.obtenerHora();
    }
}


/**
 * Inicializa la clase con los metodos necesarios
 * para los eventos de los distintos botones del DOM
 */
const dataController = new DataController();



// Creando eventos
dataController.registrarEvento('caminata', dataController.obtenerHora());
dataController.registrarEvento('ciclismo', dataController.obtenerHora());
dataController.registrarEvento('natacion', dataController.obtenerHora());