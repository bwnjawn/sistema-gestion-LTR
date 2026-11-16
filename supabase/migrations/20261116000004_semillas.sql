-- Datos iniciales (SCRUM-248): catálogo y ajustes de fábrica. Son los mismos de src/data/seed.ts y
-- src/data/ajustesPorDefecto.ts, con los mismos id, para que nada guardado en la app se desfase.
-- Los datos de transferencia, el precio de la piscina y los horarios son de ejemplo hasta que el cliente
-- entregue los reales (SCRUM-270): el administrador los edita en Ajustes.

insert into public.cabanas (id, nombre, capacidad, precio_noche, camas, descripcion, imagen_principal, imagenes, caracteristicas) values
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Cabaña 6', 6, 65000, '1 Cama Matrimonial + 2 Literas',
   'Cabaña acogedora completamente equipada con vista al bosque y estufa a leña.',
   'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80',
   array['https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80'],
   '["Cocina equipada", "Estufa a leña", "Estacionamiento", "TV Cable"]'),
  ('b1fecb99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Cabaña 8', 8, 120000, '2 Camas Matrimoniales + 2 Literas',
   'Cabaña amplia ideal para familias o grupos grandes con terraza privada.',
   'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
   array['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'],
   '["Cocina equipada", "Terraza privada", "Estufa a leña", "Estacionamiento"]');

insert into public.sitios_camping (id, nombre, descripcion, precio_persona, capacidad_min, capacidad_max, es_especial, modalidades, imagen_principal, imagenes, caracteristicas) values
  ('c2fecb99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Camping Zona General',
   'Espacio rodeado de naturaleza con acceso a baños, duchas con agua caliente, piscinas y zona de río.',
   10000, 1, 9, false, array['diario', 'pernoctar']::public.modalidad_camping[],
   'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80',
   array['https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80'],
   array['Agua caliente', 'Piscinas', 'Acceso al río', 'Sombra nativa']),
  ('d3fecb99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Espacio Grupos Grandes / Días de Campo',
   'Zona exclusiva reservada para delegaciones, colegios y grupos familiares de 10 a 150 personas con terraza privada.',
   10000, 10, 150, true, array['diario', 'pernoctar']::public.modalidad_camping[],
   'https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?auto=format&fit=crop&w=800&q=80',
   array['https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?auto=format&fit=crop&w=800&q=80'],
   array['Terraza privada', 'Zona exclusiva', 'Cancha multiuso', 'Parrillas grupales']);

insert into public.acompanamientos (nombre) values
  ('Papas al vapor'), ('Papas rústicas'), ('Puré de papas'), ('Arroz con verduras'), ('Ensalada surtida'), ('Ensalada a la chilena');

