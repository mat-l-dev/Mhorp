import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, wishlistItems, priceHistory, users } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

/**
 * Cron job para detectar bajadas de precio y notificar usuarios
 * Se ejecuta diariamente con Vercel Cron Jobs
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autorización del cron job
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Iniciando verificación de precios...');

    // Obtener todos los productos actuales
    const allProducts = await db.select().from(products);

    let totalNotifications = 0;
    const priceDrops: Array<{
      productId: number;
      productName: string;
      oldPrice: number;
      newPrice: number;
      discount: number;
      affectedUsers: number;
    }> = [];

    for (const product of allProducts) {
      // Obtener el último precio registrado
      const lastPriceRecord = await db
        .select()
        .from(priceHistory)
        .where(eq(priceHistory.productId, product.id))
        .orderBy(sql`${priceHistory.createdAt} DESC`)
        .limit(1);

      const currentPrice = parseFloat(product.price);
      const lastPrice = lastPriceRecord[0] ? parseFloat(lastPriceRecord[0].price) : null;

      // Si hay bajada de precio (al menos 5% o $50)
      if (lastPrice && currentPrice < lastPrice) {
        const priceDiff = lastPrice - currentPrice;
        const percentDiff = (priceDiff / lastPrice) * 100;

        if (percentDiff >= 5 || priceDiff >= 50) {
          console.log(
            `[CRON] Bajada de precio detectada: ${product.name} - $${lastPrice} → $${currentPrice} (-${percentDiff.toFixed(1)}%)`
          );

          // Encontrar usuarios con este producto en wishlist
          const usersWithWishlist = await db
            .select({
              userId: wishlistItems.userId,
              userEmail: users.email,
              userName: users.name,
            })
            .from(wishlistItems)
            .innerJoin(users, eq(wishlistItems.userId, users.id))
            .where(eq(wishlistItems.productId, product.id));

          if (usersWithWishlist.length > 0) {
            // Enviar notificaciones por email
            for (const user of usersWithWishlist) {
              await sendPriceDropEmail({
                to: user.userEmail,
                userName: user.userName || 'Usuario',
                productName: product.name,
                oldPrice: lastPrice,
                newPrice: currentPrice,
                discount: percentDiff,
                productUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/products/${product.id}`,
              });
              totalNotifications++;
            }

            priceDrops.push({
              productId: product.id,
              productName: product.name,
              oldPrice: lastPrice,
              newPrice: currentPrice,
              discount: percentDiff,
              affectedUsers: usersWithWishlist.length,
            });
          }
        }
      }

      // Registrar precio actual en historial
      await db.insert(priceHistory).values({
        productId: product.id,
        price: product.price,
      });
    }

    console.log(`[CRON] Finalizado. ${totalNotifications} notificaciones enviadas`);

    return NextResponse.json({
      success: true,
      productsChecked: allProducts.length,
      priceDropsDetected: priceDrops.length,
      notificationsSent: totalNotifications,
      details: priceDrops,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[CRON] Error al verificar precios:', error);
    return NextResponse.json(
      { error: 'Error al procesar verificación de precios' },
      { status: 500 }
    );
  }
}

/**
 * Envía email de notificación de bajada de precio
 * Usa Resend o el servicio configurado
 */
async function sendPriceDropEmail({
  to,
  userName,
  productName,
  oldPrice,
  newPrice,
  discount,
  productUrl,
}: {
  to: string;
  userName: string;
  productName: string;
  oldPrice: number;
  newPrice: number;
  discount: number;
  productUrl: string;
}) {
  try {
    // Si no hay API key de Resend, solo loggear
    if (!process.env.RESEND_API_KEY) {
      console.log(`[EMAIL] Simulando envío a ${to}: ${productName} bajó de precio`);
      return;
    }

    // Implementación real con Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'noreply@tutienda.com',
        to,
        subject: `¡${productName} bajó de precio! 🎉`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">¡Bajada de Precio!</h1>
              </div>
              
              <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 18px; margin-top: 0;">Hola ${userName},</p>
                
                <p style="font-size: 16px;">
                  ¡Buenas noticias! Un producto de tu wishlist bajó de precio:
                </p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                  <h2 style="margin-top: 0; color: #667eea; font-size: 20px;">${productName}</h2>
                  
                  <div style="margin: 15px 0;">
                    <span style="text-decoration: line-through; color: #999; font-size: 18px;">
                      $${oldPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                    <span style="font-size: 28px; font-weight: bold; color: #22c55e; margin-left: 10px;">
                      $${newPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  
                  <div style="background: #22c55e; color: white; display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 16px;">
                    ¡${discount.toFixed(0)}% de descuento!
                  </div>
                </div>
                
                <p style="font-size: 16px;">
                  Ahorra $${(oldPrice - newPrice).toLocaleString('es-MX', { minimumFractionDigits: 2 })} comprándolo ahora.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${productUrl}" 
                     style="background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
                    Ver Producto
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                  <strong>Nota:</strong> Los precios pueden variar. Esta oferta está sujeta a disponibilidad.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
                <p>Recibiste este email porque tienes este producto en tu wishlist.</p>
                <p>Si no deseas recibir estas notificaciones, puedes ajustar tus preferencias en tu cuenta.</p>
              </div>
            </body>
          </html>
        `,
      }),
    });

    if (!response.ok) {
      throw new Error(`Resend API error: ${response.status}`);
    }

    console.log(`[EMAIL] Enviado exitosamente a ${to}`);
  } catch (error) {
    console.error(`[EMAIL] Error al enviar a ${to}:`, error);
  }
}
