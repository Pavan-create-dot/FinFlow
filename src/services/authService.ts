import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { generateTokens } from '../middlewares/auth';
import { RegisterDto, LoginDto } from '../dtos/auth.dto';

export class AuthService {
  static async register(dto: RegisterDto) {
    const { email, password, firstName, lastName } = dto;
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const user = await User.create({
      email,
      passwordHash: hashedPassword,
      firstName,
      lastName
    });

    const safeUser: any = user.toJSON();
    delete safeUser.passwordHash;
    
    const tokens = generateTokens({ id: safeUser.id, email: safeUser.email });
    return { user: safeUser, ...tokens };
  }

  static async login(dto: LoginDto) {
    const { email, password } = dto;
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new Error('Invalid credentials');
    }

    const safeUser: any = user.toJSON();
    delete safeUser.passwordHash;
    
    const tokens = generateTokens({ id: safeUser.id, email: safeUser.email });
    return { user: safeUser, ...tokens };
  }
}
