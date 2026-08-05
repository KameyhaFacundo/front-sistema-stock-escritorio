import api from '../api/client';

const etiquetasService = {
  async fetchEtiquetas(ids) {
    const res = await api.get('productos/etiquetas', { params: { ids: ids.join(',') } });
    return res.data;
  },

  async fetchPlantillas() {
    const res = await api.get('plantillas-etiqueta');
    return res.data;
  },

  async savePlantilla(data) {
    const res = await api.post('plantillas-etiqueta', data);
    return res.data;
  },

  async updatePlantilla(id, data) {
    const res = await api.put(`plantillas-etiqueta/${id}`, data);
    return res.data;
  },

  async deletePlantilla(id) {
    await api.delete(`plantillas-etiqueta/${id}`);
  },
};

export default etiquetasService;
