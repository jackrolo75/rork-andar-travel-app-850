export interface EmailConfig {
  supportEmail: string;
  adminEmail: string;
  generalEmail: string;
  domain: string;
}

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface BookingConfirmationEmail {
  bookingId: string;
  passengerName: string;
  passengerEmail: string;
  route: {
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
  };
  price: number;
  currency: string;
  seatNumber?: string;
}

export interface ActivityPurchaseConfirmation {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  activityTitle: string;
  destination: string;
  date: string;
  timeSlot?: string;
  guests: number;
  duration?: string;
  location?: string;
  totalPrice: number;
  currency: string;
  paymentMethod?: string;
}

export interface ContactFormSubmission {
  name: string;
  email: string;
  subject: string;
  message: string;
  bookingId?: string;
}

export interface DualCurrencyDisplay {
  localAmount: number;
  localCurrency: string;
  homeAmount: number;
  homeCurrency: string;
}

export class EmailService {
  private config: EmailConfig;

  constructor() {
    this.config = {
      supportEmail: 'support@andar-travel.com',
      adminEmail: 'joao@andartravel.com',
      generalEmail: 'andar-travel@hotmail.com',
      domain: 'andartravel.com',
    };
    
    console.log('📧 Email Service: Initialized');
    console.log('📧 Support Email:', this.config.supportEmail);
    console.log('📧 Admin Email:', this.config.adminEmail);
    console.log('📧 General Email:', this.config.generalEmail);
    console.log('📧 Domain:', this.config.domain);
  }

  getContactEmails() {
    return {
      support: this.config.supportEmail,
      admin: this.config.adminEmail,
      general: this.config.generalEmail,
      domain: this.config.domain,
    };
  }

