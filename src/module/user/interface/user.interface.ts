import { CreateUserDto } from '@user/dto/createUser.dto';

export type NewUserInfo = Omit<CreateUserDto, 'adminGradeIdx'>;
