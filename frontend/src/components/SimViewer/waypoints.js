// Posiciones X (% dentro de cada zona) para cada estación de cada agente.
// Usado por useWebSocket para mover los robots a las estaciones correctas
// en respuesta a eventos del backend.

export const WP = {
  manager: {
    phone:          18,   // teléfono (izquierda del mostrador)
    idle:           50,   // escritorio (centro)
    comanda_drop:   82,   // borde con ChefZone (deja comanda)
    cash_register:  68,   // caja registradora (derecha)
  },
  chef: {
    comanda_read:    8,   // ranura izquierda donde caen las comandas
    idle:           32,   // posición base frente al mostrador
    oven:           60,   // frente al horno (derecha)
    packing:        36,   // zona de empaque (centro)
    shelf:          82,   // barra de entrega (extremo derecho, dentro del shelf)
  },
  delivery: {
    pickup:          5,   // recoge del borde con ChefZone
    house_0:        30,   // primera casa de cliente
    house_1:        50,   // segunda casa
    house_2:        68,   // tercera casa
    home:            5,   // regresa a la pizzería
  },
}

// Posiciones absolutas de las casas en DeliveryZone (% del ancho de la zona).
// Debe coincidir con WP.delivery.house_N para que el robot llegue exacto.
export const HOUSE_POSITIONS = [30, 50, 68]
