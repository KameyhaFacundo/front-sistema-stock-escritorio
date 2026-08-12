import api from '../api/client';

export const empresaService = {
  async update(data) {
    const res = await api.put('empresa', data);
    return res.data.empresa;
  },

  async subirLogo(file) {
    const formData = new FormData();
    formData.append('logo', file);
    const res = await api.post('empresa/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.empresa;
  },

  async eliminarLogo() {
    const res = await api.delete('empresa/logo');
    return res.data.empresa;
  },

  async getPagos() {
    const res = await api.get('empresa/pagos');
    return res.data.data ?? [];
  },

  async getCatalogoConfig() {
    const res = await api.get('empresa/catalogo');
    return res.data.data;
  },

  async actualizarCatalogo(activo) {
    const res = await api.put('empresa/catalogo', { activo });
    return res.data.data;
  },

  async actualizarArca({ cert, key, passphrase, puntoVenta, homologacion }) {
    const formData = new FormData();
    formData.append('cert', cert);
    formData.append('key', key);
    if (passphrase) formData.append('passphrase', passphrase);
    formData.append('punto_venta', puntoVenta);
    formData.append('homologacion', homologacion ? '1' : '0');
    const res = await api.post('empresa/arca', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.empresa;
  },

  async eliminarArca() {
    const res = await api.delete('empresa/arca');
    return res.data.empresa;
  },

  async descargarBackup() {
    const res = await api.get('empresa/exportar-datos', { responseType: 'blob' });
    const disposition = res.headers['content-disposition'] || '';
    const filename = disposition.match(/filename=([^;]+)/)?.[1]?.trim() || 'backup.zip';
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
};
