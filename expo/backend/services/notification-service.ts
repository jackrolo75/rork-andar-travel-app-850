import { EmailService, BookingConfirmationEmail } from './email-service';

export interface NotificationResult {
  success: boolean;
  channel: 'email' | 'none';
  emailResult?: {
    success: boolean;
    error?: string;
  };
  ticketUrl?: string;
  qrCodeUrl?: string;
}

export interface DualCurrencyData {
  localAmount: number;
  localCurrency: string;
  homeAmount: number;
  homeCurrency: string;
  exchangeRate?: number;
}

export interface BookingNotificationData {
  bookingId: string;
  passengerName: string;
  passengerEmail?: string;
  phoneNumber: string;
  route: {
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
  };
  price: number;
  currency: string;
  dualCurrency: DualCurrencyData;
  seatNumber?: string;
  qrCode: string;
}

export class NotificationService {
  private emailService: EmailService;

  constructor(emailService: EmailService) {
    this.emailService = emailService;
    console.log('🔔 NotificationService: Initialized with email delivery');
  }

  async sendBookingConfirmation(data: BookingNotificationData): Promise<NotificationResult> {
    console.log('🔔 NotificationService: Sending booking confirmation via email', {
      bookingId: data.bookingId,
      email: data.passengerEmail || 'not provided',
    });

    const result: NotificationResult = {
      success: false,
      channel: 'none',
    };

    if (data.passengerEmail) {
      const emailResult = await this.tryEmail(data);
      result.emailResult = emailResult;

      if (emailResult.success) {
        console.log('✅ NotificationService: Email delivery successful');
        result.success = true;
        result.channel = 'email';
        return result;
      }
    } else {
      console.warn('⚠️ NotificationService: No email provided');
      result.emailResult = {
        success: false,
        error: 'No email address provided',
      };
    }

    if (!result.success) {
      console.error('❌ NotificationService: Email delivery failed');
    }

    return result;
  }

  private async tryEmail(data: BookingNotificationData): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (!data.passengerEmail) {
      return {
        success: false,
        error: 'No email address provided',
      };
    }

    try {
      console.log('📧 NotificationService: Sending email to', data.passengerEmail);

      const bookingEmail: BookingConfirmationEmail = {
        bookingId: data.bookingId,
        passengerName: data.passengerName,
        passengerEmail: data.passengerEmail,
        route: data.route,
        price: data.price,
        currency: data.currency,
        seatNumber: data.seatNumber,
      };

      const emailResult = await this.emailService.sendBookingConfirmationWithTicket(
        bookingEmail,
        data.qrCode,
        data.dualCurrency
      );

      return {
        success: emailResult.success,
        error: emailResult.error,
      };
    } catch (error: any) {
      console.error('❌ NotificationService: Email error:', error);
      return {
        success: false,
        error: error.message || 'Email delivery failed',
      };
    }
  }

  async sendPaymentReceipt(
    email: string,
    bookingId: string,
    amount: number,
    currency: string,
    paymentMethod: string
  ): Promise<{ success: boolean; error?: string }> {
    console.log('📧 NotificationService: Sending payment receipt');
    return this.emailService.sendPaymentReceipt(email, bookingId, amount, currency, paymentMethod);
  }

  async sendRefundNotification(
    email: string,
    bookingId: string,
    amount: number,
    currency: string
  ): Promise<{ success: boolean; error?: string }> {
    console.log('📧 NotificationService: Sending refund notification');
    return this.emailService.sendRefundNotification(email, bookingId, amount, currency);
  }
}
