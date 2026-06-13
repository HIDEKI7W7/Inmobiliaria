'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getToken, getCurrentUser } from '@/utils/session';
import { DaysOnMarketBadge } from '@/components/ui/DaysOnMarketBadge';
import { PriceTrendChart } from '@/components/ui/PriceTrendChart';
import { PropertyAlertForm } from '@/components/ui/PropertyAlertForm';
import { useFavorites } from '@/context/FavoritesContext';

// Importación dinámica del Mini Mapa para evitar problemas de hidratación en Next.js
const MiniMap = dynamic(() => import('@/components/modules/properties/MiniMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 rounded-3xl flex flex-col items-center justify-center space-y-3 p-6 text-center animate-pulse border border-slate-200">
      <div className="w-8 h-8 rounded-full border-2 border-dashed border-[#b9fa3c] animate-spin"></div>
      <p className="text-xs text-slate-400 font-sans tracking-wider uppercase">Cargando cartografía...</p>
    </div>
  )
});

interface PriceHistory {
  date: string;
  event: string;
  price: number;
}

interface Agent {
  id: string;
  name: string;
  agency: string;
  stars: number;
  phone: string;
  avatar: string;
}

// Catálogo simulado de inmuebles
const PROPERTIES_CATALOG: Record<string, any> = {
  'prop-1-queru-queru': {
    id: 'prop-1-queru-queru',
    code: 'PRP-001-CBBA',
    title: 'Penthouse de Lujo en Queru Queru',
    price: 183908.0,
    priceBob: 1280000.0,
    beds: 4,
    baths: 3,
    m2: 195,
    address: 'Calle Queru Queru #100, Queru Queru',
    city: 'Cochabamba, Bolivia',
    verified: true,
    offerType: 'VENTA',
    description: 'Espectacular penthouse de estreno con terraza panorámica, jacuzzi y acabados de primera. Suite principal con vestidor, Terraza privada con vista panorámica, Parqueo subterráneo techado. Superficie Terreno: 0 m²\nSuperficie Construida: 195 m²\nAtributos: Suite Master, Terraza, Parqueo Techado',
    amenities: ['SUITE CON VESTIDOR', 'TERRAZA PRIVADA', 'VISTA PANORÁMICA', 'PARQUEO SUBTERRÁNEO', 'DOCUMENTACIÓN AL DÍA'],
    history: [{ date: '12/06/2026', event: 'Publicación Inicial', price: 183908.0 }],
    coordinates: { lat: -17.3750, lng: -66.1520 },
    docs: { folioReal: true, catastro: true, testimonio: true, impuestos: true, plano: true, ci: true },
    images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80']
  },
  'prop-2-cala-cala': {
    id: 'prop-2-cala-cala',
    code: 'PRP-002-CBBA',
    title: 'Casa Familiar de Estilo Moderno',
    price: 318965.0,
    priceBob: 2220000.0,
    beds: 5,
    baths: 4,
    m2: 250,
    address: 'Av. Circunvalación #200, Cala Cala',
    city: 'Cochabamba, Bolivia',
    verified: true,
    offerType: 'VENTA',
    description: 'Amplia casa de dos plantas con jardín interior, churrasquera y seguridad las 24 horas. Cocina remodelada, Jardín interior amplio, Churrasquero propio. Superficie Terreno: 350 m²\nSuperficie Construida: 250 m²\nAtributos: Jardín, Churrasquera/Parrillero, Cocina Equipada',
    amenities: ['COCINA REMODELADA', 'JARDÍN INTERIOR', 'CHURRASQUERO PROPIO', 'PARQUEO DOBLE', 'SEGURIDAD 24/7'],
    history: [{ date: '12/06/2026', event: 'Publicación Inicial', price: 318965.0 }],
    coordinates: { lat: -17.3780, lng: -66.1620 },
    docs: { folioReal: true, catastro: true, testimonio: true, impuestos: true, plano: true, ci: true },
    images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80']
  },
  'prop-3-el-prado': {
    id: 'prop-3-el-prado',
    code: 'PRP-003-LPZ',
    title: 'Departamento de Estreno en El Prado',
    price: 93390.0,
    priceBob: 650000.0,
    beds: 2,
    baths: 2,
    m2: 85,
    address: 'Av. 16 de Julio #300, El Prado',
    city: 'La Paz, Bolivia',
    verified: false,
    offerType: 'VENTA',
    description: 'Departamento de estreno en pleno Prado. Iluminación LED inteligente, Conexión de Gas Domiciliario. Superficie Terreno: 0 m²\nSuperficie Construida: 85 m²\nAtributos: Iluminación LED',
    amenities: ['ILUMINACIÓN LED', 'GAS DOMICILIARIO', 'ESTRENO', 'UBICACIÓN CÉNTRICA'],
    history: [{ date: '12/06/2026', event: 'Publicación Inicial', price: 93390.0 }],
    coordinates: { lat: -16.5020, lng: -68.1220 },
    docs: { folioReal: false, catastro: false, testimonio: false, impuestos: false, plano: false, ci: false },
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80']
  },
  'prop-4-villa-adela': {
    id: 'prop-4-villa-adela',
    code: 'PRP-004-LPZ',
    title: 'Galpón Industrial de Alta Capacidad',
    price: 495689.0,
    priceBob: 3450000.0,
    beds: 0,
    baths: 2,
    m2: 900,
    address: 'Zona Villa Adela, Calle 4',
    city: 'La Paz, Bolivia',
    verified: true,
    offerType: 'VENTA',
    description: 'Amplio galpón industrial en Villa Adela. Cerco eléctrico perimetral, Tanque de agua de gran capacidad, Generador eléctrico de emergencia. Superficie Terreno: 1200 m²\nSuperficie Construida: 900 m²',
    amenities: ['CERCO ELÉCTRICO', 'TANQUE DE AGUA', 'GENERADOR DE EMERGENCIA', 'INGRESO CAMIONES'],
    history: [{ date: '12/06/2026', event: 'Publicación Inicial', price: 495689.0 }],
    coordinates: { lat: -16.5120, lng: -68.1920 },
    docs: { folioReal: true, catastro: true, testimonio: true, impuestos: true, plano: true, ci: true },
    images: ['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80']
  },
  'prop-5-banzer': {
    id: 'prop-5-banzer',
    code: 'PRP-005-SCZ',
    title: 'Terreno Premium Comercial',
    price: 270114.0,
    priceBob: 1880000.0,
    beds: 0,
    baths: 0,
    m2: 600,
    address: 'Av. Banzer entre 4to y 5to Anillo',
    city: 'Santa Cruz, Bolivia',
    verified: true,
    offerType: 'VENTA',
    description: 'Excelente terreno plano comercial sobre Av. Banzer. Lote Premium (en esquina, frente a área verde). Superficie Terreno: 600 m²\nSuperficie Construida: 0 m²',
    amenities: ['LOTE EN ESQUINA', 'FRENTE A ÁREA VERDE', 'ALTA PLUSVALÍA', 'AV. PRINCIPAL'],
    history: [{ date: '12/06/2026', event: 'Publicación Inicial', price: 270114.0 }],
    coordinates: { lat: -17.7420, lng: -63.1620 },
    docs: { folioReal: true, catastro: true, testimonio: true, impuestos: true, plano: true, ci: true },
    images: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80']
  },
  'prop-6-equipetrol': {
    id: 'prop-6-equipetrol',
    code: 'PRP-006-SCZ',
    title: 'Monoambiente Amoblado para Ejecutivos',
    price: 459.0,
    priceBob: 3200.0,
    beds: 1,
    baths: 1,
    m2: 42,
    address: 'Equipetrol Calle 8 Oeste',
    city: 'Santa Cruz, Bolivia',
    verified: true,
    offerType: 'ALQUILER',
    description: 'Precioso monoambiente totalmente equipado en Equipetrol. Seguridad de vigilancia 24/7, Piscina atemperada, Gimnasio equipado. Superficie Terreno: 0 m²\nSuperficie Construida: 42 m²\nAtributos: Amoblado, Seguridad 24/7, Gimnasio',
    amenities: ['AMOBLADO', 'SEGURIDAD 24/7', 'PISCINA ATEMPERADA', 'GIMNASIO EQUIPADO'],
    history: [{ date: '12/06/2026', event: 'Publicación Inicial', price: 459.0 }],
    coordinates: { lat: -17.7620, lng: -63.1920 },
    docs: { folioReal: true, catastro: true, testimonio: true, impuestos: true, plano: true, ci: true },
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80']
  },
  'prop-7-central': {
    id: 'prop-7-central',
    code: 'PRP-007-LPZ',
    title: 'Oficina Corporativa Central',
    price: 1077.0,
    priceBob: 7500.0,
    beds: 0,
    baths: 2,
    m2: 110,
    address: 'Av. Mariscal Santa Cruz #1200',
    city: 'La Paz, Bolivia',
    verified: true,
    offerType: 'ALQUILER',
    description: 'Oficina ejecutiva de alto nivel en zona central. Control de acceso biométrico, Circuito cerrado de cámaras, Coworking space. Superficie Terreno: 0 m²\nSuperficie Construida: 110 m²\nAtributos: Cámaras de Vigilancia, Seguridad 24/7',
    amenities: ['ACCESO BIOMÉTRICO', 'CIRCUITO CERRADO CCTV', 'COWORKING SPACE', 'UBICACIÓN CENTRAL'],
    history: [{ date: '12/06/2026', event: 'Publicación Inicial', price: 1077.0 }],
    coordinates: { lat: -16.5005, lng: -68.1305 },
    docs: { folioReal: true, catastro: true, testimonio: true, impuestos: true, plano: true, ci: true },
    images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80']
  },
  'prop-8-america': {
    id: 'prop-8-america',
    code: 'PRP-008-CBBA',
    title: 'Local Comercial en Planta Baja',
    price: 1408.0,
    priceBob: 9800.0,
    beds: 0,
    baths: 1,
    m2: 130,
    address: 'Av. América Oeste Nro 450',
    city: 'Cochabamba, Bolivia',
    verified: false,
    offerType: 'ALQUILER',
    description: 'Local comercial amplio sobre Av. América. Iluminación LED inteligente, Chapas digitales / cerraduras inteligentes. Superficie Terreno: 0 m²\nSuperficie Construida: 130 m²\nAtributos: Iluminación LED, Seguridad 24/7',
    amenities: ['CERRADURA INTELIGENTE', 'ILUMINACIÓN LED', 'PLANTA BAJA', 'ALTO TRÁFICO'],
    history: [{ date: '12/06/2026', event: 'Publicación Inicial', price: 1408.0 }],
    coordinates: { lat: -17.3715, lng: -66.1518 },
    docs: { folioReal: false, catastro: false, testimonio: false, impuestos: false, plano: false, ci: false },
    images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80']
  },
  'prop-9-san-roque': {
    id: 'prop-9-san-roque',
    code: 'PRP-009-CHQ',
    title: 'Garzonier Económico',
    price: 258.0,
    priceBob: 1800.0,
    beds: 1,
    baths: 1,
    m2: 55,
    address: 'Zona San Roque Calle Bustillos',
    city: 'Chuquisaca, Bolivia',
    verified: false,
    offerType: 'ALQUILER',
    description: 'Cómodo garzonier en zona San Roque. Conexión de Gas Domiciliario instalada. Superficie Terreno: 0 m²\nSuperficie Construida: 55 m²',
    amenities: ['GAS DOMICILIARIO', 'ECONÓMICO', 'ZONA TRANQUILA'],
    history: [{ date: '12/06/2026', event: 'Publicación Inicial', price: 258.0 }],
    coordinates: { lat: -19.0435, lng: -65.2595 },
    docs: { folioReal: false, catastro: false, testimonio: false, impuestos: false, plano: false, ci: false },
    images: ['https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80']
  },
  'prop-10-panosas': {
    id: 'prop-10-panosas',
    code: 'PRP-010-TJA',
    title: 'Casa en Condominio Cerrado',
    price: 718.0,
    priceBob: 5000.0,
    beds: 3,
    baths: 3,
    m2: 210,
    address: 'Condominio Las Panosas Norte',
    city: 'Tarija, Bolivia',
    verified: true,
    offerType: 'ALQUILER',
    description: 'Casa elegante en condominio privado. Churrasquero propio, Áreas de juegos infantiles, Seguridad de vigilancia 24/7. Superficie Terreno: 300 m²\nSuperficie Construida: 210 m²\nAtributos: Jardín, Churrasquera/Parrillero, Seguridad 24/7',
    amenities: ['CHURRASQUERO', 'JUEGOS INFANTILES', 'SEGURIDAD 24/7', 'JARDÍN'],
    history: [{ date: '12/06/2026', event: 'Publicación Inicial', price: 718.0 }],
    coordinates: { lat: -21.5305, lng: -64.7355 },
    docs: { folioReal: true, catastro: true, testimonio: true, impuestos: true, plano: true, ci: true },
    images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80']
  },
  'prop-11-sarco': {
    id: 'prop-11-sarco',
    code: 'PRP-011-CBBA',
    title: 'Departamento Familiar Amplio',
    price: 35201.0,
    priceBob: 245000.0,
    beds: 3,
    baths: 2,
    m2: 120,
    address: 'Zona Sarco Calle Las Magnolias',
    city: 'Cochabamba, Bolivia',
    verified: true,
    offerType: 'ANTICRETICO',
    description: 'Amplio departamento ideal para familias en Sarco. Parqueo doble, Baulera amplia, Conexión de Gas Domiciliario instalada. Superficie Terreno: 0 m²\nSuperficie Construida: 120 m²\nAtributos: Parqueo Techado, Baulera',
    amenities: ['PARQUEO DOBLE', 'BAULERA AMPLIA', 'GAS DOMICILIARIO', 'AMPLITUD'],
    history: [{ date: '12/06/2026', event: 'Publicación Inicial', price: 35201.0 }],
    coordinates: { lat: -17.3790, lng: -66.1730 },
    docs: { folioReal: true, catastro: true, testimonio: true, impuestos: true, plano: true, ci: true },
    images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80']
  },
  'prop-12-sopocachi': {
    id: 'prop-12-sopocachi',
    code: 'PRP-012-LPZ',
    title: 'Monoambiente Minimalista',
    price: 15086.0,
    priceBob: 105000.0,
    beds: 1,
    baths: 1,
    m2: 38,
    address: 'Sopocachi Calle Ecuador',
    city: 'La Paz, Bolivia',
    verified: false,
    offerType: 'ANTICRETICO',
    description: 'Moderno monoambiente de diseño minimalista en Sopocachi. Edificio pet-friendly, Control de acceso biométrico. Superficie Terreno: 0 m²\nSuperficie Construida: 38 m²\nAtributos: Seguridad 24/7',
    amenities: ['MINIMALISTA', 'PET-FRIENDLY', 'ACCESO BIOMÉTRICO', 'CÉNTRICO'],
    history: [{ date: '12/06/2026', event: 'Publicación Inicial', price: 15086.0 }],
    coordinates: { lat: -16.5120, lng: -68.1260 },
    docs: { folioReal: false, catastro: false, testimonio: false, impuestos: false, plano: false, ci: false },
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80']
  },
  'prop-13-sud': {
    id: 'prop-13-sud',
    code: 'PRP-013-ORU',
    title: 'Casa Independiente',
    price: 45258.0,
    priceBob: 315000.0,
    beds: 4,
    baths: 3,
    m2: 160,
    address: 'Zona Sud Av. Deheza',
    city: 'Oruro, Bolivia',
    verified: true,
    offerType: 'ANTICRETICO',
    description: 'Casa independiente cómoda en Oruro. Tanque de agua de gran capacidad, Jardín interior, Garaje amplio. Superficie Terreno: 280 m²\nSuperficie Construida: 160 m²\nAtributos: Jardín, Garaje con Portón Eléctrico',
    amenities: ['TANQUE DE AGUA', 'JARDÍN INTERIOR', 'GARAJE AMPLIO', 'INDEPENDIENTE'],
    history: [{ date: '12/06/2026', event: 'Publicación Inicial', price: 45258.0 }],
    coordinates: { lat: -17.9860, lng: -67.1480 },
    docs: { folioReal: true, catastro: true, testimonio: true, impuestos: true, plano: true, ci: true },
    images: ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80']
  },
  'prop-14-satelite': {
    id: 'prop-14-satelite',
    code: 'PRP-014-POT',
    title: 'Garzonier en Planta Alta',
    price: 12931.0,
    priceBob: 90000.0,
    beds: 1,
    baths: 1,
    m2: 50,
    address: 'Ciudad Satélite Calle 5',
    city: 'Potosí, Bolivia',
    verified: false,
    offerType: 'ANTICRETICO',
    description: 'Cómodo garzonier soleado en Ciudad Satélite. Calefón a gas o termotanque solar instalado. Superficie Terreno: 0 m²\nSuperficie Construida: 50 m²',
    amenities: ['CALEFÓN A GAS', 'TERMOTANQUE SOLAR', 'SOLEADO', 'PLANTA ALTA'],
    history: [{ date: '12/06/2026', event: 'Publicación Inicial', price: 12931.0 }],
    coordinates: { lat: -19.5780, lng: -65.7480 },
    docs: { folioReal: false, catastro: false, testimonio: false, impuestos: false, plano: false, ci: false },
    images: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80']
  },
  'prop-15-sucre-central': {
    id: 'prop-15-sucre-central',
    code: 'PRP-015-CHQ',
    title: 'Oficina para Consultorios',
    price: 20114.0,
    priceBob: 140000.0,
    beds: 0,
    baths: 1,
    m2: 65,
    address: 'Zona Central Calle Calvo',
    city: 'Chuquisaca, Bolivia',
    verified: true,
    offerType: 'ANTICRETICO',
    description: 'Oficina adaptada para consultorios en pleno centro. Iluminación LED inteligente, Chapas digitales / cerraduras inteligentes. Superficie Terreno: 0 m²\nSuperficie Construida: 65 m²\nAtributos: Iluminación LED',
    amenities: ['ADAPTADA CONSULTORIOS', 'ILUMINACIÓN LED', 'CERRADURA INTELIGENTE', 'UBICACIÓN CENTRAL'],
    history: [{ date: '12/06/2026', event: 'Publicación Inicial', price: 20114.0 }],
    coordinates: { lat: -19.0350, lng: -65.2610 },
    docs: { folioReal: true, catastro: true, testimonio: true, impuestos: true, plano: true, ci: true },
    images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80']
  },
  'prop-16-urubo': {
    id: 'prop-16-urubo',
    code: 'PRP-016-SCZ',
    title: 'Condominio de Casas Premium (En Planos)',
    price: 280172.0,
    priceBob: 1950000.0,
    beds: 4,
    baths: 4,
    m2: 280,
    address: 'Urubó Condominio Privado',
    city: 'Santa Cruz, Bolivia',
    verified: true,
    offerType: 'PROYECTO',
    description: 'Proyecto residencial en preventa en el Urubó. Club House, Piscina atemperada, Domótica, Aislamiento acústico y térmico. Superficie Terreno: 400 m²\nSuperficie Construida: 280 m²\nAtributos: Piscina Común, Salón de Eventos, Seguridad 24/7',
    amenities: ['CLUB HOUSE', 'PISCINA ATEMPERADA', 'DOMÓTICA', 'AISLAMIENTO ACÚSTICO', 'PREVENTA'],
    history: [{ date: '12/06/2026', event: 'Publicación Inicial', price: 280172.0 }],
    coordinates: { lat: -17.7720, lng: -63.2120 },
    docs: { folioReal: true, catastro: true, testimonio: true, impuestos: true, plano: true, ci: true },
    images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80']
  },
  'prop-17-tupuraya': {
    id: 'prop-17-tupuraya',
    code: 'PRP-017-CBBA',
    title: 'Edificio de Departamentos Eco-Smart',
    price: 84770.0,
    priceBob: 590000.0,
    beds: 2,
    baths: 2,
    m2: 78,
    address: 'Tupuraya Calle Ciclovía',
    city: 'Cochabamba, Bolivia',
    verified: true,
    offerType: 'PROYECTO',
    description: 'Preventa de departamentos sostenibles en Tupuraya. Termotanque solar instalado, Iluminación LED inteligente, Coworking space. Superficie Terreno: 0 m²\nSuperficie Construida: 78 m²\nAtributos: Calefón Solar, Iluminación LED',
    amenities: ['EDIFICIO ECO-SMART', 'TERMOTANQUE SOLAR', 'ILUMINACIÓN LED', 'COWORKING SPACE'],
    history: [{ date: '12/06/2026', event: 'Publicación Inicial', price: 84770.0 }],
    coordinates: { lat: -17.3780, lng: -66.1420 },
    docs: { folioReal: true, catastro: true, testimonio: true, impuestos: true, plano: true, ci: true },
    images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80']
  },
  'prop-18-riberalta': {
    id: 'prop-18-riberalta',
    code: 'PRP-018-BEN',
    title: 'Complejo Hotelero y Suites',
    price: 833333.0,
    priceBob: 5800000.0,
    beds: 25,
    baths: 30,
    m2: 1800,
    address: 'Riberalta Centro Av. Principal',
    city: 'Beni, Bolivia',
    verified: true,
    offerType: 'PROYECTO',
    description: 'Inversión comercial de gran envergadura en Riberalta. Generador eléctrico de emergencia, Tanque de agua de gran capacidad, Circuito cerrado de cámaras (CCTV). Superficie Terreno: 2500 m²\nSuperficie Construida: 1800 m²',
    amenities: ['COMPLEJO HOTELERO', 'GENERADOR EMERGENCIA', 'CCTV CAMARAS', 'TANQUE AGUA GRANDE'],
    history: [{ date: '12/06/2026', event: 'Publicación Inicial', price: 833333.0 }],
    coordinates: { lat: -14.8350, lng: -64.8980 },
    docs: { folioReal: true, catastro: true, testimonio: true, impuestos: true, plano: true, ci: true },
    images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80']
  },
  'prop-19-cobija': {
    id: 'prop-19-cobija',
    code: 'PRP-019-PAN',
    title: 'Urbanización Comercial Estratégica',
    price: 50287.0,
    priceBob: 350000.0,
    beds: 0,
    baths: 0,
    m2: 500,
    address: 'Cobija Oeste Loteamento',
    city: 'Pando, Bolivia',
    verified: false,
    offerType: 'PROYECTO',
    description: 'Lotes comerciales en Cobija Oeste. Lote Premium (en esquina, frente a área verde). Superficie Terreno: 500 m²\nSuperficie Construida: 0 m²',
    amenities: ['LOTE EN ESQUINA', 'URBANIZACIÓN', 'FRENTE ÁREA VERDE', 'COMERCIAL'],
    history: [{ date: '12/06/2026', event: 'Publicación Inicial', price: 50287.0 }],
    coordinates: { lat: -11.0220, lng: -68.7520 },
    docs: { folioReal: false, catastro: false, testimonio: false, impuestos: false, plano: false, ci: false },
    images: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80']
  },
  'prop-20-sirari': {
    id: 'prop-20-sirari',
    code: 'PRP-020-SCZ',
    title: 'Edificio Corporativo y de Oficinas',
    price: 1278735.0,
    priceBob: 8900000.0,
    beds: 0,
    baths: 12,
    m2: 2400,
    address: '4to Anillo Sirari Edificio Corporativo',
    city: 'Santa Cruz, Bolivia',
    verified: true,
    offerType: 'PROYECTO',
    description: 'Edificio corporativo de oficinas premium en Sirari. Control de acceso biométrico, Circuito cerrado de cámaras, Parqueo para visitas en el edificio. Superficie Terreno: 800 m²\nSuperficie Construida: 2400 m²\nAtributos: Parqueo de Visitas, Seguridad 24/7',
    amenities: ['EDIFICIO ENTERO', 'ACCESO BIOMÉTRICO', 'CCTV CAMARAS', 'PARQUEO VISITAS'],
    history: [{ date: '12/06/2026', event: 'Publicación Inicial', price: 1278735.0 }],
    coordinates: { lat: -17.7650, lng: -63.1750 },
    docs: { folioReal: true, catastro: true, testimonio: true, impuestos: true, plano: true, ci: true },
    images: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80']
  }
};


