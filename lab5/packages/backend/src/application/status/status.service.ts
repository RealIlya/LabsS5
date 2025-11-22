export class StatusService {
  getStatus() {
    return {
      message: "Backend is up",
      timestamp: new Date().toISOString(),
    };
  }
}
