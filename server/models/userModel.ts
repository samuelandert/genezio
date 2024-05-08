// server/models/userModel.ts
import { Model } from "sequelize";

export class UserModel extends Model {
    userId!: number;
    name!: string;
    address!: string;
}