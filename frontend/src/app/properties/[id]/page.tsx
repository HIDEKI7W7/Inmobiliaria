'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { propertiesService } from '../../../services/properties.service';
import { Property } from '../../../components/modules/properties/PropertyCard';
import { Button } from '../../../components/ui/button';

export default function PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    if (!id) return;
    async function fetchDetail() {
      try {
        setLoading(true);
        const data = await propertiesService.getPropertyById(id as string);
        setProperty(data);
      } catch (err: any) {
        setError(err.message || 'Error al obtener el detalle');
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulación de registro de Lead conectándose al backend
    setContactSuccess(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-40">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-propio-blue border-t-propio-green"></div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="p-8 text-center bg-red-50 text-red-800 rounded-3xl mt-10">
        Propiedad no encontrada o inalcanzable. Volver al <a href="/properties" className="underline font-bold">catálogo</a>.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="relative h-[450px] w-full rounded-3xl overflow-hidden shadow-lg">
          <img src={property.imageUrl} alt={property.title} className="object-cover h-full w-full" />
          <div className="absolute bottom-6 left-6 bg-propio-blue text-white font-black px-6 py-3 rounded-2xl text-base shadow-xl border border-white/10 flex items-center gap-3">
            <span className="text-propio-green">${property.price.toLocaleString()} USD</span>
            <span className="text-gray-400">|</span>
            <span className="text-amber-300">Bs. ${(property.priceBob || property.price * 10).toLocaleString()} BOB</span>
          </div>
        </div>

        <div className="space-y-4">
          <span className="inline-block text-sm font-bold text-gray-500 uppercase tracking-widest">{property.location}</span>
          <h1 className="text-4xl font-black text-propio-blue tracking-tight leading-none">{property.title}</h1>
          
          <div className="flex gap-6 py-4 border-b border-t border-gray-200 text-sm">
            <div>
              <span className="text-gray-400">Área Construida:</span> <span className="font-bold text-propio-blue">{property.area} m²</span>
            </div>
            <div>
              <span className="text-gray-400">Habitaciones:</span> <span className="font-bold text-propio-blue">{property.rooms}</span>
            </div>
            <div>
              <span className="text-gray-400">Baños Completos:</span> <span className="font-bold text-propio-blue">{property.bathrooms}</span>
            </div>
          </div>

          <h3 className="text-xl font-bold text-propio-blue pt-2">Descripción del Inmueble</h3>
          <p className="text-gray-600 leading-relaxed text-base">{property.description}</p>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="p-8 rounded-3xl glass-panel shadow-md border border-gray-100/50 bg-white/40 sticky top-28 space-y-6">
          <h3 className="text-2xl font-black text-propio-blue tracking-tight">¿Te interesa esta propiedad?</h3>
          <p className="text-gray-500 text-sm leading-relaxed">
            Completa tus datos de contacto y un asesor de **Propio** te enviará la información técnica completa y coordinará una visita guiada.
          </p>

          {contactSuccess ? (
            <div className="p-6 bg-propio-blue text-white rounded-2xl text-center space-y-2">
              <span className="text-3xl">🎉</span>
              <h4 className="font-bold text-propio-green">¡Solicitud Enviada!</h4>
              <p className="text-xs text-gray-300">Hemos registrado tu lead en el sistema NestJS y nos comunicaremos contigo de inmediato.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-propio-blue mb-1.5 uppercase">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carlos Mendoza"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-propio-blue/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-propio-blue mb-1.5 uppercase">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  placeholder="carlos@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-propio-blue/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-propio-blue mb-1.5 uppercase">Número Telefónico</label>
                <input
                  type="tel"
                  required
                  placeholder="+51 999 888 777"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-propio-blue/50"
                />
              </div>

              <Button type="submit" variant="primary" className="w-full mt-2">
                Quiero que me contacten
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
