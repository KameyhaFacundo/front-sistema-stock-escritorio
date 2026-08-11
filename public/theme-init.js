(function () {
  // Mismos valores que src/theme/ThemeContext.jsx — este script solo evita
  // el parpadeo del tema viejo un instante antes de que React monte y los
  // vuelva a aplicar (ver el comentario de por qué existe, en ese archivo).
  var dark = {
    '--bg':'#1A1714','--card':'#211D19','--border':'#2E2823','--border-hover':'#40372E',
    '--ink':'#F2EDE7','--ink2':'#A89E93','--muted':'#6B6259','--input':'#231F1A',
    '--hover':'#282320','--active-bg':'#3A2416','--table-header':'#17130F',
    '--dropdown':'#231F1A','--modal':'#1A1714','--p':'#F5883A'
  };
  var light = {
    '--bg':'#F7F4EF','--card':'#FFFFFF','--border':'#E8E1D8','--border-hover':'#D6C9B8',
    '--ink':'#2A2521','--ink2':'#8A7F73','--muted':'#B8AEA2','--input':'#FAF7F2',
    '--hover':'#F1ECE4','--active-bg':'#F5E6D8','--table-header':'#F2EDE6',
    '--dropdown':'#FFFFFF','--modal':'#FFFFFF','--p':'#B5622C'
  };
  var mode = localStorage.getItem('theme') || 'light';
  var vars = mode === 'dark' ? dark : light;
  var r = document.documentElement;
  Object.keys(vars).forEach(function(k){ r.style.setProperty(k, vars[k]); });
})();
