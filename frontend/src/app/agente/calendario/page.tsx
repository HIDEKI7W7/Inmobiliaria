'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/services/api.client';
import { getToken, getCurrentUser } from '@/utils/session';

interface Appointment {
  id: string;
  clientName: string;
  propertyTitle: string;
  time: string;
  dateStr: string; // YYYY-MM-DD
  type: 'visita' | 'reunion' | 'firma' | 'otro';
  notes?: string;
  phone?: string;
}

const INITIAL_APPOINTMENTS: Appointment[] = [];

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function CalendarioPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 18)); // Junio 18, 2026
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 5, 19)); // Seleccionar por defecto mañana 19
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [agentProperties, setAgentProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  
  // Form modal state
  const [showModal, setShowModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newPropertyTitle, setNewPropertyTitle] = useState('');
  const [newTime, setNewTime] = useState('12:00');
  const [newType, setNewType] = useState<'visita' | 'reunion' | 'firma' | 'otro'>('visita');
  const [newNotes, setNewNotes] = useState('');
  const [newPhone, setNewPhone] = useState('');

  useEffect(() => {
    const token = getToken();
    const currentUser = getCurrentUser();
    if (!token) return;

    const fetchMeetings = async () => {
      try {
        const res = await apiClient.getWithAuth<any>('/appointments', token);
        const meetingsList = res.meetings || res || [];
        const mappedApps = meetingsList.map((meeting: any) => {
          const dateObj = new Date(meeting.scheduledAt);
          const y = dateObj.getFullYear();
          const m = String(dateObj.getMonth() + 1).padStart(2, '0');
          const d = String(dateObj.getDate()).padStart(2, '0');
          const dateStr = `${y}-${m}-${d}`;
          const time = dateObj.toTimeString().substring(0, 5);

          return {
            id: meeting.id,
            clientName: meeting.clientName || meeting.user?.name || 'Cliente Invitado',
            propertyTitle: meeting.property?.title || 'Propiedad sin título',
            time,
            dateStr,
            type: meeting.type || 'visita',
            notes: meeting.notes || '',
            phone: meeting.clientPhone || '',
          };
        });
        setAppointments(mappedApps);
      } catch (err) {
        console.error('Error fetching meetings:', err);
      }
    };

    const fetchProperties = async () => {
      try {
        let url = '/properties';
        if (currentUser && currentUser.userId) {
          url += `?agentId=${currentUser.userId}`;
        }
        const propsData = await apiClient.get<any>(url);
        const propsList = propsData.data || propsData || [];
        setAgentProperties(propsList);
      } catch (err) {
        console.error('Error fetching properties:', err);
      }
    };

    fetchMeetings();
    fetchProperties();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Helper properties
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first index

  const daysGrid: (Date | null)[] = [];
  // Fill leading empty days
  for (let i = 0; i < firstDayIndex; i++) {
    daysGrid.push(null);
  }
  // Fill actual month days
  for (let d = 1; d <= daysInMonth; d++) {
    daysGrid.push(new Date(year, month, d));
  }

  const formatDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getAppointmentsForDate = (date: Date) => {
    const targetStr = formatDateStr(date);
    return appointments.filter(app => app.dateStr === targetStr);
  };

  const handleDayClick = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const selectedAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !selectedPropertyId || !selectedDate) return;

    const token = getToken();
    if (!token) return;

    const scheduledAt = `${formatDateStr(selectedDate)}T${newTime}:00`;

    try {
      const res = await apiClient.postWithAuth<any>(
        '/appointments',
        {
          propertyId: selectedPropertyId,
          scheduledAt,
          clientName: newClientName,
          clientPhone: newPhone,
          notes: newNotes,
          type: newType,
        },
        token
      );

      if (res && res.meeting) {
        const meeting = res.meeting;
        const newApp: Appointment = {
          id: meeting.id,
          clientName: meeting.clientName || newClientName,
          propertyTitle: newPropertyTitle,
          time: newTime,
          dateStr: formatDateStr(selectedDate),
          type: newType,
          notes: newNotes,
          phone: newPhone || '+59170000000',
        };
        setAppointments(prev => [...prev, newApp]);
      }
    } catch (err) {
      console.error('Error adding appointment:', err);
    }
    
    // Reset form
    setNewClientName('');
    setNewPropertyTitle('');
    setSelectedPropertyId('');
    setNewTime('12:00');
    setNewType('visita');
    setNewNotes('');
    setNewPhone('');
    setShowModal(false);
  };

  const handleDeleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(app => app.id !== id));
  };

  const getTypeStyle = (type: Appointment['type']) => {
    switch (type) {
      case 'visita':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'reunion':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'firma':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-850 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 font-sans bg-[#F8FAFC]">
      
      {/* Header Info */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#04045E] uppercase tracking-tight">
            Calendario de Citas 📅
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Organiza tus visitas, reuniones y firmas de contratos de manera visual e interactiva.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#b9fa3c] text-[#04045E] font-bold px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] hover:brightness-95 transition-all shrink-0 active:scale-95"
        >
          Nueva Cita
        </button>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lado Izquierdo/Centro: Calendario Mensual */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col">
          
          {/* Cabecera del Mes */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-[#04045E] uppercase tracking-wider flex items-center gap-2">
              {MONTHS_ES[month]} <span className="text-slate-400 font-bold">{year}</span>
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={handlePrevMonth}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors"
                title="Mes Anterior"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors"
                title="Siguiente Mes"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center">
            {DAYS_ES.map(day => (
              <span key={day} className="text-[10px] font-black uppercase text-slate-400 tracking-wider py-2">
                {day}
              </span>
            ))}
          </div>

          {/* Grid de Días */}
          <div className="grid grid-cols-7 gap-2 flex-1 min-h-[350px]">
            {daysGrid.map((date, idx) => {
              if (!date) {
                return <div key={`empty-${idx}`} className="bg-slate-50/40 rounded-xl border border-transparent" />;
              }

              const isToday = date.getDate() === 18 && date.getMonth() === 5 && date.getFullYear() === 2026;
              const isSelected = selectedDate && 
                date.getDate() === selectedDate.getDate() && 
                date.getMonth() === selectedDate.getMonth() && 
                date.getFullYear() === selectedDate.getFullYear();

              const dayApps = getAppointmentsForDate(date);

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => handleDayClick(date)}
                  className={`relative flex flex-col items-center justify-between p-2 rounded-xl transition-all aspect-square border ${
                    isSelected
                      ? 'border-[#04045E] bg-[#04045E] text-white shadow-md'
                      : isToday
                        ? 'border-[#b9fa3c] bg-[#b9fa3c]/10 text-[#04045E] font-black'
                        : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold self-start">{date.getDate()}</span>
                  
                  {/* Puntos de citas */}
                  <div className="flex gap-1 justify-center w-full mt-auto">
                    {dayApps.slice(0, 3).map((app, appIdx) => (
                      <span 
                        key={app.id} 
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected
                            ? 'bg-white'
                            : app.type === 'visita'
                              ? 'bg-amber-500'
                              : app.type === 'reunion'
                                ? 'bg-blue-500'
                                : app.type === 'firma'
                                  ? 'bg-emerald-500'
                                  : 'bg-slate-500'
                        }`} 
                      />
                    ))}
                    {dayApps.length > 3 && (
                      <span className={`text-[8px] font-black leading-none ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                        +{dayApps.length - 3}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Leyenda */}
          <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span>Visitas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
              <span>Reuniones</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span>Firmas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#b9fa3c] border border-slate-350 shrink-0 animate-pulse" />
              <span>Hoy</span>
            </div>
          </div>

        </div>

        {/* Lado Derecho: Lista de Actividades / Detalle del Día */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col justify-between h-full min-h-[450px]">
          <div>
            {/* Header Detalle */}
            <div className="border-b border-slate-100 pb-4 mb-6">
              <h3 className="font-bold text-xs text-[#04045E] uppercase tracking-wider">
                Citas para el {selectedDate ? selectedDate.getDate() : 'Selected'} de {selectedDate ? MONTHS_ES[selectedDate.getMonth()] : ''}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                {selectedAppointments.length} Evento(s) Registrado(s)
              </p>
            </div>

            {/* Listado de Citas */}
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
              {selectedAppointments.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <span className="block text-3xl mb-2">☕</span>
                  <p className="text-xs font-semibold">No tienes compromisos agendados para este día.</p>
                </div>
              ) : (
                selectedAppointments.map(app => (
                  <div 
                    key={app.id}
                    className="p-4 border border-slate-100 rounded-2xl bg-slate-50 hover:bg-slate-100/70 transition-all space-y-3 relative group"
                  >
                    {/* Botón eliminar */}
                    <button
                      onClick={() => handleDeleteAppointment(app.id)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      title="Eliminar cita"
                    >
                      ✕
                    </button>

                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${getTypeStyle(app.type)}`}>
                          {app.type}
                        </span>
                        <h4 className="text-sm font-black text-[#04045E] mt-1.5 leading-tight">
                          {app.clientName}
                        </h4>
                        <p className="text-xs font-bold text-slate-500 mt-0.5">
                          🏠 {app.propertyTitle}
                        </p>
                      </div>
                      <span className="text-xs font-black text-[#04045E] bg-white border px-2.5 py-1 rounded-xl shadow-sm shrink-0">
                        ⏰ {app.time}
                      </span>
                    </div>

                    {app.notes && (
                      <p className="text-[11px] text-slate-600 bg-white/60 p-2.5 rounded-xl border border-slate-200/50 font-semibold leading-relaxed">
                        {app.notes}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <a
                        href={`https://wa.me/${app.phone?.replace('+', '')}?text=${encodeURIComponent(`Hola ${app.clientName}, te escribo del portal Propio para confirmar nuestra cita de hoy para ver la propiedad: ${app.propertyTitle} a las ${app.time}.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 text-center py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                        </svg>
                        WhatsApp
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 mt-6">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#04045E] mb-1">
              💡 Tip de Productividad
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
              Puedes pulsar en cualquier día del calendario para ver las citas programadas y agendar una nueva en esa fecha.
            </p>
          </div>
        </div>

      </div>

      {/* MODAL DE NUEVA CITA */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#04045E]/75 backdrop-blur-md animate-fadeIn">
          <form 
            onSubmit={handleAddAppointment}
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 md:p-8 space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#b9fa3c]" />
            
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-[#04045E] uppercase tracking-wide">
                Agendar Nueva Cita
              </h3>
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-650 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Registrar cita para el día: <strong>{selectedDate ? `${selectedDate.getDate()} / ${selectedDate.getMonth() + 1} / ${selectedDate.getFullYear()}` : ''}</strong>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Nombre del Cliente *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#04045E]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Propiedad asociada *</label>
                <select
                  required
                  value={selectedPropertyId}
                  onChange={e => {
                    setSelectedPropertyId(e.target.value);
                    const prop = agentProperties.find(p => p.id === e.target.value);
                    if (prop) setNewPropertyTitle(prop.title);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#04045E]"
                >
                  <option value="">Seleccione una propiedad...</option>
                  {agentProperties.map(prop => (
                    <option key={prop.id} value={prop.id}>{prop.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Hora *</label>
                  <input 
                    type="time"
                    required
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#04045E]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Tipo de Evento</label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#04045E]"
                  >
                    <option value="visita">Visita</option>
                    <option value="reunion">Reunión</option>
                    <option value="firma">Firma de Contrato</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">WhatsApp del Cliente (opcional)</label>
                <input 
                  type="text"
                  placeholder="Ej. +59170000000"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#04045E]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Notas / Recordatorio</label>
                <textarea 
                  placeholder="Detalles adicionales, requisitos del cliente..."
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#04045E] resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-[#04045E] hover:bg-[#04045E]/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all hover:scale-[1.01]"
              >
                Guardar Cita 🚀
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