const DEFAULT_PROPERTY = {
  id: 'prop-default',
  code: 'PRP-DFT-CBBA',
  title: 'Residencia Premium del Bosque',
  price: 320000,
  beds: 4,
  baths: 3,
  m2: 285,
  address: "Av. América Oeste #1420, Queru Queru Norte",
  city: "Cochabamba, Bolivia",
  verified: true,
  offerType: 'VENTA',
  description: 'Exclusivo inmueble de arquitectura contemporánea con orientación solar inmejorable. Destaca por sus acabados de lujo, cocina de diseño con isla central, climatización domotizada y amplios ventanales termoacústicos de piso a techo que expanden la iluminación natural.',
  amenities: ["COCINA REMODELADA", "LOTE PREMIUM", "PRIVACIDAD ABSOLUTA", "DOMÓTICA INTEGRADA", "PARQUEO DOBLE", "SEGURIDAD 24/7"],
  history: [
    { date: "15/05/2026", event: "Aprobado en Propio", price: 320000 },
    { date: "02/04/2026", event: "Cambio de precio", price: 335000 },
    { date: "10/03/2026", event: "Publicación Inicial", price: 350000 }
  ] as PriceHistory[],
  coordinates: { lat: -17.3680, lng: -66.1590 },
  docs: { folioReal: true, catastro: true, testimonio: true, impuestos: true, plano: true, ci: true },
  images: [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80'
  ]
};

