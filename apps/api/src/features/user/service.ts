import { singleton } from "tsyringe";
import { User } from "@repo/entities/user";
import { GoogleProfileDto } from "@api/features/user/google-profile-dto";
import { LoginDto, PatchUserRequestDto } from "@api/features/user/dto";
import { UserRepository } from "@api/features/user/repository";
import type { PatchUserDto } from "@repo/interfaces";

@singleton()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findOrCreate(profile: GoogleProfileDto) {
    // 1. 이메일로 사용자 조회
    const userFound = await this.userRepository.findOne({
      where: { email: profile.email },
    });

    if (userFound) {
      // update user
      userFound.patch(profile);
      await this.userRepository.save(userFound);

      return userFound;
    }

    // 2. 사용자가 없으면 생성
    const user = profile.toEntity();
    await this.userRepository.save(user);

    return user;
  }

  async getById(id: number) {
    return this.userRepository.findById(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async create(user: LoginDto) {
    const userFound = await this.userRepository.findOne({
      where: { email: user.email },
    });
    if (userFound) {
      return userFound;
    }
    return this.userRepository.save(user.toEntity());
  }

  async delete(user: User) {
    return this.userRepository.remove(user);
  }

  async deleteById(id: number) {
    return this.userRepository.delete(id);
  }

  async update(user: User, dto: PatchUserDto) {
    user.patch(dto);
    return this.userRepository.save(user);
  }

  async search(query: string) {
    return this.userRepository.searchByNicknameOrEmail(query);
  }
}
