import { PrismaClient, Role, PropertyStatus, ContractStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Hashing speed optimization: Hash once and reuse
const DEFAULT_PASSWORD = 'password123';

// ---------------------------------------------------------
// LOCAL MOCK DATA GENERATOR (Localized "Faker" Alternative)
// ---------------------------------------------------------

const maleNames = ["Alejandro", "Carlos", "Juan", "David", "Andres", "Jose", "Fernando", "Mauricio", "Rodrigo", "Sebastian", "Gabriel", "Mateo", "Santiago", "Diego", "Luis", "Miguel", "Hugo", "Javier", "Daniel", "Christian", "Gustavo", "Ramiro", "Alvaro", "Oscar", "Jorge"];
const femaleNames = ["Sofia", "Camila", "Valeria", "Andrea", "Natalia", "Luciana", "Maria", "Fernanda", "Gabriela", "Isabella", "Mariana", "Carolina", "Daniela", "Flavia", "Paola", "Claudia", "Valentina", "Adriana", "Cecilia", "Renata", "Leticia", "Beatriz", "Raquel", "Vanessa", "Patricia"];
const surnames = ["Quispe", "Flores", "Mamani", "Rojas", "Rodriguez", "Gomez", "Fernandez", "Lopez", "Diaz", "Martinez", "Perez", "Camacho", "Vargas", "Guzman", "Torres", "Suarez", "Ortiz", "Serrano", "Chavez", "Cardozo", "Montaño", "Justiniano", "Prado", "Zabalaga", "Terceros", "Balderrama", "Escobar", "Arias", "Pinto", "Mendoza", "Salazar", "Villaroel", "Quiroga"];

const cities = [
  {
    name: "Cochabamba",
    lat: -17.3895,
    lng: -66.1568,
    zones: ["Cala Cala", "Queru Queru", "El Prado", "Muyurina", "Sarco", "Tupuraya", "Lomas de Aranjuez", "Las Cuadras", "Chimba", "Pacata Alta", "Pacata Baja", "Sud", "Temporal", "Miraflores", "Seminario"],
    streets: ["Av. América", "Calle Tarija", "Av. Ballivián", "Calle Pando", "Av. Santa Cruz", "Calle Aniceto Arce", "Calle Beni", "Av. Ramón Rivero", "Av. Melchor Urquidi", "Calle Oruro"]
  },
  {
    name: "Santa Cruz",
    lat: -17.7862,
    lng: -63.1812,
    zones: ["Equipetrol", "Las Palmas", "Urbarí", "Centro", "Doble Vía a La Guardia", "Norte", "Sirari", "Hamacas", "Los Cusis", "Palermo", "El Trompillo", "La Salle", "San Aurelio"],
    streets: ["Av. San Martín", "Av. Bush", "Av. Banzer", "Av. Santos Dumont", "Calle Velasco", "Av. Monseñor Rivero", "Av. La Salle", "Av. Irala", "Calle Rene Moreno"]
  },
  {
    name: "La Paz",
    lat: -16.5000,
    lng: -68.1167,
    zones: ["Sopocachi", "Zona Sur", "Calacoto", "Obrajes", "Miraflores", "Centro", "Achumani", "San Miguel", "Cota Cota", "Bajo Llojeta", "Pampahasi", "San Pedro", "Aranjuez"],
    streets: ["Av. 16 de Julio", "Av. Arce", "Av. Ballivián", "Av. Hernando Siles", "Calle Claudio Aliaga", "Av. Montenegro", "Calle Goitia", "Av. Saavedra", "Calle Aspiazu"]
  }
];

const adjectives = ["Hermoso", "Amplio", "Lujoso", "Espectacular", "Moderno", "Acogedor", "Exclusivo", "De estreno", "Confortable", "Elegante", "Premium", "Impecable", "Céntrico", "Rústico", "Vanguardista"];
const propertyTypes = ["CASA", "DEPARTAMENTO", "TERRENO", "OFICINA"];

const sampleImages = [
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1598228723793-52759bba2457?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=800&q=80"
];

const leadMessages = [
  "Hola, me gustaría recibir más información sobre esta propiedad y coordinar una visita.",
  "Buenas tardes, quisiera saber si el precio es charlable y si aceptan financiamiento bancario.",
  "Hola! Me interesa mucho. ¿Está disponible para visitas este fin de semana?",
  "Estimados, me interesa el inmueble. ¿Podrían enviarme planos y requisitos para alquiler?",
  "Hola, quisiera saber los gastos comunes o expensas del edificio. Saludos.",
  "Me gustaría saber si se aceptan mascotas en esta propiedad. Gracias.",
  "Hola, ¿la cochera y baulera están incluidas en el precio de lista o tienen costo extra?",
  "Interesado en realizar una oferta al contado. Por favor, contáctenme lo antes posible."
];

const kanbanStages = ["Lead Entrante", "Contacto Realizado", "Visita Programada", "Negociación", "Cierre Exitoso", "Cierre Fallido"];
const leadStatuses = ["LEAD_ENTRANTE", "CONTACTO_REALIZADO", "CITA_AGENDADA", "EN_NEGOCIACION", "COMPRADO", "ARCHIVADO"];

const expenseConcepts = [
  { category: "MANTENIMIENTO", concepts: ["Reparación de filtración de agua", "Pintado de interiores", "Refacción de grifería de baño", "Mantenimiento preventivo de calefón", "Impermeabilización de terraza", "Mantenimiento de ascensor prorrateado"] },
  { category: "IMPUESTOS", concepts: ["Pago de impuestos anuales a la propiedad", "Tasas municipales de aseo y alumbrado"] },
  { category: "SERVICIOS", concepts: ["Pago de expensas mensuales comunes", "Servicio de limpieza profunda de entrega", "Instalación de fibra óptica corporativa"] },
  { category: "ADMINISTRACION", concepts: ["Comisión por gestión de contratos", "Honorarios notariales de protocolización"] }
];

// Helper functions for mock generation (Faker-like API)
const faker = {
  person: {
    firstName: () => {
      const list = Math.random() > 0.5 ? maleNames : femaleNames;
      return list.at(Math.floor(Math.random() * list.length))!;
    },
    lastName: () => surnames.at(Math.floor(Math.random() * surnames.length))!,
    fullName: () => `${faker.person.firstName()} ${faker.person.lastName()}`
  },
  internet: {
    email: (name?: string) => {
      const cleanName = (name || faker.person.fullName())
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
      const domains = ["gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "propio.com.bo"];
      const rand = Math.floor(Math.random() * 900) + 100;
      return `${cleanName}${rand}@${domains.at(Math.floor(Math.random() * domains.length))!}`;
    }
  },
  phone: {
    number: () => {
      const prefix = Math.random() > 0.5 ? "7" : "6";
      const rest = Math.floor(1000000 + Math.random() * 9000000);
      return `+591 ${prefix}${rest}`;
    }
  },
  location: {
    cityData: () => cities.at(Math.floor(Math.random() * cities.length))!,
    address: (cityInfo: typeof cities[0], zone: string) => {
      const street = cityInfo.streets.at(Math.floor(Math.random() * cityInfo.streets.length))!;
      const num = Math.floor(Math.random() * 2000) + 10;
      return `${street} Nro. ${num}, Zona ${zone}`;
    }
  },
  date: {
    past: (daysMax = 365) => {
      const d = new Date();
      d.setDate(d.getDate() - Math.floor(Math.random() * daysMax));
      return d;
    },
    between: (start: Date, end: Date) => {
      const time = start.getTime() + Math.random() * (end.getTime() - start.getTime());
      return new Date(time);
    }
  },
  lorem: {
    paragraph: () => {
      const intros = [
        "Extraordinario inmueble comercializado en exclusiva.",
        "Ubicado en el corazón de la zona de mayor crecimiento urbano.",
        "Ideal para familias que buscan comodidad, exclusividad y seguridad.",
        "Una joya arquitectónica que destaca por su elegancia y funcionalidad.",
        "Inversión inteligente con excelente retorno de alquiler garantizado."
      ];
      const bodies = [
        "Cuenta con suite principal con vestidor y baño privado, amplios dormitorios con roperos empotrados, living comedor de concepto abierto y cocina gourmet con despensa.",
        "Dispone de amplias terrazas, calefacción central, sistema de domótica instalado y aire acondicionado en todos los ambientes principales.",
        "Ofrece áreas de esparcimiento familiar, churrasquera techada, piscina y parque infantil dentro de un condominio cerrado de primer nivel."
      ];
      const conclusions = [
        "Papeles en orden listos para protocolizar de inmediato.",
        "Se acepta financiamiento bancario de cualquier entidad financiera.",
        "No pierda esta oportunidad única y agende su visita hoy mismo."
      ];
      return `${intros.at(Math.floor(Math.random() * intros.length))!} ${bodies.at(Math.floor(Math.random() * bodies.length))!} ${conclusions.at(Math.floor(Math.random() * conclusions.length))!}`;
    }
  }
};

function generatePropertyData(index: number) {
  const type = propertyTypes.at(Math.floor(Math.random() * propertyTypes.length))!;
  const adj = adjectives.at(Math.floor(Math.random() * adjectives.length))!;
  const cityInfo = cities.at(Math.floor(Math.random() * cities.length))!;
  const zone = cityInfo.zones.at(Math.floor(Math.random() * cityInfo.zones.length))!;
  
  const title = `${adj} ${type.charAt(0) + type.slice(1).toLowerCase()} en ${zone}, ${cityInfo.name}`;
  
  // Geolocation within the city zone with highly precise realistic coordinates
  const latOffset = (Math.random() - 0.5) * 0.05;
  const lngOffset = (Math.random() - 0.5) * 0.05;
  const latitude = cityInfo.lat + latOffset;
  const longitude = cityInfo.lng + lngOffset;
  
  const location = `${zone}, ${cityInfo.name}`;
  const address = faker.location.address(cityInfo, zone);
  
  let rooms = 0;
  let bathrooms = 0;
  let area = 0.0;
  let price = 0.0;
  
  if (type === "CASA") {
    rooms = Math.floor(Math.random() * 4) + 3; // 3 to 6
    bathrooms = Math.floor(Math.random() * 3) + 2; // 2 to 4
    area = Math.floor(Math.random() * 300) + 150; // 150 to 450 m2
    price = Math.floor(Math.random() * 300000) + 120000; // $120k to $420k
  } else if (type === "DEPARTAMENTO") {
    rooms = Math.floor(Math.random() * 3) + 1; // 1 to 3
    bathrooms = Math.floor(Math.random() * 2) + 1; // 1 to 2
    area = Math.floor(Math.random() * 120) + 50; // 50 to 170 m2
    price = Math.floor(Math.random() * 120000) + 45000; // $45k to $165k
  } else if (type === "TERRENO") {
    area = Math.floor(Math.random() * 700) + 300; // 300 to 1000 m2
    price = Math.floor(Math.random() * 180000) + 35000; // $35k to $215k
  } else if (type === "OFICINA") {
    rooms = Math.floor(Math.random() * 4) + 1; // 1 to 4
    bathrooms = Math.floor(Math.random() * 2) + 1; // 1 to 2
    area = Math.floor(Math.random() * 150) + 30; // 30 to 180 m2
    price = Math.floor(Math.random() * 100000) + 25000; // $25k to $125k
  }
  
  const minPrice = Math.floor(price * (0.9 + Math.random() * 0.05)); // 90% to 95% of price
  
  const offerType = Math.random() > 0.4 ? "VENTA" : "ALQUILER";
  
  // Adjust price if it's for ALQUILER (monthly rental price)
  let adjustedPrice = price;
  let adjustedMinPrice = minPrice;
  if (offerType === "ALQUILER") {
    if (type === "CASA") {
      adjustedPrice = Math.floor(Math.random() * 1500) + 600; // $600 to $2100 / month
    } else if (type === "DEPARTAMENTO") {
      adjustedPrice = Math.floor(Math.random() * 800) + 250; // $250 to $1050 / month
    } else if (type === "OFICINA") {
      adjustedPrice = Math.floor(Math.random() * 1200) + 300; // $300 to $1500 / month
    } else {
      adjustedPrice = Math.floor(Math.random() * 400) + 100; // $100 to $500 / month
    }
    adjustedMinPrice = Math.floor(adjustedPrice * 0.9);
  }
  
  const imageUrl = sampleImages.at(Math.floor(Math.random() * sampleImages.length))!;
  const isVerified = Math.random() > 0.7;
  
  // Status distribution
  const statusRand = Math.random();
  let status: PropertyStatus = PropertyStatus.APROBADO;
  if (statusRand < 0.1) status = PropertyStatus.NUEVA_PUBLICACION;
  else if (statusRand < 0.2) status = PropertyStatus.RESERVADO;
  else if (statusRand < 0.25) status = PropertyStatus.VENDIDO;
  else if (statusRand < 0.3) status = PropertyStatus.RECHAZADO;
  
  const approvedAt = status === PropertyStatus.APROBADO || status === PropertyStatus.RESERVADO || status === PropertyStatus.VENDIDO
    ? faker.date.past(180)
    : null;
    
  const observationNotes = status === PropertyStatus.RECHAZADO 
    ? "Falta documentación de folio real actualizado o certificado catastral vigente."
    : null;
    
  // Documentation checklist (high probability of true if approved)
  const isApproved = status === PropertyStatus.APROBADO || status === PropertyStatus.RESERVADO || status === PropertyStatus.VENDIDO;
  const hasFolioReal = isApproved ? (Math.random() > 0.1) : (Math.random() > 0.5);
  const hasCatastro = isApproved ? (Math.random() > 0.1) : (Math.random() > 0.5);
  const hasTestimonio = isApproved ? (Math.random() > 0.15) : (Math.random() > 0.6);
  const hasImpuestosAlDia = isApproved ? (Math.random() > 0.1) : (Math.random() > 0.5);
  const hasPlanoUsoSuelo = isApproved ? (Math.random() > 0.2) : (Math.random() > 0.7);
  const hasCI = isApproved ? (Math.random() > 0.05) : (Math.random() > 0.4);

  return {
    title,
    description: faker.lorem.paragraph(),
    price: adjustedPrice,
    minPrice: adjustedMinPrice,
    currency: "USD",
    area,
    rooms,
    bathrooms,
    latitude,
    longitude,
    location,
    address,
    offerType,
    imageUrl,
    type,
    isVerified,
    status,
    approvedAt,
    observationNotes,
    hasFolioReal,
    hasCatastro,
    hasTestimonio,
    hasImpuestosAlDia,
    hasPlanoUsoSuelo,
    hasCI
  };
}

async function main() {
  console.log('🔄 Iniciando el restablecimiento de datos en la base de datos de Propio...');
  
  // 1. Limpieza de datos en orden correcto de restricciones de llaves foráneas
  console.log('🧹 Limpiando base de datos en orden inverso de relaciones...');
  await prisma.payment.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.priceHistory.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.propertyAlert.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Base de datos limpia y lista.');

  // 2. Creación secuencial de usuarios de prueba (Roles del Ecosistema)
  console.log('👥 Creando 50 usuarios con contraseña encriptada pre-calculada...');
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const usersData = [];
  
  // 5 Admins
  for (let i = 0; i < 5; i++) {
    usersData.push({
      id: randomUUID(),
      email: `admin${i + 1}@propio.com.bo`,
      password: hashedPassword,
      name: `Admin ${faker.person.fullName()}`,
      role: Role.ADMIN
    });
  }

  // 15 Agentes
  const agentIds: string[] = [];
  for (let i = 0; i < 15; i++) {
    const id = randomUUID();
    agentIds.push(id);
    usersData.push({
      id,
      email: `agente${i + 1}@propio.com.bo`,
      password: hashedPassword,
      name: `Agente ${faker.person.fullName()}`,
      role: Role.AGENTE
    });
  }

  // 30 Propietarios (que también actuarán como inquilinos/clientes)
  const ownerIds: string[] = [];
  for (let i = 0; i < 30; i++) {
    const id = randomUUID();
    ownerIds.push(id);
    usersData.push({
      id,
      email: `propietario${i + 1}@gmail.com`,
      password: hashedPassword,
      name: faker.person.fullName(),
      role: Role.PROPIETARIO
    });
  }

  await prisma.user.createMany({ data: usersData });
  console.log(`✅ Creados 50 usuarios exitosamente (5 ADMIN, 15 AGENTE, 30 PROPIETARIO).`);

  // 3. Creación de 10,000 propiedades con geolocalización realista
  console.log('🏢 Generando y guardando 10,000 propiedades en la base de datos...');
  const propertiesData = [];
  const propertyIds: string[] = [];
  const rentalProperties: any[] = []; // Subconjunto para contratos de alquiler

  for (let i = 0; i < 10000; i++) {
    const id = randomUUID();
    const mockProp = generatePropertyData(i);
    const ownerId = ownerIds.at(Math.floor(Math.random() * ownerIds.length))!;
    const agentId = agentIds.at(Math.floor(Math.random() * agentIds.length))!;

    const propRecord = {
      id,
      ...mockProp,
      ownerId,
      agentId
    };

    propertiesData.push(propRecord);
    propertyIds.push(id);

    if (mockProp.offerType === "ALQUILER" && mockProp.status === PropertyStatus.APROBADO) {
      rentalProperties.push({
        id,
        ownerId,
        price: mockProp.price
      });
    }
  }

  // Guardar propiedades en lotes de 1,000 para optimizar el rendimiento y evitar buffers saturados
  const propertyBatchSize = 1000;
  for (let i = 0; i < propertiesData.length; i += propertyBatchSize) {
    const batch = propertiesData.slice(i, i + propertyBatchSize);
    await prisma.property.createMany({ data: batch });
    console.log(`   - Propiedades insertadas: [${Math.min(i + propertyBatchSize, propertiesData.length)} / 10000]`);
  }
  console.log('✅ 10,000 Propiedades creadas con éxito.');

  // 4. Creación de 20,000 leads en el Kanban comercial
  console.log('🎯 Generando y guardando 20,000 leads comerciales...');
  const leadsData = [];
  
  for (let i = 0; i < 20000; i++) {
    const id = randomUUID();
    const propId = propertyIds.at(Math.floor(Math.random() * propertyIds.length))!;
    const agentId = agentIds.at(Math.floor(Math.random() * agentIds.length))!;
    
    const stageIdx = Math.floor(Math.random() * kanbanStages.length);
    const currentStage = kanbanStages[stageIdx];
    const status = leadStatuses[stageIdx];

    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const fullName = `${firstName} ${lastName}`;

    leadsData.push({
      id,
      name: fullName,
      phone: faker.phone.number(),
      email: faker.internet.email(fullName),
      message: leadMessages.at(Math.floor(Math.random() * leadMessages.length))!,
      currentStage,
      status,
      assignedAgentId: agentId,
      propertyId: propId
    });
  }

  // Guardar leads en lotes de 2,000
  const leadBatchSize = 2000;
  for (let i = 0; i < leadsData.length; i += leadBatchSize) {
    const batch = leadsData.slice(i, i + leadBatchSize);
    await prisma.lead.createMany({ data: batch });
    console.log(`   - Leads insertados: [${Math.min(i + leadBatchSize, leadsData.length)} / 20000]`);
  }
  console.log('✅ 20,000 Leads insertados correctamente.');

  // 5. Alertas de propiedades (User Alerts)
  console.log('🔔 Creando alertas de propiedades para los usuarios...');
  const alertsData = [];
  for (const ownerId of ownerIds) {
    // Cada propietario/usuario tiene de 1 a 3 alertas de zonas y presupuestos de interés
    const numAlerts = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < numAlerts; j++) {
      const cityInfo = cities.at(Math.floor(Math.random() * cities.length))!;
      const zone = cityInfo.zones.at(Math.floor(Math.random() * cityInfo.zones.length))!;
      const precioMax = Math.floor(Math.random() * 200000) + 80000;
      const tipoInmueble = propertyTypes.at(Math.floor(Math.random() * propertyTypes.length))!;

      alertsData.push({
        id: randomUUID(),
        userId: ownerId,
        zona: `${zone}, ${cityInfo.name}`,
        precioMax,
        tipoInmueble,
        isActive: Math.random() > 0.2,
        lastMatchAt: Math.random() > 0.5 ? faker.date.past(30) : null
      });
    }
  }
  await prisma.propertyAlert.createMany({ data: alertsData });
  console.log(`✅ Creadas ${alertsData.length} alertas de propiedades.`);

  // 6. Historiales de precios
  console.log('📈 Generando historiales de precios para una muestra de 3,000 propiedades...');
  const priceHistoryData = [];
  // Seleccionamos 3,000 propiedades de forma aleatoria para registrar cambios históricos de precios
  const sampledPropertyIndices = new Set<number>();
  while (sampledPropertyIndices.size < 3000) {
    sampledPropertyIndices.add(Math.floor(Math.random() * propertyIds.length));
  }

  for (const idx of sampledPropertyIndices) {
    const prop = propertiesData.at(idx)!;
    // Registramos entre 1 y 3 cambios históricos
    const numHistory = Math.floor(Math.random() * 3) + 1;
    let basePrice = prop.price;
    for (let h = numHistory; h > 0; h--) {
      // El precio anterior era ligeramente superior o inferior
      const factor = 0.92 + Math.random() * 0.16; // -8% a +8%
      const oldPrice = Math.round(basePrice * factor);
      
      const recordedAt = faker.date.past(30 * h); // de 1 a 3 meses atrás
      priceHistoryData.push({
        id: randomUUID(),
        propertyId: prop.id,
        price: oldPrice,
        recordedAt
      });
      // El precio va cambiando
      basePrice = oldPrice;
    }
  }

  // Guardar en lotes de 2,000
  const historyBatchSize = 2000;
  for (let i = 0; i < priceHistoryData.length; i += historyBatchSize) {
    const batch = priceHistoryData.slice(i, i + historyBatchSize);
    await prisma.priceHistory.createMany({ data: batch });
  }
  console.log(`✅ Creados ${priceHistoryData.length} registros de historial de precios.`);

  // 7. Contratos de alquiler
  console.log('📄 Creando contratos de alquiler para propiedades aprobadas en oferta ALQUILER...');
  const contractsData = [];
  const selectedRentals = rentalProperties.slice(0, 1500); // Hasta 1,500 contratos

  for (const rental of selectedRentals) {
    const id = randomUUID();
    // Inquilino es un propietario aleatorio diferente al dueño real de la propiedad
    let tenantId = ownerIds.at(Math.floor(Math.random() * ownerIds.length))!;
    while (tenantId === rental.ownerId) {
      tenantId = ownerIds.at(Math.floor(Math.random() * ownerIds.length))!;
    }

    const startDate = faker.date.past(365); // Iniciado el año pasado
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1); // 1 año de vigencia

    const today = new Date();
    let status: ContractStatus = ContractStatus.VIGENTE;
    if (endDate < today) {
      status = Math.random() > 0.85 ? ContractStatus.RESCINDIDO : ContractStatus.VENCIDO;
    } else {
      status = Math.random() > 0.95 ? ContractStatus.RESCINDIDO : ContractStatus.VIGENTE;
    }

    contractsData.push({
      id,
      propertyId: rental.id,
      tenantId,
      ownerId: rental.ownerId,
      startDate,
      endDate,
      monthlyAmount: rental.price,
      status,
      observations: status === ContractStatus.RESCINDIDO
        ? "Rescisión de mutuo acuerdo firmada de forma anticipada."
        : "Contrato estándar de arrendamiento visado por notaría de fe pública."
    });
  }

  await prisma.contract.createMany({ data: contractsData });
  console.log(`✅ Creados ${contractsData.length} contratos de alquiler.`);

  // 8. Pagos de alquiler asociados
  console.log('💰 Registrando transacciones y pagos mensuales para cada contrato...');
  const paymentsData = [];

  for (const contract of contractsData) {
    const { id: contractId, startDate, endDate, monthlyAmount, status } = contract;
    const today = new Date();
    
    // Determinamos cuántos meses transcurrieron del contrato
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    const endLimit = status === ContractStatus.VIGENTE ? today : endDate;
    
    const endYear = endLimit.getFullYear();
    const endMonth = endLimit.getMonth();
    
    const monthsDiff = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
    const paidMonthsCount = Math.max(1, monthsDiff);

    for (let m = 0; m < paidMonthsCount; m++) {
      const paymentDate = new Date(startDate);
      paymentDate.setMonth(paymentDate.getMonth() + m);
      paymentDate.setDate(Math.floor(Math.random() * 10) + 1);

      // Si el pago cae en el futuro, no lo creamos
      if (paymentDate > today) continue;

      const methods = ["TRANSFERENCIA", "EFECTIVO", "DEPOSITO_BANCARIO"];
      const paymentMethod = methods.at(Math.floor(Math.random() * methods.length))!;
      const refNumber = Math.floor(Math.random() * 900000) + 100000;
      const reference = paymentMethod !== "EFECTIVO" ? `TRF-${refNumber}` : null;

      paymentsData.push({
        id: randomUUID(),
        contractId,
        amount: monthlyAmount,
        paymentDate,
        paymentMethod,
        reference
      });
    }
  }

  // Guardar pagos en lotes de 2,000
  const paymentBatchSize = 2000;
  for (let i = 0; i < paymentsData.length; i += paymentBatchSize) {
    const batch = paymentsData.slice(i, i + paymentBatchSize);
    await prisma.payment.createMany({ data: batch });
  }
  console.log(`✅ Creadas ${paymentsData.length} transacciones de pago en el historial.`);

  // 9. Gastos asociados
  console.log('🛠️ Registrando gastos de mantenimiento y administración para 4,000 propiedades...');
  const expensesData = [];
  
  const expPropertyIndices = new Set<number>();
  while (expPropertyIndices.size < 4000) {
    expPropertyIndices.add(Math.floor(Math.random() * propertyIds.length));
  }

  for (const idx of expPropertyIndices) {
    const propId = propertyIds.at(idx)!;
    const numExp = Math.floor(Math.random() * 3) + 1; // 1 a 3 gastos
    
    for (let e = 0; e < numExp; e++) {
      const conceptGroup = expenseConcepts.at(Math.floor(Math.random() * expenseConcepts.length))!;
      const concept = conceptGroup.concepts.at(Math.floor(Math.random() * conceptGroup.concepts.length))!;
      const amount = parseFloat((Math.random() * 250 + 15).toFixed(2)); // $15 a $265
      const date = faker.date.past(120);

      expensesData.push({
        id: randomUUID(),
        concept,
        amount,
        date,
        propertyId: propId,
        category: conceptGroup.category
      });
    }
  }

  // Guardar en lotes de 2,000
  const expenseBatchSize = 2000;
  for (let i = 0; i < expensesData.length; i += expenseBatchSize) {
    const batch = expensesData.slice(i, i + expenseBatchSize);
    await prisma.expense.createMany({ data: batch });
  }
  console.log(`✅ Creados ${expensesData.length} gastos operativos de mantenimiento.`);

  console.log('\n🌟 📈 ¡SEMBRADO COMPLETO Y TOTALMENTE EXITOSO DE LA BASE DE DATOS DE PROPIO! 📈 🌟');
  console.log('========================================================================');
  console.log(`👥 Usuarios totales:       ${usersData.length}`);
  console.log(`🏢 Propiedades insertadas: ${propertiesData.length}`);
  console.log(`🎯 Leads generados:       ${leadsData.length}`);
  console.log(`🔔 Alertas creadas:        ${alertsData.length}`);
  console.log(`📈 Historiales de precios: ${priceHistoryData.length}`);
  console.log(`📄 Contratos vigentes/etc: ${contractsData.length}`);
  console.log(`💰 Pagos recolectados:     ${paymentsData.length}`);
  console.log(`🛠️ Gastos de propiedades:  ${expensesData.length}`);
  console.log('========================================================================');
}

main()
  .catch((e) => {
    console.error('❌ Error al ejecutar el script de seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

