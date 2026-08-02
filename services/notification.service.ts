export class NotificationService {
  static async sendSecurityAlert(
    userId: string,
    payload: {
      type: string;
      message: string;
      details?: Record<string, unknown>;
    },
  ) {
    console.info("NotificationService.sendSecurityAlert", userId, payload);
    return true;
  }
}