insert into public.platos (id, nombre, precio, descripcion, comida, modo_acompanamiento, acompanamiento_fijo, imagen) values
  ('e4fecb99-9c0b-4ef8-bb6d-6bb9bd380a55', 'Asado de Cordero y Cerdo', 20000, 'Acompañado de papas al vapor, buffet de ensaladas y postre.',
   'almuerzo', 'choice', null, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'),
  ('f5fecb99-9c0b-4ef8-bb6d-6bb9bd380a66', 'Vacuno con salsa bechamel', 21000, 'Papas rústicas, buffet de ensaladas y postre.',
   'almuerzo', 'choice', null, 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'),
  ('a6fecb99-9c0b-4ef8-bb6d-6bb9bd380a77', 'Salmón con salsa de camarones', 21000, 'Acompañado con puré, buffet de ensaladas y pan amasado.',
   'almuerzo', 'choice', null, 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80'),
  ('b7fecb99-9c0b-4ef8-bb6d-6bb9bd380a88', 'Chuletas de cerdo con puré', 13000, 'Buffet de ensaladas, pan amasado y postre.',
   'almuerzo', 'fixed', 'Puré de papas y ensaladas', 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=800&q=80'),
  ('c8fecb99-9c0b-4ef8-bb6d-6bb9bd380a99', 'Desayuno Campestre Tradicional', 10800, 'Pan amasado, mermelada casera, mantequilla, huevos de campo y té/café.',
   'desayuno', 'fixed', 'Pan amasado y mermeladas', 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=800&q=80'),
  ('d9fecb99-9c0b-4ef8-bb6d-6bb9bd380b00', 'Once Campestre Sureña', 12000, 'Sopaipillas pasadas, kuchen casero, queso fresco y café/té/mate.',
   'once', 'fixed', 'Sopaipillas y kuchen', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80');

-- Acompañamientos que puede elegir el cliente en los platos de modo "choice"
insert into public.plato_acompanamientos (plato_id, acompanamiento_id)
select v.plato_id::uuid, a.id
  from (values
    ('e4fecb99-9c0b-4ef8-bb6d-6bb9bd380a55', 'Papas al vapor'),
    ('e4fecb99-9c0b-4ef8-bb6d-6bb9bd380a55', 'Puré de papas'),
    ('e4fecb99-9c0b-4ef8-bb6d-6bb9bd380a55', 'Ensalada surtida'),
    ('f5fecb99-9c0b-4ef8-bb6d-6bb9bd380a66', 'Papas rústicas'),
    ('f5fecb99-9c0b-4ef8-bb6d-6bb9bd380a66', 'Puré de papas'),
    ('f5fecb99-9c0b-4ef8-bb6d-6bb9bd380a66', 'Arroz con verduras'),
    ('f5fecb99-9c0b-4ef8-bb6d-6bb9bd380a66', 'Ensalada surtida'),
    ('a6fecb99-9c0b-4ef8-bb6d-6bb9bd380a77', 'Puré de papas'),
    ('a6fecb99-9c0b-4ef8-bb6d-6bb9bd380a77', 'Papas rústicas'),
    ('a6fecb99-9c0b-4ef8-bb6d-6bb9bd380a77', 'Arroz con verduras')
  ) as v(plato_id, nombre)
  join public.acompanamientos a on a.nombre = v.nombre;

insert into public.ajustes (clave, valor) values
  ('contacto', $j${
    "phone1": "+56 9 8502 5056",
    "phone2": "+56 9 5883 3853",
    "email": "lostroncosderepil@gmail.com",
    "websiteDisplay": "fresianatural.cl",
    "websiteUrl": "https://www.fresianatural.cl/troncos-de-repil-fresia-natural.html",
    "instagramUser": "@lostroncosderepil",
    "instagramUrl": "https://instagram.com/lostroncosderepil",
    "address": "Sector Repil s/n, Comuna de Fresia, Región de Los Lagos, Chile",
    "mapsUrl": "https://www.google.com/maps/place/Turismo+Los+Troncos+de+Repil/@-41.0616375,-73.647016,17z",
    "iframeMapUrl": "https://maps.google.com/maps?q=-41.0616375,-73.647016&z=17&output=embed"
  }$j$::jsonb),
  ('transferencia', $j${
    "bank": "Banco Estado",
    "accountType": "Cuenta Vista / Cuenta RUT",
    "accountNumber": "12345678",
    "holderName": "Los Troncos de Repil",
    "holderRut": "12.345.678-9",
    "email": "lostroncosderepil@gmail.com"
  }$j$::jsonb),
  ('parametros', $j${
    "defaultDepositPercentage": 30,
    "depositDeadlineHours": 48,
    "ivaPercentage": 19,
    "poolEntryPrice": 3000,
    "marginPercentage": 10,
    "capacityRules": {
      "maxRestaurantGroupsPerSlot": 8,
      "restaurantSpaces": [
        { "id": "comedor-principal", "nombre": "Comedor principal", "capacidad": 120 },
        { "id": "carpa", "nombre": "Carpa", "capacidad": 50 },
        { "id": "comedor-secundario", "nombre": "Comedor secundario", "capacidad": 30 }
      ],
      "menuLargeGroupThreshold": 30,
      "maxMenuVarietiesLargeGroup": 3,
      "maxCampingPeopleCapacity": 150,
      "marginPercentage": 10
    }
  }$j$::jsonb),
  ('horarios_restaurante', $j${
    "desayuno": { "start": "08:30", "end": "11:00", "times": ["08:30", "09:00", "09:30", "10:00", "10:30", "11:00"] },
    "almuerzo": { "start": "12:30", "end": "14:00", "times": ["12:30", "13:00", "13:30", "14:00"] },
    "once": { "start": "17:00", "end": "19:30", "times": ["17:00", "17:30", "18:00", "18:30", "19:00", "19:30"] }
  }$j$::jsonb),
  ('horarios_camping', $j${
    "diario": { "checkIn": "09:00", "checkOut": "19:30", "display": "Día de ingreso (09:00 hrs) - Día de ingreso (19:30 hrs)" },
    "pernoctar": { "checkIn": "12:00", "checkOut": "11:00", "display": "Día de ingreso (12:00 hrs) - Día de salida (11:00 hrs)" }
  }$j$::jsonb),
  ('horarios_cabana', $j${
    "checkIn": "15:00",
    "checkOut": "11:00",
    "display": "Día de ingreso (15:00 hrs) - Día de salida (11:00 hrs)"
  }$j$::jsonb);