  async sendBookingConfirmation(booking: BookingConfirmationEmail): Promise<{ success: boolean; error?: string }> {
    console.log('📧 Sending booking confirmation email to:', booking.passengerEmail);

    try {
      const emailTemplate = this.generateBookingConfirmationTemplate(booking);
      
      await this.sendEmail(emailTemplate);
      
      console.log('✅ Booking confirmation email sent successfully');
      
      return { success: true };
    } catch (error: any) {
      console.error('❌ Failed to send booking confirmation email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendBookingConfirmationWithTicket(
    booking: BookingConfirmationEmail,
    qrCode: string,
    dualCurrency: DualCurrencyDisplay
  ): Promise<{ success: boolean; error?: string }> {
    console.log('📧 Sending booking confirmation with ticket to:', booking.passengerEmail);

    try {
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`;
      
      const emailTemplate: EmailTemplate = {
        to: booking.passengerEmail,
        subject: `🎫 Tu Boleto Digital - Reserva ${booking.bookingId} | ANDAR Travel`,
        html: this.generateTicketEmailHTML(booking, qrCodeUrl, dualCurrency),
        text: this.generateTicketEmailText(booking, qrCode, dualCurrency),
      };

      await this.sendEmail(emailTemplate);

      console.log('✅ Ticket email sent successfully');

      return { success: true };
    } catch (error: any) {
      console.error('❌ Failed to send ticket email:', error);
      return { success: false, error: error.message };
    }
  }

  private generateTicketEmailHTML(
    booking: BookingConfirmationEmail,
    qrCodeUrl: string,
    dualCurrency: DualCurrencyDisplay
  ): string {
    const seatInfo = booking.seatNumber ? `<p style="margin: 8px 0;"><strong>🪑 Asiento:</strong> ${booking.seatNumber}</p>` : '';
    const localPrice = `${dualCurrency.localCurrency} ${dualCurrency.localAmount.toFixed(2)}`;
    const homePrice = `${dualCurrency.homeCurrency} ${dualCurrency.homeAmount.toFixed(2)}`;

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tu Boleto Digital - ANDAR</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background: linear-gradient(135deg, #2D5A27 0%, #E2725B 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 36px; font-weight: 800;">ANDAR</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Tu Boleto Digital</p>
        </div>

        <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 25px;">
            <div style="background: #E8F5E9; color: #2D5A27; padding: 12px 24px; border-radius: 8px; display: inline-block; font-weight: 600;">
              ✅ Reserva Confirmada
            </div>
          </div>

          <div style="background: #f9f9f9; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #2D5A27; font-size: 18px;">📋 Detalles de la Reserva</h3>
            <p style="margin: 8px 0;"><strong>Código:</strong> <span style="font-family: monospace; background: #E2725B; color: white; padding: 4px 8px; border-radius: 4px;">${booking.bookingId}</span></p>
            <p style="margin: 8px 0;"><strong>👤 Pasajero:</strong> ${booking.passengerName}</p>
            ${seatInfo}
          </div>

          <div style="background: #f9f9f9; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #2D5A27; font-size: 18px;">🚌 Tu Viaje</h3>
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <div style="flex: 1;">
                <p style="margin: 0; font-size: 12px; color: #666;">ORIGEN</p>
                <p style="margin: 4px 0; font-weight: 600; font-size: 16px;">${booking.route.origin}</p>
                <p style="margin: 0; color: #E2725B; font-weight: 600;">${booking.route.departureTime}</p>
              </div>
              <div style="padding: 0 20px; color: #ccc;">→</div>
              <div style="flex: 1; text-align: right;">
                <p style="margin: 0; font-size: 12px; color: #666;">DESTINO</p>
                <p style="margin: 4px 0; font-weight: 600; font-size: 16px;">${booking.route.destination}</p>
                <p style="margin: 0; color: #2D5A27; font-weight: 600;">${booking.route.arrivalTime}</p>
              </div>
            </div>
          </div>

          <div style="background: #f9f9f9; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #2D5A27; font-size: 18px;">💰 Pago</h3>
            <p style="margin: 8px 0;"><strong>💵 Precio Local:</strong> ${localPrice}</p>
            <p style="margin: 8px 0;"><strong>🌎 Equivalente:</strong> ${homePrice}</p>
          </div>

          <div style="text-align: center; background: white; padding: 25px; border: 2px dashed #E2725B; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #2D5A27;">🎫 Tu Código QR</h3>
            <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">Presenta este código en el terminal</p>
            <img src="${qrCodeUrl}" alt="Código QR" style="max-width: 200px; height: auto; border-radius: 8px;" />
            <p style="margin: 15px 0 0 0; font-family: monospace; font-size: 12px; color: #999;">${booking.bookingId}</p>
          </div>

          <div style="background: #FFF3CD; padding: 20px; border-radius: 12px; border-left: 4px solid #E2725B;">
            <h4 style="margin: 0 0 10px 0; color: #856404;">⚠️ Importante</h4>
            <ul style="margin: 0; padding-left: 20px; color: #856404;">
              <li>Presenta este email o el código QR en el terminal</li>
              <li>Llega 30 minutos antes de la salida</li>
              <li>Guarda este email como comprobante</li>
              <li>Este boleto es válido sin conexión a internet</li>
            </ul>
          </div>
        </div>

        <div style="text-align: center; padding: 25px; color: #999; font-size: 12px;">
          <p style="margin: 0 0 5px 0;">¿Necesitas ayuda? Contáctanos:</p>
          <p style="margin: 0 0 15px 0;">📧 <a href="mailto:support@andar-travel.com" style="color: #E2725B;">support@andar-travel.com</a></p>
          <p style="margin: 0;">ANDAR Travel | andartravel.com</p>
          <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} ANDAR. Todos los derechos reservados.</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateTicketEmailText(
    booking: BookingConfirmationEmail,
    qrCode: string,
    dualCurrency: DualCurrencyDisplay
  ): string {
    const seatInfo = booking.seatNumber ? `\nAsiento: ${booking.seatNumber}` : '';
    const localPrice = `${dualCurrency.localCurrency} ${dualCurrency.localAmount.toFixed(2)}`;
    const homePrice = `${dualCurrency.homeCurrency} ${dualCurrency.homeAmount.toFixed(2)}`;

    return `
🎫 ANDAR - TU BOLETO DIGITAL
============================

✅ RESERVA CONFIRMADA

DETALLES DE LA RESERVA
----------------------
Código: ${booking.bookingId}
Pasajero: ${booking.passengerName}${seatInfo}

TU VIAJE
--------
Origen: ${booking.route.origin}
Destino: ${booking.route.destination}
Salida: ${booking.route.departureTime}
Llegada: ${booking.route.arrivalTime}

PAGO
----
Precio Local: ${localPrice}
Equivalente: ${homePrice}

CÓDIGO QR
---------
Presenta este código en el terminal: ${qrCode}

Ver QR: https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}

IMPORTANTE
----------
• Presenta este email o el código QR en el terminal
• Llega 30 minutos antes de la salida
• Guarda este email como comprobante
• Este boleto es válido sin conexión a internet

¿Necesitas ayuda?
Email: support@andar-travel.com

ANDAR Travel | andartravel.com
© ${new Date().getFullYear()} ANDAR. Todos los derechos reservados.
    `.trim();
  }

  async sendActivityPurchaseConfirmation(data: ActivityPurchaseConfirmation): Promise<{ success: boolean; error?: string }> {
    console.log('📧 Sending activity purchase confirmation email to:', data.customerEmail);

    try {
      const emailTemplate: EmailTemplate = {
        to: data.customerEmail,
        subject: `Booking Confirmed - ${data.activityTitle} | ANDAR Travel`,
        html: this.generateActivityConfirmationHTML(data),
        text: this.generateActivityConfirmationText(data),
      };

      await this.sendEmail(emailTemplate);

      const adminNotification: EmailTemplate = {
        to: this.config.adminEmail,
        subject: `New Activity Booking - ${data.bookingId} | ${data.activityTitle}`,
        html: this.generateAdminActivityNotificationHTML(data),
        text: `New booking: ${data.bookingId} - ${data.activityTitle} - ${data.currency} ${data.totalPrice} - ${data.customerName} (${data.customerEmail})`,
      };

      await this.sendEmail(adminNotification);

      console.log('✅ Activity purchase confirmation email sent successfully');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Failed to send activity purchase confirmation email:', error);
      return { success: false, error: error.message };
    }
  }

  private generateActivityConfirmationHTML(data: ActivityPurchaseConfirmation): string {
    const formattedDate = data.date
      ? new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      : 'To be confirmed';
    const timeInfo = data.timeSlot ? `<tr><td style="padding:10px 0;color:#6B7084;font-size:14px;">Time</td><td style="padding:10px 0;font-weight:600;color:#1A1D26;font-size:14px;text-align:right;">${data.timeSlot}</td></tr>` : '';
    const durationInfo = data.duration ? `<tr><td style="padding:10px 0;color:#6B7084;font-size:14px;">Duration</td><td style="padding:10px 0;font-weight:600;color:#1A1D26;font-size:14px;text-align:right;">${data.duration}</td></tr>` : '';

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmation</title>
      </head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#1A1D26;max-width:600px;margin:0 auto;padding:0;background-color:#F5F6F8;">
        <div style="background:linear-gradient(135deg,#0D7377 0%,#085355 100%);padding:40px 30px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:32px;font-weight:800;letter-spacing:1px;">ANDAR</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Travel Experiences</p>
        </div>

        <div style="background:white;padding:32px;margin:0;">
          <div style="text-align:center;margin-bottom:28px;">
            <div style="display:inline-block;background:rgba(13,115,119,0.1);color:#0D7377;padding:10px 24px;border-radius:24px;font-weight:700;font-size:14px;">✅ Booking Confirmed</div>
          </div>

          <p style="margin:0 0 6px;font-size:16px;color:#6B7084;">Hi ${data.customerName || 'Traveler'},</p>
          <p style="margin:0 0 28px;font-size:16px;color:#1A1D26;">Your activity has been booked successfully. Here are the details:</p>

          <div style="background:#F5F6F8;border-radius:16px;padding:24px;margin-bottom:24px;">
            <h3 style="margin:0 0 4px;color:#0D7377;font-size:13px;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;">Activity</h3>
            <p style="margin:0 0 20px;font-size:18px;font-weight:700;color:#1A1D26;line-height:1.4;">${data.activityTitle}</p>

            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:10px 0;border-top:1px solid #E4E5EA;color:#6B7084;font-size:14px;">Booking ID</td><td style="padding:10px 0;border-top:1px solid #E4E5EA;font-weight:700;color:#0D7377;font-size:14px;text-align:right;font-family:monospace;">${data.bookingId.toUpperCase().slice(0, 16)}</td></tr>
              <tr><td style="padding:10px 0;border-top:1px solid #E4E5EA;color:#6B7084;font-size:14px;">Location</td><td style="padding:10px 0;border-top:1px solid #E4E5EA;font-weight:600;color:#1A1D26;font-size:14px;text-align:right;">${data.location || data.destination}</td></tr>
              <tr><td style="padding:10px 0;border-top:1px solid #E4E5EA;color:#6B7084;font-size:14px;">Date</td><td style="padding:10px 0;border-top:1px solid #E4E5EA;font-weight:600;color:#1A1D26;font-size:14px;text-align:right;">${formattedDate}</td></tr>
              ${timeInfo}
              <tr><td style="padding:10px 0;border-top:1px solid #E4E5EA;color:#6B7084;font-size:14px;">Guests</td><td style="padding:10px 0;border-top:1px solid #E4E5EA;font-weight:600;color:#1A1D26;font-size:14px;text-align:right;">${data.guests} guest${data.guests > 1 ? 's' : ''}</td></tr>
              ${durationInfo}
            </table>
          </div>

          <div style="background:#F5F6F8;border-radius:16px;padding:24px;margin-bottom:24px;">
            <h3 style="margin:0 0 16px;color:#0D7377;font-size:13px;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;">Payment Summary</h3>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:12px 0;border-top:2px solid #0D7377;font-weight:700;color:#1A1D26;font-size:16px;">Total Paid</td><td style="padding:12px 0;border-top:2px solid #0D7377;font-weight:800;color:#0D7377;font-size:20px;text-align:right;">${data.totalPrice} ${data.currency}</td></tr>
            </table>
          </div>

          <div style="background:rgba(13,115,119,0.06);padding:20px;border-radius:12px;border-left:4px solid #0D7377;margin-bottom:24px;">
            <h4 style="margin:0 0 8px;color:#0D7377;font-size:14px;">Important Information</h4>
            <ul style="margin:0;padding-left:18px;color:#1A1D26;font-size:14px;line-height:1.8;">
              <li>Please arrive 15 minutes before the scheduled start time</li>
              <li>Bring this email or your booking reference as confirmation</li>
              <li>Check the activity provider for cancellation policies</li>
            </ul>
          </div>
        </div>

        <div style="background:white;padding:24px 32px;border-top:1px solid #E4E5EA;">
          <p style="margin:0 0 4px;font-size:14px;color:#6B7084;">Need help?</p>
          <p style="margin:0;font-size:14px;"><a href="mailto:support@andar-travel.com" style="color:#0D7377;font-weight:600;text-decoration:none;">support@andar-travel.com</a></p>
        </div>

        <div style="text-align:center;padding:24px;color:#9CA0B0;font-size:12px;">
          <p style="margin:0 0 4px;">ANDAR Travel | <a href="https://andartravel.com" style="color:#0D7377;text-decoration:none;">andartravel.com</a></p>
          <p style="margin:0;">&copy; ${new Date().getFullYear()} ANDAR. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateActivityConfirmationText(data: ActivityPurchaseConfirmation): string {
    const formattedDate = data.date
      ? new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      : 'To be confirmed';
    const timeInfo = data.timeSlot ? `\nTime: ${data.timeSlot}` : '';
    const durationInfo = data.duration ? `\nDuration: ${data.duration}` : '';

    return `
ANDAR - Booking Confirmation
============================

Booking Confirmed!

Hi ${data.customerName || 'Traveler'},

Your activity has been booked successfully.

ACTIVITY DETAILS
----------------
${data.activityTitle}

Booking ID: ${data.bookingId.toUpperCase().slice(0, 16)}
Location: ${data.location || data.destination}
Date: ${formattedDate}${timeInfo}
Guests: ${data.guests} guest${data.guests > 1 ? 's' : ''}${durationInfo}

PAYMENT
-------
Total Paid: ${data.totalPrice} ${data.currency}

IMPORTANT
---------
- Please arrive 15 minutes before the scheduled start time
- Bring this email or your booking reference as confirmation
- Check the activity provider for cancellation policies

Need help? Email: support@andar-travel.com

ANDAR Travel | andartravel.com
(c) ${new Date().getFullYear()} ANDAR. All rights reserved.
    `.trim();
  }

  private generateAdminActivityNotificationHTML(data: ActivityPurchaseConfirmation): string {
    return `
      <!DOCTYPE html>
      <html><head><meta charset="UTF-8"></head>
      <body style="font-family:-apple-system,sans-serif;padding:20px;color:#333;">
        <h2 style="color:#0D7377;">New Activity Booking</h2>
        <table style="border-collapse:collapse;width:100%;">
          <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Booking ID</strong></td><td style="padding:8px;border-bottom:1px solid #eee;">${data.bookingId}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Activity</strong></td><td style="padding:8px;border-bottom:1px solid #eee;">${data.activityTitle}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Customer</strong></td><td style="padding:8px;border-bottom:1px solid #eee;">${data.customerName} (${data.customerEmail})</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Destination</strong></td><td style="padding:8px;border-bottom:1px solid #eee;">${data.destination}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Date</strong></td><td style="padding:8px;border-bottom:1px solid #eee;">${data.date}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Guests</strong></td><td style="padding:8px;border-bottom:1px solid #eee;">${data.guests}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Amount</strong></td><td style="padding:8px;border-bottom:1px solid #eee;">${data.totalPrice} ${data.currency}</td></tr>
          <tr><td style="padding:8px;"><strong>Time</strong></td><td style="padding:8px;">${new Date().toISOString()}</td></tr>
        </table>
      </body></html>
    `;
  }

  async sendPaymentReceipt(
    email: string,
    bookingId: string,
    amount: number,
    currency: string,
    paymentMethod: string
  ): Promise<{ success: boolean; error?: string }> {
    console.log('📧 Sending payment receipt to:', email);

    try {
      const emailTemplate: EmailTemplate = {
        to: email,
        subject: `Recibo de Pago - Reserva ${bookingId} | ANDAR Travel`,
        html: this.generatePaymentReceiptHTML(bookingId, amount, currency, paymentMethod),
        text: this.generatePaymentReceiptText(bookingId, amount, currency, paymentMethod),
      };

      await this.sendEmail(emailTemplate);
      
      console.log('✅ Payment receipt email sent successfully');
      
      return { success: true };
    } catch (error: any) {
      console.error('❌ Failed to send payment receipt:', error);
      return { success: false, error: error.message };
    }
  }

  async handleContactForm(submission: ContactFormSubmission): Promise<{ success: boolean; error?: string }> {
    console.log('📧 Processing contact form submission from:', submission.email);

    try {
      const notificationEmail: EmailTemplate = {
        to: this.config.supportEmail,
        subject: `Nuevo Mensaje de Contacto: ${submission.subject}`,
        html: this.generateContactFormNotificationHTML(submission),
        text: this.generateContactFormNotificationText(submission),
      };

      await this.sendEmail(notificationEmail);

      const confirmationEmail: EmailTemplate = {
        to: submission.email,
        subject: 'Hemos Recibido Tu Mensaje | ANDAR Travel',
        html: this.generateContactConfirmationHTML(submission),
        text: this.generateContactConfirmationText(submission),
      };

      await this.sendEmail(confirmationEmail);

      console.log('✅ Contact form emails sent successfully');

      return { success: true };
    } catch (error: any) {
      console.error('❌ Failed to process contact form:', error);
      return { success: false, error: error.message };
    }
  }

  async sendRefundNotification(
    email: string,
    bookingId: string,
    amount: number,
    currency: string
  ): Promise<{ success: boolean; error?: string }> {
    console.log('📧 Sending refund notification to:', email);

    try {
      const emailTemplate: EmailTemplate = {
        to: email,
        subject: `Reembolso Procesado - Reserva ${bookingId} | ANDAR Travel`,
        html: this.generateRefundNotificationHTML(bookingId, amount, currency),
        text: this.generateRefundNotificationText(bookingId, amount, currency),
      };

      await this.sendEmail(emailTemplate);

      console.log('✅ Refund notification email sent successfully');

      return { success: true };
    } catch (error: any) {
      console.error('❌ Failed to send refund notification:', error);
      return { success: false, error: error.message };
    }
  }

  private async sendEmail(template: EmailTemplate): Promise<void> {
    console.log('📤 Sending email to:', template.to);
    console.log('📧 Subject:', template.subject);

    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.log('⚠️ Email Service: RESEND_API_KEY not configured, falling back to console log');
      console.log('📧 Email Preview:', {
        to: template.to,
        subject: template.subject,
        textPreview: template.text.substring(0, 100) + '...',
      });
      return;
    }

    try {
      const fromAddress = process.env.RESEND_FROM_EMAIL || `ANDAR Travel <noreply@${this.config.domain}>`;

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [template.to],
          subject: template.subject,
          html: template.html,
          text: template.text,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('❌ Resend API error:', response.status, errorBody);
        throw new Error(`Resend API error: ${response.status} - ${errorBody}`);
      }

      const result = await response.json();
      console.log('✅ Email sent via Resend, id:', (result as any).id);
    } catch (error: any) {
      console.error('❌ Email delivery failed:', error.message);
      throw error;
    }
  }

  private generateBookingConfirmationTemplate(booking: BookingConfirmationEmail): EmailTemplate {
    return {
      to: booking.passengerEmail,
      subject: `Confirmación de Reserva ${booking.bookingId} | ANDAR Travel`,
      html: this.generateBookingConfirmationHTML(booking),
      text: this.generateBookingConfirmationText(booking),
    };
  }

  private generateBookingConfirmationHTML(booking: BookingConfirmationEmail): string {
    const seatInfo = booking.seatNumber ? `<p><strong>Asiento:</strong> ${booking.seatNumber}</p>` : '';

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación de Reserva</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2D5A27 0%, #E2725B 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 32px;">ANDAR</h1>
          <p style="color: white; margin: 10px 0 0 0;">Viaja por Sudamérica</p>
        </div>

        <div style="background: #f9f9f9; padding: 25px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="color: #2D5A27; margin-top: 0;">✅ ¡Reserva Confirmada!</h2>
          <p>Hola <strong>${booking.passengerName}</strong>,</p>
          <p>Tu reserva ha sido confirmada exitosamente.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2D5A27;">Detalles de tu Viaje</h3>
            <p><strong>Código de Reserva:</strong> ${booking.bookingId}</p>
            ${seatInfo}
            <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
            <p><strong>Origen:</strong> ${booking.route.origin}</p>
            <p><strong>Destino:</strong> ${booking.route.destination}</p>
            <p><strong>Salida:</strong> ${booking.route.departureTime}</p>
            <p><strong>Llegada:</strong> ${booking.route.arrivalTime}</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
            <p><strong>Total Pagado:</strong> ${booking.currency} ${booking.price.toFixed(2)}</p>
          </div>

          <div style="background: #FFF3CD; padding: 15px; border-radius: 8px; border-left: 4px solid #E2725B;">
            <h4 style="margin-top: 0; color: #856404;">⚠️ Importante</h4>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Presenta tu código QR en el terminal</li>
              <li>Llega 30 minutos antes de la salida</li>
              <li>Guarda este correo como comprobante</li>
            </ul>
          </div>
        </div>

        <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
          <h3 style="color: #2D5A27;">¿Necesitas ayuda?</h3>
          <p>Nuestro equipo está disponible para asistirte:</p>
          <p>📧 Email: <a href="mailto:support@andar-travel.com" style="color: #E2725B;">support@andar-travel.com</a></p>
          <p>📱 Soporte: Responde a este correo electrónico</p>
        </div>

        <div style="text-align: center; color: #999; font-size: 12px; padding: 20px 0;">
          <p>ANDAR Travel | andartravel.com</p>
          <p>© ${new Date().getFullYear()} ANDAR. Todos los derechos reservados.</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateBookingConfirmationText(booking: BookingConfirmationEmail): string {
    const seatInfo = booking.seatNumber ? `\nAsiento: ${booking.seatNumber}` : '';

    return `
ANDAR - Confirmación de Reserva

¡Reserva Confirmada!

Hola ${booking.passengerName},

Tu reserva ha sido confirmada exitosamente.

DETALLES DE TU VIAJE
---------------------
Código de Reserva: ${booking.bookingId}${seatInfo}

Origen: ${booking.route.origin}
Destino: ${booking.route.destination}
Salida: ${booking.route.departureTime}
Llegada: ${booking.route.arrivalTime}

Total Pagado: ${booking.currency} ${booking.price.toFixed(2)}

IMPORTANTE
----------
• Presenta tu código QR en el terminal
• Llega 30 minutos antes de la salida
• Guarda este correo como comprobante

¿NECESITAS AYUDA?
-----------------
Email: support@andar-travel.com
Soporte: Responde a este correo electrónico

ANDAR Travel | andartravel.com
© ${new Date().getFullYear()} ANDAR. Todos los derechos reservados.
    `.trim();
  }

  private generatePaymentReceiptHTML(bookingId: string, amount: number, currency: string, paymentMethod: string): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recibo de Pago</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2D5A27 0%, #E2725B 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 32px;">ANDAR</h1>
          <p style="color: white; margin: 10px 0 0 0;">Recibo de Pago</p>
        </div>

        <div style="background: #f9f9f9; padding: 25px; border-radius: 10px;">
          <h2 style="color: #2D5A27; margin-top: 0;">💳 Pago Recibido</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Reserva:</strong> ${bookingId}</p>
            <p><strong>Monto:</strong> ${currency} ${amount.toFixed(2)}</p>
            <p><strong>Método de Pago:</strong> ${paymentMethod}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
          </div>

          <p style="color: #666;">Este es tu comprobante de pago. Guárdalo para tus registros.</p>
        </div>

        <div style="text-align: center; color: #999; font-size: 12px; padding: 20px 0; margin-top: 30px;">
          <p>ANDAR Travel | andartravel.com</p>
          <p>📧 support@andar-travel.com</p>
        </div>
      </body>
      </html>
    `;
  }

  private generatePaymentReceiptText(bookingId: string, amount: number, currency: string, paymentMethod: string): string {
    return `
ANDAR - Recibo de Pago

Pago Recibido

Reserva: ${bookingId}
Monto: ${currency} ${amount.toFixed(2)}
Método de Pago: ${paymentMethod}
Fecha: ${new Date().toLocaleString('es-ES')}

Este es tu comprobante de pago. Guárdalo para tus registros.

ANDAR Travel | andartravel.com
support@andar-travel.com
    `.trim();
  }

  private generateContactFormNotificationHTML(submission: ContactFormSubmission): string {
    const bookingInfo = submission.bookingId ? `<p><strong>Reserva Relacionada:</strong> ${submission.bookingId}</p>` : '';

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nuevo Mensaje de Contacto</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #2D5A27; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📧 Nuevo Mensaje de Contacto</h1>
        </div>

        <div style="background: #f9f9f9; padding: 25px; border-radius: 10px;">
          <h2 style="margin-top: 0; color: #2D5A27;">${submission.subject}</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>De:</strong> ${submission.name}</p>
            <p><strong>Email:</strong> <a href="mailto:${submission.email}">${submission.email}</a></p>
            ${bookingInfo}
            <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
            <p><strong>Mensaje:</strong></p>
            <p style="white-space: pre-wrap;">${submission.message}</p>
          </div>

          <p style="color: #666; font-size: 12px;">Recibido: ${new Date().toLocaleString('es-ES')}</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateContactFormNotificationText(submission: ContactFormSubmission): string {
    const bookingInfo = submission.bookingId ? `\nReserva Relacionada: ${submission.bookingId}` : '';

    return `
ANDAR - Nuevo Mensaje de Contacto

Asunto: ${submission.subject}

De: ${submission.name}
Email: ${submission.email}${bookingInfo}

Mensaje:
${submission.message}

Recibido: ${new Date().toLocaleString('es-ES')}
    `.trim();
  }

  private generateContactConfirmationHTML(submission: ContactFormSubmission): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mensaje Recibido</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2D5A27 0%, #E2725B 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 32px;">ANDAR</h1>
        </div>

        <div style="background: #f9f9f9; padding: 25px; border-radius: 10px;">
          <h2 style="color: #2D5A27; margin-top: 0;">✅ Hemos Recibido Tu Mensaje</h2>
          <p>Hola <strong>${submission.name}</strong>,</p>
          <p>Gracias por contactarnos. Hemos recibido tu mensaje y nuestro equipo te responderá a la brevedad posible.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Tu Mensaje:</strong></p>
            <p style="color: #666; white-space: pre-wrap;">${submission.message}</p>
          </div>

          <p>Normalmente respondemos en menos de 24 horas.</p>
        </div>

        <div style="text-align: center; color: #999; font-size: 12px; padding: 20px 0; margin-top: 30px;">
          <p>ANDAR Travel | andartravel.com</p>
          <p>📧 support@andar-travel.com</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateContactConfirmationText(submission: ContactFormSubmission): string {
    return `
ANDAR - Mensaje Recibido

Hola ${submission.name},

Gracias por contactarnos. Hemos recibido tu mensaje y nuestro equipo te responderá a la brevedad posible.

Tu Mensaje:
${submission.message}

Normalmente respondemos en menos de 24 horas.

ANDAR Travel | andartravel.com
support@andar-travel.com
    `.trim();
  }

  private generateRefundNotificationHTML(bookingId: string, amount: number, currency: string): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reembolso Procesado</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2D5A27 0%, #E2725B 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 32px;">ANDAR</h1>
        </div>

        <div style="background: #f9f9f9; padding: 25px; border-radius: 10px;">
          <h2 style="color: #2D5A27; margin-top: 0;">💰 Reembolso Procesado</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Reserva:</strong> ${bookingId}</p>
            <p><strong>Monto Reembolsado:</strong> ${currency} ${amount.toFixed(2)}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
          </div>

          <div style="background: #D1ECF1; padding: 15px; border-radius: 8px; border-left: 4px solid #0C5460;">
            <p style="margin: 0;"><strong>ℹ️ El reembolso aparecerá en tu cuenta en 5-10 días hábiles.</strong></p>
          </div>
        </div>

        <div style="text-align: center; color: #999; font-size: 12px; padding: 20px 0; margin-top: 30px;">
          <p>ANDAR Travel | andartravel.com</p>
          <p>📧 support@andar-travel.com</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateRefundNotificationText(bookingId: string, amount: number, currency: string): string {
    return `
ANDAR - Reembolso Procesado

Reembolso Procesado

Reserva: ${bookingId}
Monto Reembolsado: ${currency} ${amount.toFixed(2)}
Fecha: ${new Date().toLocaleString('es-ES')}

El reembolso aparecerá en tu cuenta en 5-10 días hábiles.

ANDAR Travel | andartravel.com
support@andar-travel.com
    `.trim();
  }
}
