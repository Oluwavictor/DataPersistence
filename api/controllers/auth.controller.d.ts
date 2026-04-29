import { Request, Response, NextFunction } from "express";

export declare class AuthController {
  githubLogin(req: Request, res: Response): Promise<void>;
  githubCallback(req: Request, res: Response, next: NextFunction): Promise<void>;
  refresh(req: Request, res: Response, next: NextFunction): Promise<void>;
  logout(req: Request, res: Response, next: NextFunction): Promise<void>;
  whoami(req: Request, res: Response): Promise<void>;
}

export declare const authController: AuthController;