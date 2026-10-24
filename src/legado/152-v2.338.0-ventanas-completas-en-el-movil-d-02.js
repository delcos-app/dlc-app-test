addEventListener('resize', medirBnav); setTimeout(medirBnav, 0);
pintarBnav = (orig => function (...a) { const r = orig.apply(this, a); medirBnav(); return r; })(pintarBnav);


