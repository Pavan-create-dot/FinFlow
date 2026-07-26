import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { generateTokens } from '../middlewares/auth';
import { RegisterDto, LoginDto } from '../dtos/auth.dto';

export class AuthService {
  static async register(dto: RegisterDto) {
    const { email, password, firstName, lastName } = dto;
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName
      }
    });

    const safeUser: any = { ...user };
    delete safeUser.passwordHash;
    
    const tokens = generateTokens({ id: user.id, email: user.email });
    return { user: safeUser, ...tokens };
  }

  static async login(dto: LoginDto) {
    const { email, password } = dto;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new Error('Invalid credentials');
    }

    const safeUser: any = { ...user };
    delete safeUser.passwordHash;
    
    const tokens = generateTokens({ id: user.id, email: user.email });
    return { user: safeUser, ...tokens };
  }
}
