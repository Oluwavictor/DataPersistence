import axios from "axios";
import { AppDataSource } from "../database/data-source";
import { User } from "../entities/User";
import { generateId } from "../utils";

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

interface GitHubUser {
  id: number;
  login: string;
  email: string | null;
  avatar_url: string;
  name: string | null;
}

export class AuthService {
  private readonly userRepo = () => AppDataSource.getRepository(User);

  buildGitHubAuthUrl(state: string, codeChallenge?: string): string {
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID || "",
      redirect_uri: process.env.GITHUB_CALLBACK_URL || "",
      scope: "user:email read:user",
      state,
    });

    if (codeChallenge) {
      params.set("code_challenge", codeChallenge);
      params.set("code_challenge_method", "S256");
    }

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(
    code: string,
    codeVerifier?: string
  ): Promise<string> {
    const body: Record<string, string> = {
      client_id: process.env.GITHUB_CLIENT_ID || "",
      client_secret: process.env.GITHUB_CLIENT_SECRET || "",
      code,
      redirect_uri: process.env.GITHUB_CALLBACK_URL || "",
    };

    if (codeVerifier) {
      body.code_verifier = codeVerifier;
    }

    const { data } = await axios.post<GitHubTokenResponse>(
      "https://github.com/login/oauth/access_token",
      body,
      { headers: { Accept: "application/json" } }
    );

    if (!data.access_token) {
      throw new Error("Failed to obtain GitHub access token");
    }

    return data.access_token;
  }

  async getGitHubUser(accessToken: string): Promise<GitHubUser> {
    const { data } = await axios.get<GitHubUser>("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });
    return data;
  }

  async findOrCreateUser(githubUser: GitHubUser): Promise<User> {
    const repo = this.userRepo();

    let user = await repo.findOne({
      where: { github_id: String(githubUser.id) },
    });

    if (user) {
      user.username = githubUser.login;
      user.email = githubUser.email;
      user.avatar_url = githubUser.avatar_url;
      user.last_login_at = new Date();
      return repo.save(user);
    }

    user = repo.create({
      id: generateId(),
      github_id: String(githubUser.id),
      username: githubUser.login,
      email: githubUser.email,
      avatar_url: githubUser.avatar_url,
      role: "analyst",
      is_active: true,
      last_login_at: new Date(),
    });

    return repo.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepo().findOne({ where: { id } });
  }
}

export const authService = new AuthService();