const staffAgents: Agent[] = [
  { id: 'age_1', name: 'Carlos Mendoza', agency: 'Propio Premium Staff', stars: 5.0, phone: '+591 72345678', avatar: 'CM' },
  { id: 'age_2', name: 'Ana María Rojas', agency: 'Propio Cochabamba Norte', stars: 4.9, phone: '+591 70112233', avatar: 'AR' },
  { id: 'age_3', name: 'Bryan Salirrosas', agency: 'Propio VIP Sales', stars: 5.0, phone: '+591 71987654', avatar: 'BS' }
];

interface PropertyDetailClientProps {
  propertyId: string;
  initialIsFavorited: boolean;
  initialToken: string | null;
}

export function PropertyDetailClient({
  propertyId,
  initialIsFavorited,
  initialToken,
}: PropertyDetailClientProps) {
  const currentProperty = PROPERTIES_CATALOG[propertyId] || { ...DEFAULT_PROPERTY, id: propertyId };

  const router = useRouter();
  const { isFavorited: isFavGlobal, toggleFavorite, favorites, loading } = useFavorites();
  const [isFavorited, setIsFavorited] = useState<boolean>(initialIsFavorited);
  const [token, setToken] = useState<string | null>(initialToken);
  const [authLoaded, setAuthLoaded] = useState<boolean>(!!initialToken);

  // Efecto de ciclo de vida para cargar de forma reactiva la sesión
  useEffect(() => {
    const activeToken = getToken();
    if (activeToken) {
      setToken(activeToken);
    }
    setAuthLoaded(true);
  }, []);

  useEffect(() => {
    if (!authLoaded) return; // Esperar a que la autenticación se haya cargado del localStorage

    const recordPropertyView = async () => {
      const activeToken = token || getToken();
      
      // AUDITORÍA DE ID REAL: Extraemos explícitamente el identificador interno de base de datos
      // del objeto de propiedad (currentProperty.id) para evitar inconsistencias con slugs de URL.
      const propertyDbId = currentProperty.id;

      if (propertyDbId && activeToken) {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

        // REGISTRO INMEDIATO EN HISTORIAL DE VISTAS (Al cargar la página y verificar sesión)
        fetch(`${apiBaseUrl}/historial-vistas/${propertyDbId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeToken}`,
          },
        }).catch(err => console.error("Error al registrar historial de vista:", err));
      }

      // Local storage fallback for view history
      try {
        const localViews = localStorage.getItem('propio_recent_views');
        let viewsArray: string[] = localViews ? JSON.parse(localViews) : [];
        viewsArray = viewsArray.filter(id => id !== propertyDbId);
        viewsArray.unshift(propertyDbId);
        localStorage.setItem('propio_recent_views', JSON.stringify(viewsArray.slice(0, 10)));
      } catch (err) {
        console.error('Error writing to local recent views:', err);
      }
    };

    recordPropertyView();
  }, [currentProperty.id, token, authLoaded]);

  // Sincronizar el estado de favoritos con el contexto global de favoritos
  useEffect(() => {
    if (!loading) {
      setIsFavorited(isFavGlobal(currentProperty.id));
    }
  }, [favorites, currentProperty.id, isFavGlobal, loading]);

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const token = getToken();
    const user = getCurrentUser();
    if (!token || !user) {
      router.push(`/login?redirect=/properties/${currentProperty.id}`);
      return;
    }

    // AUDITORÍA DE ID REAL: Extraemos y usamos el ID interno de la base de datos (currentProperty.id)
    // para realizar el toggle de favoritos de forma 100% persistente y evitar el cruce de slugs.
    const propertyDbId = currentProperty.id;
    if (!propertyDbId) {
      console.error('Error: Identificador interno de base de datos no definido.');
      return;
    }

    const newFavState = await toggleFavorite(propertyDbId);
    setIsFavorited(newFavState);
  };

  const [activeTab, setActiveTab] = useState<'fotos' | 'mapa' | '3d' | 'plano'>('fotos');
  const [selectedAgent, setSelectedAgent] = useState<string>('age_1');
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [showQR, setShowQR] = useState<boolean>(false);

  // Estados del Formulario de Agendamiento de Visitas
  const [showAppointmentModal, setShowAppointmentModal] = useState<boolean>(false);
  const [appointmentName, setAppointmentName] = useState<string>('');
  const [appointmentWhatsApp, setAppointmentWhatsApp] = useState<string>('');
  const [appointmentEmail, setAppointmentEmail] = useState<string>('');
  const [appointmentDate, setAppointmentDate] = useState<string>('');
  const [appointmentTime, setAppointmentTime] = useState<string>('');
  const [appointmentSuccessMsg, setAppointmentSuccessMsg] = useState<string>('');

  useEffect(() => {
    const user = getCurrentUser() as any;
    if (user) {
      setAppointmentName(user.name || '');
      setAppointmentEmail(user.email || '');
      setAppointmentWhatsApp(user.whatsappPhone || user.phone || '');
    }
  }, [showAppointmentModal]);

  // ─── Estados Interactivos de la Calculadora Hipotecaria Real ───
  const [downPayment, setDownPayment] = useState<number>(Math.round(currentProperty.price * 0.2));
  const [interestRate, setInterestRate] = useState<number>(5.5); // Tasa anual en %
  const [loanTerm, setLoanTerm] = useState<number>(20); // Plazo en años

  // Estados interactivos 3D y Plano
  const [active3DRoom, setActive3DRoom] = useState<'fachada' | 'cocina' | 'sala'>('fachada');
  const room3DImages = {
    fachada: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    cocina: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    sala: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80'
  };
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);

  const currentAgent = staffAgents.find(a => a.id === selectedAgent) || staffAgents[0];

  // Cálculo matemático en tiempo real para la calculadora hipotecaria
  const mortgageResults = useMemo(() => {
    const principal = currentProperty.price - downPayment;
    if (principal <= 0) {
      return {
        monthlyPrincipalInterest: 0,
        monthlyTax: 0,
        monthlyInsurance: 0,
        totalMonthly: 0,
        percentages: { principalInterest: 0, tax: 0, insurance: 0 }
      };
    }

    const monthlyRate = (interestRate / 100) / 12;
    const totalMonths = loanTerm * 12;

    // Fórmula del amortizador estándar francés
    let monthlyPrincipalInterest = 0;
    if (monthlyRate === 0) {
      monthlyPrincipalInterest = principal / totalMonths;
    } else {
      monthlyPrincipalInterest = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    }

    // Impuesto predial anual simulado: 0.1% de la propiedad, mensualizado
    const monthlyTax = (currentProperty.price * 0.001) / 12;
    
    // Seguro de hogar anual simulado: 0.05% de la propiedad, mensualizado
    const monthlyInsurance = (currentProperty.price * 0.0005) / 12;

    const totalMonthly = monthlyPrincipalInterest + monthlyTax + monthlyInsurance;

    const pctPrincipalInterest = Math.round((monthlyPrincipalInterest / totalMonthly) * 100);
    const pctTax = Math.round((monthlyTax / totalMonthly) * 100);
    const pctInsurance = 100 - pctPrincipalInterest - pctTax;

    return {
      monthlyPrincipalInterest: Math.round(monthlyPrincipalInterest),
      monthlyTax: Math.round(monthlyTax),
      monthlyInsurance: Math.round(monthlyInsurance),
      totalMonthly: Math.round(totalMonthly),
      percentages: {
        principalInterest: pctPrincipalInterest,
        tax: pctTax,
        insurance: pctInsurance
      }
    };
  }, [currentProperty.price, downPayment, interestRate, loanTerm]);

  const whatsappMsg = encodeURIComponent(
    `Hola ${currentAgent.name}, me interesa el inmueble "${currentProperty.title}" (${currentProperty.code}). ¿Podríamos coordinar una cita de atención premium?`
  );
  const whatsappUrl = `https://wa.me/${currentAgent.phone.replace(/\D/g, '')}?text=${whatsappMsg}`;

  const handleActionClick = (e: React.MouseEvent, actionType: 'visita' | 'whatsapp') => {
    e.preventDefault();
    e.stopPropagation();
    const tokenVal = getToken();
    const userVal = getCurrentUser();
    const isAuthenticated = !!(userVal && tokenVal);
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (actionType === 'visita') {
      setShowAppointmentModal(true);
    } else {
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleAppointmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppointmentSuccessMsg(
      `¡Visita programada con éxito! Confirmación: Se agendó para el ${appointmentDate} a las ${appointmentTime}. Recibirás un mensaje automático al WhatsApp ${appointmentWhatsApp}.`
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-700 antialiased selection:bg-[#b9fa3c]/30">
      
      {/* ─── Breadcrumb de Navegación ─── */}
      <div className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between text-xs font-bold text-slate-400">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-[#04045E] transition-colors">Inicio</Link>
            <span>/</span>
            <Link href="/properties" className="hover:text-[#04045E] transition-colors">Propiedades</Link>
            <span>/</span>
            <span className="text-[#04045E] font-black line-clamp-1">{currentProperty.title}</span>
          </div>
          <span className="font-mono text-[10px] tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
            CÓD: {currentProperty.code}
          </span>
        </div>
      </div>

      {/* Layout Principal Asimétrico */}
      <main className="max-w-[1440px] mx-auto flex flex-col lg:flex-row w-full relative pb-24 lg:pb-0">
        
        {/* =================================================================
            COLUMNA IZQUIERDA: CONTENIDO SCROLLABLE (65% de Ancho)
            ================================================================= */}
        <div className="w-full lg:w-[65%] lg:pr-8 p-4 md:p-6 lg:border-r lg:border-slate-200/80 space-y-8 h-full">
          
          {/* 1. CABECERA MULTIMEDIA INTEGRADA CON TABS ZILLOW-STYLE */}
          <section className="space-y-4">
            <div className="w-full aspect-[16/9] bg-slate-900 rounded-3xl relative overflow-hidden shadow-md border border-slate-200/50 group">
              
              {/* Fotos Slider */}
              {activeTab === 'fotos' && (
                <div className="w-full h-full relative">
                  {/* Desktop slider (hidden on mobile, block on md:) */}
                  <div className="hidden md:block w-full h-full relative">
                    <img 
                      src={currentProperty.images[activeImageIndex]} 
                      alt={currentProperty.title}
                      className="w-full h-full object-cover transition-all duration-700" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"></div>
                    
                    {currentProperty.images.length > 1 && (
                      <>
                        <button 
                          onClick={() => setActiveImageIndex((prev) => (prev === 0 ? currentProperty.images.length - 1 : prev - 1))}
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 hover:bg-[#b9fa3c] text-[#04045E] shadow transition-all duration-300 hover:scale-105 active:scale-95"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => setActiveImageIndex((prev) => (prev === currentProperty.images.length - 1 ? 0 : prev + 1))}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 hover:bg-[#b9fa3c] text-[#04045E] shadow transition-all duration-300 hover:scale-105 active:scale-95"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </button>
                      </>
                    )}

                    <span className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
                      Foto {activeImageIndex + 1} de {currentProperty.images.length}
                    </span>
                  </div>

                  {/* Mobile Táctil Carousel (block on mobile, hidden on md:) */}
                  <div className="flex md:hidden w-full h-full overflow-x-scroll snap-x scrollbar-none">
                    {currentProperty.images.map((imgUrl: string, idx: number) => (
                      <div key={idx} className="w-full h-full flex-shrink-0 snap-start relative">
                        <img 
                          src={imgUrl} 
                          alt={`${currentProperty.title} - ${idx + 1}`}
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"></div>
                        <span className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
                          Foto {idx + 1} de {currentProperty.images.length}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matterport 3D Mockup */}
              {activeTab === '3d' && (
                <div className="w-full h-full relative bg-slate-950 flex flex-col justify-between overflow-hidden">
                  <img 
                    src={room3DImages[active3DRoom]} 
                    alt="Tour 3D" 
                    className="absolute inset-0 w-full h-full object-cover opacity-60 filter saturate-[0.8]"
                  />
                  <div className="absolute inset-0 bg-[#04045E]/10 backdrop-blur-[1px]"></div>
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:2rem_2rem]"></div>
                  
                  <div className="relative z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                      <span className="text-[10px] text-white font-black uppercase tracking-wider">Tour Virtual Activo</span>
                    </div>
                    <span className="text-white font-mono text-[10px] font-bold bg-[#04045E]/85 border border-[#b9fa3c]/35 px-3 py-1 rounded-full uppercase">
                      Estancia: {active3DRoom}
                    </span>
                  </div>

                  <div className="absolute inset-0 z-10 flex items-center justify-center">
                    {active3DRoom === 'fachada' && (
                      <button onClick={() => setActive3DRoom('cocina')} className="group flex flex-col items-center">
                        <span className="relative flex h-8 w-8 items-center justify-center">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#b9fa3c] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-[#b9fa3c] border border-white"></span>
                        </span>
                        <span className="mt-1 bg-black/80 px-2 py-1 text-[9px] font-bold text-white uppercase rounded">Ingresar a Cocina</span>
                      </button>
                    )}
                    {active3DRoom === 'cocina' && (
                      <button onClick={() => setActive3DRoom('sala')} className="group flex flex-col items-center">
                        <span className="relative flex h-8 w-8 items-center justify-center">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#b9fa3c] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-[#b9fa3c] border border-white"></span>
                        </span>
                        <span className="mt-1 bg-black/80 px-2 py-1 text-[9px] font-bold text-white uppercase rounded">Pasar a Living</span>
                      </button>
                    )}
                    {active3DRoom === 'sala' && (
                      <button onClick={() => setActive3DRoom('fachada')} className="group flex flex-col items-center">
                        <span className="relative flex h-8 w-8 items-center justify-center">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#b9fa3c] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-[#b9fa3c] border border-white"></span>
                        </span>
                        <span className="mt-1 bg-black/80 px-2 py-1 text-[9px] font-bold text-white uppercase rounded">Salir al Exterior</span>
                      </button>
                    )}
                  </div>

                  <div className="relative z-10 p-4 bg-gradient-to-t from-black/60 to-transparent flex justify-center gap-2">
                    {(['fachada', 'cocina', 'sala'] as const).map((room) => (
                      <button
                        key={room}
                        onClick={() => setActive3DRoom(room)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                          active3DRoom === room 
                            ? 'bg-[#b9fa3c] text-[#04045E]' 
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {room === 'fachada' ? 'Fachada' : room === 'cocina' ? 'Cocina' : 'Living'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Plano de Planta Vectorial */}
              {activeTab === 'plano' && (
                <div className="w-full h-full bg-[#050516] flex flex-col justify-between p-4 relative">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] pointer-events-none"></div>

                  <div className="relative z-10 flex justify-between items-center">
                    <span className="text-[10px] text-white/50 font-mono tracking-widest uppercase">Plano Arquitectónico</span>
                    <span className="text-[#b9fa3c] font-mono text-[10px] font-black uppercase">
                      {hoveredRoom ? `Zona Activa: ${hoveredRoom}` : 'Pasa el cursor por las habitaciones'}
                    </span>
                  </div>

                  <div className="relative w-full flex-1 flex items-center justify-center p-4">
                    <svg viewBox="0 0 800 450" className="w-full h-full max-h-[260px] drop-shadow-2xl">
                      <rect x="50" y="30" width="700" height="390" fill="none" stroke="#161a4c" strokeWidth="4" />
                      <rect 
                        x="50" y="30" width="280" height="200" 
                        fill={hoveredRoom === 'Dormitorio Master' ? 'rgba(185, 250, 60, 0.08)' : 'transparent'} 
                        stroke="#161a4c" strokeWidth="2" 
                        className="cursor-pointer transition-all duration-300"
                        onMouseEnter={() => setHoveredRoom('Dormitorio Master')}
                        onMouseLeave={() => setHoveredRoom(null)}
                      />
                      <text x="190" y="130" textAnchor="middle" fill={hoveredRoom === 'Dormitorio Master' ? '#b9fa3c' : '#4f5694'} className="text-[11px] font-bold select-none pointer-events-none transition-colors">
                        Dormitorio Master (28 m²)
                      </text>

                      <rect 
                        x="330" y="30" width="420" height="250" 
                        fill={hoveredRoom === 'Living Comedor' ? 'rgba(185, 250, 60, 0.08)' : 'transparent'} 
                        stroke="#161a4c" strokeWidth="2" 
                        className="cursor-pointer transition-all duration-300"
                        onMouseEnter={() => setHoveredRoom('Living Comedor')}
                        onMouseLeave={() => setHoveredRoom(null)}
                      />
                      <text x="540" y="150" textAnchor="middle" fill={hoveredRoom === 'Living Comedor' ? '#b9fa3c' : '#4f5694'} className="text-[11px] font-bold select-none pointer-events-none transition-colors">
                        Living Comedor (72 m²)
                      </text>

                      <rect 
                        x="330" y="280" width="220" height="140" 
                        fill={hoveredRoom === 'Cocina Gourmet' ? 'rgba(185, 250, 60, 0.08)' : 'transparent'} 
                        stroke="#161a4c" strokeWidth="2" 
                        className="cursor-pointer transition-all duration-300"
                        onMouseEnter={() => setHoveredRoom('Cocina Gourmet')}
                        onMouseLeave={() => setHoveredRoom(null)}
                      />
                      <text x="440" y="350" textAnchor="middle" fill={hoveredRoom === 'Cocina Gourmet' ? '#b9fa3c' : '#4f5694'} className="text-[11px] font-bold select-none pointer-events-none transition-colors">
                        Cocina / Isla (31 m²)
                      </text>
                    </svg>
                  </div>

                  <div className="relative z-10 flex justify-between items-center text-[9px] font-mono text-white/30 uppercase tracking-widest pt-2 border-t border-white/5">
                    <span>* Escala Real 1:50 · Láser Certificado</span>
                    <span>Plano Planta Baja</span>
                  </div>
                </div>
              )}

              {/* Mapa de Entorno */}
              {activeTab === 'mapa' && (
                <div className="w-full h-full bg-slate-200">
                  <MiniMap center={currentProperty.coordinates} />
                </div>
              )}

              {/* Pestañas Redondeadas Integradas (Zillow Style) */}
              <div className="absolute bottom-4 left-4 right-4 z-10 flex justify-center">
                <div className="bg-white/90 backdrop-blur-md p-1 rounded-full flex gap-1 shadow-lg border border-slate-200/50 max-w-full overflow-x-auto no-scrollbar">
                  {[
                    { key: 'fotos', label: 'Fotos' },
                    { key: 'mapa', label: 'Mapa' }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap active:scale-95 ${
                        activeTab === tab.key 
                          ? 'bg-[#000033] text-white shadow' 
                          : 'text-[#000033] hover:bg-slate-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Favoritos */}
              <button 
                onClick={handleFavoriteToggle}
                className="absolute top-4 right-4 z-10 p-3 rounded-full bg-white/95 backdrop-blur shadow hover:scale-110 active:scale-95 transition-all text-[#04045E]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill={isFavorited ? '#b9fa3c' : 'none'} viewBox="0 0 24 24" stroke={isFavorited ? '#b9fa3c' : 'currentColor'} strokeWidth={2.5} className="w-5 h-5 transition-transform duration-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </button>
            </div>

            {/* Cabecera Técnica de Datos en Texto Limpio */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-4">
                
                <div className="flex items-baseline gap-3">
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#04045E] font-sans">
                    ${currentProperty.price.toLocaleString()}
                  </h1>
                  <span className="text-slate-400 text-xs font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {(currentProperty.price / currentProperty.m2).toFixed(0)} USD/m²
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {currentProperty.verified && (
                    <span className="bg-[#b9fa3c] text-[#04045E] text-[9px] font-black px-3 py-1.5 rounded-full border border-[#04045E]/10 tracking-widest uppercase shadow-sm">
                      ✓ Verificado Oro
                    </span>
                  )}
                  <DaysOnMarketBadge propertyId={currentProperty.id} size="sm" />
                </div>
              </div>

              {/* Habitaciones, Baños y metros cuadrados en Texto Limpio y Sobrio */}
              <div className="flex items-center gap-4 text-xs font-bold text-slate-700 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm w-full max-w-max">
                <span className="flex items-center gap-1"><strong className="text-base font-black text-[#04045E]">{currentProperty.beds}</strong> habitaciones</span>
                <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                <span className="flex items-center gap-1"><strong className="text-base font-black text-[#04045E]">{currentProperty.baths}</strong> baños</span>
                <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                <span className="flex items-center gap-1"><strong className="text-base font-black text-[#04045E]">{currentProperty.m2}</strong> m² construidos</span>
              </div>

              <p className="text-sm md:text-base text-slate-500 font-bold tracking-wide">
                {currentProperty.address} • <span className="text-slate-400 font-semibold">{currentProperty.city}</span>
              </p>
            </div>
          </section>

          <hr className="border-slate-200/80" />

          {/* 2. DESCRIPCIÓN */}
          <section className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#04045E]/50">Resumen y descripción</h3>
            <p className="text-slate-600 font-medium leading-relaxed text-sm">
              {currentProperty.description}
            </p>
          </section>

          <hr className="border-slate-200/80" />

          {/* 3. SECCIÓN ¿QUÉ TIENE DE ESPECIAL? */}
          <section className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#04045E]">¿Qué tiene de especial?</h3>
            <div className="flex flex-wrap gap-2.5">
              {(currentProperty.amenities || []).map((amenity: string, idx: number) => (
                <span 
                  key={idx} 
                  className="bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-600 font-sans font-bold text-[10px] px-4 py-2.5 rounded-full tracking-wider uppercase cursor-default transition-all duration-200 flex items-center gap-1.5"
                >
                  ✨ {amenity}
                </span>
              ))}
            </div>
          </section>

          <hr className="border-slate-200/80" />

          {currentProperty.offerType === 'VENTA' && (
            <>
              {/* 5. CALCULADORA DE PAGO MENSUAL INTERACTIVA COMPLETA */}
              <section className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-[#000033]">Calculadora de Pago Mensual Interactiva</h3>
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* Desglose visual en tiempo real */}
                  <div className="space-y-6 flex flex-col justify-center">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Cuota mensual estimada</span>
                      <h4 className="text-3xl font-black text-[#000033] font-sans pt-1">
                        Bs. {(mortgageResults.totalMonthly * 10).toLocaleString()} <span className="text-xs text-slate-400 font-semibold tracking-normal">/ mes</span>
                      </h4>
                    </div>
                    
                    {/* Barra de Porcentaje Dinámica */}
                    <div className="space-y-4">
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                        <div 
                          className="h-full bg-[#000033] transition-all duration-300" 
                          style={{ width: `${mortgageResults.percentages.principalInterest}%` }} 
                          title="Capital e intereses"
                        />
                        <div 
                          className="h-full bg-blue-500 transition-all duration-300" 
                          style={{ width: `${mortgageResults.percentages.tax}%` }} 
                          title="Impuestos"
                        />
                        <div 
                          className="h-full bg-[#ccff00] transition-all duration-300" 
                          style={{ width: `${mortgageResults.percentages.insurance}%` }} 
                          title="Seguro"
                        />
                      </div>

                      <div className="space-y-2.5 pt-1">
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-xs font-bold text-slate-600">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 bg-[#000033] rounded-full inline-block" />
                              Capital e intereses
                            </span>
                            <span className="text-[#000033]">Bs. {(mortgageResults.monthlyPrincipalInterest * 10).toLocaleString()} ({mortgageResults.percentages.principalInterest}%)</span>
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-xs font-bold text-slate-600">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full inline-block" />
                              Impuesto predial mensual
                            </span>
                            <span className="text-blue-500">Bs. {(mortgageResults.monthlyTax * 10).toLocaleString()} ({mortgageResults.percentages.tax}%)</span>
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-xs font-bold text-slate-600">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 bg-[#ccff00] rounded-full inline-block" />
                              Seguro de hogar
                            </span>
                            <span className="text-[#000033] font-black">Bs. {(mortgageResults.monthlyInsurance * 10).toLocaleString()} ({mortgageResults.percentages.insurance}%)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Formulario Interactivo */}
                  <div className="bg-[#F8FAFC] p-6 border border-slate-200 rounded-2xl space-y-4 flex flex-col justify-between">
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Cuota Inicial (Bs)</label>
                        <input 
                          type="number"
                          value={downPayment * 10}
                          onChange={(e) => setDownPayment(Math.min(currentProperty.price, Math.max(0, Math.round(Number(e.target.value) / 10))))}
                          className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#000033] text-[#000033] font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Tasa de interés (%)</label>
                        <input 
                          type="number"
                          step="0.1"
                          value={interestRate}
                          onChange={(e) => setInterestRate(Math.max(0, Number(e.target.value)))}
                          className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#000033] text-[#000033] font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Plazo (Años)</label>
                        <select 
                          value={loanTerm}
                          onChange={(e) => setLoanTerm(Number(e.target.value))}
                          className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#000033] text-[#000033]"
                        >
                          <option value={10}>10 años</option>
                          <option value={15}>15 años</option>
                          <option value={20}>20 años</option>
                          <option value={30}>30 años</option>
                        </select>
                      </div>
                    </div>
                    <div className="pt-2 text-[10px] text-center text-slate-400 font-bold uppercase tracking-wider select-none">
                      ⚡ Actualizado en tiempo real
                    </div>
                  </div>
                </div>
              </section>
              <hr className="border-slate-200/80" />
            </>
          )}

          {/* 7. MINI MAPA ENTORNO INFERIOR */}
          <section className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#000033]">MÁS OPCIONES</h3>
            <div className="w-full h-80 bg-slate-100 border border-slate-200 rounded-3xl overflow-hidden relative shadow-inner">
              <MiniMap center={currentProperty.coordinates} isInteractive={false} />
            </div>
            {/* Sello Documental */}
            <div className="pt-2 flex items-center gap-2 text-xs font-bold font-sans">
              <span className="text-slate-400 uppercase tracking-widest text-[9px]">Sello documental:</span>
              {currentProperty.verified ? (
                <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wider text-[9px] font-black">
                  ✓ documentación verificada
                </span>
              ) : (
                <span className="text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100 uppercase tracking-wider text-[9px] font-black">
                  ✗ No verificado
                </span>
              )}
            </div>
          </section>

          <hr className="border-slate-200/80" />

          {/* Formulario de alertas integrado al final */}
          <section className="bg-white p-6 border border-slate-200 rounded-3xl shadow-sm">
            <PropertyAlertForm 
              defaultZona={currentProperty.address.split(',')[0]} 
              defaultType={currentProperty.type || 'CASA'} 
              defaultMaxPrice={currentProperty.price} 
            />
          </section>

        </div>

        {/* =================================================================
            COLUMNA DERECHA: STICKY SIDEBAR DE CONVERSIÓN (35% de Ancho)
            ================================================================= */}
        <div className="w-full lg:w-[35%] p-4 md:p-6 bg-slate-50/40 lg:bg-transparent">
          <div className="w-full lg:sticky lg:top-24 space-y-4">
            
            {/* CAJA 1: ELIMINADA JORNADA DE OPEN HOUSE */}
            
            {/* CAJA 2: TARJETA DE AGENTE RESPONSABLE (SELECTOR INHABILITADO) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#000033]/5 rounded-full overflow-hidden flex-shrink-0 border border-slate-200 flex items-center justify-center font-heading font-black text-[#000033] text-base">
                  {currentAgent.avatar}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-black text-[#000033] leading-tight">{currentAgent.name}</h4>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">{currentAgent.agency}</p>
                  
                  {/* Calificación */}
                  <div className="flex items-center gap-1 mt-1 text-amber-500 text-xs">
                    <span>★</span>
                    <span className="text-slate-500 font-bold text-[11px]">{currentAgent.stars} Certificación Oro</span>
                  </div>
                </div>
              </div>

              {/* Selector de agente inhabilitado */}
              <div className="pt-3.5 border-t border-slate-100">
                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                  Agente de Atención Asignado
                </label>
                <div className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold px-3 py-2.5 rounded-xl select-none">
                  Agente Asignado: {currentAgent.name}
                </div>
              </div>
            </div>

            {/* CAJA 3: BOTONES DE ACCIÓN PRINCIPALES - CONVERSIÓN QUIRÚRGICA */}
            <div className="space-y-2.5">
              
              {/* [SOLICITAR VISITA GUIADA] */}
              <button 
                onClick={(e) => handleActionClick(e, 'visita')}
                className="w-full bg-[#ccff00] hover:bg-[#b5e600] text-[#000033] font-heading font-black py-4 px-6 rounded-2xl shadow-md text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-[#ccff00]/10 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
                </svg>
                Solicitar visita guiada
              </button>

              <button 
                onClick={(e) => handleActionClick(e, 'whatsapp')}
                className="w-full bg-[#000033] hover:bg-[#000044] text-white font-black py-4 px-6 rounded-2xl shadow-sm text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer text-center"
              >
                Contactar por WhatsApp
              </button>
            </div>

          </div>
        </div>

      </main>

      {/* =========================================================
          MODAL DE VISITA / CÓDIGO QR SIMULADO (Zillow Style)
          ========================================================= */}
      {showQR && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white p-8 rounded-3xl max-w-sm w-full text-center space-y-6 shadow-2xl border border-slate-100">
            <div className="space-y-2">
              <h4 className="text-xl font-black text-[#04045E]">Escanea para Reservar</h4>
              <p className="text-xs text-slate-400 font-medium">Agenda tu visita guiada al instante con un asesor certificado de Propio.</p>
            </div>

            {/* Código QR Vectorial Estetizado */}
            <div className="w-44 h-44 bg-slate-50 rounded-2xl border border-slate-200 mx-auto flex items-center justify-center p-3 relative group">
              <div className="grid grid-cols-6 grid-rows-6 gap-1 w-full h-full">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`rounded-sm transition-all duration-300 ${
                      [0, 1, 2, 3, 4, 5, 6, 11, 12, 17, 18, 23, 24, 29, 30, 31, 32, 33, 34, 35, 8, 9, 14, 15, 20, 21, 26, 27].includes(i) 
                        ? 'bg-[#b9fa3c]' 
                        : 'bg-[#04045E]'
                    }`} 
                  />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md border border-slate-100">
                  🏠
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[#04045E] font-black text-lg">${(currentProperty.price * 0.01).toLocaleString()} USD</p>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Reserva mínima del 1% · {currentProperty.code}</p>
            </div>

            <button 
              onClick={() => setShowQR(false)} 
              className="w-full bg-[#04045E] hover:bg-opacity-95 text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all"
            >
              Cerrar y Regresar
            </button>
          </div>
        </div>
      )}

      {showAppointmentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white p-8 rounded-3xl max-w-md w-full text-left space-y-6 shadow-2xl border border-slate-100 font-sans">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="text-sm font-black text-[#000033] uppercase tracking-wide">Agendar Visita Guiada</h4>
              <button 
                onClick={() => {
                  setShowAppointmentModal(false);
                  setAppointmentSuccessMsg('');
                }}
                className="text-slate-400 hover:text-black font-bold text-lg cursor-pointer bg-transparent border-none"
              >
                ✕
              </button>
            </div>

            {appointmentSuccessMsg ? (
              <div className="space-y-4 py-4 text-center">
                <div className="text-4xl text-emerald-500">✓</div>
                <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                  {appointmentSuccessMsg}
                </p>
                <button
                  onClick={() => {
                    setShowAppointmentModal(false);
                    setAppointmentSuccessMsg('');
                  }}
                  className="w-full bg-[#000033] hover:bg-[#000044] text-white font-sans font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-all"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleAppointmentSubmit} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={appointmentName}
                    onChange={(e) => setAppointmentName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#000033] text-[#000033]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Número de WhatsApp</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej: 71234567"
                    value={appointmentWhatsApp}
                    onChange={(e) => setAppointmentWhatsApp(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#000033] text-[#000033]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    placeholder="tu@correo.com"
                    value={appointmentEmail}
                    onChange={(e) => setAppointmentEmail(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#000033] text-[#000033]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Fecha</label>
                    <input
                      type="date"
                      required
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#000033] text-[#000033]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Hora de Visita</label>
                    <input
                      type="time"
                      required
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#000033] text-[#000033]"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#000033] hover:bg-[#000044] text-white font-sans font-black py-3 rounded-xl text-xs uppercase tracking-widest transition-all"
                >
                  Agendar Cita de Visita
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Barra de Contacto Fija en la Base para Móviles (Zillow / Airbnb Style) */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] animate-fadeIn">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Precio</span>
          <span className="text-sm font-black text-[#000033]">Bs. ${(currentProperty.priceBob || currentProperty.price * 10).toLocaleString()}</span>
        </div>
        <div className="flex gap-2 flex-1 max-w-[240px]">
          <button 
            onClick={(e) => handleActionClick(e, 'visita')}
            className="flex-1 bg-[#ccff00] hover:bg-[#b5e600] text-[#000033] font-heading font-black py-3 rounded-xl text-[10px] uppercase tracking-wider text-center transition-all active:scale-[0.98] border border-[#ccff00]/10 cursor-pointer"
          >
            Reservar
          </button>
          <button 
            onClick={(e) => handleActionClick(e, 'whatsapp')}
            className="flex-1 bg-[#000033] hover:bg-opacity-95 text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 transition-all active:scale-[0.98] text-center cursor-pointer"
          >
            WhatsApp
          </button>
        </div>
      </div>

    </div>
  );
}
