import React, { useState } from 'react';

interface ContactFormProps {
  propertyId?: string;
  propertyName?: string;
  onSuccess?: () => void;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  propertyId,
  propertyName,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: propertyName 
      ? `Hola, estoy interesado en la propiedad "${propertyName}" (ID: ${propertyId}). Por favor, contáctenme.`
      : 'Hola, me gustaría recibir más información sobre sus servicios inmobiliarios.',
    contactMethod: 'whatsapp' as 'whatsapp' | 'email' | 'call',
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    
    // Simular envío de datos a API (NestJS backend)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setStatus('success');
      if (onSuccess) onSuccess();
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="w-full max-w-md mx-auto bg-slate-50 p-8 rounded-2xl shadow-xl border border-propio-green/30 text-center space-y-6 transition-all duration-500 animate-fadeIn">
        <div className="w-16 h-16 bg-propio-green text-propio-blue rounded-full flex items-center justify-center mx-auto shadow-md">
          <span className="text-3xl">✓</span>
        </div>
        <div className="space-y-2">
          <h3 className="font-heading text-2xl font-black text-propio-blue uppercase tracking-tight">
            ¡Mensaje Enviado!
          </h3>
          <p className="font-sans text-sm text-gray-600 font-medium leading-relaxed">
            Hemos recibido tus datos con éxito. Un asesor de <strong className="text-propio-blue font-bold">Propio</strong> te contactará en menos de 24 horas por tu medio de preferencia.
          </p>
        </div>
        <button
          onClick={() => {
            setStatus('idle');
            setFormData({
              name: '',
              email: '',
              phone: '',
              message: propertyName ? `Hola, estoy interesado...` : 'Hola, me gustaría...',
              contactMethod: 'whatsapp',
            });
          }}
          className="w-full py-3.5 bg-propio-blue hover:bg-propio-green hover:text-propio-blue text-propio-green font-heading font-black text-xs rounded-xl shadow-md uppercase tracking-widest border-2 border-propio-blue transition-all duration-300"
        >
          Enviar Otro Mensaje
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-slate-50 p-8 rounded-2xl shadow-xl border border-gray-200/50 space-y-6">
      {/* Encabezado del Formulario (Respetando Área de Autonomía) */}
      <div className="space-y-2 border-b border-gray-200/50 pb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-sans font-bold bg-propio-blue text-propio-green uppercase tracking-wider">
          ⚡ Contacto Express
        </span>
        <h3 className="font-heading text-2xl font-black text-propio-blue uppercase tracking-tight">
          ¿Te interesa?
        </h3>
        <p className="font-sans text-xs text-gray-500 font-medium">
          Completa tus datos y conecta directamente con el propietario.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre Completo */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-sans font-black text-propio-blue/70 uppercase tracking-widest">
            Nombre Completo
          </label>
          <input
            type="text"
            required
            placeholder="Ej. Alejandro Flores"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full h-12 px-4 rounded-xl border-2 border-propio-blue/15 focus:border-propio-blue focus:outline-none focus:ring-2 focus:ring-propio-green/50 text-sm bg-white text-propio-blue font-sans font-bold placeholder-gray-400 transition-all duration-200"
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-sans font-black text-propio-blue/70 uppercase tracking-widest">
            Correo Electrónico
          </label>
          <input
            type="email"
            required
            placeholder="alejandro@ejemplo.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full h-12 px-4 rounded-xl border-2 border-propio-blue/15 focus:border-propio-blue focus:outline-none focus:ring-2 focus:ring-propio-green/50 text-sm bg-white text-propio-blue font-sans font-bold placeholder-gray-400 transition-all duration-200"
          />
        </div>

        {/* Teléfono */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-sans font-black text-propio-blue/70 uppercase tracking-widest">
            Número de Teléfono (WhatsApp)
          </label>
          <input
            type="tel"
            required
            placeholder="+591 7XXXXXXX"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full h-12 px-4 rounded-xl border-2 border-propio-blue/15 focus:border-propio-blue focus:outline-none focus:ring-2 focus:ring-propio-green/50 text-sm bg-white text-propio-blue font-sans font-bold placeholder-gray-400 transition-all duration-200"
          />
        </div>

        {/* Método de Contacto Preferido */}
        <div className="space-y-2">
          <label className="block text-[11px] font-sans font-black text-propio-blue/70 uppercase tracking-widest">
            ¿Cómo prefieres ser contactado?
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'whatsapp', label: '💬 WhatsApp' },
              { id: 'call', label: '📞 Llamada' },
              { id: 'email', label: '✉️ Email' },
            ].map((method) => {
              const isActive = formData.contactMethod === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, contactMethod: method.id as any })}
                  className={`py-2 rounded-lg text-[10px] font-sans font-bold uppercase tracking-wider border-2 text-center transition-all duration-200 ${
                    isActive
                      ? 'bg-propio-green border-propio-green text-propio-blue shadow-sm'
                      : 'bg-white border-propio-blue/10 text-propio-blue hover:border-propio-blue/30'
                  }`}
                >
                  {method.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mensaje */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-sans font-black text-propio-blue/70 uppercase tracking-widest">
            Mensaje
          </label>
          <textarea
            rows={3}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border-2 border-propio-blue/15 focus:border-propio-blue focus:outline-none focus:ring-2 focus:ring-propio-green/50 text-sm bg-white text-propio-blue font-sans font-medium placeholder-gray-400 resize-none transition-all duration-200"
          />
        </div>

        {/* Botón de Enviar (Primary CTA: fondo verde corporativo y tipografía azul de alto impacto) */}
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full h-12 bg-propio-green hover:bg-propio-blue text-propio-blue hover:text-propio-green font-heading font-black text-xs rounded-xl shadow-md hover:shadow-lg uppercase tracking-widest transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] border-2 border-propio-green hover:border-propio-blue flex items-center justify-center gap-2"
        >
          {status === 'submitting' ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-propio-blue border-t-transparent"></div>
              <span>Procesando...</span>
            </>
          ) : (
            <span>Enviar Solicitud</span>
          )}
        </button>
      </form>
    </div>
  );
};
