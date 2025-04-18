import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Esquema de validación de Zod
const contactSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Número de teléfono inválido'),
  company: z.string().optional(),
  status: z.enum(['cliente', 'prospecto', 'inactivo']),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').optional(),
});

export default function ContactForm({ onSubmit, initialData = {}, isEditing = false }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: initialData || {
      name: '',
      email: '',
      phone: '',
      company: '',
      status: 'prospecto',
      tags: [],
      notes: '',
    }
  });

  const processSubmit = async (data) => {
    try {
      await onSubmit(data);
      if (!isEditing) {
        reset();
      }
    } catch (error) {
      console.error('Error al guardar contacto:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(processSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Nombre */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nombre*
          </label>
          <input
            id="name"
            type="text"
            {...register('name')}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              errors.name ? 'border-red-300' : ''
            }`}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email*
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              errors.email ? 'border-red-300' : ''
            }`}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Teléfono */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Teléfono*
          </label>
          <input
            id="phone"
            type="tel"
            {...register('phone')}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              errors.phone ? 'border-red-300' : ''
            }`}
            placeholder="+34600000000"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>

        {/* Empresa */}
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700">
            Empresa
          </label>
          <input
            id="company"
            type="text"
            {...register('company')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        {/* Estado */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Estado*
          </label>
          <select
            id="status"
            {...register('status')}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              errors.status ? 'border-red-300' : ''
            }`}
          >
            <option value="prospecto">Prospecto</option>
            <option value="cliente">Cliente</option>
            <option value="inactivo">Inactivo</option>
          </select>
          {errors.status && (
            <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
          )}
        </div>
      </div>

      {/* Notas */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notas
        </label>
        <textarea
          id="notes"
          {...register('notes')}
          rows={4}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
            errors.notes ? 'border-red-300' : ''
          }`}
        />
        {errors.notes && (
          <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  );
} 