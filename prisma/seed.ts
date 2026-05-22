import { 
  PrismaClient, 
  Role, 
  Currency, 
  PropertyType, 
  OfferType, 
  PropertyStatus, 
  LeadOrigin, 
  LeadStatus 
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Iniciando el restablecimiento de datos en la base de datos de Propio...');

  // 1. Limpieza de datos previa en orden inverso de dependencias para evitar violaciones de clave foránea
  console.log('🧹 Limpiando registros existentes (Leads, Propiedades, Usuarios)...');
  await prisma.lead.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Base de datos limpia y lista.');

  // 2. Creación secuencial de usuarios de prueba (Roles del Ecosistema)
  console.log('👥 Creando usuarios comerciales (Roles: ADMIN, AGENTE, PROPIETARIO)...');
  
  const admin = await prisma.user.create({
    data: {
      id: 'admin-1',
      email: 'admin@propio.com.bo',
      password: 'admin123PasswordSecure', // En producción se aplicará hashing de contraseñas
      name: 'Administrador Propio',
      role: Role.ADMIN,
    },
  });

  const agent = await prisma.user.create({
    data: {
      id: 'agent-1',
      email: 'agent@propio.com.bo',
      password: 'agent123PasswordSecure',
      name: 'Agente Estrella',
      role: Role.AGENTE,
    },
  });

  const owner = await prisma.user.create({
    data: {
      id: 'owner-1',
      email: 'owner@propio.com.bo',
      password: 'owner123PasswordSecure',
      name: 'Propietario Legítimo',
      role: Role.PROPIETARIO,
    },
  });

  console.log(`✅ Usuarios creados: Admin (${admin.email}), Agente (${agent.email}), Propietario (${owner.email}).`);

  // 3. Creación de propiedades de prueba en Cochabamba (En estado NUEVA_PUBLICACION)
  console.log('🏢 Creando inmuebles captados en Cochabamba vinculados al Propietario...');

  const propCalaCala = await prisma.property.create({
    data: {
      id: 'prop-1-cala-cala',
      title: 'Hermosa Casa Familiar en Cala Cala',
      description: 'Amplia casa de dos plantas con jardín interior, churrasquera y seguridad las 24 horas.',
      price: 320000,
      minPrice: 300000, // Invisible para clientes
      currency: Currency.USD,
      type: PropertyType.CASA,
      offerType: OfferType.VENTA,
      location: 'Cala Cala, Cochabamba',
      address: 'Calle Tarija Nro. 1420',
      imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
      rooms: 5,
      bathrooms: 4,
      area: 350.0,
      latitude: -17.3780,
      longitude: -66.1620,
      isVerified: false,
      status: PropertyStatus.NUEVA_PUBLICACION,
      ownerId: 'owner-1',
      // Documentos cargados parcialmente para simulación de checklist
      hasFolioReal: true,
      hasCatastro: true,
      hasCI: true,
    },
  });

  const propQueruQueru = await prisma.property.create({
    data: {
      id: 'prop-2-queru-queru',
      title: 'Penthouse de Lujo en Queru Queru',
      description: 'Espectacular penthouse de estreno con terraza panorámica, jacuzzi y acabados de primera.',
      price: 185000,
      minPrice: 175000,
      currency: Currency.USD,
      type: PropertyType.DEPARTAMENTO,
      offerType: OfferType.VENTA,
      location: 'Queru Queru, Cochabamba',
      address: 'Av. América Este Nro. 450, Edificio Skyview',
      imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
      rooms: 4,
      bathrooms: 3,
      area: 195.0,
      latitude: -17.3750,
      longitude: -66.1520,
      isVerified: false,
      status: PropertyStatus.NUEVA_PUBLICACION,
      ownerId: 'owner-1',
      hasFolioReal: true,
      hasCatastro: true,
      hasTestimonio: true,
      hasCI: true,
    },
  });

  const propPrado = await prisma.property.create({
    data: {
      id: 'prop-3-el-prado',
      title: 'Departamento de Estreno en El Prado',
      description: 'Departamento de 2 habitaciones en pleno Prado, ideal para inversión con alta rentabilidad de alquiler.',
      price: 95000,
      minPrice: 90000,
      currency: Currency.USD,
      type: PropertyType.DEPARTAMENTO,
      offerType: OfferType.ALQUILER,
      location: 'El Prado, Cochabamba',
      address: 'Av. Ballivián Nro. 780',
      imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
      rooms: 2,
      bathrooms: 2,
      area: 85.0,
      latitude: -17.3880,
      longitude: -66.1550,
      isVerified: false,
      status: PropertyStatus.NUEVA_PUBLICACION,
      ownerId: 'owner-1',
      hasCI: true,
    },
  });

  console.log('✅ Propiedades creadas exitosamente.');

  // 4. Creación de prospectos (Leads) de prueba asignados al Agente
  console.log('🎯 Creando prospectos comerciales (Leads) asignados al Agente...');

  const lead1 = await prisma.lead.create({
    data: {
      id: 'lead-1',
      name: 'Alejandro Camacho',
      phone: '+591 70712345',
      email: 'acamacho@gmail.com',
      message: 'Interesado en coordinar una visita al Penthouse en Queru Queru.',
      origin: LeadOrigin.WEB,
      status: LeadStatus.LEAD_ENTRANTE,
      propertyId: 'prop-2-queru-queru',
      assignedAgentId: 'agent-1',
    },
  });

  const lead2 = await prisma.lead.create({
    data: {
      id: 'lead-2',
      name: 'Sofia Rojas',
      phone: '+591 72233445',
      email: 'srojas@hotmail.com',
      message: 'Consultó por financiamiento bancario para la Casa en Cala Cala.',
      origin: LeadOrigin.WHATSAPP,
      status: LeadStatus.CITA_AGENDADA,
      propertyId: 'prop-1-cala-cala',
      assignedAgentId: 'agent-1',
    },
  });

  console.log(`✅ Leads creados: ${lead1.name} y ${lead2.name}. Ambos asignados al Agente 'agent-1'.`);
  console.log('🚀 ¡Población de datos comerciales del ecosistema Propio finalizada con éxito!');
}

main()
  .catch((e) => {
    console.error('❌ Error al ejecutar el script de seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
