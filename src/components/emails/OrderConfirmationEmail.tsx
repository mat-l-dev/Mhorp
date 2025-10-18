// src/components/emails/OrderConfirmationEmail.tsx
// Propósito: Plantilla de email profesional para actualizaciones de pedidos
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Heading,
  Text,
  Section,
  Hr,
} from '@react-email/components';

interface OrderConfirmationEmailProps {
  orderId: string;
  status: string;
  customerName?: string;
}

const statusMessages: Record<string, { title: string; message: string }> = {
  pending: {
    title: 'Pedido Recibido',
    message: 'Hemos recibido tu pedido y estamos procesando tu comprobante de pago.',
  },
  processing: {
    title: 'Pago Aprobado',
    message: '¡Genial! Tu pago ha sido aprobado y estamos preparando tu pedido para el envío.',
  },
  shipped: {
    title: 'Pedido Enviado',
    message: 'Tu pedido ya está en camino. Recibirás un email con el código de seguimiento pronto.',
  },
  delivered: {
    title: 'Pedido Entregado',
    message: '¡Tu pedido ha sido entregado! Esperamos que disfrutes tus productos.',
  },
  cancelled: {
    title: 'Pedido Cancelado',
    message: 'Tu pedido ha sido cancelado. Si tienes preguntas, no dudes en contactarnos.',
  },
};

export default function OrderConfirmationEmail({
  orderId,
  status,
  customerName = 'Cliente',
}: OrderConfirmationEmailProps) {
  const statusInfo = statusMessages[status] || {
    title: 'Actualización de Pedido',
    message: `El estado de tu pedido ha cambiado a: ${status}`,
  };

  return (
    <Html>
      <Head />
      <Preview>{statusInfo.title} - Pedido #{orderId}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Mhorp</Heading>
          <Hr style={hr} />
          
          <Section style={section}>
            <Heading as="h2" style={h2}>
              {statusInfo.title}
            </Heading>
            
            <Text style={text}>Hola {customerName},</Text>
            
            <Text style={text}>{statusInfo.message}</Text>
            
            <Section style={orderInfo}>
              <Text style={orderLabel}>Número de Pedido:</Text>
              <Text style={orderValue}>#{orderId}</Text>
              <Text style={orderLabel}>Estado Actual:</Text>
              <Text style={statusBadge}>{status.toUpperCase()}</Text>
            </Section>
            
            <Hr style={hr} />
            
            <Text style={footer}>
              Puedes revisar los detalles completos de tu pedido iniciando sesión en tu cuenta de Mhorp.
            </Text>
            
            <Text style={footer}>
              Si tienes alguna pregunta, no dudes en contactarnos.
            </Text>
            
            <Text style={footer}>
              Gracias por tu compra,
              <br />
              <strong>El equipo de Mhorp</strong>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Estilos inline para compatibilidad con clientes de email
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const section = {
  padding: '0 48px',
};

const h1 = {
  color: '#000',
  fontSize: '32px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '40px 0',
};

const h2 = {
  color: '#000',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '30px 0 15px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const orderInfo = {
  backgroundColor: '#f6f9fc',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const orderLabel = {
  color: '#666',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '8px 0 4px',
};

const orderValue = {
  color: '#000',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px',
};

const statusBadge = {
  display: 'inline-block',
  backgroundColor: '#0070f3',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold',
  padding: '8px 16px',
  borderRadius: '4px',
  margin: '0',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 0',
};
