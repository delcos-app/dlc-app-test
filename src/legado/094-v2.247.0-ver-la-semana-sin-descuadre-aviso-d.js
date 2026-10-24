/* ============================================================
   v2.247.0 · «Ver la semana» sin descuadre (aviso de Eric: en apptest, en el 14/10, al pulsar «Ver la semana» la pantalla se
   descuadraba un momento). Para pintar la semana dentro de la cinta, la tarjeta de «Tu día» cede un instante su nombre (#agcuerpo)
   a la semana; mientras llegaban los datos de esa semana (en una semana que no es la de hoy hay que pedirlos), la tarjeta perdía su
   sitio en la rejilla y saltaba arriba a todo el ancho. Ahora los datos se piden antes y el cambio de nombre dura solo lo que se
   tarda en pintar, sin esperar a la red.
   ============================================================ */



