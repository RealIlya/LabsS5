export class StatusService {
  getStatus() {
    return {
      message: "Hex Strategy backend is up",
      timestamp: new Date().toISOString(),
    };
  }
}
