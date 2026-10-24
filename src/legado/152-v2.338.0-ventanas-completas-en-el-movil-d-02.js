addEventListener('resize', medirBnav); setTimeout(medirBnav, 0);
function pintarBnav(...a) { const r = pintarBnavBase4.apply(this, a); medirBnav(); return r; }


