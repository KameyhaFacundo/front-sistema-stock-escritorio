import Swal from 'sweetalert2';

export function AlertaWithConfirmation({
  title,
  textMain,
  textSuccesfull,
  textError,
  functionConfirmed
}) {
  Swal.fire({
    title: title || '',
    icon: 'warning',
    text: textMain || '',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    cancelButtonText: 'Cancelar',
    confirmButtonText: 'Confirmar'
  }).then(async result => {
    if (result.isConfirmed) {
      try {
        await functionConfirmed();
        Alerta()
          .withTitulo(textSuccesfull || '')
          .withTipo('success')
          .withMini(true)
          .build();
      } catch (error) {
        Alerta()
          .withTitulo(textError || error?.response?.data?.message || 'Hubo un error, contacte con el administrador.')
          .withTipo('error')
          .withMini(true)
          .build();
      }
    }
  });
}

export const doubleConfirmationAlert = ({
  textoConfirmacion,
  textoSuccess,
  textoError,
  funcion,
  refresh
}) => {
  Swal.fire({
    title: textoConfirmacion,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Confirmar',
    cancelButtonText: 'Cancelar'
  })
    .then(result => {
      if (result.isConfirmed) {
        funcion()
          .then(response => {
            Alerta()
              .withMini(true)
              .withTipo('success')
              .withTitulo(textoSuccess)
              .withMensaje(response.message)
              .build();
            if (refresh) refresh();
          })
          .catch(err => {
            Alerta()
              .withMini(true)
              .withTipo('error')
              .withTitulo(textoError)
              .withMensaje(
                err?.response?.data?.message
                  ? err.response.data.message
                  : 'Hubo un error, contacte con el administrador.'
              )
              .build();
          });
      }
    })
    .catch(err => {
      Alerta()
        .withMini(true)
        .withTipo('error')
        .withTitulo(textoError)
        .withMensaje(
          err?.response?.data?.message
            ? err.response.data.message
            : 'Hubo un error, contacte con el administrador.'
        )
        .build();
    });
};

export function mostrarAlerta(titulo, mensaje, tipo, html = null, mini = false) {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
    didOpen: toast => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });

  if (mini) {
    Toast.fire({
      title: titulo,
      text: mensaje,
      html: html,
      icon: tipo
    });
  } else {
    Swal.fire({
      title: titulo,
      text: mensaje,
      html: html,
      icon: tipo
    });
  }
}

class AlertaBuilder {
  constructor() {
    this.titulo = null;
    this.mensaje = null;
    this.tipo = null;
    this.html = null;
    this.mini = false;
    this.posicion = 'top-end';
  }

  withTitulo(titulo) {
    this.titulo = titulo;
    return this;
  }

  withMensaje(mensaje) {
    this.mensaje = mensaje;
    return this;
  }

  withTipo(tipo) {
    this.tipo = tipo;
    return this;
  }

  withHtml(html) {
    this.html = html;
    return this;
  }

  withMini(mini) {
    this.mini = mini;
    return this;
  }

  withPosicion(posicion) {
    this.posicion = posicion;
    return this;
  }

  build() {
    const Toast = Swal.mixin({
      toast: true,
      position: this.posicion,
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      didOpen: toast => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });

    if (this.mini) {
      Toast.fire({
        title: this.titulo,
        text: this.mensaje,
        html: this.html,
        icon: this.tipo
      });
    } else {
      Swal.fire({
        title: this.titulo,
        text: this.mensaje,
        html: this.html,
        icon: this.tipo
      });
    }
  }
}

export function Alerta() {
  return new AlertaBuilder();
}
