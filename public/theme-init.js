(function () {
  // Mismos valores que el preset activo en src/theme/ThemeContext.jsx (hoy:
  // "clay") — este script solo evita el parpadeo del tema viejo un instante
  // antes de que React monte y los vuelva a aplicar (ver el comentario de
  // por qué existe, en ese archivo). Los otros presets guardados (slate,
  // terracota) no hace falta duplicarlos acá — este archivo solo necesita
  // el que está activo.
  var dark = {
    '--bg':'#2B2118','--bg-sidebar':'#241B14','--card':'#332720','--border':'#473627','--border-hover':'#5C4936',
    '--ink':'#F5EEE4','--ink2':'#C7B7A3','--muted':'#8F7D68','--input':'#362A22',
    '--hover':'#3D2F26','--active-bg':'#4A3626','--accent-ink':'#FFC397','--table-header':'#251C15',
    '--dropdown':'#332720','--modal':'#2B2118','--p':'#E08A5B'
  };
  var light = {
    '--bg':'#F3EDE3','--bg-sidebar':'#F8F4EC','--card':'#FFFFFF','--border':'#E5DBC9','--border-hover':'#D4C2A0',
    '--ink':'#2B241D','--ink2':'#6C6052','--muted':'#A89C89','--input':'#FAF6EF',
    '--hover':'#ECE4D5','--active-bg':'#F0DFCE','--accent-ink':'#8A4A22','--table-header':'#EFE7D9',
    '--dropdown':'#FFFFFF','--modal':'#FFFFFF','--p':'#B0653D'
  };
  var mode = localStorage.getItem('theme') || 'light';
  var vars = mode === 'dark' ? dark : light;
  var r = document.documentElement;
  Object.keys(vars).forEach(function(k){ r.style.setProperty(k, vars[k]); });
})();
