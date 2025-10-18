// src/actions/email.ts
// Propósito: Server Actions para envío de emails transaccionales con Resend
'use server';

import { Resend } from 'resend';
import OrderConfirmationEmail from '@/components/emails/OrderConfirmationEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envía un email de actualización de estado de pedido al cliente
 */
export async function sendOrderStatusUpdateEmail(
  to: string,
  orderId: string,
  status: string,
  customerName?: string
) {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY no está configurada');
    return { error: 'Configuración de email no disponible' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Mhorp <onboarding@resend.dev>', // Cambiar a tu dominio verificado: 'Mhorp <pedidos@tudominio.com>'
      to,
      subject: `Actualización de tu pedido #${orderId} - Mhorp`,
      react: OrderConfirmationEmail({ orderId, status, customerName }),
    });

    if (error) {
      console.error('Error de Resend:', error);
      return { error: 'No se pudo enviar el email' };
    }

    console.log('Email enviado exitosamente:', data);
    return { success: 'Email enviado correctamente', data };
  } catch (error) {
    console.error('Error al enviar email:', error);
    return { error: 'Error al procesar el envío del email' };
  }
}

/**
 * Envía un email de bienvenida al nuevo usuario
 */
export async function sendWelcomeEmail(to: string, name: string) {
  if (!process.env.RESEND_API_KEY) {
    return { error: 'Configuración de email no disponible' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Mhorp <onboarding@resend.dev>',
      to,
      subject: '¡Bienvenido a Mhorp!',
      html: `
        <h1>¡Bienvenido a Mhorp, ${name}!</h1>
        <p>Gracias por registrarte en nuestra tienda.</p>
        <p>Explora nuestro catálogo y encuentra los mejores productos.</p>
        <p>Saludos,<br />El equipo de Mhorp</p>
      `,
    });

    if (error) {
      console.error('Error al enviar email de bienvenida:', error);
      return { error: 'No se pudo enviar el email' };
    }

    return { success: 'Email de bienvenida enviado', data };
  } catch (error) {
    console.error('Error al enviar email de bienvenida:', error);
    return { error: 'Error al procesar el envío' };
  }
}
