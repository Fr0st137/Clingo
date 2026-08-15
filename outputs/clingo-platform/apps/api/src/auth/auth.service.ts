import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { randomBytes, scryptSync } from "crypto";
import { Repository } from "typeorm";
import { UserEntity } from "./user.entity";

type RegisterUserInput = {
  companyName?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  phone?: string;
};

type UpdateUserProfileInput = {
  apartment?: string;
  city?: string;
  companyName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  postalCode?: string;
  street?: string;
};

function normalizeEmail(value?: string) {
  const email = (value ?? "").trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new BadRequestException("Valid email is required.");
  }

  return email;
}

function cleanOptional(value?: string) {
  const cleaned = (value ?? "").trim();
  return cleaned ? cleaned : null;
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");

  return { hash, salt };
}

function toProfile(user: UserEntity) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  const initialsSource = name || user.email;

  return {
    apartment: user.apartment,
    city: user.city,
    companyName: user.companyName,
    email: user.email,
    firstName: user.firstName,
    id: user.id,
    initials: initialsSource
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "U",
    lastName: user.lastName,
    name: name || user.email,
    phone: user.phone,
    postalCode: user.postalCode,
    street: user.street
  };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>
  ) {}

  async lookupEmail(emailValue?: string) {
    const email = normalizeEmail(emailValue);
    const count = await this.usersRepository.count({ where: { email } });

    return { exists: count > 0 };
  }

  async register(input: RegisterUserInput) {
    const email = normalizeEmail(input.email);
    const password = (input.password ?? "").trim();

    if (password.length < 6) {
      throw new BadRequestException("Password must have at least 6 characters.");
    }

    const existingCount = await this.usersRepository.count({ where: { email } });

    if (existingCount > 0) {
      throw new ConflictException("User with this email already exists.");
    }

    const passwordHash = hashPassword(password);
    const user = this.usersRepository.create({
      companyName: cleanOptional(input.companyName),
      email,
      firstName: cleanOptional(input.firstName),
      lastName: cleanOptional(input.lastName),
      passwordHash: passwordHash.hash,
      passwordSalt: passwordHash.salt,
      phone: cleanOptional(input.phone)
    });
    const savedUser = await this.usersRepository.save(user);

    return {
      user: toProfile(savedUser)
    };
  }

  async getProfile(emailValue?: string) {
    const email = normalizeEmail(emailValue);
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException("User not found.");
    }

    return { user: toProfile(user) };
  }

  async updateProfile(emailValue: string | undefined, input: UpdateUserProfileInput) {
    const email = normalizeEmail(emailValue);
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException("User not found.");
    }

    const updates: Partial<UserEntity> = {};

    if ("apartment" in input) {
      updates.apartment = cleanOptional(input.apartment);
    }

    if ("city" in input) {
      updates.city = cleanOptional(input.city);
    }

    if ("companyName" in input) {
      updates.companyName = cleanOptional(input.companyName);
    }

    if ("firstName" in input) {
      updates.firstName = cleanOptional(input.firstName);
    }

    if ("lastName" in input) {
      updates.lastName = cleanOptional(input.lastName);
    }

    if ("phone" in input) {
      updates.phone = cleanOptional(input.phone);
    }

    if ("postalCode" in input) {
      updates.postalCode = cleanOptional(input.postalCode);
    }

    if ("street" in input) {
      updates.street = cleanOptional(input.street);
    }

    this.usersRepository.merge(user, updates);

    const savedUser = await this.usersRepository.save(user);

    return { user: toProfile(savedUser) };
  }
}
