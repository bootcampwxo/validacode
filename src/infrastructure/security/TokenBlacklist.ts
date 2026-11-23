export class TokenBlacklist {
  private static instance: TokenBlacklist;
  private revokedTokens: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): TokenBlacklist {
    if (!TokenBlacklist.instance) {
      TokenBlacklist.instance = new TokenBlacklist();
    }
    return TokenBlacklist.instance;
  }

  public revoke(token: string): void {
    this.revokedTokens.add(token);
  }

  public isRevoked(token: string): boolean {
    return this.revokedTokens.has(token);
  }

  public clear(): void {
    this.revokedTokens.clear();
  }
}
