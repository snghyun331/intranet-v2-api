import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ collection: 'user', timestamps: true })
export class User {
  @Prop({ type: Number, required: true })
  _id: number;

  @Prop({ type: String, required: true })
  userName: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
