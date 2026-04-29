import jwt from "jsonwebtoken";
import crypto from "crypto";
import { AppDataSource } from "../database/data-source";
import { RefreshToken } from "../entities/RefreshToken";
import { User } from "../entities/User";
import { generateId } from "../utils";
import { TokenPayload, UnauthorizedError } from "../types";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access_secret_dev";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret_dev";
const ACCESS_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "3m";
const REFRESH_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "5m";

function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 300;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1, m: 60, h: 3600, d: 86400,
  };
  return value * (multipliers[unit] || 60);
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export class TokenService {
  private readonly refreshTokenRepo = () =>
    AppDataSource.getRepository(RefreshToken);

  issueAccessToken(user: User): string {
    const payload: TokenPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      type: "access",
    };
    return jwt.sign(payload, ACCESS_SECRET, {
      expiresIn: ACCESS_EXPIRY as any,
    });
  }

  async issueRefreshToken(user: User): Promise<string> {
    const raw = crypto.randomBytes(64).toString("hex");
    const hash = hashToken(raw);
    const expiresAt = new Date(
      Date.now() + parseExpiry(REFRESH_EXPIRY) * 1000
    );

    const token = this.refreshTokenRepo().create({
      id: generateId(),
      token_hash: hash,
      user_id: user.id,
      expires_at: expiresAt,
      is_revoked: false,
    });

    await this.refreshTokenRepo().save(token);
    return raw;
  }

  async issueTokenPair(
    user: User
  ): Promise<{ access_token: string; refresh_token: string }> {
    const access_token = this.issueAccessToken(user);
    const refresh_token = await this.issueRefreshToken(user);
    return { access_token, refresh_token };
  }

  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
    } catch {
      throw new UnauthorizedError("Invalid or expired access token");
    }
  }

  verifyRefreshTokenJwt(token: string): TokenPayload {
    try {
      return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }
  }
  
  async rotateRefreshToken(
    rawToken: string
  ): Promise<{ access_token: string; refresh_token: string }> {
    const hash = hashToken(rawToken);
    const repo = this.refreshTokenRepo();

    const stored = await repo.findOne({
      where: { token_hash: hash },
      relations: ["user"],
    });

    if (!stored || stored.is_revoked || stored.expires_at < new Date()) {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    if (!stored.user.is_active) {
      throw new UnauthorizedError("Account is inactive");
    }

    // Invalidate old token immediately
    stored.is_revoked = true;
    await repo.save(stored);

    // Issue new pair
    return this.issueTokenPair(stored.user);
  }

  async revokeRefreshToken(rawToken: string): Promise<void> {
    const hash = hashToken(rawToken);
    const repo = this.refreshTokenRepo();

    const stored = await repo.findOne({ where: { token_hash: hash } });
    if (stored) {
      stored.is_revoked = true;
      await repo.save(stored);
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepo().update(
      { user_id: userId, is_revoked: false },
      { is_revoked: true }
    );
  }
}

export const tokenService = new TokenService();