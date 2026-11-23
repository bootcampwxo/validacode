import bcrypt from 'bcryptjs';
import { config } from '../../config';

export interface IPasswordHasher {
  hash(plainText: string): Promise<string>;
  compare(plainText: string, hashed: string): Promise<boolean>;
}

export class BcryptHasher implements IPasswordHasher {
  private readonly rounds: number;

  constructor(rounds = config.jwt.saltRounds) {
    this.rounds = rounds;
  }

  public async hash(plainText: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.rounds);
    return bcrypt.hash(plainText, salt);
  }

  public async compare(plainText: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plainText, hashed);
  }
}
