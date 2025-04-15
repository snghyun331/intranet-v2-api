import { CreateUserDto } from '../dto/createUser.dto';

export type NewUserInfo = Omit<CreateUserDto, 'adminGradeIdx'>;
